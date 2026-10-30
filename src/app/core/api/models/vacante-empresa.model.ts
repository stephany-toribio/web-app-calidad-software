export type TipoEmpleo = 'presencial' | 'remoto' | 'hibrido';

export type EstadoGeneralVacante =
  | 'eliminada'
  | 'finalizada'
  | 'no_aprobada'
  | 'pendiente_revision'
  | 'pendiente_pago'
  | 'pausada'
  | 'vencida'
  | 'por_iniciar'
  | 'publicada';

export type EstadoRevisionVacante = 'pendiente' | 'aprobada' | 'no_aprobada';
export type EstadoPagoVacante = 'sin_pago' | 'pagado' | 'fallido' | 'cancelado';
export type EstadoDisponibilidadVacante = 'activa' | 'pausada' | 'finalizada' | 'eliminada';
export type RequisitoHabilidad = 'must_have' | 'nice_to_have';

export interface NivelPuestoResumen {
  id: number;
  nombre: string;
}

export interface AreaProfesionalResumen {
  id: number;
  nombre: string;
}

export interface HabilidadVacante {
  id: number;
  nombre: string;
  tipo_habilidad: 'tecnica' | 'blanda';
  requisito: RequisitoHabilidad;
}

export interface EstadoVacante {
  general: EstadoGeneralVacante;
  revision: EstadoRevisionVacante;
  motivo_no_aprobacion: string | null;
  pago: EstadoPagoVacante;
  disponibilidad: EstadoDisponibilidadVacante;
  vigente: boolean;
  publicada_en: string | null;
}

export interface VacanteEmpresa {
  id: number;
  titulo: string;
  descripcion: string;
  /** Textos libres; llegan [] si la empresa no registró ninguno */
  requisitos: string[];
  beneficios: string[];
  nivel_puesto: NivelPuestoResumen;
  area_profesional: AreaProfesionalResumen;
  tipo_empleo: TipoEmpleo;
  ubicacion: string | null;
  salario_min: number | null;
  salario_max: number | null;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string;
  max_contrataciones: number;
  habilidades: HabilidadVacante[];
  estado: EstadoVacante;
  creado_en: string;
  eliminado_en: string | null;
}

export interface HabilidadPayload {
  habilidad_id: number;
  requisito: RequisitoHabilidad;
}

export interface CrearVacantePayload {
  titulo: string;
  descripcion: string;
  nivel_puesto_id: number;
  area_estudio_id: number;
  tipo_empleo: TipoEmpleo;
  ubicacion?: string | null;
  salario_min?: number | null;
  salario_max?: number | null;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string;
  max_contrataciones: number;
  habilidades: HabilidadPayload[];
  /** Opcionales: hasta 10 textos de 200 caracteres, sin repetir */
  requisitos?: string[];
  beneficios?: string[];
}

export interface IntentoPago {
  id: number;
  resultado: string;
  monto: number;
  tarjeta: string | null;
  fecha: string;
}

export interface ResumenPagoVacante {
  vacante_id: number;
  estado_pago: EstadoPagoVacante;
  puede_pagar: boolean;
  tarifa_por_puesto: number;
  unidad_cobro: string;
  max_contrataciones: number;
  monto: number;
  moneda: string;
  intentos: IntentoPago[];
}

export interface PagarVacantePayload {
  titular: string;
  numero_tarjeta: string;
  vencimiento: string;
  cvv: string;
}

export interface ResultadoPago {
  pago: IntentoPago;
  vacante: VacanteEmpresa;
}

export interface EmpresaRevisionResumen {
  id: number;
  razon_social: string;
  ruc: string;
  sector: string;
}

export interface RevisionDetalle {
  estado: EstadoRevisionVacante;
  motivo: string | null;
  revisado_en: string | null;
}

export interface VacanteRevision {
  id: number;
  titulo: string;
  descripcion: string;
  requisitos: string[];
  beneficios: string[];
  nivel_puesto: NivelPuestoResumen;
  area_profesional: AreaProfesionalResumen;
  tipo_empleo: TipoEmpleo;
  ubicacion: string | null;
  salario_min: number | null;
  salario_max: number | null;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string;
  max_contrataciones: number;
  habilidades: HabilidadVacante[];
  empresa: EmpresaRevisionResumen;
  revision: RevisionDetalle;
  creado_en: string;
}

export interface ResultadoAprobarMasivo {
  aprobadas: number[];
  no_procesadas: number[];
}
