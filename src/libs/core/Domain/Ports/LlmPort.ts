export type LlmParams = {
  prompt: string;
};

export type LlmResponse = {
  body?: string;
  frontmatter?: Record<string, unknown>;
};

export interface LlmPort {
  requestEnrichment(params: LlmParams): Promise<LlmResponse | null>;
  requestStreamBrief(params: LlmParams): Promise<string | null>;
  request(params: LlmParams): Promise<string | null>;
  requestJson(params: LlmParams): Promise<any | null>;
}
