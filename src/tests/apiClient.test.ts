import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiException } from '../core/network/apiClient';
import { SessionStorageService } from '../core/storage/sessionStorageService';
import type { UserSession } from '../models/auth';

function crearSesionPrueba(overrides: Partial<UserSession> = {}): UserSession {
  return {
    accessToken: 'jwt-web-12345',
    tokenType: 'Bearer',
    expiresIn: 900,
    plataforma: 'WEB',
    correo: 'ana.lopez.prueba@example.com',
    nombreCliente: 'Ana María López García',
    numeroCuenta: '4229215075268914',
    ...overrides,
  };
}

describe('ApiClient y SessionStorageService', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('inyecta automaticamente el header Authorization Bearer cuando existe sesion activa', async () => {
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionPrueba());

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: { ok: true },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const client = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });
    const resp = await client.getJson<{ ok: boolean }>('/auth/sesion');

    expect(resp.data?.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer jwt-web-12345');
  });

  it('extrae ConflictoSesion cuando el servidor responde 409 Conflict por sesion activa en MOVIL', async () => {
    const storage = new SessionStorageService();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          message: 'Ya existe una sesión activa en MOVIL.',
          data: {
            sesionActivaExistente: true,
            plataformaActiva: 'MOVIL',
            fechaInicio: '2026-11-22T00:00:00Z',
            accionRequerida: 'Finaliza tu sesión en MOVIL antes de ingresar en WEB.',
          },
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const client = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    await expect(
      client.postJson('/auth/login/2fa/solicitar', {
        requiereAuth: false,
        body: { correo: 'ana.lopez.prueba@example.com' },
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      conflictoSesion: {
        sesionActivaExistente: true,
        plataformaActiva: 'MOVIL',
        accionRequerida: 'Finaliza tu sesión en MOVIL antes de ingresar en WEB.',
      },
    });
  });

  it('marca esSesionReemplazada y notifica onUnauthorizedSession ante 401 Unauthorized', async () => {
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionPrueba());
    const onUnauthorized = vi.fn();

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          message: 'Tu sesión fue reemplazada desde otro dispositivo.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const client = new ApiClient({
      sessionStorage: storage,
      fetchFn: fetchMock,
      onUnauthorizedSession: onUnauthorized,
    });

    let capturada: ApiException | null = null;
    try {
      await client.getJson('/api/gestopago/catalogo');
    } catch (error) {
      capturada = error as ApiException;
    }

    expect(capturada).toBeInstanceOf(ApiException);
    expect(capturada?.statusCode).toBe(401);
    expect(capturada?.esSesionReemplazada).toBe(true);
    expect(onUnauthorized).toHaveBeenCalledWith(
      'Tu sesión fue reemplazada desde otro dispositivo.',
    );
  });

  it('mapea timeout (AbortError) a statusCode 504 y fallo de red a statusCode 503', async () => {
    const storage = new SessionStorageService();
    const abortError = new DOMException('Aborted', 'AbortError');
    const fetchTimeout = vi.fn<typeof fetch>().mockRejectedValue(abortError);
    const clientTimeout = new ApiClient({ sessionStorage: storage, fetchFn: fetchTimeout });

    await expect(clientTimeout.getJson('/productos')).rejects.toMatchObject({
      statusCode: 504,
    });

    const fetchNetwork = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    const clientNetwork = new ApiClient({ sessionStorage: storage, fetchFn: fetchNetwork });

    await expect(clientNetwork.postJson('/api/gestopago/transacciones/recarga')).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it('limpia automaticamente una sesion expirada en SessionStorageService', () => {
    const storage = new SessionStorageService();
    const expiredIso = new Date(Date.now() - 60_000).toISOString();
    storage.guardarSesion(crearSesionPrueba({ expiresAt: expiredIso }));

    expect(storage.obtenerSesion()).toBeNull();
    expect(window.sessionStorage.getItem('gestopago_web_session')).toBeNull();
  });
});
