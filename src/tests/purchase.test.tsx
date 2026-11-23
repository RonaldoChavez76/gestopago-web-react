import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider } from '../context/SessionContext';
import { ApiClient } from '../core/network/apiClient';
import { SessionStorageService } from '../core/storage/sessionStorageService';
import type { UserSession } from '../models/auth';
import { parseCatalogProduct } from '../models/product';
import { PurchasePage } from '../pages/PurchasePage';
import { TransactionService } from '../services/transactionService';

function crearRespuestaJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function crearSesionActiva(): UserSession {
  return {
    accessToken: 'jwt-web-compra',
    tokenType: 'Bearer',
    expiresIn: 900,
    plataforma: 'WEB',
    correo: 'ana.lopez.prueba@example.com',
    nombreCliente: 'Ana María López García',
    numeroCuenta: '4229215075268914',
    saldoCuenta: 4990,
  };
}

const PRODUCTO_RECARGA = parseCatalogProduct({
  idProducto: 582,
  idServicio: 133,
  producto: 'Recarga Telcel $50',
  servicio: 'Telcel',
  precio: '50.00',
  tipoFront: '1',
  active: true,
});

describe('Fase 4: Módulo de Compras, Confirmación 2FA y Clasificación de Estados', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('TransactionService distingue entre compra exitosa, rechazada, pendiente y error de comunicacion', async () => {
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());

    const svcExitosa = new TransactionService({
      apiClient: new ApiClient({
        sessionStorage: storage,
        fetchFn: vi.fn<typeof fetch>().mockResolvedValue(
          crearRespuestaJson({
            success: true,
            data: {
              upc: 'TX1A100',
              estado: 'EXITOSA',
              exitoso: true,
              mensaje: 'Abono exitoso',
              monto: 50,
              idTx: 'TX-OK-100',
            },
          }),
        ),
      }),
    });
    const rOk = await svcExitosa.procesarCompra({
      producto: PRODUCTO_RECARGA,
      numeroCuenta: '4229215075268914',
      monto: 50,
      destino: '5512345678',
    });
    expect(rOk.estadoVisual).toBe('exitosa');
    expect(rOk.exitoso).toBe(true);

    const svcRechazada = new TransactionService({
      apiClient: new ApiClient({
        sessionStorage: storage,
        fetchFn: vi.fn<typeof fetch>().mockResolvedValue(
          crearRespuestaJson({ message: 'Saldo insuficiente' }, 400),
        ),
      }),
    });
    const rRech = await svcRechazada.procesarCompra({
      producto: PRODUCTO_RECARGA,
      numeroCuenta: '4229215075268914',
      monto: 50,
      destino: '5512345678',
    });
    expect(rRech.estadoVisual).toBe('rechazada');
    expect(rRech.exitoso).toBe(false);

    const svcPendiente = new TransactionService({
      apiClient: new ApiClient({
        sessionStorage: storage,
        fetchFn: vi.fn<typeof fetch>().mockRejectedValue(new DOMException('Aborted', 'AbortError')),
      }),
    });
    const rPend = await svcPendiente.procesarCompra({
      producto: PRODUCTO_RECARGA,
      numeroCuenta: '4229215075268914',
      monto: 50,
      destino: '5512345678',
    });
    expect(rPend.estadoVisual).toBe('pendiente');
    expect(rPend.exitoso).toBe(false);

    const svcErrorRed = new TransactionService({
      apiClient: new ApiClient({
        sessionStorage: storage,
        fetchFn: vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch')),
      }),
    });
    const rErr = await svcErrorRed.procesarCompra({
      producto: PRODUCTO_RECARGA,
      numeroCuenta: '4229215075268914',
      monto: 50,
      destino: '5512345678',
    });
    expect(rErr.estadoVisual).toBe('errorComunicacion');
    expect(rErr.exitoso).toBe(false);
  });

  it('ejecuta flujo completo de compra con OTP 2FA, confirmacion previa, comprobante exitoso y actualiza saldo', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());

    const payloadsRecarga: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/api/seguridad/2fa/solicitar')) {
        return crearRespuestaJson({
          success: true,
          data: { codigoOtp: '482910' },
        });
      }
      if (url.endsWith('/api/gestopago/transacciones/recarga')) {
        payloadsRecarga.push(JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>);
        return crearRespuestaJson({
          success: true,
          data: {
            upc: 'TX1A18913184248',
            tipoOperacion: 'RECARGA',
            idProducto: 582,
            idServicio: 133,
            nombreProducto: 'Recarga Telcel $50',
            exitoso: true,
            estado: 'EXITOSA',
            codigo: '01',
            mensaje: 'Operación realizada con éxito',
            idTx: '826364546',
            numAutorizacion: '18596434',
            monto: 50.0,
            telefono: '5512345678',
            numeroCuenta: '4229215075268914',
            nuevoSaldoCuenta: 4940.0,
            fecha: '22/Nov/2026 01:02:00',
          },
        });
      }
      return crearRespuestaJson({}, 404);
    });

    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/comprar']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <Routes>
            <Route path="/comprar" element={<PurchasePage productoOverride={PRODUCTO_RECARGA} />} />
            <Route path="/historial" element={<h1>Pantalla Historial</h1>} />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Generar OTP/i }));
    expect(
      await screen.findByText('Código OTP generado en el servidor y autocompletado: 482910'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Continuar a Confirmación/i }));

    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByText('Confirmar Intención de Compra')).toBeInTheDocument();
    expect(within(modal).getByText('Recarga Telcel $50')).toBeInTheDocument();
    expect(within(modal).getByText('$50.00 MXN')).toBeInTheDocument();

    await user.click(within(modal).getByRole('button', { name: /Confirmar y Pagar/i }));

    expect(await screen.findByText('¡Compra Exitosa!')).toBeInTheDocument();
    expect(screen.getByText('826364546')).toBeInTheDocument();
    expect(screen.getByText('18596434')).toBeInTheDocument();
    expect(screen.getByText('$4940.00 MXN')).toBeInTheDocument();
    expect(payloadsRecarga).toHaveLength(1);
    expect(payloadsRecarga[0].codigo2FA).toBe('482910');
    expect(storage.obtenerSesion()?.saldoCuenta).toBe(4940);

    await user.click(
      screen.getByRole('button', { name: /Ver en Mi Historial de Compras Exitosas/i }),
    );
    expect(await screen.findByRole('heading', { name: 'Pantalla Historial' })).toBeInTheDocument();
  });

  it('muestra comprobante de Compra Rechazada sin boton de historial ante error 400', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      crearRespuestaJson({ message: 'Referencia inválida para el operador' }, 400),
    );
    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/comprar']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <Routes>
            <Route path="/comprar" element={<PurchasePage productoOverride={PRODUCTO_RECARGA} />} />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/Código 2FA OTP/i), '482910');
    await user.click(screen.getByRole('button', { name: /Continuar a Confirmación/i }));
    const modal = await screen.findByRole('dialog');
    await user.click(within(modal).getByRole('button', { name: /Confirmar y Pagar/i }));

    expect(await screen.findByText('Compra Rechazada')).toBeInTheDocument();
    expect(screen.getByText('Referencia inválida para el operador')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Ver en Mi Historial de Compras Exitosas/i }),
    ).not.toBeInTheDocument();
  });

  it('impide continuar a confirmacion si el codigo 2FA esta vacio', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());

    const fetchMock = vi.fn<typeof fetch>();
    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/comprar']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <Routes>
            <Route path="/comprar" element={<PurchasePage productoOverride={PRODUCTO_RECARGA} />} />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Continuar a Confirmación/i }));

    expect(
      await screen.findByText(
        'Solicita e ingresa el código 2FA de 6 dígitos para autorizar la compra.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('muestra estado amigable con acceso al catalogo cuando se entra a /comprar sin producto', () => {
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());
    const apiClient = new ApiClient({
      sessionStorage: storage,
      fetchFn: vi.fn<typeof fetch>(),
    });

    render(
      <MemoryRouter initialEntries={['/comprar']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <Routes>
            <Route path="/comprar" element={<PurchasePage />} />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Selecciona un producto del catálogo para realizar una compra'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir al Catálogo de Productos/i })).toBeInTheDocument();
  });
});
