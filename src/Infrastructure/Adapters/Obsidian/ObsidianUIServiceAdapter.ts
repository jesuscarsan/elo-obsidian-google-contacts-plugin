import { App, FuzzySuggestModal, Notice } from "obsidian";
import { UIService } from "../../../Domain/Ports/UIService";
import { Contact } from "../../../Domain/Contact";

export class ObsidianUIServiceAdapter implements UIService {
    constructor(private app: App) { }

    async selectContact(noteName: string, query: string, candidates: Contact[]): Promise<Contact | null> {
        return new Promise((resolve) => {
            const modal = new ContactSelectionModal(this.app, noteName, query, candidates, (selected) => {
                resolve(selected);
            });
            modal.open();
        });
    }

    notify(message: string): void {
        new Notice(message);
    }

    async confirm(title: string, message: string): Promise<boolean> {
        // Simple placeholder, real confirmation modal would be better
        // For now just return true or implement a simple Modal
        return true;
    }
}

class ContactSelectionModal extends FuzzySuggestModal<any> {
    constructor(
        app: App,
        private noteName: string,
        private query: string,
        private candidates: Contact[],
        private onChoose: (item: Contact | null) => void
    ) {
        super(app);
        this.setPlaceholder(`Selecciona un contacto de Google para "${noteName}"`);
    }

    getItems(): any[] {
        return [
            ...this.candidates,
            { id: "CREATE_NEW", name: `➕ Crear nuevo contacto: "${this.query}"` }
        ];
    }

    getItemText(item: any): string {
        if (item.id === "CREATE_NEW") return item.name;

        const details = [
            item.phone?.join(", "),
            item.email?.join(", ")
        ].filter(Boolean).join(" | ");

        return `${item.name} ${details ? `(${details})` : ''}`;
    }

    onChooseItem(item: any, evt: MouseEvent | KeyboardEvent): void {
        if (item.id === "CREATE_NEW") {
            this.onChoose(null);
        } else {
            this.onChoose(item);
        }
    }
}
