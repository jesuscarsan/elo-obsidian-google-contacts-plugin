
import { App, Modal, Notice, ButtonComponent, FuzzySuggestModal, TFile, normalizePath } from 'obsidian';
import { GoogleContactAdapter } from '../../Adapters/GoogleContactAdapter';
import EloGoogleContactsPlugin from '../../../main';
import { Contact } from '../../../Domain/Contact';
import { SyncContactUseCase } from '../../../Application/UseCases/SyncContactUseCase';

interface ContactMatch {
    contact: Contact;
    suggestedNote?: TFile;
}

export class ProcessUnsyncedGoogleContactsCommand {
    id: string = 'elo-process-unsynced-google-contacts';
    name: string = 'Contactos: Procesar No Sincronizados de Google';

    constructor(
        private app: App,
        private plugin: EloGoogleContactsPlugin
    ) {
    }

    async execute(): Promise<void> {
        new Notice("Buscando contactos no sincronizados en Google...");
        try {
            const matches = await this.fetchUnsyncedContacts();

            if (matches.length === 0) {
                new Notice("No se encontraron contactos pendientes de sincronizar.");
                return;
            }

            new UnsyncedContactsBatchModal(this.app, matches, this.plugin.googleAdapter, this.plugin.syncContactUseCase).open();

        } catch (e) {
            console.error("Error fetching unsynced contacts:", e);
            new Notice(`Error: ${(e as Error).message}`);
        }
    }

    private async fetchUnsyncedContacts(): Promise<ContactMatch[]> {
        const matches: ContactMatch[] = [];
        let pageToken: string | undefined = undefined;
        let limit = 10;

        // Safety break to avoid infinite loops if all contacts are synced but we keep fetching
        let pagesFetched = 0;
        const MAX_PAGES = 20;

        while (matches.length < limit && pagesFetched < MAX_PAGES) {
            // Fetch a batch (larger than limit to reduce calls)
            const response = await this.plugin.googleAdapter.listContacts(30, pageToken);

            if (!response.contacts || response.contacts.length === 0) {
                break;
            }

            for (const contact of response.contacts) {
                // Check if already synced
                if (contact.customFields && contact.customFields['eloSyncDate']) {
                    continue;
                }

                // Add to list
                const match: ContactMatch = {
                    contact: contact
                };

                // Try to find a suggested note
                const suggested = this.findSuggestedNote(contact.name);
                if (suggested) {
                    match.suggestedNote = suggested;
                }

                matches.push(match);

                if (matches.length >= limit) break;
            }

            pageToken = response.nextPageToken;
            pagesFetched++;

            if (!pageToken) break;
        }

        return matches;
    }

    private findSuggestedNote(contactName: string): TFile | undefined {
        if (!contactName) return undefined;
        const lowerName = contactName.toLowerCase();

        const files = this.app.vault.getMarkdownFiles();

        // Exact match
        let exact = files.find(f => f.basename.toLowerCase() === lowerName);
        if (exact) return exact;

        // Partial match
        return files.find(f => f.basename.toLowerCase().includes(lowerName) || lowerName.includes(f.basename.toLowerCase()));
    }
}

class UnsyncedContactsBatchModal extends Modal {
    private matches: ContactMatch[];
    private adapter: GoogleContactAdapter;
    private useCase: SyncContactUseCase;

    constructor(app: App, matches: ContactMatch[], adapter: GoogleContactAdapter, useCase: SyncContactUseCase) {
        super(app);
        this.matches = matches;
        this.adapter = adapter;
        this.useCase = useCase;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h2", { text: "Contactos de Google No Sincronizados" });
        contentEl.createEl("p", { text: "Se muestran hasta 10 contactos pendientes. Elige una acción para cada uno." });

        const container = contentEl.createDiv({ cls: "elo-google-contacts-list" });

        this.matches.forEach(match => {
            this.renderContactItem(container, match);
        });
    }

    private renderContactItem(container: HTMLElement, match: ContactMatch) {
        const itemDiv = container.createDiv({ cls: "elo-contact-item", attr: { style: "display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid var(--background-modifier-border);" } });

        const infoDiv = itemDiv.createDiv();
        infoDiv.createEl("strong", { text: match.contact.name });
        const details = [match.contact.email?.[0], match.contact.phone?.[0]].filter(Boolean).join(", ");
        if (details) {
            infoDiv.createEl("small", { text: ` (${details})`, attr: { style: "color: var(--text-muted);" } });
        }

        if (match.suggestedNote) {
            infoDiv.createDiv({ text: `💡 Sugerencia: [[${match.suggestedNote.basename}]]`, attr: { style: "color: var(--text-accent); font-size: 0.9em;" } });
        }

        const actionsDiv = itemDiv.createDiv({ attr: { style: "display: flex; gap: 5px;" } });

        // LINK
        new ButtonComponent(actionsDiv)
            .setButtonText(match.suggestedNote ? "Enlazar" : "Enlazar...")
            .setIcon("link")
            .setTooltip(match.suggestedNote ? `Enlazar con ${match.suggestedNote.basename}` : "Buscar nota para enlazar")
            .onClick(async () => {
                if (match.suggestedNote) {
                    await this.useCase.linkContactToNote(match.contact, match.suggestedNote.path);
                    itemDiv.remove();
                } else {
                    this.close();
                    new NoteSelectionModal(this.app, match.contact, async (file) => {
                        await this.useCase.linkContactToNote(match.contact, file.path);
                    }).open();
                }
            });

        // CREATE
        new ButtonComponent(actionsDiv)
            .setButtonText("Crear")
            .setIcon("file-plus")
            .setCta()
            .setTooltip("Crear nueva nota en Personas/Conocidos-mios")
            .onClick(async () => {
                const newFilePath = await this.useCase.createNoteFromContact(match.contact);
                new Notice(`Nota creada: ${newFilePath}`);
                itemDiv.remove();
            });

        // MOVE (Create + Delete)
        new ButtonComponent(actionsDiv)
            .setButtonText("Mover")
            .setIcon("import")
            .setTooltip("Crear nota y eliminar de Google")
            .onClick(async () => {
                if (confirm(`¿Crear nota para "${match.contact.name}" y eliminarlo de Google?`)) {
                    await this.useCase.createNoteFromContact(match.contact);
                    if (match.contact.id) {
                        await this.adapter.deleteContact(match.contact.id);
                        new Notice(`Movido a Obsidian: ${match.contact.name}`);
                    }
                    itemDiv.remove();
                }
            });

        // DELETE
        new ButtonComponent(actionsDiv)
            .setButtonText("Eliminar")
            .setIcon("trash")
            .setWarning()
            .setTooltip("Eliminar de Google Contacts")
            .onClick(async () => {
                if (confirm(`¿Seguro que quieres eliminar a "${match.contact.name}" de Google Contacts?`)) {
                    if (match.contact.id) {
                        await this.adapter.deleteContact(match.contact.id);
                        new Notice(`Eliminado de Google: ${match.contact.name}`);
                    }
                    itemDiv.remove();
                }
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class NoteSelectionModal extends FuzzySuggestModal<TFile> {
    constructor(app: App, private contact: Contact, private onSelect: (file: TFile) => void) {
        super(app);
        this.setPlaceholder(`Selecciona nota para enlazar con "${contact.name}"`);
    }

    getItems(): TFile[] {
        return this.app.vault.getMarkdownFiles();
    }

    getItemText(item: TFile): string {
        return item.path;
    }

    onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void {
        this.onSelect(item);
    }
}
