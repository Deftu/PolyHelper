import Application from '../Application.ts';
import {
  CrashDataCrashes,
  MclogInfoMetadata,
  type MclogsFetchOptions,
  MclogsFetchResponse,
  type MclogsFetchResult,
  MclogsInsightsResponse,
  type MclogsUploadRequest,
  MclogsUploadResponse
} from '../types/mclogs.ts';
import type { EmbedHelperField } from '../types/discord.ts';
import type { Message } from 'discord.js';

export const mclogsBaseURL = 'https://api.mclo.gs/1';
export const mclogsLogo = 'https://mclo.gs/img/logo.png';
export const mclogsRegex = /https:\/\/(?:mclo\.gs|api.mclo\.gs\/1\/raw)\/([a-z0-9]+)/i;
export const hstshRegex = /https:\/\/hst\.sh\/(?:raw\/)?([a-z]+)/i;
export const mclogsRegexG = new RegExp(mclogsRegex, 'gi');
export const hstshRegexG = new RegExp(hstshRegex, 'gi');

export async function uploadLog(input: MclogsUploadRequest): Promise<MclogsUploadResponse> {
  const response = await Application.request<MclogsUploadResponse>(`${mclogsBaseURL}/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: input
  });
  const parse = await MclogsUploadResponse.parseAsync(response.data);
  return parse;
}

export async function getInsights(id: string): Promise<MclogsInsightsResponse> {
  const response = await Application.request<MclogsInsightsResponse>(
    `${mclogsBaseURL}/insights/${encodeURIComponent(id)}`
  );
  return await MclogsInsightsResponse.parseAsync(response.data);
}

export async function getLog<const T extends MclogsFetchOptions>(
  id: string,
  options: T = {} as T
): Promise<MclogsFetchResult<T>> {
  const response = await Application.request<MclogsFetchResponse>(`${mclogsBaseURL}/log/${encodeURIComponent(id)}`, {
    params: {
      raw: options.raw || undefined,
      parsed: options.parsed || undefined,
      insights: options.insights || undefined
    }
  });
  return (await MclogsFetchResponse.parseAsync(response.data)) as MclogsFetchResult<T>;
}

export function findLogLinks(string: string) {
  const links = [];

  const mclogsMatch = string.match(mclogsRegex);
  if (mclogsMatch) links.push(`https://api.mclo.gs/1/raw/${mclogsMatch[1]}`);

  const hastebinMatch = string.match(hstshRegex);
  if (hastebinMatch) links.push(`https://hst.sh/raw/${hastebinMatch[1]}`);

  return links;
}

export function findLogURL(message: Message): string | undefined {
  const attachmentURL = message.attachments.find((attachment) =>
    ['.txt', '.log'].some((extension) => attachment.name?.toLowerCase().endsWith(extension))
  )?.url;

  return attachmentURL ?? findLogLinks(message.content).at(0);
}

export function cleanString(string: string): string {
  return string.replaceAll(hstshRegexG, '').replaceAll(mclogsRegexG, '').trim();
}

export function getIdFromUrl(log: string | { id: string }): string {
  return encodeURIComponent(typeof log === 'string' ? log.split('/').pop() || '' : log.id);
}

export async function getNewLog(url: string, metadata?: MclogInfoMetadata[]) {
  if (!url.includes('mclo.gs')) {
    const text = await Application.request<string>(url);
    const upload = await uploadLog({ content: text.data, source: 'PolyHelper', metadata });
    if (upload.success) return await getLog(upload.id, { raw: true, insights: true });
  }
  return await getLog(getIdFromUrl(url), { raw: true, insights: true });
}

export async function verbalizeCrash(log: string): Promise<EmbedHelperField[]> {
  const pathIndicator = '`';
  const gameRoot = '.minecraft';
  const profileRoot = '.minecraft';
  const crashes = await Application.request<CrashDataCrashes>(
    'https://raw.githubusercontent.com/Polyfrost/CrashData/refs/heads/main/crashes.json'
  ).catch((e) => {
    console.error(e);
    return null;
  });
  if (crashes === null) return [{ name: 'Failed to parse crashes.json', value: 'Blame Wyvest' }];

  const relevantInfo = crashes.data.fixes.filter((fix) => {
    return fix.causes.every((type) => {
      if (type.method === 'contains') return log.includes(type.value);
      else if (type.method === 'regex') return log.match(new RegExp(type.value));
      else if (type.method === 'contains_not') return !log.includes(type.value);
      return false;
    });
  });

  const cheater = relevantInfo.find((info) => info.fix.startsWith('Cheater'));
  if (cheater) return [{ name: 'Cheater', value: cheater.fix }];

  return crashes.data.fixtypes
    .map((type, i) => {
      const groupInfo = relevantInfo.filter((info) => (info.fixtype ?? crashes.data.default_fix_type) === i);
      if (!groupInfo.length) return;
      return {
        name: type.name,
        value: [
          ...new Set(
            groupInfo.map((info) =>
              info.fix
                .replaceAll('%pathindicator%', pathIndicator)
                .replaceAll('%gameroot%', gameRoot)
                .replaceAll('%profileroot%', profileRoot)
            )
          )
        ].join('\n')
      };
    })
    .filter((field) => field !== undefined);
}
