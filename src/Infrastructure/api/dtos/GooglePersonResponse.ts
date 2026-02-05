export interface GooglePersonResponse {
    resourceName: string;
    etag: string;
    names?: GoogleName[];
    phoneNumbers?: GooglePhoneNumber[];
    emailAddresses?: GoogleEmailAddress[];
    birthdays?: GoogleBirthday[];
    biographies?: GoogleBiography[];
    userDefined?: GoogleUserDefined[];
    nicknames?: GoogleNickname[];
    organizations?: GoogleOrganization[];
    addresses?: GoogleAddress[];
    urls?: GoogleUrl[];
    events?: GoogleEvent[];
    relations?: GoogleRelation[];
    genders?: GoogleGender[];
    occupations?: GoogleOccupation[];
    interests?: GoogleInterest[];
    skills?: GoogleSkill[];
    residences?: GoogleResidence[];
    memberships?: GoogleMembership[];
    metadata?: GoogleMetadata;
}

export interface GoogleName {
    displayName: string;
    metadata?: { primary?: boolean; source?: any };
    givenName?: string;
    familyName?: string;
}

export interface GooglePhoneNumber {
    value: string;
}

export interface GoogleEmailAddress {
    value: string;
}

export interface GoogleBirthday {
    date: {
        year?: number;
        month?: number;
        day?: number;
    };
}

export interface GoogleBiography {
    value: string;
    contentType: "TEXT_PLAIN" | "TEXT_HTML";
}

export interface GoogleUserDefined {
    key: string;
    value: string;
}

export interface GoogleNickname {
    value: string;
}

export interface GoogleOrganization {
    name?: string;
    title?: string;
}

export interface GoogleAddress {
    formattedValue: string;
}

export interface GoogleUrl {
    value: string;
}

export interface GoogleEvent {
    type: string;
    date: {
        year?: number;
        month?: number;
        day?: number;
    };
}

export interface GoogleRelation {
    person: string;
    type: string;
}

export interface GoogleGender {
    value: string;
}

export interface GoogleOccupation {
    value: string;
}

export interface GoogleInterest {
    value: string;
}

export interface GoogleSkill {
    value: string;
}

export interface GoogleResidence {
    value: string;
}

export interface GoogleMembership {
    contactGroupMembership?: {
        contactGroupResourceName: string;
    };
}

export interface GoogleMetadata {
    sources: {
        type: string;
        updateTime: string;
    }[];
}

export interface GoogleConnectionsResponse {
    connections?: GooglePersonResponse[];
    nextPageToken?: string;
    nextSyncToken?: string;
}

export interface GoogleSearchResponse {
    results?: { person: GooglePersonResponse }[];
}

export interface GooglePersonPayload {
    etag?: string;
    names?: { givenName?: string; familyName?: string; }[];
    phoneNumbers?: { value: string }[];
    emailAddresses?: { value: string }[];
    birthdays?: { date: { year?: number; month?: number; day?: number } }[];
    nicknames?: { value: string }[];
    organizations?: { name?: string; title?: string }[];
    userDefined?: { key: string; value: string }[];
    memberships?: { contactGroupMembership: { contactGroupResourceName: string } }[];
}

export interface GoogleContactGroupsResponse {
    contactGroups?: {
        resourceName: string;
        name: string;
        formattedName?: string;
    }[];
}
