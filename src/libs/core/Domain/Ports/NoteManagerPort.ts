import { TFile } from 'obsidian'; // We might need to abstract TFile if we want pure decoupling, but for now we'll return generic types or keep TFile if it's too deep to refactor all at once. 
// Wait, the goal is to REMOVE obsidian imports from Application.
// So NoteManagerPort should NOT return TFile. 

import { HeaderMetadata } from '../Constants/HeaderMetadataRegistry'; // Ensuring correct import path

export interface NoteItem {
    path: string;
    name: string;
    extension: string;
    basename: string;
}

export interface NoteMetadata {
    [key: string]: any;
}

export interface NoteHeading {
    heading: string;
    level: number;
    position: {
        start: { line: number; col: number; offset: number };
        end: { line: number; col: number; offset: number };
    };
}

export interface NoteManagerPort {
    getActiveNote(): NoteItem | null;
    readNote(path: string): Promise<string>;
    getNoteMetadata(path: string): Promise<NoteMetadata>;
    getNoteHeadings(path: string): Promise<NoteHeading[]>;
    updateBlockMetadata(path: string, blockId: string, metadata: HeaderMetadata): Promise<void>;


    renameFile(file: NoteItem, newPath: string): Promise<void>;
    ensureFolderExists(path: string): Promise<void>;
    normalizePath(path: string): string;

    // For QuizService specific needs (reading active file content)
    getActiveNoteContent(): Promise<string | null>;
}
