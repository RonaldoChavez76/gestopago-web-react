import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider } from '../context/SessionContext';
import { ApiClient, ApiException } from '../core/network/apiClient';
import { SessionStorageService } from '../core/storage/sessionStorageService';
import type { UserSession } from '../models/auth';
import type { CatalogProduct } from '../models/product';
import { CatalogPage } from '../pages/CatalogPage';
import { CatalogService } from '../services/catalogService';

function crearRespuestaJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function crearSesionActiva(): UserSession {
  return {
    accessToken: 'jwt-web-catalogo',
    tokenType: 'Bearer',
    expiresIn: 900,
    plataforma: 'WEB',
    correo: 'ana.lopez.prueba@example.com',
    nombreCliente: 'Ana María López García',
    numeroCuenta: '4229215075268914',
    saldoCuenta: 4990,
  };
}

const PRODUCTOS_MOCK = [
  {
    idProducto: 582,
    idServicio: 133,
    producto: 'Recarga Telcel $50',
    servicio: 'Telcel',
    precio: '50.00',
    tipoFront: '1',
    active: true,
    legend: 'Tiempo aire inmediato para líneas Telcel',
  },
  {
    idProducto: 701,
    idServicio: 76,
    producto: 'Pago Recibo CFE',
    servicio: 'CFE Electricidad',
    precio: 0,
    tipoFront: '2',
    active: true,
    legend: 'Pago de servicio eléctrico nacional',
  },
  {
    idProducto: 905,
    idServicio: 210,
    producto: 'Tarjeta Netflix $300',
    servicio: 'Pines Digitales',
    precio: 300,
    tipoFront: '4',
    active: false,
    legend: 'Código digital de entretenimiento',
  },
];

function ComprarLocationInspector() {
  const location = useLocation();
  const state = location.state as { producto?: CatalogProduct } | null;
  return (
    <div>
      <h1>Ruta Compra</h1>
      <p>{state?.producto?.nombre ?? 'Sin producto'}</p>
    </div>
  );
}

function renderCatalogoConRouter(fetchMock: typeof fetch) {
  const storage = new SessionStorageService();
  storage.guardarSesion(crearSesionActiva());
  const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

  return render(
    <MemoryRouter initialEntries={['/catalogo']}>
      <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
        <Routes>
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/comprar" element={<ComprarLocationInspector />} />
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe('Fase 3: Catálogo Dinámico de Productos GestoPago', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('CatalogService obtiene /productos, usa fallback /api/gestopago/catalogo ante 500 y relanza 401', async () => {
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());

    const fetchExitoso = vi.fn<typeof fetch>().mockResolvedValue(
      crearRespuestaJson({
        success: true,
        data: { data: PRODUCTOS_MOCK },
      }),
    );
    const serviceOk = new CatalogService({
      apiClient: new ApiClient({ sessionStorage: storage, fetchFn: fetchExitoso }),
    });
    const listaOk = await serviceOk.obtenerCatalogoProductos();
    expect(listaOk).toHaveLength(3);
    expect(listaOk[0].nombre).toBe('Recarga Telcel $50');

    const fetchFallback = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      if (String(input).endsWith('/productos')) {
        return crearRespuestaJson({ message: 'Error interno' }, 500);
      }
      return crearRespuestaJson({
        success: true,
        data: [PRODUCTOS_MOCK[1]],
      });
    });
    const serviceFallback = new CatalogService({
      apiClient: new ApiClient({ sessionStorage: storage, fetchFn: fetchFallback }),
    });
    const listaFallback = await serviceFallback.obtenerCatalogoProductos();
    expect(listaFallback).toHaveLength(1);
    expect(listaFallback[0].nombre).toBe('Pago Recibo CFE');

    const fetch401 = vi.fn<typeof fetch>().mockResolvedValue(
      crearRespuestaJson({ message: 'Sesión reemplazada' }, 401),
    );
    const service401 = new CatalogService({
      apiClient: new ApiClient({ sessionStorage: storage, fetchFn: fetch401 }),
    });
    await expect(service401.obtenerCatalogoProductos()).rejects.toBeInstanceOf(ApiException);
    expect(fetch401).toHaveBeenCalledTimes(1);
  });

  it('filtra CatalogPage por categoria, disponibilidad, busqueda y limpia filtros', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      crearRespuestaJson({
        success: true,
        data: { data: PRODUCTOS_MOCK },
      }),
    );

    renderCatalogoConRouter(fetchMock);

    expect(await screen.findByText('Recarga Telcel $50')).toBeInTheDocument();
    expect(screen.getByText('Pago Recibo CFE')).toBeInTheDocument();
    expect(screen.getByText('Tarjeta Netflix $300')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 3 productos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Pago de Servicios \(1\)/i }));
    expect(screen.getByText('Pago Recibo CFE')).toBeInTheDocument();
    expect(screen.queryByText('Recarga Telcel $50')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Todos \(3\)/i }));
    await user.click(screen.getByRole('button', { name: /Solo disponibles/i }));
    expect(screen.queryByText('Tarjeta Netflix $300')).not.toBeInTheDocument();
    expect(screen.getByText('Mostrando 2 productos')).toBeInTheDocument();

    const searchInput = screen.getByRole('textbox', { name: /Buscar productos/i });
    await user.type(searchInput, 'Telcel');
    expect(screen.getByText('Recarga Telcel $50')).toBeInTheDocument();
    expect(screen.queryByText('Pago Recibo CFE')).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'InexistenteXYZ');
    expect(
      screen.getByText('No se encontraron productos que coincidan con tu búsqueda.'),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Limpiar filtros' })[0]);
    expect(screen.getByText('Mostrando 3 productos')).toBeInTheDocument();
  });

  it('abre ProductDetailModal y navega a /comprar con el producto seleccionado', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      crearRespuestaJson({
        success: true,
        data: { data: PRODUCTOS_MOCK },
      }),
    );

    renderCatalogoConRouter(fetchMock);

    const tituloTelcel = await screen.findByText('Recarga Telcel $50');
    const tarjeta = tituloTelcel.closest('article')!;
    await user.click(within(tarjeta).getByRole('button', { name: /Ver detalle/i }));

    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByText('Telcel • Recargas Telefónicas')).toBeInTheDocument();
    expect(within(modal).getByText('$50.00 MXN')).toBeInTheDocument();
    expect(within(modal).getByText('#582')).toBeInTheDocument();
    expect(within(modal).getByText('#133')).toBeInTheDocument();
    expect(
      within(modal).getByText('Tiempo aire inmediato para líneas Telcel'),
    ).toBeInTheDocument();

    await user.click(within(modal).getByRole('button', { name: /Seleccionar para Compra/i }));

    expect(await screen.findByRole('heading', { name: 'Ruta Compra' })).toBeInTheDocument();
    expect(screen.getByText('Recarga Telcel $50')).toBeInTheDocument();
  });

  it('muestra error de red ante 503 y permite reintentar consulta exitosamente', async () => {
    const user = userEvent.setup();
    let intentos = 0;

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/api/gestopago/catalogo')) {
        intentos++;
        if (intentos === 1) {
          return crearRespuestaJson({ message: 'Servicio GestoPago temporalmente no disponible.' }, 503);
        }
        return crearRespuestaJson({ success: true, data: [PRODUCTOS_MOCK[0]] });
      }
      return crearRespuestaJson({ message: 'No disponible' }, 503);
    });

    renderCatalogoConRouter(fetchMock);

    expect(
      await screen.findByText('Servicio GestoPago temporalmente no disponible.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Reintentar consulta/i }));

    expect(await screen.findByText('Recarga Telcel $50')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 productos')).toBeInTheDocument();
  });
});
