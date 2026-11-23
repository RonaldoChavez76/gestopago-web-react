import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { SessionProvider } from '../context/SessionContext';
import { ApiClient, ApiException } from '../core/network/apiClient';
import { SessionStorageService } from '../core/storage/sessionStorageService';

function crearRespuestaJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Escenario Práctico de Evaluación de Ana: Flutter Móvil y React Web sincronizados', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('detecta sesion activa en MOVIL (409), reemplaza sesion con 2FA, muestra compra movil en WEB e invalida MOVIL (401)', async () => {
    const user = userEvent.setup();

    let plataformaActivaServidor = 'MOVIL';
    let tokenActivoServidor = 'jwt-movil-token';
    const transaccionesRegistradas = [
      {
        upc: 'TX1A9001',
        tipoOperacion: 'RECARGA',
        idProducto: 582,
        idServicio: 133,
        nombreProducto: 'Recarga Telcel $50',
        exitoso: true,
        estado: 'EXITOSA',
        codigo: '01',
        mensaje: 'Operación realizada con éxito',
        idTx: 'TX-ANA-9001',
        numAutorizacion: 'AUTH-778899',
        monto: 50.0,
        telefono: '5512345678',
        numeroCuenta: '4229215075268914',
        fecha: '22/Nov/2026 01:05:00',
      },
      {
        upc: 'TX-INTENTO-FALLIDO',
        tipoOperacion: 'RECARGA',
        idProducto: 582,
        idServicio: 133,
        nombreProducto: 'Recarga Telcel $100 Fallida',
        exitoso: false,
        estado: 'RECHAZADA',
        codigo: '99',
        mensaje: 'Rechazada por operador',
        monto: 100.0,
        telefono: '5512345678',
        numeroCuenta: '4229215075268914',
        fecha: '22/Nov/2026 01:04:00',
      },
    ];

    const sharedBackendFetch = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      const authHeader = (init?.headers as Record<string, string> | undefined)?.Authorization;

      if (url.endsWith('/auth/login/2fa/solicitar')) {
        const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
        const plataformaSolicitada = String(body.plataforma ?? 'WEB');
        const forzar = Boolean(body.forzarCierreSesion);

        if (plataformaActivaServidor !== plataformaSolicitada && !forzar) {
          return crearRespuestaJson(
            {
              success: false,
              message: `Ya existe una sesión activa en ${plataformaActivaServidor}.`,
              data: {
                sesionActivaExistente: true,
                plataformaActiva: plataformaActivaServidor,
                fechaInicio: '2026-11-22T01:00:00Z',
                accionRequerida: `Debes finalizar la sesión anterior en ${plataformaActivaServidor} antes de continuar.`,
              },
            },
            409,
          );
        }

        return crearRespuestaJson({
          success: true,
          message: 'Código 2FA generado',
          data: {
            requiere2FA: true,
            correo: body.correo,
            numeroCuenta: '4229215075268914',
            plataforma: plataformaSolicitada,
            codigoOtp: '482910',
            expiraEnSegundos: 300,
            mensaje: 'Ingresa el código de 6 dígitos.',
          },
        });
      }

      if (url.endsWith('/auth/login/2fa/verificar')) {
        const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
        const plataformaSolicitada = String(body.plataforma ?? 'WEB');
        plataformaActivaServidor = plataformaSolicitada;
        tokenActivoServidor = `jwt-${plataformaSolicitada}-token`;

        return crearRespuestaJson({
          success: true,
          message: 'Inicio de sesión exitoso',
          data: {
            accessToken: tokenActivoServidor,
            tokenType: 'Bearer',
            expiresIn: 900,
            sessionId: `sess-${plataformaSolicitada}`,
            plataforma: plataformaSolicitada,
            clienteId: 1,
            nombreCliente: 'Ana María López García',
            correo: body.correo,
            numeroCuenta: '4229215075268914',
            saldoCuenta: 4940.0,
          },
        });
      }

      if (authHeader !== `Bearer ${tokenActivoServidor}`) {
        return crearRespuestaJson(
          {
            success: false,
            message: 'Tu sesión fue cerrada o reemplazada desde otro dispositivo.',
          },
          401,
        );
      }

      if (url.includes('/api/gestopago/transacciones/historial/exitosas')) {
        return crearRespuestaJson({
          success: true,
          data: transaccionesRegistradas.filter((tx) => tx.exitoso),
        });
      }

      return crearRespuestaJson({}, 404);
    });

    const storageWeb = new SessionStorageService();
    const apiWeb = new ApiClient({
      sessionStorage: storageWeb,
      fetchFn: sharedBackendFetch,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <SessionProvider
          storageOverride={storageWeb}
          apiClientOverride={apiWeb}
          enableAutoSync={false}
        >
          <AppRoutes />
        </SessionProvider>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/Correo electrónico/i), 'ana.lopez.prueba@example.com');
    await user.type(screen.getByLabelText(/^Contraseña$/i), 'Prueba2026!');
    await user.click(screen.getByRole('button', { name: /Iniciar Sesión con 2FA/i }));

    const modalConflicto = await screen.findByRole('dialog');
    expect(within(modalConflicto).getByText('Sesión activa en MOVIL')).toBeInTheDocument();

    await user.click(
      within(modalConflicto).getByRole('button', { name: /Cerrar sesión anterior y continuar/i }),
    );

    expect(await screen.findByText('Verificación de Doble Factor (2FA)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Usar código/i }));
    await user.click(screen.getByRole('button', { name: /Confirmar y Acceder/i }));

    expect(
      await screen.findByRole('heading', { name: 'Ana María López García' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Sesión WEB')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Consultar Historial de Compras/i }));

    expect(await screen.findByText('Historial de Compras Exitosas')).toBeInTheDocument();
    expect(await screen.findByText('Recarga Telcel $50')).toBeInTheDocument();
    expect(screen.getByText(/TX-ANA-9001/)).toBeInTheDocument();
    expect(screen.getByText('Total operado: $50.00 MXN')).toBeInTheDocument();
    expect(screen.queryByText('Recarga Telcel $100 Fallida')).not.toBeInTheDocument();

    const storageMovilAntiguo = new SessionStorageService();
    storageMovilAntiguo.guardarSesion({
      accessToken: 'jwt-movil-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      plataforma: 'MOVIL',
      correo: 'ana.lopez.prueba@example.com',
    });
    const apiMovilAntiguo = new ApiClient({
      sessionStorage: storageMovilAntiguo,
      fetchFn: sharedBackendFetch,
    });

    let errorMovil: ApiException | null = null;
    try {
      await apiMovilAntiguo.getJson('/api/gestopago/transacciones/historial/exitosas');
    } catch (error) {
      errorMovil = error as ApiException;
    }

    expect(errorMovil).toBeInstanceOf(ApiException);
    expect(errorMovil?.statusCode).toBe(401);
    expect(errorMovil?.esSesionReemplazada).toBe(true);
  });
});
