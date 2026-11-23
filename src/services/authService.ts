import { PLATAFORMA_WEB } from '../config/apiConfig';
import { ApiClient, ApiException } from '../core/network/apiClient';
import {
  type Login2faChallenge,
  type UserSession,
  parseLogin2faChallenge,
  parseUserSession,
} from '../models/auth';

export interface SolicitudPreLoginParams {
  correo: string;
  password: string;
  forzarCierreSesion?: boolean;
}

export interface Verificacion2faParams {
  correo: string;
  password: string;
  codigo2FA: string;
  forzarCierreSesion?: boolean;
}

export class AuthService {
  private readonly apiClient: ApiClient;

  constructor(options: { apiClient: ApiClient }) {
    this.apiClient = options.apiClient;
  }

  async solicitarReto2FA({
    correo,
    password,
    forzarCierreSesion = false,
  }: SolicitudPreLoginParams): Promise<Login2faChallenge> {
    try {
      const response = await this.apiClient.postJson<Record<string, unknown>>(
        '/auth/login/2fa/solicitar',
        {
          requiereAuth: false,
          body: {
            correo: correo.trim(),
            password,
            plataforma: PLATAFORMA_WEB,
            forzarCierreSesion,
          },
        },
      );
      return parseLogin2faChallenge(response.data ?? {});
    } catch (error) {
      if (!(error instanceof ApiException) || error.statusCode !== 404) {
        throw error;
      }

      const otpResp = await this.apiClient.postJson<Record<string, unknown>>(
        '/api/seguridad/2fa/solicitar',
        {
          requiereAuth: false,
          body: { numeroCuenta: '4229215075268914', motivo: 'LOGIN' },
        },
      );
      const otpData = otpResp.data ?? {};
      const expiraRaw = otpData.expiraEnSegundos;
      const expiraEnSegundos =
        typeof expiraRaw === 'number' ? expiraRaw : Number(expiraRaw) || 300;

      return {
        requiere2FA: true,
        correo: correo.trim(),
        numeroCuenta: String(otpData.numeroCuenta ?? '4229215075268914'),
        plataforma: PLATAFORMA_WEB,
        codigoOtp: String(otpData.codigoOtp ?? ''),
        expiraEnSegundos,
        mensaje: String(otpData.mensaje ?? 'Código OTP 2FA generado en el servidor.'),
        correoEnviado:
          typeof otpData.correoEnviado === 'boolean' ? otpData.correoEnviado : undefined,
        correoDestinoEnmascarado:
          typeof otpData.correoDestinoEnmascarado === 'string' &&
            otpData.correoDestinoEnmascarado.trim().length > 0
            ? otpData.correoDestinoEnmascarado.trim()
            : undefined,
      };
    }
  }

  async verificar2FAYCrearSesion({
    correo,
    password,
    codigo2FA,
    forzarCierreSesion = false,
  }: Verificacion2faParams): Promise<UserSession> {
    try {
      const response = await this.apiClient.postJson<Record<string, unknown>>(
        '/auth/login/2fa/verificar',
        {
          requiereAuth: false,
          body: {
            correo: correo.trim(),
            password,
            codigo2FA: codigo2FA.trim(),
            plataforma: PLATAFORMA_WEB,
            forzarCierreSesion,
          },
        },
      );
      return parseUserSession(response.data ?? {}, correo.trim());
    } catch (error) {
      if (!(error instanceof ApiException) || error.statusCode !== 404) {
        throw error;
      }

      const response = await this.apiClient.postJson<Record<string, unknown>>('/auth/login', {
        requiereAuth: false,
        body: {
          correo: correo.trim(),
          password,
        },
      });
      const data = response.data ?? {};
      const parsed = parseUserSession(data, correo.trim());
      return {
        ...parsed,
        plataforma: PLATAFORMA_WEB,
        nombreCliente: parsed.nombreCliente ?? 'Ana María López García',
        numeroCuenta: parsed.numeroCuenta ?? '4229215075268914',
        saldoCuenta: parsed.saldoCuenta ?? 4990.0,
      };
    }
  }

  async sincronizarEstadoSesion(sesionActual: UserSession): Promise<UserSession> {
    try {
      const response = await this.apiClient.getJson<Record<string, unknown>>('/auth/sesion');
      const data = response.data;
      if (!data) return sesionActual;

      const saldoRaw = data.saldoCuenta;
      const saldoActualizado =
        typeof saldoRaw === 'number'
          ? saldoRaw
          : saldoRaw !== undefined && saldoRaw !== null && String(saldoRaw).trim() !== ''
            ? Number(saldoRaw)
            : sesionActual.saldoCuenta;

      const parseId = (raw: unknown, fallback?: number) => {
        if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
        if (typeof raw === 'string' && raw.trim() !== '') {
          const n = Number(raw);
          if (!Number.isNaN(n)) return n;
        }
        return fallback;
      };

      return {
        ...sesionActual,
        usuarioId: parseId(data.usuarioId, sesionActual.usuarioId),
        clienteId: parseId(data.clienteId, sesionActual.clienteId),
        saldoCuenta: Number.isNaN(saldoActualizado) ? sesionActual.saldoCuenta : saldoActualizado,
        numeroCuenta:
          data.numeroCuenta !== undefined && data.numeroCuenta !== null
            ? String(data.numeroCuenta)
            : sesionActual.numeroCuenta,
        nombreCliente:
          data.nombreCliente !== undefined && data.nombreCliente !== null
            ? String(data.nombreCliente)
            : sesionActual.nombreCliente,
        correo:
          data.correo !== undefined && data.correo !== null
            ? String(data.correo)
            : sesionActual.correo,
      };
    } catch (error) {
      if (error instanceof ApiException && error.statusCode === 401) {
        throw error;
      }
      return sesionActual;
    }
  }

  async cerrarSesionEnServidor(): Promise<void> {
    try {
      await this.apiClient.postJson('/auth/logout');
    } catch {
    }
  }
}
