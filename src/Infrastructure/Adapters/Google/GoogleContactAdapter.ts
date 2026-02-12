import { Contact } from "../../../Domain/Contact";
import { ContactAdapter } from "../../../Domain/Ports/ContactAdapter";
import { GoogleContactPluginSettings } from "../../Obsidian/settings";
import { Notice, requestUrl, RequestUrlParam } from "obsidian";
import { GoogleContactMapper } from "./api/mappers/GoogleContactMapper";
import { GooglePersonResponse, GoogleConnectionsResponse, GoogleSearchResponse, GoogleContactGroupsResponse } from "./api/dtos/GooglePersonResponse";

export class GoogleContactAdapter implements ContactAdapter {
    private settings: GoogleContactPluginSettings;
    private saveSettings: (settings: GoogleContactPluginSettings) => Promise<void>;

    constructor(
        settings: GoogleContactPluginSettings,
        saveSettings: (settings: GoogleContactPluginSettings) => Promise<void>
    ) {
        this.settings = settings;
        this.saveSettings = saveSettings;
    }

    generateAuthUrl(redirectUri: string): string {
        if (!this.settings.googleClientId) {
            console.error("Google Client ID is missing.");
            return "";
        }

        const scope = "https://www.googleapis.com/auth/contacts";
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.settings.googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

        return url;
    }

    async finishAuthentication(code: string, redirectUri: string): Promise<boolean> {
        if (!this.settings.googleClientId || !this.settings.googleClientSecret) {
            throw new Error("Missing Client ID or Secret in settings.");
        }

        try {
            const response = await requestUrl({
                url: "https://oauth2.googleapis.com/token",
                method: "POST",
                throw: false,
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: this.settings.googleClientId,
                    client_secret: this.settings.googleClientSecret,
                    code: code,
                    grant_type: "authorization_code",
                    redirect_uri: redirectUri
                }).toString(),
            });

            if (response.status !== 200) {
                console.error("[GoogleAdapter] Token Exchange Failed. Status:", response.status);
                throw new Error(`Failed to exchange token: ${response.text}`);
            }

            const data = response.json;
            if (!data.access_token) {
                throw new Error("No access_token in response");
            }

            this.settings.googleAccessToken = data.access_token;
            // expires_in is usually 3600 seconds
            const now = Date.now();
            this.settings.googleTokenExpirationTime = now + (data.expires_in * 1000);

            if (data.refresh_token) {
                this.settings.googleRefreshToken = data.refresh_token;
            }

            await this.saveSettings(this.settings);
            console.log("[GoogleAdapter] Authentication Successful");
            return true;

        } catch (error) {
            console.error("[GoogleAdapter] Auth Error", error);
            throw error;
        }
    }

    private async getAccessToken(): Promise<string> {
        // Check if we have tokens at all
        if (!this.settings.googleRefreshToken && !this.settings.googleAccessToken) {
            throw new Error("No Google tokens found. Please authenticate first.");
        }

        const now = Date.now();
        // Add 5 minute buffer
        if (this.settings.googleAccessToken && this.settings.googleTokenExpirationTime > now + 300000) {
            return this.settings.googleAccessToken;
        }

        if (!this.settings.googleRefreshToken) {
            throw new Error("Google Refresh Token is missing. Re-authentication required.");
        }

        console.log("[GoogleAdapter] Refreshing Access Token...");

        try {
            const response = await requestUrl({
                url: "https://oauth2.googleapis.com/token",
                method: "POST",
                throw: false,
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: this.settings.googleClientId,
                    client_secret: this.settings.googleClientSecret,
                    refresh_token: this.settings.googleRefreshToken,
                    grant_type: "refresh_token",
                }).toString(),
            });

            if (response.status !== 200) {
                console.error("[GoogleAdapter] Token Refresh Failed. Status:", response.status);
                console.error("[GoogleAdapter] Response Body:", response.text);
                throw new Error(`Failed to refresh token: ${response.status} - ${response.text}`);
            }

            const data = response.json;
            if (!data.access_token) {
                throw new Error("No access_token in response");
            }

            this.settings.googleAccessToken = data.access_token;
            // expires_in is usually 3600 seconds
            this.settings.googleTokenExpirationTime = now + (data.expires_in * 1000);

            await this.saveSettings(this.settings);
            console.log("[GoogleAdapter] Token Refreshed Successfully");
            return this.settings.googleAccessToken;

        } catch (error) {
            console.error("[GoogleAdapter] Auth Error", error);
            new Notice("Error al autenticar con Google. Revisa la consola.");
            throw error;
        }
    }

    private async request<T>(url: string, method: string = "GET", body?: any): Promise<T> {
        const token = await this.getAccessToken();
        const params: RequestUrlParam = {
            url,
            method,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        };

        if (body) {
            params.body = JSON.stringify(body);
        }

        const response = await requestUrl(params);

        if (response.status >= 400) {
            throw new Error(`Google API Error ${response.status}: ${response.text}`);
        }

        return response.json;
    }

    async searchContacts(query: string): Promise<Contact[]> {
        // Ensure groups are loaded
        await this.ensureContactGroupsLoaded();

        // People API: people.searchContacts
        if (query.length < 1) return [];

        const url = `https://people.googleapis.com/v1/people:searchContacts?query=${encodeURIComponent(query)}&readMask=names,phoneNumbers,emailAddresses,birthdays,biographies,userDefined,metadata,nicknames,organizations,addresses,urls,events,relations,genders,occupations,interests,skills,residences,memberships`;

        try {
            const data = await this.request<GoogleSearchResponse>(url);
            if (!data.results) return [];

            const mapper = new GoogleContactMapper(this.contactGroupIdsToNames, this.contactGroupNamesToIds);
            return data.results.map(item => mapper.toDomain(item.person));
        } catch (e) {
            console.error("[GoogleAdapter] Search Error", e);
            throw e;
        }
    }

    async upsertContact(contact: Contact): Promise<Contact> {
        await this.ensureContactGroupsLoaded();
        if (contact.id) {
            return this.updateContact(contact.id, contact);
        } else {
            return this.createContact(contact);
        }
    }

    private async createContact(contact: Contact): Promise<Contact> {
        const url = `https://people.googleapis.com/v1/people:createContact`;
        const mapper = new GoogleContactMapper(this.contactGroupIdsToNames, this.contactGroupNamesToIds);
        const body = mapper.toPayload(contact);

        const data = await this.request<GooglePersonResponse>(url, "POST", body);
        return mapper.toDomain(data);
    }

    private async updateContact(resourceName: string, contact: Contact): Promise<Contact> {
        // Fetch current person to get etag and memberships
        const getUrl = `https://people.googleapis.com/v1/${resourceName}?personFields=names,phoneNumbers,emailAddresses,birthdays,userDefined,nicknames,organizations,addresses,urls,events,relations,genders,occupations,interests,skills,residences,memberships`;
        const current = await this.request<GooglePersonResponse>(getUrl);

        const etag = current.etag;
        const mapper = new GoogleContactMapper(this.contactGroupIdsToNames, this.contactGroupNamesToIds);

        // Prepare update
        const body = mapper.toPayload(contact);
        body.etag = etag; // Critical for update

        const updateMask = [];
        if (contact.name) updateMask.push("names");
        if (contact.phone) updateMask.push("phoneNumbers");
        if (contact.email) updateMask.push("emailAddresses");
        if (contact.birthday) updateMask.push("birthdays");
        if (contact.customFields) updateMask.push("userDefined");
        if (contact.nickname) updateMask.push("nicknames");
        if (contact.jobTitle || contact.organization) updateMask.push("organizations");

        // Handle Groups / Memberships
        if (contact.groups) {
            updateMask.push("memberships");

            const currentMemberships = current.memberships || [];

            const newMemberships = [];

            // Add Target Groups
            if (body.memberships) {
                newMemberships.push(...body.memberships);
            }

            // Keep existing "system" or unmanaged groups?
            for (const m of currentMemberships) {
                const id = m.contactGroupMembership?.contactGroupResourceName;
                const mappedName = id ? this.contactGroupIdsToNames.get(id) : undefined;

                // Fallback: If we don't know the name, keep it.
                if (!mappedName && id) {
                    // Check if already in new (duplicate)?
                    const exists = newMemberships.find(nm => nm.contactGroupMembership?.contactGroupResourceName === id);
                    if (!exists) newMemberships.push(m);
                }
            }

            body.memberships = newMemberships as any;
        }

        const updateUrl = `https://people.googleapis.com/v1/${resourceName}:updateContact?updatePersonFields=${updateMask.join(",")}&personFields=names,phoneNumbers,emailAddresses,birthdays,biographies,userDefined,metadata,nicknames,organizations,addresses,urls,events,relations,genders,occupations,interests,skills,residences,memberships`;

        const data = await this.request<GooglePersonResponse>(updateUrl, "PATCH", body);
        return mapper.toDomain(data);
    }


    async listContacts(pageSize: number, pageToken?: string): Promise<{ contacts: Contact[], nextSyncToken?: string, nextPageToken?: string }> {
        // Ensure groups are loaded
        await this.ensureContactGroupsLoaded();

        let url = `https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses,birthdays,biographies,userDefined,metadata,nicknames,organizations,addresses,urls,events,relations,genders,occupations,interests,skills,residences,memberships&pageSize=${pageSize}`;
        if (pageToken) {
            url += `&pageToken=${pageToken}`;
        }

        const data = await this.request<GoogleConnectionsResponse>(url);
        const mapper = new GoogleContactMapper(this.contactGroupIdsToNames, this.contactGroupNamesToIds);

        return {
            contacts: (data.connections || []).map(p => mapper.toDomain(p)),
            nextSyncToken: data.nextSyncToken,
            nextPageToken: data.nextPageToken
        };
    }

    async deleteContact(resourceName: string): Promise<void> {
        const url = `https://people.googleapis.com/v1/${resourceName}:deleteContact`;
        await this.request(url, "DELETE");
    }

    // --- Groups / Labels Support ---
    private contactGroupIdsToNames: Map<string, string> = new Map();
    private contactGroupNamesToIds: Map<string, string> = new Map();
    private groupsLoaded = false;

    private async ensureContactGroupsLoaded() {
        if (this.groupsLoaded) return;
        try {
            console.log("[GoogleAdapter] Loading Contact Groups...");
            const url = `https://people.googleapis.com/v1/contactGroups`;
            const data = await this.request<GoogleContactGroupsResponse>(url);

            if (data.contactGroups) {
                for (const g of data.contactGroups) {
                    const name = g.formattedName || g.name;
                    const id = g.resourceName;

                    this.contactGroupIdsToNames.set(id, name);
                    this.contactGroupNamesToIds.set(name, id);
                }
            }
            this.groupsLoaded = true;
            console.log(`[GoogleAdapter] Loaded ${this.contactGroupIdsToNames.size} groups.`);
        } catch (e) {
            console.error("[GoogleAdapter] Error loading groups", e);
        }
    }
}
