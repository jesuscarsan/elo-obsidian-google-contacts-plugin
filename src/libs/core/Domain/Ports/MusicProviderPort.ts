export interface MusicTrack {
    id: string;
    uri: string;
    name: string;
    artists: string[];
    album: string;
}

export interface MusicPlaylist {
    id: string;
    uri: string;
    name: string;
    totalTracks: number;
}

export interface MusicArtist {
    uri: string;
    name: string;
    genres?: string[];
    popularity?: number;
    images?: { url: string; height: number; width: number }[];
}

export interface MusicProviderPort {
    generateAuthUrl(redirectUri: string, options?: any): Promise<string> | string;
    exchangeCode(code: string, redirectUri: string, verifier?: string): Promise<{ accessToken: string, refreshToken: string, expiresIn: number }>;
    isAuthenticated(): boolean;
    searchTracks(query: string): Promise<MusicTrack[]>;
    searchArtists(query: string): Promise<MusicArtist[]>;
    getUserPlaylists(): Promise<MusicPlaylist[]>;
    getPlaylistTracks(playlistId: string): Promise<MusicTrack[]>;
    generatePkceVerifier?(): string; // Optional if handled internally
    generatePkceChallenge?(verifier: string): Promise<string>;
    updateCredentials(clientId: string, accessToken: string): void;
}
