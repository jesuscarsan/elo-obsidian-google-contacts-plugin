export interface GoogleContactPluginSettings {
    googleClientId: string;
    googleClientSecret: string;
    googleAccessToken: string;
    googleRefreshToken: string;
    googleTokenExpirationTime: number;
    googleCustomSearchApiKey: string;
    googleCustomSearchEngineId: string;
}

export const DEFAULT_SETTINGS: GoogleContactPluginSettings = {
    googleClientId: '',
    googleClientSecret: '',
    googleAccessToken: '',
    googleRefreshToken: '',
    googleTokenExpirationTime: 0,
    googleCustomSearchApiKey: '',
    googleCustomSearchEngineId: ''
}
