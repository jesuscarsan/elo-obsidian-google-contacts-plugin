
import { GoogleGeminiAdapter } from './GoogleGeminiAdapter';

const mockGenerateContent = jest.fn();
// We need to define the class mock inside the factory or use a variable that is hoisted (var) but jest.mock is special.
// Best to just return the mock structure from the factory and assign it to a variable for assertions if needed, 
// or import the mocked module.

jest.mock('@google/genai', () => {
    return {
        GoogleGenAI: jest.fn().mockImplementation(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: mockGenerateContent
            }),
            models: {
                generateContent: mockGenerateContent
            }
        }))
    };
});

describe('GoogleGeminiAdapter', () => {
    let adapter: GoogleGeminiAdapter;
    const apiKey = 'test-api-key';

    beforeEach(() => {
        jest.clearAllMocks();
        adapter = new GoogleGeminiAdapter(apiKey);
    });

    const createMockResponse = (text: string) => ({
        candidates: [{
            content: {
                parts: [{ text }]
            }
        }]
    });

    describe('requestEnrichment', () => {
        it('should parse clean JSON response', async () => {
            const mockResponse = createMockResponse('{"body": "content", "frontmatter": {"tags": ["a"]}}');
            mockGenerateContent.mockResolvedValue(mockResponse);

            const result = await adapter.requestEnrichment({ prompt: 'test' });

            expect(result).toEqual({
                body: "content",
                frontmatter: { tags: ["a"] }
            });
        });

        it('should parse JSON wrapped in markdown code fence', async () => {
            const mockResponse = createMockResponse('```json\n{"body": "content"}\n```');
            mockGenerateContent.mockResolvedValue(mockResponse);

            const result = await adapter.requestEnrichment({ prompt: 'test' });

            expect(result).toEqual({
                body: "content",
                frontmatter: undefined
            });
        });

        it('should parse JSON wrapped in generic code fence', async () => {
            const mockResponse = createMockResponse('```\n{"body": "content"}\n```');
            mockGenerateContent.mockResolvedValue(mockResponse);

            const result = await adapter.requestEnrichment({ prompt: 'test' });

            expect(result).toEqual({
                body: "content",
                frontmatter: undefined
            });
        });

        it('should extract JSON embedded in text', async () => {
            const mockResponse = createMockResponse('Here is the json:\n```json\n{"body": "content"}\n```\nHope it helps.');
            mockGenerateContent.mockResolvedValue(mockResponse);

            const result = await adapter.requestEnrichment({ prompt: 'test' });

            expect(result).toEqual({
                body: "content",
                frontmatter: undefined
            });
        });

        it('should extract JSON even without code fences if valid JSON block exists', async () => {
            const mockResponse = createMockResponse('Sure, here is it: {"body": "content"} thanks.');
            mockGenerateContent.mockResolvedValue(mockResponse);

            const result = await adapter.requestEnrichment({ prompt: 'test' });

            expect(result).toEqual({
                body: "content",
                frontmatter: undefined
            });
        });

        it('should handle broken JSON gracefully', async () => {
            const mockResponse = createMockResponse('{"body": "content"'); // Missing closing brace
            mockGenerateContent.mockResolvedValue(mockResponse);

            const result = await adapter.requestEnrichment({ prompt: 'test' });

            expect(result).toBeNull();
        });

        it('should handle the specific user case (stutter at the end)', async () => {
            // Simulating the user error: extra text after the valid JSON
            const json = JSON.stringify({
                body: "# Content\n...",
                frontmatter: {}
            }, null, 2);
            const stutter = 'aprender!"\n}\nSyntaxError...';
            // The user error actually looked like valid JSON then garbage. 
            // "aprender!"\n}" then garbage. 

            // Wait, the user error was:
            /*
            "aprender!"
            } SyntaxError: ...
            */
            // The Gemini output probably was: 
            // { "body": "..." } SyntaxError... (it hallucinates the error?) or it just dumps text.

            // Let's test "Valid JSON" followed by "Garbage".
            const text = `${json} This is garbage text properly outside parsing range`;

            mockGenerateContent.mockResolvedValue(createMockResponse(text));

            const result = await adapter.requestEnrichment({ prompt: 'test' });

            expect(result).not.toBeNull();
            if (result) {
                expect(result.body).toContain("# Content");
            }
        });
    });
});
