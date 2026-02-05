
export interface HeaderData {
    [blockId: string]: any;
}

export interface HeaderProgress {
    [headerText: string]: number;
}

export interface HeaderDataPort {
    getHeaderData(filePath: string): Promise<HeaderData>;
    getHeaderProgress(filePath: string): Promise<HeaderProgress>;
    exists(filePath: string): Promise<boolean>;
}
