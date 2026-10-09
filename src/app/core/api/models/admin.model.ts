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

export interface PaisAdmin {
  id: number;
  nombre: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InstitucionAdmin {
  id: number;
  nombre: string;
  pais_id: number;
  pais?: { id: number; nombre: string; activo: boolean };
  estado: 'activo' | 'inactivo';
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * personalizado = false: catálogo global (lo crea el admin).
 * personalizado = true: lo escribió un candidato; es solo suyo y el admin solo lo activa o desactiva.
 */
export interface PuestoAdmin {
  id: number;
  nombre: string;
  personalizado: boolean;
  creado_por: { candidato_id: number; nombre: string; apellidos: string } | null;
  /** Solo viene en el listado: cuántos candidatos escribieron ese mismo nombre */
  candidatos_con_mismo_nombre?: number;
  estado: 'activo' | 'inactivo';
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Igual que PuestoAdmin, pero cada organización pertenece a un país (que no se puede cambiar).
 * personalizado = true: la escribió un candidato; es solo suya y el admin solo la activa o desactiva.
 */
export interface OrganizacionAdmin {
  id: number;
  nombre: string;
  pais_id: number;
  pais?: { id: number; nombre: string; activo: boolean };
  personalizado: boolean;
  creado_por: { candidato_id: number; nombre: string; apellidos: string } | null;
  /** Solo viene en el listado: cuántos candidatos escribieron ese mismo nombre en ese país */
  candidatos_con_mismo_nombre?: number;
  estado: 'activo' | 'inactivo';
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CrearOrganizacionPayload {
  nombre: string;
  pais_id: number;
}

/**
 * Igual que PuestoAdmin, más el orden jerárquico de los globales (los personalizados no tienen orden).
 */
export interface NivelPuestoAdmin {
  id: number;
  nombre: string;
  orden: number | null;
  personalizado: boolean;
  creado_por: { candidato_id: number; nombre: string; apellidos: string } | null;
  /** Solo viene en el listado: cuántos candidatos escribieron ese mismo nombre */
  candidatos_con_mismo_nombre?: number;
  estado: 'activo' | 'inactivo';
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

/** orden opcional al crear: si no se envía, el nivel va al final de la jerarquía */
export interface NivelPuestoPayload {
  nombre?: string;
  orden?: number;
}

export interface CrearInstitucionPayload {
  nombre: string;
  pais_id: number;
}

export type { AreaEstudio, Habilidad };
