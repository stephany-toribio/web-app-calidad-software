export type EtapaPostulacionCodigo = 'recibido' | 'en_revision' | 'entrevista' | 'contratado' | 'rechazado';

export interface EtapaPostulacion {
  codigo: EtapaPostulacionCodigo;
  nombre: string;
}

export type EstadoVacante = 'activa' | 'pausada' | 'finalizada' | 'eliminada';

export type VerVacanteTipo = 'disponible' | 'historico' | null;

export interface VacanteResumen {
  id: number;
  titulo: string;
  empresa: {
    razon_social: string;
  };
  estado: EstadoVacante;
  vigente: boolean;
}

/** HU-15: Respuesta de GET /api/v1/candidatos/me/postulaciones */
export interface MiPostulacion {
  id: number;
  estado: EtapaPostulacion;
  retirada: boolean;
  retirada_en: string | null;
  puede_retirar: boolean;
  fecha_postulacion: string;
  vacante: VacanteResumen;
  ver_vacante: VerVacanteTipo;
}

/** HU-05: Payload para POST /api/v1/candidatos/me/postulaciones */
export interface PostularVacantePayload {
  vacante_id: number;
}

/** HU-05: Respuesta 201 de POST /api/v1/candidatos/me/postulaciones */
export interface PostulacionCreada {
  id: number;
  estado: EtapaPostulacion;
  retirada: boolean;
  fecha_postulacion: string;
  vacante: {
    id: number;
    titulo: string;
  };
}

/** HU-16: Respuesta 200 de PATCH /api/v1/candidatos/me/postulaciones/{id}/retirar */
export interface PostulacionRetirada {
  id: number;
  estado: EtapaPostulacion;
  retirada: boolean;
  retirada_en: string;
}
