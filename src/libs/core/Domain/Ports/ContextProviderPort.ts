export interface ContextProviderPort {
    getLinkedFileContent(path: string, range?: { start: number, end: number }): Promise<string>;
}
