import { GoogleGenAI } from '@google/genai';
// import { showMessage } from '@/Infrastructure/Obsidian/Utils/Messages'; // Removed for Core
import { IGeminiSessionAdapter } from './IGeminiSessionAdapter';

export class GoogleGeminiChatAdapter implements IGeminiSessionAdapter {
    private client: GoogleGenAI;
    private apiKey: string;
    private history: any[] = [];
    private systemInstruction: string = '';
    private modelName: string = 'gemini-2.0-flash-exp';
    private config: any = {};
    private tools: any[] | undefined;

    private onTextReceived: (text: string) => void;
    private onScoreReceived: (score: number) => void;
    private onUserTextReceived: (text: string) => void;

    constructor(apiKey: string, onTextReceived?: (text: string) => void, onScoreReceived?: (score: number) => void, onUserTextReceived?: (text: string) => void) {
        this.apiKey = apiKey;
        this.onTextReceived = onTextReceived || (() => { });
        this.onScoreReceived = onScoreReceived || (() => { });
        this.onUserTextReceived = onUserTextReceived || (() => { });
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }

    async connect(systemInstruction: string, enableScoreTracking: boolean, voice: string, temperature: number, topP: number): Promise<boolean> {
        if (!this.apiKey) {
            console.error('Falta la API Key de Gemini');
            return false;
        }

        this.history = [];
        this.config = {
            temperature: temperature,
            topP: topP
        };

        this.tools = [];
        if (enableScoreTracking) {
            this.tools.push({
                functionDeclarations: [
                    {
                        name: 'report_score',
                        description: 'Report the score of the user\'s answer effectiveness.',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                score: {
                                    type: 'INTEGER',
                                    description: 'The score of the answer from 0 to 10.',
                                },
                            },
                            required: ['score'],
                        },
                    },
                ],
            });
        }

        // Add instructions
        this.systemInstruction = systemInstruction;
        if (enableScoreTracking) {
            this.systemInstruction += '\n\nIMPORTANT: You are configured to track the user\'s answer quality. When the user answers, you MUST evaluate it and call the "report_score" function with a score from 0 to 10.';
        }

        console.log("Gemini Chat (Text) Connected");
        return true;
    }

    disconnect(): void {
        this.history = [];
    }

    async sendText(text: string): Promise<void> {
        try {
            // Add user message
            this.history.push({ role: 'user', parts: [{ text: text }] });
            await this.generateResponse();
        } catch (e) {
            console.error("Error sending text to Gemini Chat", e);
            console.error("Error al enviar mensaje (Chat)");
        }
    }

    private async generateResponse() {
        console.log("Gemini Chat: generateResponse started. History length:", this.history.length);
        try {
            const req: any = {
                model: this.modelName,
                contents: this.history,
                config: {
                    ...this.config,
                    systemInstruction: { parts: [{ text: this.systemInstruction }] },
                }
            };

            if (this.tools && this.tools.length > 0) {
                req.config.tools = this.tools;
            }

            const stream = await this.client.models.generateContentStream(req);

            let fullText = "";
            let functionCalls: any[] = [];

            for await (const chunk of stream) {
                const candidates = (chunk as any).candidates;
                if (!candidates || candidates.length === 0) continue;

                const parts = candidates[0].content?.parts;
                if (!parts) continue;

                for (const part of parts) {
                    // Handle Text
                    if (part.text) {
                        const text = part.text;
                        this.onTextReceived(text);
                        fullText += text;
                    }

                    // Handle Function Call
                    if (part.functionCall) {
                        functionCalls.push(part.functionCall);

                        // Process Score Immediately
                        const call = part.functionCall;
                        if (call.name === 'report_score') {
                            const args: any = call.args;
                            console.log("Gemini Chat: report_score called", args);
                            if (args && args.score !== undefined) {
                                let score = args.score;
                                if (typeof score === 'string') score = parseInt(score, 10);
                                if (!isNaN(score)) {
                                    this.onScoreReceived(score);
                                }
                            }
                        }
                    }
                }
            }

            // Append model response to history
            const modelParts: any[] = [];
            if (fullText) {
                modelParts.push({ text: fullText });
            }
            if (functionCalls.length > 0) {
                functionCalls.forEach(call => modelParts.push({ functionCall: call }));
            }

            if (modelParts.length > 0) {
                this.history.push({ role: 'model', parts: modelParts });
            }

            // If we had function calls, we MUST respond to them to continue the conversation
            if (functionCalls.length > 0) {
                console.log(`Gemini Chat: Found ${functionCalls.length} function calls. Processing...`);
                for (const call of functionCalls) {
                    // Assuming call.id is available, if not, a unique ID might need to be generated or omitted if not required by the API for functionResponse
                    console.log(`Gemini Chat: Sending response for ${call.name}`);
                    await this.sendFunctionResponse(call.name, call.id, { result: 'ok' });
                }
            } else {
                console.log("Gemini Chat: No function calls found in this turn.");
            }

        } catch (e) {
            console.error("Error generating response", e);
            console.error(`Gemini Chat Error: ${e}`);
        }
    }

    sendContextUpdate(fileName: string, content: string): void {
        const updateMsg = `SYSTEM UPDATE from ${fileName}:\n${content}`;
        // In Chat Mode, we want this to trigger a response because it's usually the "Question"
        this.sendText(updateMsg);
    }

    async sendFunctionResponse(name: string, id: string, response: any) {
        // Push function response
        this.history.push({
            role: 'function',
            parts: [{
                functionResponse: {
                    name: name,
                    response: response
                }
            }]
        });

        // Trigger next generation to continue conversation (model will see the function output and continue)
        await this.generateResponse();
    }

    // Audio methods - No-op
    async resumeAudio(): Promise<void> { }

}
