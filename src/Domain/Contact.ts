
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

