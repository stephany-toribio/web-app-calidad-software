// Contrato de respuesta del backend (portal-empleos-api, BaseApiController y bootstrap/app.php)

/** Respuesta exitosa: { success: true, message, data } */
export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

/** Respuesta de error: { success: false, message, error_code, errors? } */
export interface ApiError {
  success: false;
  message: string;
  error_code: string;
  /** Solo en 422: campo → mensajes (p. ej. "correo" o "estudios.0.carrera_id") */
  errors?: Record<string, string[]>;
}
