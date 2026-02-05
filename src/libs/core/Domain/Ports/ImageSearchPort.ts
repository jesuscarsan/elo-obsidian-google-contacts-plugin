export interface ImageSearchPort {
    searchImages(query: string, count: number): Promise<string[]>;
}
