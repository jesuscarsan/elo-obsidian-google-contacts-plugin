import { Contact } from '../../../../../Domain/Contact';
import {
    GooglePersonResponse,
    GooglePersonPayload,
    GoogleName
} from '../dtos/GooglePersonResponse';


export class GoogleContactMapper {
    constructor(
        private groupIdsToNames: Map<string, string>,
        private groupNamesToIds: Map<string, string>
    ) { }

    toDomain(person: GooglePersonResponse): Contact {
        const names = person.names || [];
        const phones = person.phoneNumbers || [];
        const emails = person.emailAddresses || [];
        const birthdays = person.birthdays || [];
        const biographies = person.biographies || [];
        const nicknames = person.nicknames || [];
        const organizations = person.organizations || [];
        const addresses = person.addresses || [];
        const urls = person.urls || [];
        const events = person.events || [];
        const relations = person.relations || [];
        const genders = person.genders || [];
        const occupations = person.occupations || [];
        const interests = person.interests || [];
        const skills = person.skills || [];
        const residences = person.residences || [];
        const memberships = person.memberships || []; // Array

        const primaryName = names.find(n => n.metadata?.primary) || names[0];

        // Birthday parse
        let bdayStr = undefined;
        if (birthdays.length > 0 && birthdays[0].date) {
            const b = birthdays[0].date;
            if (b.year && b.month && b.day) {
                bdayStr = `${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`;
            }
        }

        // Updated At (from metadata source)
        let updatedAt = undefined;
        if (person.metadata && person.metadata.sources && person.metadata.sources.length > 0) {
            updatedAt = person.metadata.sources.find(s => s.type === "CONTACT")?.updateTime || person.metadata.sources[0].updateTime;
        }

        // Map Groups
        const groups = memberships.map(m => {
            const id = m.contactGroupMembership?.contactGroupResourceName;
            return id ? this.groupIdsToNames.get(id) : undefined;
        }).filter((g): g is string => !!g);

        return {
            id: person.resourceName,
            name: primaryName ? primaryName.displayName : "No Name",
            phone: phones.map(p => p.value),
            email: emails.map(e => e.value),
            birthday: bdayStr,
            updatedAt: updatedAt,
            notes: biographies.find(b => b.contentType === "TEXT_PLAIN")?.value,
            nickname: nicknames[0]?.value,
            jobTitle: organizations[0]?.title,
            organization: organizations[0]?.name,
            addresses: addresses.map(a => a.formattedValue),
            urls: urls.map(u => u.value),
            events: events.map(e => {
                if (e.date && e.type) {
                    const d = e.date;
                    const dateStr = `${d.year || '????'}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
                    return `${e.type}: ${dateStr}`;
                }
                return null;
            }).filter((e): e is string => !!e),
            relations: relations.map(r => `${r.person} (${r.type})`),
            gender: genders[0]?.value,
            occupations: occupations.map(o => o.value),
            interests: interests.map(i => i.value),
            skills: skills.map(s => s.value),
            residences: residences.map(r => r.value),
            customFields: (person.userDefined || []).reduce((acc: any, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {}),
            groups: groups
        };
    }

    toPayload(contact: Contact): GooglePersonPayload {
        const payload: GooglePersonPayload = {};

        if (contact.name) {
            // Split name simplistic
            const parts = contact.name.split(" ");
            const given = parts[0];
            const family = parts.slice(1).join(" ");
            payload.names = [{
                givenName: given,
                familyName: family
            }];
        }

        if (contact.phone && contact.phone.length > 0) {
            payload.phoneNumbers = contact.phone.map(p => ({ value: p }));
        }

        if (contact.email && contact.email.length > 0) {
            payload.emailAddresses = contact.email.map(e => ({ value: e }));
        }

        if (contact.birthday) {
            // Expect YYYY-MM-DD
            const [y, m, d] = contact.birthday.split("-").map(Number);
            if (y && m && d) {
                payload.birthdays = [{
                    date: {
                        year: y,
                        month: m,
                        day: d
                    }
                }];
            }
        }

        if (contact.nickname) {
            payload.nicknames = [{
                value: contact.nickname
            }];
        }

        if (contact.jobTitle || contact.organization) {
            const org: { name?: string; title?: string } = {};
            if (contact.jobTitle) org.title = contact.jobTitle;
            if (contact.organization) org.name = contact.organization;
            payload.organizations = [org];
        }

        if (contact.customFields) {
            payload.userDefined = Object.entries(contact.customFields).map(([key, value]) => ({
                key: key,
                // Ensure value is string
                value: String(value)
            }));
        }

        if (contact.groups) {
            const mShips = [];
            for (const gName of contact.groups) {
                const gId = this.groupNamesToIds.get(gName);
                if (gId) {
                    mShips.push({
                        contactGroupMembership: {
                            contactGroupResourceName: gId
                        }
                    });
                }
            }
            if (mShips.length > 0) payload.memberships = mShips;
        }

        return payload;
    }
}
