import { GoogleGenAI } from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';
import type {
  LlmResponse,
  LlmPort,
  LlmParams,
} from '../../Domain/Ports/LlmPort';

const GEMINI_MODEL_NAME = 'gemini-2.5-flash';
const GEMINI_JSON_GENERATION_CONFIG = {
  temperature: 0.4,
  // maxOutputTokens: 10000,
  responseMimeType: 'application/json',
};
const GEMINI_SUMMARY_GENERATION_CONFIG = {
  temperature: 0.35,
};

export class GoogleGeminiAdapter implements LlmPort {
  private readonly apiKey: string;
  private cachedGeminiClient: GoogleGenAI | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  /**
   * Requests content enrichment based on a prompt, expecting a structured response with body and frontmatter.
   *
   * @param params - The parameters for the LLM request, including the prompt.
   * @returns A promise that resolves to an `LlmResponse` object containing the generated body and frontmatter, or `null` if the request fails or parsing errors occur.
   */
  async requestEnrichment(params: LlmParams): Promise<LlmResponse | null> {
    const { prompt } = params;
    console.log('Prompt:', prompt);

    // ...

    const rawText = await this.generate(
      prompt,
      GEMINI_JSON_GENERATION_CONFIG,
      'completar la plantilla automáticamente',
    );

    if (!rawText) return null;

    const cleanText = this.cleanResponse(rawText);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      console.error(
        'Gemini response could not be parsed as JSON',
        cleanText,
        parseError,
      );
      return null;
    }

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const parsedRecord = parsed as Record<string, unknown>;
    const body =
      typeof parsedRecord.body === 'string'
        ? parsedRecord.body.trim()
        : undefined;
    const frontmatterValue = parsedRecord.frontmatter;
    const frontmatter =
      frontmatterValue &&
        typeof frontmatterValue === 'object' &&
        !Array.isArray(frontmatterValue)
        ? (frontmatterValue as Record<string, unknown>)
        : undefined;

    return {
      body,
      frontmatter,
    };
  }

  /**
   * Sends a general request to the LLM and returns the response as a string.
   *
   * @param params - The parameters for the LLM request, including the prompt.
   * @returns A promise that resolves to the generated text content, or `null` if the request fails.
   */
  async request(params: LlmParams): Promise<string | null> {
    const { prompt } = params;
    return this.generate(prompt, GEMINI_SUMMARY_GENERATION_CONFIG);
  }

  /**
   * Sends a request to the LLM expecting a JSON response.
   *
   * @param params - The parameters for the LLM request, including the prompt.
   * @returns A promise that resolves to the parsed JSON object, or `null` if the request fails or parsing errors occur.
   */
  async requestJson(params: LlmParams): Promise<any | null> {
    const { prompt } = params;
    const rawText = await this.generate(prompt, GEMINI_JSON_GENERATION_CONFIG);

    if (!rawText) return null;

    const cleanText = this.cleanResponse(rawText);

    try {
      return JSON.parse(cleanText);
    } catch (parseError) {
      console.error(
        'Gemini response could not be parsed as JSON',
        cleanText,
        parseError,
      );
      return null;
    }
  }

  /**
   * Requests a brief summary of a streaming session.
   *
   * @param params - The parameters for the LLM request, including the prompt.
   * @returns A promise that resolves to the generated summary text, or `null` if the request fails.
   */
  async requestStreamBrief(params: LlmParams): Promise<string | null> {
    const { prompt } = params;
    return this.generate(
      prompt,
      GEMINI_SUMMARY_GENERATION_CONFIG,
      'resumir el streaming',
    );
  }

  /**
   * Internal method to handle the common logic for generating content from the Gemini API.
   *
   * @param prompt - The input prompt for the model.
   * @param config - The configuration object for the generation (e.g., temperature, mimeType).
   * @param errorContext - Optional context description for error messages (used to customize the API key missing message).
   * @returns A promise that resolves to the generated text, or `null` if the request fails.
   */
  private async generate(
    prompt: string,
    config: any,
    errorContext?: string,
  ): Promise<string | null> {
    if (!this.apiKey) {
      const msg = errorContext
        ? `Configura tu clave de la API de Gemini en los ajustes para ${errorContext}.`
        : 'Configura tu clave de la API de Gemini en los ajustes.';
      console.warn('[GoogleGeminiAdapter] Missing API Key:', msg);
      return null;
    }

    try {
      const client = this.getGeminiClient();
      const response = await client.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        config: config,
      });
      console.log('[GoogleGeminiAdapter] Response received from Gemini.');

      const rawText = this.extractText(response).trim();
      return rawText || null;
    } catch (error) {
      console.error('Failed to request Gemini', error);
      console.error('Gemini error details:', error);
      return null;
    }
  }

  /**
   * Lazily initializes and retrieves the Gemini client instance.
   *
   * @returns The initialized `GoogleGenAI` client.
   */
  private getGeminiClient(): GoogleGenAI {
    if (this.cachedGeminiClient) {
      return this.cachedGeminiClient;
    }

    this.cachedGeminiClient = new GoogleGenAI({ apiKey: this.apiKey });
    return this.cachedGeminiClient;
  }

  /**
   * Extracts the text content from the Gemini API response.
   *
   * @param response - The response object from the Gemini API.
   * @returns The extracted text content, or an empty string if no content is found.
   */
  private extractText(response: GenerateContentResponse): string {
    const viaGetter =
      typeof response.text === 'string' ? response.text.trim() : '';
    if (viaGetter) {
      return viaGetter;
    }

    const candidates = response.candidates;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return '';
    }

    const parts = candidates[0]?.content?.parts;
    if (!Array.isArray(parts)) {
      return '';
    }

    return parts
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('')
      .trim();
  }

  /**
   * Cleans the response text by removing Markdown code fences or extracting logic from JSON-like structures.
   *
   * @param text - The raw text response from the LLM.
   * @returns The cleaned text content.
   */
  private cleanResponse(text: string): string {
    // 1. Try to find standard markdown code fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      return fenceMatch[1].trim();
    }

    // 2. Fallback: Find the first '{' and last '}' OR first '[' and last ']'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    // Check if it looks more like an object or an array
    // If both exist, we take the one that starts earlier (outermost)
    let start = -1;
    let end = -1;

    // Logic: if both exist, pick the one with smaller index. If only one exists, pick that one.
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = lastBrace;
    } else if (firstBracket !== -1) {
      start = firstBracket;
      end = lastBracket;
    }

    if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1);
    }

    return text;
  }
}
