import { EstadoVacante } from './postulacion.model';

export interface HabilidadDetalle {
  id: number;
  nombre: string;
}

export interface EmpresaDetalle {
  razon_social: string;
  sector: string;
  descripcion: string | null;
}

export interface CatalogoItem {
  id: number;
  nombre: string;
}

export interface PostulacionPropiaResumen {
  id: number;
  retirada: boolean;
}

/** HU-13: Detalle de vacante (disponible o histórico) */
export interface VacanteDetalle {
  id: number;
  titulo: string;
  descripcion: string;
  requisitos: string[];
  beneficios: string[];
  empresa: EmpresaDetalle;
  nivel_puesto: CatalogoItem;
  area_profesional: CatalogoItem;
  tipo_empleo: string;
  ubicacion: string;
  salario_min: number | null;
  salario_max: number | null;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string;
  publicada_en: string | null;
  habilidades: HabilidadDetalle[];
  postulantes_aprox: string;
  modo_consulta: 'disponible' | 'historico';
  estado: EstadoVacante;
  postulacion: PostulacionPropiaResumen | null;
  puede_postular: boolean;
  motivo_no_postulable: string | null;
}
