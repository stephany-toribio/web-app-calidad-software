// Respuestas de los catálogos del backend (GET /paises, /tipos-estudio, /carreras, etc.)

export interface ItemCatalogo {
    id: number;
    nombre: string;
}

/** GET /candidatos/me/puestos — personalizado: true => lo escribió el propio candidato (solo él lo ve) */
export interface PuestoSeleccionable extends ItemCatalogo {
    personalizado?: boolean;
}

/** GET /tipos-estudio — requiere_carrera: true => el estudio lleva institución y carrera */
export interface TipoEstudio extends ItemCatalogo {
    requiere_carrera: boolean;
}

/** GET /areas-estudio */
export interface AreaEstudio extends ItemCatalogo {
    activo: boolean;
}

/** GET /instituciones?pais_id= */
export interface Institucion extends ItemCatalogo {
    pais_id: number;
}

/** GET /organizaciones?pais_id= y GET /candidatos/me/organizaciones (este último trae personalizado) */
export interface Organizacion extends ItemCatalogo {
    pais_id: number;
    personalizado?: boolean;
}

/** GET /carreras?tipo_estudio_id= (carreras globales, iguales en todos los países) */
export interface Carrera extends ItemCatalogo {
    tipo_estudio_id: number;
}

/** GET /habilidades?areas[]= — las blandas no tienen área */
export interface Habilidad extends ItemCatalogo {
    tipo_habilidad: 'tecnica' | 'blanda';
    activo: boolean;
    area_estudio: { id: number; nombre: string; activo: boolean } | null;
}
