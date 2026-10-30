import { MetaPaginacion } from './api-response.model';
import { HabilidadVacante, NivelPuestoResumen, AreaProfesionalResumen, TipoEmpleo } from './vacante-empresa.model';

/** HU-04: cada resultado de GET /vacantes (no incluye la descripción) */
export interface VacanteBusqueda {
  id: number;
  titulo: string;
  empresa: { razon_social: string; sector: string };
  nivel_puesto: NivelPuestoResumen;
  area_profesional: AreaProfesionalResumen;
  tipo_empleo: TipoEmpleo;
  ubicacion: string | null;
  salario_min: number | null;
  salario_max: number | null;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string;
  publicada_en: string;
  habilidades: HabilidadVacante[];
  /** Texto aproximado; el backend nunca envía el número exacto */
  postulantes_aprox: string;
}

/** Valores que acepta el filtro salario_minimo */
export type SalarioMinimoFiltro = 1500 | 3000 | 5000 | 7000 | 9000;

/** Filtros de GET /vacantes; todos opcionales */
export interface FiltrosBusquedaVacantes {
  titulo?: string;
  /** Máximo 3 */
  habilidades?: number[];
  niveles_puesto?: number[];
  area_estudio_id?: number | null;
  solo_remoto?: boolean;
  salario_minimo?: SalarioMinimoFiltro | null;
  page?: number;
}

export interface PaginaVacantes {
  vacantes: VacanteBusqueda[];
  meta: MetaPaginacion;
}
