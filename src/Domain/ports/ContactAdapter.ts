import { Contact } from "../Contact";

export interface ContactAdapter {
    searchContacts(query: string): Promise<Contact[]>;
    upsertContact(contact: Contact): Promise<Contact>;
    listContacts(pageSize: number, pageToken?: string): Promise<{ contacts: Contact[], nextSyncToken?: string, nextPageToken?: string }>;
    deleteContact(resourceName: string): Promise<void>;
}
