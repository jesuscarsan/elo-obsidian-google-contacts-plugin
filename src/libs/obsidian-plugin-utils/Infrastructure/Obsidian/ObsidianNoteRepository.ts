import { App, TFile, getAllTags } from "obsidian";
import { NoteMetadata, NoteRepository } from "../../Domain/ports/NoteRepository";

export class ObsidianNoteRepository implements NoteRepository {
    constructor(private app: App) {}

    async getNoteMetadata(path: string): Promise<NoteMetadata | null> {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) return null;

        const cache = this.app.metadataCache.getFileCache(file);
        return {
            path: file.path,
            basename: file.basename,
            frontmatter: cache?.frontmatter,
            tags: cache ? (getAllTags(cache) || undefined) : undefined
        };
    }

    async readNote(path: string): Promise<string> {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) throw new Error(`File not found: ${path}`);
        return await this.app.vault.read(file);
    }

    async appendContent(path: string, content: string): Promise<void> {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) throw new Error(`File not found: ${path}`);
        
        const currentContent = await this.app.vault.read(file);
        await this.app.vault.modify(file, currentContent + content);
    }

    async updateFrontmatter(path: string, callback: (frontmatter: any) => void): Promise<void> {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) throw new Error(`File not found: ${path}`);

        await this.app.fileManager.processFrontMatter(file, callback);
    }

    async createNote(path: string, content: string): Promise<NoteMetadata> {
        const file = await this.app.vault.create(path, content);
        
        // Wait for cache to update? simple return for now
        return {
            path: file.path,
            basename: file.basename,
            frontmatter: {},
            tags: []
        };
    }

    async exists(path: string): Promise<boolean> {
        return await this.app.vault.adapter.exists(path);
    }

    async createFolder(path: string): Promise<void> {
        // Obsidian can create nested folders? or need recursive?
        // simple createFolder usuall works if parent exists or specific recursive helper
        if (!(await this.exists(path))) {
             await this.app.vault.createFolder(path);
        }
    }

    async getTemplateContent(path: string): Promise<string | null> {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile) {
            return await this.app.vault.read(file);
        }
        return null;
    }
}
