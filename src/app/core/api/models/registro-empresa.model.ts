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
