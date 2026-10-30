import { EtapaPostulacion } from './postulacion.model';

export interface HabilidadItem {
  id: number;
  nombre: string;
}

export interface RequisitoDeseableItem {
  id: number;
  nombre: string;
  posee: boolean;
}

export interface RequisitosVacanteComparativa {
  must_have: {
    posee: HabilidadItem[];
    faltan: HabilidadItem[];
  };
  nice_to_have: RequisitoDeseableItem[];
}

export interface EstudioPostulante {
  id: number;
  tipo_estudio: { id: number; nombre: string };
  area_estudio: { id: number; nombre: string };
  pais: { id: number; nombre: string };
  institucion: { id: number; nombre: string };
  carrera: { id: number; nombre: string };
  estado: 'en_curso' | 'finalizado' | 'incompleto';
  ciclo_actual: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
}

export interface ExperienciaPostulante {
  id: number;
  puesto: { id: number; nombre: string; personalizado: boolean; activo: boolean };
  organizacion: { id: number; nombre: string; personalizado: boolean; activo: boolean };
  pais: { id: number; nombre: string };
  nivel: { id: number; nombre: string; personalizado: boolean; activo: boolean };
  fecha_inicio: string;
  fecha_fin: string | null;
  descripcion: string;
}

export interface IdiomaPostulante {
  id: number;
  idioma: { id: number; nombre: string };
  nivel_escrito: string;
  nivel_oral: string;
}

export interface CandidatoContacto {
  nombre: string;
  apellidos: string;
  correo: string;
  celular: string;
  busca_primer_empleo: boolean;
}

/** HU-17: Perfil completo del postulante para la empresa */
export interface PerfilPostulante {
  postulacion: {
    id: number;
    estado: EtapaPostulacion;
  };
  candidato: CandidatoContacto;
  estudios: EstudioPostulante[];
  experiencias: ExperienciaPostulante[];
  idiomas: IdiomaPostulante[];
  habilidades: {
    tecnicas: HabilidadItem[];
    blandas: HabilidadItem[];
  };
  requisitos_vacante: RequisitosVacanteComparativa;
}
