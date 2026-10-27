import type Anthropic from '@anthropic-ai/sdk';

export type AgentEffort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface ClientTool {
  definition: Anthropic.Beta.BetaTool;
  run(input: unknown): Promise<string>;
}

export interface ModelPricing {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

export interface AgentOptions {
  client: Anthropic;
  label: string;
  model: string;
  system: string;
  prompt: string;
  tools: ClientTool[];
  finishTool: string;
  effort: AgentEffort;
  maxTurns: number;
  maxTokens: number;
  taskBudgetTokens: number | null;
}

export interface AgentResult<T> {
  report: T | null;
  text: string | null;
  turns: number;
  stopReason: 'finished' | 'budget' | 'turns' | 'no report';
}

export interface CompletionOptions {
  client: Anthropic;
  label: string;
  model: string;
  system: string;
  prompt: string;
  effort: AgentEffort;
  maxTokens: number;
}
