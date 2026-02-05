import { Contact } from "../Contact";

export interface UIService {
    /**
     * Prompts the user to select a contact from a list of candidates.
     */
    selectContact(noteName: string, query: string, candidates: Contact[]): Promise<Contact | null>;

    /**
     * Shows a notification to the user.
     */
    notify(message: string): void;

    /**
     * Confirms an action with the user.
     */
    confirm(title: string, message: string): Promise<boolean>;
}
