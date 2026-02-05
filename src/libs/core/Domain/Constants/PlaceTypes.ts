export const PlaceTypes = [
    "Lugares/Restaurantes",
    "Lugares/Monumentos",
    "Lugares/Paisajes",
    "Lugares/Playas",
    "Lugares/Montañas",
    "Lugares/Parques",
    "Lugares/Cafeterías",
    "Lugares/Bares",
    "Lugares/Museos-Artes",
    "Lugares/Museos-Ciencia",
    "Lugares/Hoteles",
    "Lugares/Tiendas",
    "Lugares/Estadios",
    "Lugares/Auditorios",
    "Lugares/Bibliotecas",
    "Lugares/Capitales",
    "Lugares/Municipios",
    "Lugares/Provincias",
    "Lugares/Regiones",
    "Lugares/Países",
    "Lugares/Ciudades",
    "Lugares/Continentes",
    "Lugares/Barrios",
    "Lugares/Pueblos",
    "Lugares/Grandes-almacenes",
    "Lugares/Parques-naturales",
    "Lugares/Casas",
    "Lugares/Oficinas",
    "Lugares/Pisos",
    "Lugares/Calles",
    "Lugares/Islas",
    "Lugares/Tiendas-de-ropa",
    "Lugares/Hospitales",
    "Eventos/Festivales-de-cine",
    "Eventos/Festivales-de-musica",

] as const;

export type PlaceType = (typeof PlaceTypes)[number];

export interface PlaceTypeConfig {
    geocodingSuffix?: string;
}

export const PlaceTypeRegistry: Partial<Record<PlaceType, PlaceTypeConfig>> = {
    "Lugares/Provincias": { geocodingSuffix: "Provincia" },
    "Lugares/Regiones": { geocodingSuffix: "Region" },
    "Lugares/Países": { geocodingSuffix: "Pais" },
    "Lugares/Municipios": { geocodingSuffix: "Municipio" },
    "Lugares/Ciudades": { geocodingSuffix: "Ciudad" },
};
