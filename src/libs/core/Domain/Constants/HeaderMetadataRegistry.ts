export const HeaderMetadataKeys = {
    Score: "score",
    Difficulty: "difficulty",
    Importance: "importance",
    Attempts: "attempts",
} as const;

export type HeaderMetadataKey = (typeof HeaderMetadataKeys)[keyof typeof HeaderMetadataKeys];

export interface HeaderMetadataFieldConfig {
    key: HeaderMetadataKey;
    description: string;
    type: 'number' | 'string' | 'boolean';
    defaultValue: string | number | boolean;
}

export const HeaderMetadataRegistry: Record<string, HeaderMetadataFieldConfig> = {
    [HeaderMetadataKeys.Score]: {
        key: HeaderMetadataKeys.Score,
        description: "Puntuación asociada al contenido",
        type: 'number',
        defaultValue: 0
    },
    [HeaderMetadataKeys.Difficulty]: {
        key: HeaderMetadataKeys.Difficulty,
        description: "Nivel de dificultad",
        type: 'number',
        defaultValue: 0
    },
    [HeaderMetadataKeys.Importance]: {
        key: HeaderMetadataKeys.Importance,
        description: "Nivel de importancia",
        type: 'number',
        defaultValue: 0
    },
    [HeaderMetadataKeys.Attempts]: {
        key: HeaderMetadataKeys.Attempts,
        description: "Número de intentos",
        type: 'number',
        defaultValue: 0
    }
};

export interface HeaderMetadata {
    [HeaderMetadataKeys.Score]?: number;
    [HeaderMetadataKeys.Difficulty]?: number;
    [HeaderMetadataKeys.Importance]?: number;
    [HeaderMetadataKeys.Attempts]?: number;
}
