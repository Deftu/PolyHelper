import Anthropic from '@anthropic-ai/sdk';
import PolyHelperError from '../private/error.ts';
import zod from 'zod';
import { getErrorMessage } from './miscUtils.ts';
import type { AgentOptions, AgentResult, ClientTool, CompletionOptions, ModelPricing } from '../types/claude.ts';

const modelPricing: Record<string, ModelPricing> = {
  'claude-sonnet-5-5': { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 }
};

const charsPerToken = 3;

const finalReportTokens = 4000;

const minimumTurnTokens = 1500;

const maxToolResultChars = 8000;

const maxBudgetRefusals = 2;

const wrapUpMessage =
  'You have reached your budget. Do not call any other tool. Call submit_report now with what you have found, marking anything unconfirmed as a hypothesis.';

const nudgeMessage = 'Call submit_report now with your findings. Do not reply with plain text.';

const budgetToolError = 'Budget reached, so this tool did not run. Call submit_report now.';

interface UsageLike {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

function isToolInputParseError(error: unknown): boolean {
  return (
    error instanceof Anthropic.AnthropicError &&
    !(error instanceof Anthropic.APIError) &&
    error.message.startsWith('Unable to parse tool parameter JSON')
  );
}

async function runTool(
  tools: Map<string, ClientTool>,
  use: Anthropic.Beta.BetaToolUseBlock,
  label: string
): Promise<Anthropic.Beta.BetaToolResultBlockParam> {
  try {
    const tool = tools.get(use.name);
    if (!tool) throw new PolyHelperError(`Unknown tool ${use.name}`);
    let content = await tool.run(use.input);
    if (content.length > maxToolResultChars) {
      content = `${content.slice(0, maxToolResultChars)}\n[output truncated]`;
    }
    return { type: 'tool_result', tool_use_id: use.id, content };
  } catch (error) {
    console.warn(`[${label}] Tool ${use.name} failed: ${getErrorMessage(error)}`);
    return { type: 'tool_result', tool_use_id: use.id, is_error: true, content: getErrorMessage(error) };
  }
}

function toolError(use: Anthropic.Beta.BetaToolUseBlock, content: string): Anthropic.Beta.BetaToolResultBlockParam {
  return { type: 'tool_result', tool_use_id: use.id, is_error: true, content };
}

function getText(message: Anthropic.Beta.BetaMessage): string | null {
  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
  return text || null;
}

function contentChars(content: Anthropic.Beta.BetaMessageParam['content']): number {
  return typeof content === 'string' ? content.length : JSON.stringify(content).length;
}

export function getPricing(model: string): ModelPricing {
  const pricing = modelPricing[model];
  if (!pricing) throw new PolyHelperError(`No pricing is known for ${model}, so its cost can't be capped`);
  return pricing;
}

export class CostTracker {
  spent = 0;
  constructor(
    readonly target: number,
    readonly cap: number
  ) {}

  add(model: string, usage: UsageLike): number {
    const pricing = getPricing(model);
    const cost =
      (usage.input_tokens * pricing.input +
        (usage.cache_creation_input_tokens ?? 0) * pricing.cacheWrite +
        (usage.cache_read_input_tokens ?? 0) * pricing.cacheRead +
        usage.output_tokens * pricing.output) /
      1_000_000;
    this.spent += cost;
    return cost;
  }

  canAffordBeforeTarget(cost: number): boolean {
    return this.spent + cost <= this.target;
  }
}

export async function runAgent<T>(
  options: AgentOptions,
  tracker: CostTracker,
  reportSchema: zod.ZodType<T>
): Promise<AgentResult<T>> {
  const pricing = getPricing(options.model);
  const tools = new Map(options.tools.map((tool) => [tool.definition.name, tool]));
  const definitions = [...tools.values()].map((tool) => tool.definition);
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: 'user', content: [{ type: 'text', text: options.prompt }] }
  ];
  const startCost = tracker.spent;
  let promptTokens = 0;
  let newChars = options.system.length + options.prompt.length + JSON.stringify(definitions).length;
  let wrapping = false;
  let wrapSent = false;
  let nudged = false;
  let budgetRefusals = 0;
  let lastText: string | null = null;
  let turns = 0;
  let jsonRetries = 0;

  const finish = (stopReason: AgentResult<T>['stopReason'], report: T | null = null): AgentResult<T> => {
    console.other(
      `[${options.label}] ${stopReason} after ${turns} turns, $${(tracker.spent - startCost).toFixed(4)} agent, $${tracker.spent.toFixed(4)} total`
    );
    return { report, text: lastText, turns, stopReason };
  };

  while (turns < options.maxTurns) {
    const newTokens = newChars / charsPerToken;
    const inputCost = (promptTokens * pricing.cacheRead + newTokens * pricing.cacheWrite) / 1_000_000;
    const reserveCost =
      (finalReportTokens * pricing.output + (promptTokens + newTokens) * pricing.cacheRead) / 1_000_000;
    if (tracker.spent + inputCost + reserveCost >= tracker.target || turns === options.maxTurns - 1) wrapping = true;

    const room = Math.floor(((tracker.cap - tracker.spent - inputCost) * 1_000_000) / pricing.output);
    if (room < minimumTurnTokens) return finish('budget');
    if (room < finalReportTokens + minimumTurnTokens) wrapping = true;

    const last = messages.at(-1);
    if (wrapping && !wrapSent && last?.role === 'user' && Array.isArray(last.content)) {
      last.content.push({ type: 'text', text: wrapUpMessage });
      wrapSent = true;
    }

    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await options.client.beta.messages
        .stream({
          model: options.model,
          max_tokens: Math.min(options.maxTokens, room),
          betas: ['server-side-fallback-2026-07-01', ...(options.taskBudgetTokens ? ['task-budgets-2026-03-13'] : [])],
          fallbacks: 'default',
          cache_control: { type: 'ephemeral' },
          output_config: {
            effort: options.effort,
            ...(options.taskBudgetTokens
              ? { task_budget: { type: 'tokens' as const, total: options.taskBudgetTokens } }
              : {})
          },
          system: [{ type: 'text', text: options.system, cache_control: { type: 'ephemeral' } }],
          tools: definitions,
          messages
        })
        .finalMessage();
      jsonRetries = 0;
    } catch (error) {
      if (!isToolInputParseError(error) || jsonRetries++ >= 2) throw error;
      console.warn(`[${options.label}] Unparseable tool input, retrying`);
      continue;
    }
    turns++;
    tracker.add(options.model, message.usage);
    promptTokens =
      message.usage.input_tokens +
      (message.usage.cache_read_input_tokens ?? 0) +
      (message.usage.cache_creation_input_tokens ?? 0);
    newChars = message.usage.output_tokens * charsPerToken;
    lastText = getText(message) ?? lastText;

    if (message.stop_reason === 'refusal') {
      throw new PolyHelperError(`Claude declined the request (${message.stop_details?.category ?? 'uncategorized'})`);
    }
    if (message.stop_reason === 'max_tokens') return finish('budget');

    const toolUses = message.content.filter(
      (block): block is Anthropic.Beta.BetaToolUseBlock => block.type === 'tool_use'
    );
    messages.push({ role: 'assistant', content: message.content });

    const report = toolUses.find((use) => use.name === options.finishTool);
    if (report) {
      const parsed = reportSchema.safeParse(report.input);
      if (parsed.success) return finish('finished', parsed.data);
      const invalid = `Invalid report: ${zod.prettifyError(parsed.error)}`;
      const results = toolUses.map((use) =>
        toolError(use, use === report ? invalid : 'Not run. Fix the report and call submit_report again.')
      );
      messages.push({ role: 'user', content: results });
      newChars += contentChars(results);
      continue;
    }

    if (toolUses.length === 0) {
      if (nudged) return finish('no report');
      nudged = true;
      messages.push({ role: 'user', content: [{ type: 'text', text: nudgeMessage }] });
      newChars += nudgeMessage.length;
      continue;
    }

    if (wrapping) {
      if (++budgetRefusals > maxBudgetRefusals) return finish('budget');
      const results = toolUses.map((use) => toolError(use, budgetToolError));
      messages.push({ role: 'user', content: results });
      newChars += contentChars(results);
      continue;
    }

    const results = await Promise.all(toolUses.map((use) => runTool(tools, use, options.label)));
    messages.push({ role: 'user', content: results });
    newChars += contentChars(results);
  }

  return finish('turns');
}

export async function runCompletion(options: CompletionOptions, tracker: CostTracker): Promise<string> {
  const pricing = getPricing(options.model);
  const worstCase =
    ((options.system.length + options.prompt.length) / charsPerToken) * pricing.input +
    options.maxTokens * pricing.output;
  if (!tracker.canAffordBeforeTarget(worstCase / 1_000_000)) {
    throw new PolyHelperError('Not enough budget left for this call');
  }
  const message = await options.client.messages.create({
    model: options.model,
    max_tokens: options.maxTokens,
    output_config: { effort: options.effort },
    system: options.system,
    messages: [{ role: 'user', content: options.prompt }]
  });
  const cost = tracker.add(options.model, message.usage);
  console.other(`[${options.label}] $${cost.toFixed(4)}`);
  if (message.stop_reason === 'refusal') throw new PolyHelperError('The helper model declined to read this file');
  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
  if (!text) throw new PolyHelperError('The helper model returned an empty reply');
  return text;
}

export function defineTool<T extends zod.ZodObject>(tool: {
  name: string;
  description: string;
  input: T;
  strict?: boolean;
  run: (input: zod.output<T>) => Promise<string>;
}): ClientTool {
  const schema = zod.toJSONSchema(tool.input, { io: 'input' });
  delete schema.$schema;
  return {
    definition: {
      name: tool.name,
      description: tool.description,
      input_schema: schema as Anthropic.Beta.BetaTool.InputSchema,
      ...(tool.strict ? { strict: true } : { eager_input_streaming: true })
    },
    run: async (input) => {
      const parsed = tool.input.safeParse(input);
      if (!parsed.success) throw new PolyHelperError(`Invalid input: ${zod.prettifyError(parsed.error)}`);
      return await tool.run(parsed.data);
    }
  };
}
