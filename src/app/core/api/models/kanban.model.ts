import { EtapaPostulacion, EtapaPostulacionCodigo } from './postulacion.model';

export interface MotivoRechazo {
  id: number;
  motivo: string;
}

export interface TarjetaPostulacion {
  id: number;
  candidato: {
    nombre: string;
    apellidos: string;
  };
  fecha_postulacion: string;
}

export interface ColumnaKanban {
  estado: EtapaPostulacion;
  postulaciones: TarjetaPostulacion[];
}

export interface VacanteKanbanInfo {
  id: number;
  titulo: string;
  solo_lectura: boolean;
  max_contrataciones: number;
  contratados: number;
  cupos_disponibles: number;
}

/** HU-06: Respuesta de GET /empresas/me/vacantes/{vacante}/postulaciones */
export interface TableroKanban {
  vacante: VacanteKanbanInfo;
  columnas: ColumnaKanban[];
}

/** HU-06: Respuesta 200 de avanzar, rechazar y contratar */
export interface MovimientoPostulacionRespuesta {
  id: number;
  estado: EtapaPostulacion;
  motivo_rechazo: string | null;
}

export interface MovimientoHistorialKanban {
  id: number;
  estado: EtapaPostulacion;
  motivo_rechazo: string | null;
  fecha_cambio: string | null;
}

export interface PostulacionHistorialKanban {
  id: number;
  candidato: {
    nombre: string;
    apellidos: string;
  };
  fecha_postulacion: string | null;
  estado: EtapaPostulacion;
  retirada: boolean;
  retirada_en: string | null;
  movimientos: MovimientoHistorialKanban[];
}

export interface HistorialKanban {
  vacante: VacanteKanbanInfo;
  postulaciones: PostulacionHistorialKanban[];
}
