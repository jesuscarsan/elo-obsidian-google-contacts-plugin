export interface NoteMetadata {
    frontmatter?: Record<string, any>;
    tags?: string[];
    path: string;
    basename: string;
}

export interface NoteRepository {
    /**
     * Reads note content and metadata
     */
    getNoteMetadata(path: string): Promise<NoteMetadata | null>;
    
    /**
     * Reads the raw content of a note
     */
    readNote(path: string): Promise<string>;

    /**
     * Appends content to a note
     */
    appendContent(path: string, content: string): Promise<void>;

    /**
     * Updates specific frontmatter keys
     */
    updateFrontmatter(path: string, callback: (frontmatter: any) => void): Promise<void>;

    /**
     * Creates a new note with content
     */
    createNote(path: string, content: string): Promise<NoteMetadata>;

    /**
     * Checks if a file exists
     */
    exists(path: string): Promise<boolean>;

    /**
     * Creates a folder if it doesn't exist
     */
    createFolder(path: string): Promise<void>;
    
    /**
     * Gets a template content if it exists
     */
    getTemplateContent(path: string): Promise<string | null>;
}
