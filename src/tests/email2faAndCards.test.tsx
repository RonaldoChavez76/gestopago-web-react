import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { SessionProvider } from '../context/SessionContext';
import { ApiClient } from '../core/network/apiClient';
import { SessionStorageService } from '../core/storage/sessionStorageService';
import type { UserSession } from '../models/auth';
import { parseCatalogProduct } from '../models/product';
import { CatalogPage } from '../pages/CatalogPage';
import { PurchasePage } from '../pages/PurchasePage';

function crearRespuestaJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function crearSesionActiva(): UserSession {
  return {
    accessToken: 'jwt-web-test',
    tokenType: 'Bearer',
    expiresIn: 900,
    plataforma: 'WEB',
    usuarioId: 10,
    clienteId: 1,
    correo: 'chavezronaldo675@gmail.com',
    nombreCliente: 'Ana María López García',
    numeroCuenta: '4229215075268914',
    saldoCuenta: 4990,
  };
}

describe('Mejoras Web: Tarjetas de catálogo completas y 2FA por correo Brevo', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('muestra precio completo, ids de producto y servicio y botones completos en tarjetas del catalogo', async () => {
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      crearRespuestaJson({
        success: true,
        data: [
          {
            idProducto: 14302,
            idServicio: 99,
            producto: 'ABIB 100',
            servicio: 'ABIB',
            precio: '100.00',
            tipoFront: '2',
            active: true,
            legend: 'Pago de servicio ABIB por $100.00 MXN.',
          },
        ],
      }),
    );

    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/catalogo']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <Routes>
            <Route path="/catalogo" element={<CatalogPage />} />
            <Route path="/comprar" element={<h1>Comprar</h1>} />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );

    const heading = await screen.findByText('ABIB 100');
    const card = heading.closest('article')!;
    expect(within(card).getByText('$100.00 MXN')).toBeInTheDocument();
    expect(within(card).getByText('Prod #14302 • Serv #99')).toBeInTheDocument();
    expect(within(card).getByText('Disponible')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: /Ver detalle/i })).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: /Comprar/i })).toBeEnabled();
  });

  it('oculta codigo OTP en 2FA de login y muestra confirmacion de envio por correo', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login/2fa/solicitar')) {
        return crearRespuestaJson({
          success: true,
          data: {
            requiere2FA: true,
            correo: 'chavezronaldo675@gmail.com',
            numeroCuenta: '4229215075268914',
            plataforma: 'WEB',
            codigoOtp: null,
            expiraEnSegundos: 300,
            mensaje: 'Código enviado por correo.',
            correoEnviado: true,
            correoDestinoEnmascarado: 'ch***5@gmail.com',
          },
        });
      }
      if (url.endsWith('/auth/login/2fa/verificar')) {
        return crearRespuestaJson({
          success: true,
          data: {
            accessToken: 'jwt-correo-ok',
            tokenType: 'Bearer',
            expiresIn: 900,
            plataforma: 'WEB',
            usuarioId: 10,
            clienteId: 1,
            nombreCliente: 'Ana Prueba',
            correo: 'chavezronaldo675@gmail.com',
            numeroCuenta: '4229215075268914',
            saldoCuenta: 3990,
          },
        });
      }
      return crearRespuestaJson({}, 404);
    });

    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <AppRoutes />
        </SessionProvider>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/Correo electrónico/i), 'chavezronaldo675@gmail.com');
    await user.type(screen.getByLabelText(/^Contraseña$/i), 'Prueba2026!');
    await user.click(screen.getByRole('button', { name: /Iniciar Sesión con 2FA/i }));

    expect(await screen.findByText('Verificación de Doble Factor (2FA)')).toBeInTheDocument();
    expect(screen.getByText('ch***5@gmail.com')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Usar código/i })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/Código de 6 dígitos/i), '654321');
    await user.click(screen.getByRole('button', { name: /Confirmar y Acceder/i }));

    expect(await screen.findByRole('heading', { name: 'Ana Prueba' })).toBeInTheDocument();
  });

  it('muestra aviso de envio por correo en PurchasePage cuando el servidor no expone el OTP', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());

    const producto = parseCatalogProduct({
      idProducto: 582,
      idServicio: 133,
      producto: 'Recarga Telcel $50',
      servicio: 'Telcel',
      precio: '50.00',
      tipoFront: '1',
      active: true,
    });

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      crearRespuestaJson({
        success: true,
        data: {
          numeroCuenta: '4229215075268914',
          expiraEnSegundos: 300,
          codigoOtp: null,
          correoEnviado: true,
          correoDestinoEnmascarado: 'ch***5@gmail.com',
        },
      }),
    );

    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/comprar']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <Routes>
            <Route path="/comprar" element={<PurchasePage productoOverride={producto} />} />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Generar OTP/i }));

    expect(await screen.findByText('ch***5@gmail.com')).toBeInTheDocument();
    expect(
      screen.queryByText(/Código OTP generado en el servidor y autocompletado:/i),
    ).not.toBeInTheDocument();
  });
});
