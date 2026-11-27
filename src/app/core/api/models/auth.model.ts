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
