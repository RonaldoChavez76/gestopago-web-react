import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { SessionProvider } from '../context/SessionContext';
import { ApiClient } from '../core/network/apiClient';
import { SessionStorageService } from '../core/storage/sessionStorageService';
import type { UserSession } from '../models/auth';

function crearRespuestaJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderConSesion(options: {
  fetchMock: typeof fetch;
  initialEntries?: string[];
  sesionInicial?: UserSession | null;
}) {
  const storage = new SessionStorageService();
  if (options.sesionInicial) {
    storage.guardarSesion(options.sesionInicial);
  }

  let unauthorizedCallback: ((motivo: string) => void) | undefined;
  const apiClient = new ApiClient({
    sessionStorage: storage,
    fetchFn: options.fetchMock,
    onUnauthorizedSession: (motivo) => unauthorizedCallback?.(motivo),
  });

  function ProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={options.initialEntries ?? ['/login']}>
        <SessionProvider
          storageOverride={storage}
          apiClientOverride={apiClient}
          enableAutoSync={false}
        >
          {children}
        </SessionProvider>
      </MemoryRouter>
    );
  }

  const originalProvider = render(
    <ProviderWrapper>
      <AppRoutes />
    </ProviderWrapper>,
  );

  return {
    ...originalProvider,
    storage,
    setUnauthorizedCallback: (cb: (motivo: string) => void) => {
      unauthorizedCallback = cb;
    },
  };
}

describe('Fase 2: Flujo completo de Autenticación Web, 2FA y Sesión Única', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('completa login con credenciales de Ana, verificacion 2FA y renderiza cuenta Web', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login/2fa/solicitar')) {
        return crearRespuestaJson({
          success: true,
          message: 'Reto generado',
          data: {
            requiere2FA: true,
            correo: 'ana.lopez.prueba@example.com',
            numeroCuenta: '4229215075268914',
            plataforma: 'WEB',
            codigoOtp: '482910',
            expiraEnSegundos: 300,
            mensaje: 'Código OTP generado',
          },
        });
      }
      if (url.endsWith('/auth/login/2fa/verificar')) {
        return crearRespuestaJson({
          success: true,
          message: 'Inicio exitoso',
          data: {
            accessToken: 'jwt-web-ana-token',
            tokenType: 'Bearer',
            expiresIn: 900,
            sessionId: 'sess-web-001',
            plataforma: 'WEB',
            clienteId: 1,
            nombreCliente: 'Ana María López García',
            correo: 'ana.lopez.prueba@example.com',
            numeroCuenta: '4229215075268914',
            saldoCuenta: 4990.0,
          },
        });
      }
      return crearRespuestaJson({}, 404);
    });

    const { storage } = renderConSesion({ fetchMock, initialEntries: ['/login'] });

    await user.click(screen.getByRole('button', { name: /Cargar credenciales de prueba \(Ana\)/i }));
    await user.click(screen.getByRole('button', { name: /Iniciar Sesión con 2FA/i }));

    expect(await screen.findByText('Verificación de Doble Factor (2FA)')).toBeInTheDocument();
    expect(screen.getByText('482910')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Usar código/i }));
    await user.click(screen.getByRole('button', { name: /Confirmar y Acceder/i }));

    expect(
      await screen.findByRole('heading', { name: 'Ana María López García' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('$4,990.00 MXN').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sesión WEB')).toBeInTheDocument();
    expect(storage.obtenerSesion()?.accessToken).toBe('jwt-web-ana-token');
  });

  it('detecta conflicto de sesion activa en MOVIL (409) y permite cerrar la anterior para continuar', async () => {
    const user = userEvent.setup();
    const solicitudesBody: Array<Record<string, unknown>> = [];

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/auth/login/2fa/solicitar')) {
        const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
        solicitudesBody.push(body);

        if (!body.forzarCierreSesion) {
          return crearRespuestaJson(
            {
              success: false,
              message: 'Ya existe una sesión activa en MOVIL.',
              data: {
                sesionActivaExistente: true,
                plataformaActiva: 'MOVIL',
                fechaInicio: '2026-11-22T00:10:00Z',
                accionRequerida: 'Finaliza la sesión anterior en MOVIL.',
              },
            },
            409,
          );
        }

        return crearRespuestaJson({
          success: true,
          message: 'Reto generado tras reemplazo',
          data: {
            requiere2FA: true,
            correo: 'ana.lopez.prueba@example.com',
            numeroCuenta: '4229215075268914',
            plataforma: 'WEB',
            codigoOtp: '991122',
            expiraEnSegundos: 300,
            mensaje: 'Ingresa el código OTP.',
          },
        });
      }
      return crearRespuestaJson({}, 404);
    });

    renderConSesion({ fetchMock, initialEntries: ['/login'] });

    await user.click(screen.getByRole('button', { name: /Cargar credenciales de prueba \(Ana\)/i }));
    await user.click(screen.getByRole('button', { name: /Iniciar Sesión con 2FA/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Sesión activa en MOVIL')).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole('button', { name: /Cerrar sesión anterior y continuar/i }),
    );

    expect(await screen.findByText('Verificación de Doble Factor (2FA)')).toBeInTheDocument();
    expect(solicitudesBody).toHaveLength(2);
    expect(solicitudesBody[0].forzarCierreSesion).toBe(false);
    expect(solicitudesBody[1].forzarCierreSesion).toBe(true);
    expect(solicitudesBody[1].plataforma).toBe('WEB');
  });

  it('expulsa al login con alerta cuando verificar vigencia recibe 401 por sesion reemplazada', async () => {
    const user = userEvent.setup();
    const sesionWeb: UserSession = {
      accessToken: 'jwt-web-reemplazado',
      tokenType: 'Bearer',
      expiresIn: 900,
      plataforma: 'WEB',
      correo: 'ana.lopez.prueba@example.com',
      nombreCliente: 'Ana María López García',
      numeroCuenta: '4229215075268914',
      saldoCuenta: 4990,
    };

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      crearRespuestaJson(
        {
          success: false,
          message: 'Tu sesión fue reemplazada desde otro dispositivo.',
        },
        401,
      ),
    );

    const storage = new SessionStorageService();
    storage.guardarSesion(sesionWeb);

    let onUnauthorized: ((motivo: string) => void) | undefined;
    const apiClient = new ApiClient({
      sessionStorage: storage,
      fetchFn: fetchMock,
      onUnauthorizedSession: (motivo) => onUnauthorized?.(motivo),
    });
    void onUnauthorized;

    render(
      <MemoryRouter initialEntries={['/']}>
        <SessionProvider storageOverride={storage} enableAutoSync={false} apiClientOverride={apiClient}>
          <AppRoutes />
        </SessionProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Verificar vigencia/i }));

    expect(await screen.findByText('Bienvenido a GestoPago')).toBeInTheDocument();
    expect(
      screen.getByText('Tu sesión fue reemplazada desde otro dispositivo.'),
    ).toBeInTheDocument();
    expect(storage.obtenerSesion()).toBeNull();
  });

  it('cierra sesion de forma segura invocando POST /auth/logout y limpiando sessionStorage', async () => {
    const user = userEvent.setup();
    const sesionWeb: UserSession = {
      accessToken: 'jwt-web-activa',
      tokenType: 'Bearer',
      expiresIn: 900,
      plataforma: 'WEB',
      correo: 'ana.lopez.prueba@example.com',
      nombreCliente: 'Ana María López García',
      numeroCuenta: '4229215075268914',
      saldoCuenta: 4990,
    };

    const storage = new SessionStorageService();
    storage.guardarSesion(sesionWeb);

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      crearRespuestaJson({
        success: true,
        message: 'Sesión cerrada correctamente.',
        data: null,
      }),
    );

    const apiClient = new ApiClient({
      sessionStorage: storage,
      fetchFn: fetchMock,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <AppRoutes />
        </SessionProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Cerrar sesión/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Cerrar sesión segura')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /Cerrar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText('Bienvenido a GestoPago')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/logout$/),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(storage.obtenerSesion()).toBeNull();
  });
});
