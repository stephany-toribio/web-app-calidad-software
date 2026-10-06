export interface RegistroEmpresaPayload {
  correo: string;
  password: string;
  encargado_empresa: string;
  razon_social: string;
  sector: string;
  ruc: string;
  sitio_web: string | null;
  descripcion: string | null;
}

export interface EmpresaRegistrada {
  id: number;
  correo: string;
  encargado_empresa: string;
  razon_social: string;
  sector: string;
  ruc: string;
  sitio_web: string | null;
  descripcion: string | null;
}

export interface LoginPayload {
  correo: string;
  password: string;
}

export interface SesionUsuario {
  usuario_id: number;
  correo: string;
  rol: string;
  token: string;
}
