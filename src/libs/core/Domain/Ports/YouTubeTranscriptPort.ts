export type YouTubeTranscriptParams = {
  videoId: string;
};

export interface YouTubeTranscriptPort {
  fetchTranscript(params: YouTubeTranscriptParams): Promise<string | null>;
}
