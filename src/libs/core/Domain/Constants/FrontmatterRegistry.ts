import { CommandEnum } from "./CommandIds";

export const FrontmatterKeys = {
    EloCommands: "!!commands",
    EloPrompt: "!!prompt",
    EloPromptUrl: "!!promptUrl",
    EloImages: "!!images",
    EloAppleContactId: "!!appleContactId",
    Municipio: "Municipio",
    Provincia: "Provincia",
    LugarId: "Lugar Id",
    Region: "Región",
    Pais: "País",
    Paises: "Países",
    Lugares: "Lugares",
    Lugar: "Lugar",
    SedePrincipal: "Sede principal",
    Latitud: "Latitud",
    Longitud: "Longitud",
    Url: "Url",
    SpotifyUri: "Spotify uri",
    Capital: "Capital",
    Tags: "tags",
    Conocidos: "Conocidos",
    Hijos: "Hijos",
    Padres: "Padres",
    Pareja: "Pareja",
    Exparejas: "Exparejas",
    Hermanos: "Hermanos",
    Familiares: "Familiares",
    CompanerosTrabajo: "Compañeros de trabajo",
    Jefes: "Jefes",
    Empleados: "Empleados",
    EstilosMusicales: "Estilos musicales",
    SpotifyPopularity: "Spotify popularidad",
    Telefono: "Teléfono",
    Email: "Email",
    Cumpleanos: "Cumpleaños",
    Apodo: "Apodo",
    Puesto: "Puesto de trabajo",
    Empresa: "Empresa",
    Direcciones: "Direcciones",
    Urls: "Urls",
    Eventos: "Eventos",
    Relaciones: "Relaciones",
    Genero: "Género",
    Ocupaciones: "Ocupaciones",
    Intereses: "Intereses",
    Habilidades: "Habilidades",
    Residencias: "Residencias",
} as const;

export type FrontmatterKey = (typeof FrontmatterKeys)[keyof typeof FrontmatterKeys];

export interface FrontmatterFieldConfig {
    key: FrontmatterKey;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'array';
    asLink?: boolean;
    reciprocityField?: FrontmatterKey;
    amongField?: FrontmatterKey;
    isRelocateField?: boolean;
    commands?: string[];
}


export const FrontmatterRegistry: Record<string, FrontmatterFieldConfig> = {
    // Internal fields:
    [FrontmatterKeys.EloCommands]: {
        key: FrontmatterKeys.EloCommands,
        description: "Comandos adicionales para la IA",
        type: 'array'
    },
    [FrontmatterKeys.EloPrompt]: {
        key: FrontmatterKeys.EloPrompt,
        description: "Prompt personalizado para la IA",
        type: 'string'
    },
    [FrontmatterKeys.EloPromptUrl]: {
        key: FrontmatterKeys.EloPromptUrl,
        description: "URL de contexto para el prompt",
        type: 'string'
    },

    // User fields:
    [FrontmatterKeys.Municipio]: {
        key: FrontmatterKeys.Municipio,
        description: "Nombre del municipio, ciudad o pueblo",
        type: 'string',
        asLink: true
    },
    [FrontmatterKeys.Provincia]: {
        key: FrontmatterKeys.Provincia,
        description: "Nombre de la provincia administrativa",
        type: 'string',
        asLink: true
    },
    [FrontmatterKeys.Region]: {
        key: FrontmatterKeys.Region,
        description: "Comunidad autónoma o región",
        type: 'string',
        asLink: true
    },
    [FrontmatterKeys.Pais]: {
        key: FrontmatterKeys.Pais,
        description: "País",
        type: 'string',
        isRelocateField: true,
        asLink: true,
        commands: [CommandEnum.RelocateNoteByLinkField]
    },
    [FrontmatterKeys.Paises]: {
        key: FrontmatterKeys.Paises,
        description: "Países",
        type: 'array',
        isRelocateField: true,
        asLink: true,
        commands: [CommandEnum.RelocateNoteByLinkField]
    },
    [FrontmatterKeys.LugarId]: {
        key: FrontmatterKeys.LugarId,
        description: "Identificador único del lugar (ej. Google Place ID)",
        type: 'string',
        commands: [CommandEnum.RelocateNoteByLinkField]
    },
    [FrontmatterKeys.Lugar]: {
        key: FrontmatterKeys.Lugar,
        description: "Lugar relacionado",
        type: 'string',
        isRelocateField: true,
        asLink: true,
        commands: [CommandEnum.RelocateNoteByLinkField]
    },
    [FrontmatterKeys.Lugares]: {
        key: FrontmatterKeys.Lugares,
        description: "Lugares relacionados",
        type: 'array',
        isRelocateField: true,
        asLink: true,
        commands: [CommandEnum.RelocateNoteByLinkField]
    },
    [FrontmatterKeys.SedePrincipal]: {
        key: FrontmatterKeys.SedePrincipal,
        description: "Sede principal",
        isRelocateField: true,
        type: 'string',
        asLink: true
    },
    [FrontmatterKeys.Latitud]: {
        key: FrontmatterKeys.Latitud,
        description: "Coordenada de latitud geográfica",
        type: 'number'
    },
    [FrontmatterKeys.Longitud]: {
        key: FrontmatterKeys.Longitud,
        description: "Coordenada de longitud geográfica",
        type: 'number'
    },
    [FrontmatterKeys.Url]: {
        key: FrontmatterKeys.Url,
        description: "URL de la web, video, streaming, ...",
        type: 'string',
    },

    [FrontmatterKeys.SpotifyUri]: {
        key: FrontmatterKeys.SpotifyUri,
        description: "URI de Spotify",
        type: 'string'
    },
    [FrontmatterKeys.Capital]: {
        key: FrontmatterKeys.Capital,
        description: "Capital del país (si aplica)",
        type: 'string',
        asLink: true
    },
    [FrontmatterKeys.Tags]: {
        key: FrontmatterKeys.Tags,
        description: "Etiquetas",
        type: 'array'
    },

    [FrontmatterKeys.Conocidos]: {
        key: FrontmatterKeys.Conocidos,
        description: "Lista de conocidos",
        type: 'array',
        reciprocityField: FrontmatterKeys.Conocidos,
        asLink: true,
        commands: [CommandEnum.CreateReciprocityLinksNotes]
    },
    [FrontmatterKeys.Hijos]: {
        key: FrontmatterKeys.Hijos,
        description: "Hijos de la persona",
        type: 'array',
        reciprocityField: FrontmatterKeys.Padres,
        amongField: FrontmatterKeys.Hermanos,
        asLink: true,
        commands: [CommandEnum.CreateReciprocityLinksNotes]
    },
    [FrontmatterKeys.Padres]: {
        key: FrontmatterKeys.Padres,
        description: "Padres de la persona",
        type: 'array',
        reciprocityField: FrontmatterKeys.Hijos,
        asLink: true,
        commands: [CommandEnum.CreateReciprocityLinksNotes]
    },
    [FrontmatterKeys.Pareja]: {
        key: FrontmatterKeys.Pareja,
        description: "Pareja actual",
        type: 'array',
        reciprocityField: FrontmatterKeys.Pareja,
        asLink: true,
        commands: [CommandEnum.CreateReciprocityLinksNotes]
    },
    [FrontmatterKeys.Exparejas]: {
        key: FrontmatterKeys.Exparejas,
        description: "Exparejas",
        type: 'array',
        reciprocityField: FrontmatterKeys.Exparejas,
        asLink: true,
        commands: [CommandEnum.CreateReciprocityLinksNotes]
    },
    [FrontmatterKeys.Hermanos]: {
        key: FrontmatterKeys.Hermanos,
        description: "Hermanos",
        type: 'array',
        reciprocityField: FrontmatterKeys.Hermanos,
        asLink: true,
        commands: [CommandEnum.CreateReciprocityLinksNotes]
    },
    [FrontmatterKeys.Familiares]: {
        key: FrontmatterKeys.Familiares,
        description: "Otros familiares",
        type: 'array',
        reciprocityField: FrontmatterKeys.Familiares,
        asLink: true,
        commands: [CommandEnum.CreateReciprocityLinksNotes]
    },
    [FrontmatterKeys.CompanerosTrabajo]: {
        key: FrontmatterKeys.CompanerosTrabajo,
        description: "Compañeros de trabajo",
        type: 'array',
        reciprocityField: FrontmatterKeys.CompanerosTrabajo,
        asLink: true,
        commands: [CommandEnum.CreateReciprocityLinksNotes]
    },
    [FrontmatterKeys.Jefes]: {
        key: FrontmatterKeys.Jefes,
        description: "Jefes directos",
        type: 'array',
        reciprocityField: FrontmatterKeys.Empleados,
        asLink: true,
        commands: [CommandEnum.CreateReciprocityLinksNotes]
    },
    [FrontmatterKeys.Empleados]: {
        key: FrontmatterKeys.Empleados,
        description: "Empleados a cargo",
        type: 'array',
        reciprocityField: FrontmatterKeys.Jefes,
        asLink: true,
        commands: [CommandEnum.CreateReciprocityLinksNotes]
    },
    [FrontmatterKeys.EstilosMusicales]: {
        key: FrontmatterKeys.EstilosMusicales,
        description: "Estilos musicales del artista",
        type: 'array'
    },
    [FrontmatterKeys.SpotifyPopularity]: {
        key: FrontmatterKeys.SpotifyPopularity,
        description: "Popularidad del artista en Spotify (0-100)",
        type: 'number'
    },
    [FrontmatterKeys.EloImages]: {
        key: FrontmatterKeys.EloImages,
        description: "Lista de fotos enlazadas (elo-bridge)",
        type: 'array'
    },
    [FrontmatterKeys.Telefono]: {
        key: FrontmatterKeys.Telefono,
        description: "Teléfono de contacto",
        type: 'string'
    },
    [FrontmatterKeys.Email]: {
        key: FrontmatterKeys.Email,
        description: "Email de contacto",
        type: 'string'
    },
    [FrontmatterKeys.Cumpleanos]: {
        key: FrontmatterKeys.Cumpleanos,
        description: "Cumpleaños (YYYY-MM-DD)",
        type: 'date'
    },
    [FrontmatterKeys.EloAppleContactId]: {
        key: FrontmatterKeys.EloAppleContactId,
        description: "ID de contacto en Apple (elo-bridge)",
        type: 'string'
    },
    [FrontmatterKeys.Apodo]: {
        key: FrontmatterKeys.Apodo,
        description: "Apodo o nombre corto",
        type: 'string'
    },
    [FrontmatterKeys.Puesto]: {
        key: FrontmatterKeys.Puesto,
        description: "Puesto de trabajo o cargo",
        type: 'string'
    },
    [FrontmatterKeys.Empresa]: {
        key: FrontmatterKeys.Empresa,
        description: "Empresa u organización",
        type: 'string'
    },
    [FrontmatterKeys.Direcciones]: {
        key: FrontmatterKeys.Direcciones,
        description: "Direcciones postales",
        type: 'array'
    },
    [FrontmatterKeys.Urls]: {
        key: FrontmatterKeys.Urls,
        description: "Sitios web y enlaces",
        type: 'array'
    },
    [FrontmatterKeys.Eventos]: {
        key: FrontmatterKeys.Eventos,
        description: "Eventos o fechas importantes",
        type: 'array'
    },
    [FrontmatterKeys.Relaciones]: {
        key: FrontmatterKeys.Relaciones,
        description: "Relaciones con otras personas",
        type: 'array'
    },
    [FrontmatterKeys.Genero]: {
        key: FrontmatterKeys.Genero,
        description: "Género",
        type: 'string'
    },
    [FrontmatterKeys.Ocupaciones]: {
        key: FrontmatterKeys.Ocupaciones,
        description: "Ocupaciones (adicionales al puesto)",
        type: 'array'
    },
    [FrontmatterKeys.Intereses]: {
        key: FrontmatterKeys.Intereses,
        description: "Intereses",
        type: 'array'
    },
    [FrontmatterKeys.Habilidades]: {
        key: FrontmatterKeys.Habilidades,
        description: "Habilidades",
        type: 'array'
    },
    [FrontmatterKeys.Residencias]: {
        key: FrontmatterKeys.Residencias,
        description: "Residencias o lugares de vivienda",
        type: 'array'
    }
};
