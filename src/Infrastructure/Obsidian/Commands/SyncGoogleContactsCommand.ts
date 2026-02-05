
import { App, Notice, TFile, FuzzySuggestModal, getAllTags } from 'obsidian';
import { GoogleAuthModal } from '../Views/GoogleAuthModal';
import { executeInEditMode, getActiveMarkdownView } from '../Utils/ViewMode';
import { GoogleContactAdapter } from '../../Adapters/GoogleContactAdapter';
import EloGoogleContactsPlugin from '../../../main';
import { SyncContactUseCase } from '../../../Application/UseCases/SyncContactUseCase';

export class SyncGoogleContactsCommand {
    id: string = 'elo-sync-google-contacts';
    name: string = 'Contactos: Sincronizar Nota Activa con Google';

    constructor(
        private app: App,
        private plugin: EloGoogleContactsPlugin
    ) {
    }

    async execute(file?: TFile): Promise<void> {
        const targetFile = file || this.app.workspace.getActiveFile();

        if (!targetFile || !(targetFile instanceof TFile)) {
            new Notice("No hay ninguna nota activa.");
            return;
        }

        if (!this.isPersona(targetFile)) {
            new Notice("La nota activa no es una Persona (falta tag #Personas).");
            return;
        }

        const view = getActiveMarkdownView(this.app, targetFile);
        if (!view) {
            new Notice("No se pudo obtener la vista de la nota para activar el modo edición.");
            return;
        }

        await executeInEditMode(view, async () => {
            new Notice(`Sincronizando con Google: ${targetFile.basename}...`);
            try {
                await this.plugin.syncContactUseCase.syncNoteWithGoogle(targetFile.path);
                new Notice(`Sincronización con Google completada para ${targetFile.basename}`);
            } catch (e) {
                console.error(`Error syncing ${targetFile.basename}:`, e);
                // Check if error is related to auth
                const msg = (e as Error).message;
                if (msg.includes("Refresh Token is missing") || msg.includes("No Google tokens") || msg.includes("401") || msg.includes("403") || msg.includes("invalid_grant") || msg.includes("Token has been expired")) {
                    new Notice("Autenticación necesaria con Google.");
                    new GoogleAuthModal(this.app, this.plugin.googleAdapter, async () => {
                        // On Success, retry? Or just notify.
                        new Notice("Autenticado correctamente. Ejecuta el comando de nuevo.");
                    }).open();
                } else {
                    new Notice(`Error al sincronizar con Google: ${msg}`);
                }
            }
        });
    }

    private isPersona(file: TFile): boolean {
        const cache = this.app.metadataCache.getFileCache(file);
        if (!cache) return false;

        const tags = getAllTags(cache);
        // console.log("tags:", tags);
        if (tags && tags.some(t => t.startsWith("#Personas/"))) {
            return true;
        }
        return false;
    }
}
