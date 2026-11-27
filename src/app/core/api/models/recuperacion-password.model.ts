// Contrato de la recuperación de contraseña (HU-11): /auth/forgot-password, /auth/verify-reset-code y /auth/reset-password

/** POST /auth/verify-reset-code → data */
export interface VerificarCodigoRespuesta {
  reset_token: string;
  expira_en_minutos: number;
}

/** POST /auth/reset-password */
export interface RestablecerPasswordPayload {
  correo: string;
  reset_token: string;
  password: string;
  password_confirmation: string;
}
