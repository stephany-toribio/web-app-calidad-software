// Contrato de respuesta del backend (portal-empleos-api, BaseApiController y bootstrap/app.php)

/** Respuesta exitosa: { success: true, message, data } */
export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

/** Datos del paginador (hoy solo GET /vacantes es paginado) */
export interface MetaPaginacion {
  current_page: number; //
  per_page: number;
  total: number;
  last_page: number;
}

/** Respuesta paginada: { success: true, message, data: [], meta } */
export interface ApiPaginatedResponse<T> extends ApiResponse<T[]> {
  meta: MetaPaginacion;
}

/** Respuesta de error: { success: false, message, error_code, errors? } */
export interface ApiError {
  success: false;
  message: string;
  error_code: string;
  /** Solo en 422: campo → mensajes (p. ej. "correo" o "estudios.0.carrera_id") */
  errors?: Record<string, string[]>;
}
