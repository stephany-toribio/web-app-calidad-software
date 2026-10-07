import { Habilidad, ItemCatalogo } from './catalogos.model';
import { EstadoEstudio, Genero, NivelExperiencia, NivelIdioma } from './registro-candidato.model';

// Respuesta de GET /candidatos/me 
export interface ItemPropuesto extends ItemCatalogo {
    estado_catalogo: string;
}

export interface EstudioPerfil {
    id: number;
    tipo_estudio: ItemCatalogo;
    area_estudio: ItemCatalogo;
    pais: ItemCatalogo;
    institucion: ItemCatalogo | null;   // null en Secundario y Terciario
    carrera: ItemCatalogo | null;
    estado: EstadoEstudio;
    ciclo_actual: number | null;
    fecha_inicio: string;               // 'YYYY-MM-DD'
    fecha_fin: string | null;
}

export interface IdiomaPerfil {
    id: number;
    idioma: ItemCatalogo;
    nivel_escrito: NivelIdioma;
    nivel_oral: NivelIdioma;
}

export interface ExperienciaPerfil {
    id: number;
    puesto: ItemPropuesto;
    organizacion: ItemPropuesto;
    pais: ItemCatalogo;
    nivel: NivelExperiencia;
    fecha_inicio: string;
    fecha_fin: string | null;
    descripcion: string | null;
}

export interface CandidatoPerfil {
    id: number;
    usuario_id: number;
    correo: string;
    nombre: string;
    apellidos: string;
    dni: string;
    fecha_nacimiento: string;
    celular: string;
    genero: Genero | null;
    busca_primer_empleo: boolean;
    estudios: EstudioPerfil[];
    idiomas: IdiomaPerfil[];
    experiencias: ExperienciaPerfil[];
    habilidades: Habilidad[];
    creado_en: string;
}
