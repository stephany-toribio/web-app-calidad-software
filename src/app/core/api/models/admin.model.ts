import { AreaEstudio, Habilidad } from './catalogos.model';

export interface RolAdmin {
  id: number;
  nombre: 'candidato' | 'empresa' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface CandidatoAdmin {
  id: number;
  usuario_id: number;
  nombre: string;
  apellidos: string;
  dni: string;
  fecha_nacimiento: string;
  celular: string;
  genero: string;
  busca_primer_empleo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmpresaAdmin {
  id: number;
  usuario_id: number;
  encargado_empresa: string;
  razon_social: string;
  sector: string;
  descripcion: string;
  ruc: string;
  sitio_web: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UsuarioAdmin {
  id: number;
  rol_id: number;
  correo: string;
  estado_cuenta: 'activo' | 'suspendido';
  intentos_fallidos?: number;
  bloqueado_hasta?: string | null;
  motivo_suspension?: string | null;
  fecha_suspension?: string | null;
  created_at: string;
  updated_at: string;
  rol: RolAdmin;
  candidato: CandidatoAdmin | null;
  empresa: EmpresaAdmin | null;
}

export interface SuspenderUsuarioPayload {
  motivo?: string;
}

export interface CrearAreaEstudioPayload {
  nombre: string;
}

export interface EditarAreaEstudioPayload {
  nombre: string;
}

export interface CrearHabilidadPayload {
  nombre: string;
  tipo_habilidad: 'tecnica' | 'blanda';
  area_estudio_id?: number | null;
}

export interface EditarHabilidadPayload {
  nombre?: string;
  area_estudio_id?: number | null;
}

export type { AreaEstudio, Habilidad };
