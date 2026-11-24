import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider } from '../context/SessionContext';
import { ApiClient } from '../core/network/apiClient';
import { SessionStorageService } from '../core/storage/sessionStorageService';
import type { UserSession } from '../models/auth';
import { HistoryPage } from '../pages/HistoryPage';
import { TransactionService } from '../services/transactionService';

function crearRespuestaJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function crearSesionActiva(): UserSession {
  return {
    accessToken: 'jwt-web-historial',
    tokenType: 'Bearer',
    expiresIn: 900,
    plataforma: 'WEB',
    correo: 'ana.lopez.prueba@example.com',
    nombreCliente: 'Ana María López García',
    numeroCuenta: '4229215075268914',
    saldoCuenta: 4940,
  };
}

const COMPRA_RECARGA = {
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
  fecha: '22/Nov/2026 01:02:00',
};

const COMPRA_SERVICIO = {
  upc: 'TX1B9922334455',
  tipoOperacion: 'PAGO_SERVICIO',
  idProducto: 701,
  idServicio: 76,
  nombreProducto: 'Pago Recibo CFE',
  exitoso: true,
  estado: 'EXITOSA',
  codigo: '01',
  mensaje: 'Servicio pagado correctamente',
  idTx: '991122334',
  numAutorizacion: '44556677',
  monto: 120.0,
  referencia: '2572038100',
  numeroCuenta: '4229215075268914',
  fecha: '22/Nov/2026 01:05:00',
};

describe('Fase 5: Historial de Compras Exitosas y Detalle por UPC', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('TransactionService excluye operaciones rechazadas y pendientes conservando solo EXITOSA', async () => {
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/historial/exitosas')) {
        return crearRespuestaJson({
          success: true,
          data: [
            COMPRA_RECARGA,
            {
              upc: 'TX-RECH-01',
              tipoOperacion: 'RECARGA',
              nombreProducto: 'Recarga Fallida',
              exitoso: false,
              estado: 'RECHAZADA',
              mensaje: 'Saldo insuficiente',
              monto: 100.0,
            },
            {
              upc: 'TX-PEND-02',
              tipoOperacion: 'PAGO_SERVICIO',
              nombreProducto: 'Servicio Pendiente',
              exitoso: false,
              estado: 'PENDIENTE',
              mensaje: 'En verificación',
              monto: 80.0,
            },
          ],
        });
      }
      if (url.endsWith(`/transacciones/${COMPRA_RECARGA.upc}`)) {
        return crearRespuestaJson({
          success: true,
          data: COMPRA_RECARGA,
        });
      }
      return crearRespuestaJson({}, 404);
    });

    const service = new TransactionService({
      apiClient: new ApiClient({ sessionStorage: storage, fetchFn: fetchMock }),
    });

    const exitosas = await service.obtenerHistorialComprasExitosas({
      clienteId: 1,
      numeroCuenta: '4229215075268914',
    });
    expect(exitosas).toHaveLength(1);
    expect(exitosas[0].upc).toBe('TX1A18913184248');
    expect(exitosas[0].exitoso).toBe(true);

    const detalle = await service.consultarDetallePorUpc('TX1A18913184248');
    expect(detalle.idTx).toBe('826364546');
    expect(detalle.numAutorizacion).toBe('18596434');
  });

  it('HistoryPage muestra resumen, filtra por busqueda/tipo y verifica detalle por UPC en servidor', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/historial/exitosas')) {
        return crearRespuestaJson({
          success: true,
          data: [COMPRA_RECARGA, COMPRA_SERVICIO],
        });
      }
      if (url.endsWith(`/transacciones/${COMPRA_RECARGA.upc}`)) {
        return crearRespuestaJson({
          success: true,
          data: COMPRA_RECARGA,
        });
      }
      return crearRespuestaJson({}, 404);
    });

    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/historial']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <Routes>
            <Route path="/historial" element={<HistoryPage />} />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Operaciones Exitosas: 2')).toBeInTheDocument();
    expect(screen.getByText('Total operado: $170.00 MXN')).toBeInTheDocument();
    expect(screen.getByText('Recarga Telcel $50')).toBeInTheDocument();
    expect(screen.getByText('Pago Recibo CFE')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Servicios' }));
    expect(screen.getByText('Pago Recibo CFE')).toBeInTheDocument();
    expect(screen.queryByText('Recarga Telcel $50')).not.toBeInTheDocument();
    expect(screen.getByText('Operaciones Exitosas: 1')).toBeInTheDocument();
    expect(screen.getByText('Total operado: $120.00 MXN')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Todas' }));
    const searchInput = screen.getByRole('textbox', { name: /Buscar en historial/i });
    await user.type(searchInput, '826364546');
    expect(screen.getByText('Recarga Telcel $50')).toBeInTheDocument();
    expect(screen.queryByText('Pago Recibo CFE')).not.toBeInTheDocument();

    const tarjeta = screen.getByText('Recarga Telcel $50').closest('article')!;
    await user.click(within(tarjeta).getByRole('button', { name: /Ver comprobante/i }));

    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByText('Detalle de Compra Exitosa')).toBeInTheDocument();
    expect(within(modal).getByText('18596434')).toBeInTheDocument();

    await user.click(
      within(modal).getByRole('button', { name: /Verificar en servidor por UPC/i }),
    );
    expect(
      await within(modal).findByText('Comprobante verificado en tiempo real con el servidor.'),
    ).toBeInTheDocument();
  });

  it('HistoryPage muestra compras rechazadas con su motivo especifico sin sumarlas al total operado', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());

    const COMPRA_RECHAZADA = {
      upc: 'RJ_SALDO_09',
      tipoOperacion: 'RECARGA',
      idProducto: 582,
      idServicio: 133,
      nombreProducto: 'Recarga Telcel $200',
      exitoso: false,
      estado: 'RECHAZADA',
      codigo: 'SALDO_INS',
      mensaje: 'Saldo insuficiente en la cuenta 4229215075268914.',
      motivoRechazo: 'Saldo insuficiente en la cuenta 4229215075268914.',
      monto: 200.0,
      telefono: '5512345678',
      numeroCuenta: '4229215075268914',
      fechaRegistro: '2026-11-24T00:10:00',
    };

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/historial/completo')) {
        return crearRespuestaJson({
          success: true,
          data: [COMPRA_RECARGA, COMPRA_RECHAZADA],
        });
      }
      return crearRespuestaJson({}, 404);
    });

    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/historial']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <Routes>
            <Route path="/historial" element={<HistoryPage />} />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Operaciones Exitosas: 1')).toBeInTheDocument();
    expect(screen.getByText('Rechazadas / Fallidas: 1')).toBeInTheDocument();
    expect(screen.getByText('Total operado: $50.00 MXN')).toBeInTheDocument();
    expect(screen.getByText('Recarga Telcel $200')).toBeInTheDocument();
    expect(screen.getByText(/Saldo insuficiente en la cuenta 4229215075268914\./)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Rechazadas' }));
    expect(screen.getByText('Recarga Telcel $200')).toBeInTheDocument();
    expect(screen.queryByText('Recarga Telcel $50')).not.toBeInTheDocument();

    const tarjetaRechazada = screen.getByText('Recarga Telcel $200').closest('article')!;
    await user.click(within(tarjetaRechazada).getByRole('button', { name: /Ver comprobante/i }));

    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByText('Detalle de Compra Rechazada')).toBeInTheDocument();
    expect(within(modal).getByText('Motivo específico del rechazo')).toBeInTheDocument();
    expect(within(modal).getByText('SALDO_INS')).toBeInTheDocument();
  });
});
