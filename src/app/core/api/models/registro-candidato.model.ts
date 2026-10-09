// Body de POST /api/v1/candidatos  

export type Genero = 'masculino' | 'femenino' | 'otro' | 'prefiero no decir';
export type EstadoEstudio = 'finalizado' | 'en_curso' | 'incompleto';
export type NivelIdioma = 'basico' | 'intermedio' | 'avanzado' | 'nativo';

export interface EstudioPayload {
    tipo_estudio_id: number;
    area_estudio_id: number;
    pais_id: number;
    institucion_id: number | null;   // null en Secundario y Terciario
    carrera_id: number | null;       // null en Secundario y Terciario
    estado: EstadoEstudio;
    ciclo_actual: number | null;     // solo si estado = 'en_curso'
    fecha_inicio: string;            // 'YYYY-MM-DD'
    fecha_fin: string | null;        // null = "al presente"
}

export interface IdiomaPayload {
    idioma_id: number;
    nivel_escrito: NivelIdioma;
    nivel_oral: NivelIdioma;
}

/** Puesto, organización y nivel: el id si existe en el catálogo, o el nombre si el candidato lo escribió */
export interface ExperienciaPayload {
    puesto_id?: number;
    puesto_nombre?: string;
    organizacion_id?: number;
    organizacion_nombre?: string;
    nivel_puesto_id?: number;
    nivel_puesto_nombre?: string;
    pais_id: number;
    fecha_inicio: string;
    fecha_fin: string | null;
    descripcion: string | null;
}

export interface RegistroCandidatoPayload {
    nombre: string;
    apellidos: string;
    dni: string;
    fecha_nacimiento: string;        // 'YYYY-MM-DD'
    genero: Genero | null;
    celular: string;
    correo: string;
    password: string;
    password_confirmation: string;
    estudios: EstudioPayload[];
    idiomas: IdiomaPayload[];
    busca_primer_empleo: boolean;
    experiencias?: ExperienciaPayload[];   // solo si busca_primer_empleo = false
    habilidades: number[];
}

/** Parte de la respuesta 201 que usa el frontend */
export interface CandidatoRegistrado {
    id: number;
    correo: string;
    nombre: string;
    apellidos: string;
}
