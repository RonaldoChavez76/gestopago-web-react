export interface ConflictoSesion {
  sesionActivaExistente: boolean;
  plataformaActiva: string;
  fechaInicio?: string;
  fechaExpiracion?: string;
  accionRequerida: string;
}

export interface Login2faChallenge {
  requiere2FA: boolean;
  correo: string;
  numeroCuenta: string;
  plataforma: string;
  codigoOtp: string;
  expiraEnSegundos: number;
  mensaje: string;
  correoEnviado?: boolean;
  correoDestinoEnmascarado?: string;
}

export type RolUsuario = 'CLIENTE' | 'EJECUTIVO';

export interface UserSession {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt?: string;
  sessionId?: string;
  plataforma: string;
  rol?: string;
  cuentaActiva?: boolean;
  usuarioId?: number;
  clienteId?: number;
  nombreCliente?: string;
  correo: string;
  numeroCuenta?: string;
  saldoCuenta?: number;
}

export function normalizarRolUsuario(value: unknown): RolUsuario {
  const limpio = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return limpio === 'EJECUTIVO' ? 'EJECUTIVO' : 'CLIENTE';
}

export function esUsuarioEjecutivo(session?: UserSession | null): boolean {
  return (session?.rol ?? 'CLIENTE').trim().toUpperCase() === 'EJECUTIVO';
}

export function esCuentaActiva(session?: UserSession | null): boolean {
  return session?.cuentaActiva !== false;
}

function toStringOrUndefined(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const str = String(value);
  return str.length > 0 ? str : undefined;
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export function parseConflictoSesion(json: Record<string, unknown>): ConflictoSesion {
  return {
    sesionActivaExistente:
      typeof json.sesionActivaExistente === 'boolean' ? json.sesionActivaExistente : true,
    plataformaActiva: String(json.plataformaActiva ?? 'OTRO DISPOSITIVO'),
    fechaInicio: toStringOrUndefined(json.fechaInicio),
    fechaExpiracion: toStringOrUndefined(json.fechaExpiracion),
    accionRequerida: String(
      json.accionRequerida ??
        'Ya existe una sesión activa en otra plataforma. ¿Deseas cerrarla para continuar?',
    ),
  };
}

export function parseLogin2faChallenge(json: Record<string, unknown>): Login2faChallenge {
  return {
    requiere2FA: typeof json.requiere2FA === 'boolean' ? json.requiere2FA : true,
    correo: String(json.correo ?? ''),
    numeroCuenta: String(json.numeroCuenta ?? ''),
    plataforma: String(json.plataforma ?? 'WEB'),
    codigoOtp: String(json.codigoOtp ?? ''),
    expiraEnSegundos: toNumberOrUndefined(json.expiraEnSegundos) ?? 300,
    mensaje: String(json.mensaje ?? 'Ingresa el código de verificación de 6 dígitos.'),
    correoEnviado: typeof json.correoEnviado === 'boolean' ? json.correoEnviado : undefined,
    correoDestinoEnmascarado: toStringOrUndefined(json.correoDestinoEnmascarado),
  };
}

export function parseUserSession(
  json: Record<string, unknown>,
  correoFallback = '',
): UserSession {
  let parsedExpiresAt: string | undefined;
  if (json.expiresAt !== null && json.expiresAt !== undefined) {
    const ms = Date.parse(String(json.expiresAt));
    if (!Number.isNaN(ms)) {
      parsedExpiresAt = new Date(ms).toISOString();
    }
  }

  return {
    accessToken: String(json.accessToken ?? ''),
    tokenType: String(json.tokenType ?? 'Bearer'),
    expiresIn: toNumberOrUndefined(json.expiresIn) ?? 900,
    expiresAt: parsedExpiresAt,
    sessionId: toStringOrUndefined(json.sessionId),
    plataforma: String(json.plataforma ?? 'WEB'),
    usuarioId: toNumberOrUndefined(json.usuarioId),
    clienteId: toNumberOrUndefined(json.clienteId),
    nombreCliente: toStringOrUndefined(json.nombreCliente),
    correo: String(json.correo ?? correoFallback),
    numeroCuenta: toStringOrUndefined(json.numeroCuenta),
    saldoCuenta: toNumberOrUndefined(json.saldoCuenta),
    rol: normalizarRolUsuario(json.rol),
    cuentaActiva: typeof json.cuentaActiva === 'boolean' ? json.cuentaActiva : true,
  };
}

export function haExpiradoLocalmente(session: UserSession): boolean {
  if (!session.expiresAt) return false;
  const expiresMs = Date.parse(session.expiresAt);
  if (Number.isNaN(expiresMs)) return false;
  return Date.now() > expiresMs;
}
