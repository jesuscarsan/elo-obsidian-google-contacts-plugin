export interface TranscriptionPort {
    transcribe(audioBlob: Blob): Promise<string>;
}
