import { Contact, ContactAdapter } from "../../Domain/Contact";
import { NoteRepository } from "@elo/obsidian-plugin";
import { UIService } from "../../Domain/ports/UIService";
import { GoogleContactTransformer } from "../../Domain/GoogleContactTransformer";

export class SyncContactUseCase {
    constructor(
        private noteRepo: NoteRepository,
        private uiService: UIService,
        private adapter: ContactAdapter,
        private transformer: GoogleContactTransformer 
    ) { }

    /**
     * Syncs a specific note with Google.
     * If no Google ID exists, searches for candidates or creates a new one.
     */
    async syncNoteWithGoogle(notePath: string): Promise<void> {
        const metadata = await this.noteRepo.getNoteMetadata(notePath);
        if (!metadata) return;

        const frontmatter = metadata.frontmatter || {};

        // 1. Transform Note -> Contact
        // REFACTOR NEEDED: Transformer currently depends on TFile/Cache?
        // We should probably move transformation logic here or update transformer to use generic objects
        // For now, assuming transformer is also refactored or we do it inline here.
        // Let's assume transformer needs refactoring too, but for now we pass plain objects
        
        // Wait, `GoogleContactTransformer.toContact` takes (file: TFile, frontmatter: any, tags: string[])
        // We need to fix that too.
        // Ideally transformer should be pure domain service found in Domain/Services?
        // Or just a utility class. It sits in Infrastructure currently.
        const tags = metadata.tags || [];
        
        // TEMPORARY: We might need to adjust transformer signature.
        // For this step I will assume transformer takes (basename, frontmatter, tags)
        
        const contactData = this.transformer.toContactFromMetadata(metadata.basename, frontmatter, tags);
        let selectedCandidate: Contact | null = null;

        // 2. Identify / Match
        if (!contactData.id) {
            const cleanName = contactData.name;
            console.log(`[SyncService] Searching candidates for: ${cleanName}`);

            try {
                const candidates = await this.adapter.searchContacts(cleanName);
                if (candidates && candidates.length > 0) {
                    selectedCandidate = await this.uiService.selectContact(metadata.basename, cleanName, candidates);

                    if (selectedCandidate) {
                        contactData.id = selectedCandidate.id;
                        this.uiService.notify(`Enlazado a Google Contact: ${selectedCandidate.name}`);
                    } else {
                        this.uiService.notify(`Creando nuevo contacto en Google: ${cleanName}`);
                    }
                } else {
                    this.uiService.notify(`No se encontraron candidatos. Creando nuevo...`);
                }
            } catch (err) {
                console.error("Error searching candidate:", err);
            }
        }

        // 3. Upsert to Google
        const syncedContact = await this.adapter.upsertContact(contactData);

        // 4. Update Note Frontmatter (Sync back)
        await this.noteRepo.updateFrontmatter(notePath, (fm: any) => {
            this.transformer.updateFrontmatterFromContact(fm, syncedContact);
        });
    }

    /**
     * Links a specific Google Contact to a Note.
     * Updates frontmatter and appends notes if any.
     */
    async linkContactToNote(contact: Contact, notePath: string): Promise<void> {
        // 1. Update Obsidian Note
        await this.noteRepo.updateFrontmatter(notePath, (fm: any) => {
            this.transformer.updateFrontmatterFromContact(fm, contact);
        });

        // Append Notes to Body if they exist
        if (contact.notes) {
            await this.noteRepo.appendContent(notePath, "\n\n" + contact.notes);
        }

        // 2. Update Google Contact (set eloSyncDate)
        const updatedContact: Contact = {
            ...contact,
            customFields: {
                ...contact.customFields,
                eloSyncDate: new Date().toISOString()
            }
        };
        await this.adapter.upsertContact(updatedContact);
        
        // Get basename for notification
        const meta = await this.noteRepo.getNoteMetadata(notePath);
        this.uiService.notify(`Enlazado: ${contact.name} <-> ${meta?.basename}`);
    }

    /**
     * Creates a new note from a Contact and links them.
     */
    async createNoteFromContact(contact: Contact): Promise<string> {
        const templatePath = "!!metadata/templates/Personas/Persona conocidos mios.md";
        let content = await this.noteRepo.getTemplateContent(templatePath) || "";

        // Determine filename
        let filename = `Personas/${contact.name}.md`;

        // Ensure folder exists
        await this.noteRepo.createFolder("Personas");

        // Handle duplicates
        let i = 1;
        while (await this.noteRepo.exists(filename)) {
            filename = `Personas/${contact.name} ${i}.md`;
            i++;
        }

        const newNote = await this.noteRepo.createNote(filename, content);

        // Link
        await this.linkContactToNote(contact, newNote.path);

        return newNote.path;
    }
}
