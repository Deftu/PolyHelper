import zod from 'zod';

export const MclogInfoMetadata = zod.object({
  key: zod.string(),
  value: zod.union([zod.string(), zod.number(), zod.boolean(), zod.null()]),
  label: zod.string().nullable().optional(),
  visible: zod.boolean().optional()
});
export type MclogInfoMetadata = zod.infer<typeof MclogInfoMetadata>;

export const BaseMclogsLogInfo = zod.object({
  id: zod.string(),
  source: zod.string().nullable(),
  created: zod.number().int(),
  expires: zod.number().int(),
  size: zod.number().int(),
  lines: zod.number().int(),
  errors: zod.number().int(),
  url: zod.url(),
  raw: zod.url(),
  metadata: zod.array(MclogInfoMetadata).optional()
});

export const MclogsErrorResponse = zod.object({ success: zod.literal(false), error: zod.string() });
export type MclogsErrorResponse = zod.infer<typeof MclogsErrorResponse>;

export const BaseMclogsUploadRequest = zod.object({ content: zod.string() });
export type BaseMclogsUploadRequest = zod.infer<typeof BaseMclogsUploadRequest>;

export const MclogsUploadRequest = BaseMclogsUploadRequest.extend({
  source: zod.string().optional(),
  metadata: zod.array(MclogInfoMetadata).optional()
});
export type MclogsUploadRequest = zod.infer<typeof MclogsUploadRequest>;

export const MclogsUploadSuccessResponse = BaseMclogsLogInfo.extend({
  success: zod.literal(true),
  token: zod.string()
});

export const MclogsUploadResponse = zod.discriminatedUnion('success', [
  MclogsUploadSuccessResponse,
  MclogsErrorResponse
]);
export type MclogsUploadResponse = zod.infer<typeof MclogsUploadResponse>;

export const MclogsInsightsAnalysisEntryLine = zod.object({ number: zod.number(), content: zod.string() });

export const MclogsInsightsAnalysisEntry = zod.object({
  level: zod.number(),
  time: zod.string().nullable(),
  prefix: zod.string().nullable(),
  lines: zod.array(MclogsInsightsAnalysisEntryLine)
});

export const MclogsInsightsAnalysisProblemSolution = zod.object({ message: zod.string() });

export const BaseMclogsInsightsAnalysisItem = zod.object({
  message: zod.string(),
  counter: zod.number(),
  entry: MclogsInsightsAnalysisEntry
});

export const MclogsInsightsAnalysisProblem = BaseMclogsInsightsAnalysisItem.extend({
  solutions: zod.array(MclogsInsightsAnalysisProblemSolution)
});

export const MclogsInsightsAnalysisInformation = BaseMclogsInsightsAnalysisItem.extend({
  label: zod.string(),
  value: zod.string()
});

export const MclogsInsightsAnalysis = zod.object({
  problems: zod.array(MclogsInsightsAnalysisProblem),
  information: zod.array(MclogsInsightsAnalysisInformation)
});

export const MclogsInsights = zod.object({
  id: zod.string(),
  name: zod.string().nullable(),
  type: zod.string(),
  version: zod.string().nullable(),
  title: zod.string(),
  analysis: MclogsInsightsAnalysis
});
export const MclogsInsightsSuccessResponse = MclogsInsights.extend({ success: zod.literal(true) });

export const MclogsInsightsResponse = zod.discriminatedUnion('success', [
  MclogsInsightsSuccessResponse,
  MclogsErrorResponse
]);
export type MclogsInsightsResponse = zod.infer<typeof MclogsInsightsResponse>;

export const MclogsFetchOptions = zod.object({
  raw: zod.boolean().optional(),
  parsed: zod.boolean().optional(),
  insights: zod.boolean().optional()
});
export type MclogsFetchOptions = zod.infer<typeof MclogsFetchOptions>;

export const MclogsLogContent = zod.object({
  raw: zod.string().optional(),
  parsed: zod.array(MclogsInsightsAnalysisEntry).optional(),
  insights: MclogsInsights.optional()
});
export type MclogsLogContent = zod.infer<typeof MclogsLogContent>;

export const MclogsFetchSuccessResponse = BaseMclogsLogInfo.extend({
  success: zod.literal(true),
  content: MclogsLogContent.optional()
});
export type MclogsFetchSuccessResponse = zod.infer<typeof MclogsFetchSuccessResponse>;

export const MclogsFetchResponse = zod.discriminatedUnion('success', [MclogsFetchSuccessResponse, MclogsErrorResponse]);
export type MclogsFetchResponse = zod.infer<typeof MclogsFetchResponse>;

export type RequestedContent<T extends MclogsFetchOptions> = {
  [K in keyof T as T[K] extends true ? K : never]-?: K extends keyof MclogsLogContent
    ? NonNullable<MclogsLogContent[K]>
    : never;
};

export type MclogsFetchResult<T extends MclogsFetchOptions> =
  | (Omit<MclogsFetchSuccessResponse, 'content'> & { content: RequestedContent<T> & MclogsLogContent })
  | MclogsErrorResponse;

export const CrashDataCrashCause = zod.object({
  method: zod.enum(['contains', 'contains_not', 'regex']),
  value: zod.string()
});
export const CrashDataCrashFix = zod.object({
  name: zod.string().optional(),
  fixtype: zod.number().optional(),
  fix: zod.string(),
  causes: zod.array(CrashDataCrashCause)
});
export const CrashDataFixType = zod.object({ name: zod.string() });
export const CrashDataCrashes = zod.object({
  fixes: zod.array(CrashDataCrashFix),
  fixtypes: zod.array(CrashDataFixType),
  default_fix_type: zod.number()
});
export type CrashDataCrashes = zod.infer<typeof CrashDataCrashes>;
