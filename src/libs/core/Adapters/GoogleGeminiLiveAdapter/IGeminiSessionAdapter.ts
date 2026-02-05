export interface IGeminiSessionAdapter {
    connect(systemInstruction: string, enableScoreTracking: boolean, voice: string, temperature: number, topP: number): Promise<boolean>;
    disconnect(): void;
    sendText(text: string): void;
    sendContextUpdate(fileName: string, content: string): void;

    // Audio specific (can be no-op for text)
    resumeAudio(): Promise<void>;
}
