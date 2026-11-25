export type SessionInvalidationReason =
  | 'sessionExpired'
  | 'accountSuspended';

export interface SessionErrorContext {
  status: number;
  payload: unknown;
  requestToken: string | null;
  currentToken: string | null;
  isLoginRequest: boolean;
}

export function getSessionInvalidationReason(
  context: SessionErrorContext
): SessionInvalidationReason | null {
  const {
    status,
    payload,
    requestToken,
    currentToken,
    isLoginRequest
  } = context;

  // Una solicitud de login no invalida otra sesion.
  if (isLoginRequest) {
    return null;
  }

  // No invalidar sesiones inexistentes ni sesiones nuevas
  // por respuestas pertenecientes a solicitudes anteriores.
  if (!requestToken || requestToken !== currentToken) {
    return null;
  }

  if (status === 401) {
    return 'sessionExpired';
  }

  if (
    status === 403 &&
    typeof payload === 'object' &&
    payload !== null
  ) {
    const body = payload as Record<string, unknown>;

    if (
      body['error_code'] === 'FORBIDDEN' &&
      body['reason'] === 'ACCOUNT_NOT_ACTIVE'
    ) {
      return 'accountSuspended';
    }
  }

  return null;
}
