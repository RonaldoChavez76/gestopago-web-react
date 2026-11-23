import { buildEndpoint } from '../../config/apiConfig';
import { type ConflictoSesion, parseConflictoSesion } from '../../models/auth';
import { SessionStorageService } from '../storage/sessionStorageService';

export interface ApiEnvelope<T = unknown> {
  status?: number;
  success?: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
}

export class ApiException extends Error {
  readonly statusCode: number;
  readonly conflictoSesion?: ConflictoSesion;
  readonly esSesionReemplazada: boolean;

  constructor(options: {
    statusCode: number;
    message: string;
    conflictoSesion?: ConflictoSesion;
    esSesionReemplazada?: boolean;
  }) {
    super(options.message);
    this.name = 'ApiException';
    this.statusCode = options.statusCode;
    this.conflictoSesion = options.conflictoSesion;
    this.esSesionReemplazada = options.esSesionReemplazada ?? false;
  }
}

export interface ApiClientOptions {
  sessionStorage: SessionStorageService;
  fetchFn?: typeof fetch;
  onUnauthorizedSession?: (motivo: string) => void;
}

export interface GetRequestOptions {
  queryParameters?: Record<string, string | number | boolean | undefined | null>;
  requiereAuth?: boolean;
  timeoutMs?: number;
}

export interface PostRequestOptions {
  body?: unknown;
  requiereAuth?: boolean;
  timeoutMs?: number;
}

export class ApiClient {
  readonly sessionStorage: SessionStorageService;
  private readonly fetchFn: typeof fetch;
  private readonly onUnauthorizedSession?: (motivo: string) => void;

  constructor(options: ApiClientOptions) {
    this.sessionStorage = options.sessionStorage;
    this.fetchFn = options.fetchFn ?? ((input, init) => globalThis.fetch(input, init));
    this.onUnauthorizedSession = options.onUnauthorizedSession;
  }

  private construirHeaders(incluirAuth = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
    };

    if (incluirAuth) {
      const sesion = this.sessionStorage.currentSession;
      if (sesion && sesion.accessToken.trim().length > 0) {
        headers.Authorization = `Bearer ${sesion.accessToken}`;
      }
    }

    return headers;
  }

  async getJson<T = Record<string, unknown>>(
    path: string,
    options: GetRequestOptions = {},
  ): Promise<ApiEnvelope<T>> {
    const requiereAuth = options.requiereAuth ?? true;
    const timeoutMs = options.timeoutMs ?? 25000;
    const url = buildEndpoint(path, options.queryParameters);
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.fetchFn(url, {
        method: 'GET',
        headers: this.construirHeaders(requiereAuth),
        signal: controller.signal,
      });
      return await this.procesarRespuesta<T>(response, requiereAuth);
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      if (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        throw new ApiException({
          statusCode: 504,
          message:
            'Tiempo de espera agotado al comunicarse con el servidor. Verifica tu conexión.',
        });
      }
      throw new ApiException({
        statusCode: 503,
        message: 'No fue posible establecer comunicación con el servidor GestoPago.',
      });
    } finally {
      globalThis.clearTimeout(timer);
    }
  }

  async postJson<T = Record<string, unknown>>(
    path: string,
    options: PostRequestOptions = {},
  ): Promise<ApiEnvelope<T>> {
    return this.enviarJson<T>('POST', path, options);
  }

  async putJson<T = Record<string, unknown>>(
    path: string,
    options: PostRequestOptions = {},
  ): Promise<ApiEnvelope<T>> {
    return this.enviarJson<T>('PUT', path, options);
  }

  async deleteJson<T = Record<string, unknown>>(
    path: string,
    options: PostRequestOptions = {},
  ): Promise<ApiEnvelope<T>> {
    return this.enviarJson<T>('DELETE', path, options);
  }

  private async enviarJson<T = Record<string, unknown>>(
    method: 'POST' | 'PUT' | 'DELETE',
    path: string,
    options: PostRequestOptions = {},
  ): Promise<ApiEnvelope<T>> {
    const requiereAuth = options.requiereAuth ?? true;
    const timeoutMs = options.timeoutMs ?? 35000;
    const url = buildEndpoint(path);
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.fetchFn(url, {
        method,
        headers: this.construirHeaders(requiereAuth),
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      return await this.procesarRespuesta<T>(response, requiereAuth);
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      if (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        throw new ApiException({
          statusCode: 504,
          message:
            'La solicitud excedió el tiempo de espera. Por seguridad no reintentes cargos sin verificar tu historial.',
        });
      }
      throw new ApiException({
        statusCode: 503,
        message: 'Error de red al conectar con el servidor. Verifica tu conexión a Internet.',
      });
    } finally {
      globalThis.clearTimeout(timer);
    }
  }

  private async procesarRespuesta<T>(
    response: Response,
    notificarExpiracion: boolean,
  ): Promise<ApiEnvelope<T>> {
    let decoded: ApiEnvelope<T> = {};

    try {
      const rawText = await response.text();
      if (rawText.trim().length > 0) {
        const parsed = JSON.parse(rawText) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          decoded = parsed as ApiEnvelope<T>;
        }
      }
    } catch {
      decoded = {
        message: `Respuesta inesperada del servidor (${response.status}).`,
      };
    }

    const status = response.status;
    const mensaje = String(decoded.message ?? `Error en la operación (${status})`);

    if (response.ok) {
      return decoded;
    }

    if (status === 409) {
      let conflicto: ConflictoSesion | undefined;
      const data = decoded.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const record = data as Record<string, unknown>;
        if (record.sesionActivaExistente === true || 'plataformaActiva' in record) {
          conflicto = parseConflictoSesion(record);
        }
      }
      throw new ApiException({
        statusCode: 409,
        message: mensaje,
        conflictoSesion: conflicto,
      });
    }

    if (status === 401) {
      const lower = mensaje.toLowerCase();
      const esReemplazada =
        lower.includes('cerrada') ||
        lower.includes('reemplazada') ||
        lower.includes('expir');
      if (notificarExpiracion && this.onUnauthorizedSession) {
        this.onUnauthorizedSession(mensaje);
      }
      throw new ApiException({
        statusCode: 401,
        message: mensaje,
        esSesionReemplazada: esReemplazada,
      });
    }

    throw new ApiException({
      statusCode: status,
      message: mensaje,
    });
  }
}
