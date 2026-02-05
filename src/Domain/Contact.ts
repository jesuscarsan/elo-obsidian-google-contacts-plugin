
export interface Contact {
    id?: string; // Resource Name for Google, UUID for Mac
    name: string;
    phone?: string[];
    email?: string[];
    birthday?: string; // YYYY-MM-DD
    updatedAt?: string; // ISO string
    notes?: string;
    nickname?: string;
    jobTitle?: string;
    organization?: string;
    addresses?: string[];
    urls?: string[];
    events?: string[];
    relations?: string[];
    gender?: string;
    occupations?: string[];
    interests?: string[];
    skills?: string[];
    residences?: string[];
    customFields?: Record<string, string>;
    groups?: string[]; // Contact Group Names (Labels)
}

export interface ContactAdapter {
    searchContacts(query: string): Promise<Contact[]>;
    upsertContact(contact: Contact): Promise<Contact>;
    listContacts(pageSize: number, pageToken?: string): Promise<{ contacts: Contact[], nextSyncToken?: string, nextPageToken?: string }>;
    deleteContact(resourceName: string): Promise<void>;
}
