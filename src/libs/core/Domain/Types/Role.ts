export interface Role {
    name: string;
    prompt: string;
    trackLevelAnswer: boolean;
    evaluationPrompt?: string;
    liveVoice?: string;
    liveTemperature?: number;
    vocabularyList?: string[];
}
