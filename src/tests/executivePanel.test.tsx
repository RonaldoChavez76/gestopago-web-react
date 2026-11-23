import { render, screen, waitFor } from '@testing-library/react';
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

function crearSesionActiva(rol: 'CLIENTE' | 'EJECUTIVO'): UserSession {
  return {
    accessToken: 'jwt-prueba',
    tokenType: 'Bearer',
    expiresIn: 900,
    expiresAt: new Date(Date.now() + 900_000).toISOString(),
    sessionId: 'sid-1',
    plataforma: 'WEB',
    rol,
    usuarioId: 10,
    clienteId: 3,
    nombreCliente: rol === 'EJECUTIVO' ? 'Ronaldo Ejecutivo' : 'Ana Cliente',
    correo: rol === 'EJECUTIVO' ? 'ejecutivo@gestopago.com' : 'ana@gestopago.com',
    numeroCuenta: '9941467045485002',
    saldoCuenta: 3680,
  };
}

function clienteFixture(id = 7, primerNombre = 'Mario', activo = true) {
  return {
    id,
    primerNombre,
    segundoNombre: '',
    apellidoPaterno: 'Salazar',
    apellidoMaterno: 'Vega',
    fechaNacimiento: '1992-05-14',
    curp: 'SAVA920514HDFRRL01',
    rfc: 'SAVA920514AB1',
    sexo: 'MASCULINO',
    nacionalidad: 'Mexicana',
    estadoCivil: 'Soltero',
    correo: 'mario.salazar@correo.com',
    telefonoMovil: '5511223344',
    telefonoAlternativo: '',
    ocupacion: 'Ingeniero',
    empresa: 'Tech MX',
    ingresoMensual: 28000,
    activo,
    fechaCreacion: '2026-10-10T10:00:00Z',
    domicilio: {
      calle: 'Reforma',
      numeroExterior: '100',
      numeroInterior: '',
      colonia: 'Juárez',
      municipio: 'Cuauhtémoc',
      estado: 'Ciudad de México',
      codigoPostal: '06600',
      pais: 'México',
    },
  };
}

describe('Diferenciación de Roles y Panel Ejecutivo en Web', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('oculta Panel Ejecutivo para rol CLIENTE y redirige /ejecutivo a inicio', async () => {
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva('CLIENTE'));
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(crearRespuestaJson({}, 404));
    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/ejecutivo']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <AppRoutes />
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Estado de Sesión Única Activa/i)).toBeInTheDocument();
    expect(screen.getByText(/Rol:\s*CLIENTE/i)).toBeInTheDocument();
    expect(screen.queryByText(/Panel Ejecutivo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Panel Operativo Ejecutivo/i)).not.toBeInTheDocument();
  });

  it('permite a EJECUTIVO buscar, editar y dar de baja clientes, consultar cuentas y auditar usuarios', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva('EJECUTIVO'));

    const busquedasClientes: Array<Record<string, unknown>> = [];
    const busquedasCuentas: Array<Record<string, unknown>> = [];
    const actualizaciones: Array<Record<string, unknown>> = [];
    const bajas: Array<Record<string, unknown>> = [];
    let clientesActivos = true;

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = String(input);
      const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

      if (url.endsWith('/clientes/busqueda')) {
        busquedasClientes.push(body);
        return crearRespuestaJson({
          success: true,
          data: {
            content: [clienteFixture(7, 'Mario', clientesActivos)],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
            first: true,
            last: true,
          },
        });
      }

      if (url.endsWith('/clientes/consulta')) {
        return crearRespuestaJson({
          success: true,
          data: clienteFixture(7, 'Mario', true),
        });
      }

      if (url.endsWith('/clientes/actualizar')) {
        actualizaciones.push(body);
        return crearRespuestaJson({
          success: true,
          data: clienteFixture(7, 'Mario Editado', true),
        });
      }

      if (url.endsWith('/clientes/baja')) {
        bajas.push(body);
        clientesActivos = false;
        return crearRespuestaJson({
          success: true,
          message: 'Baja aplicada',
          data: null,
        });
      }

      if (url.endsWith('/cuentas/busqueda')) {
        busquedasCuentas.push(body);
        return crearRespuestaJson({
          success: true,
          data: {
            content: [
              {
                id: 14,
                numeroCuenta: '9941467045485002',
                clienteId: 7,
                saldo: 2500.5,
                estatus: 'ACTIVA',
                fechaApertura: '2026-09-01T12:00:00Z',
              },
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
            first: true,
            last: true,
          },
        });
      }

      if (url.endsWith('/usuarios/consulta')) {
        return crearRespuestaJson({
          success: true,
          data: {
            id: 22,
            clienteId: 7,
            correo: 'mario.salazar@correo.com',
            activo: true,
            fechaCreacion: '2026-10-10T10:00:00Z',
            fechaActualizacion: '2026-10-12T10:00:00Z',
          },
        });
      }

      if (url.includes('/api/gestopago/transacciones/historial/exitosas')) {
        return crearRespuestaJson({
          success: true,
          data: [
            {
              exitoso: true,
              upc: '7509988776655',
              idTx: '998877',
              idServicio: 299,
              idProducto: 299,
              nombreProducto: 'Recarga $100 Auditoría',
              tipoOperacion: 'RECARGA',
              monto: 100,
              numeroCuenta: '9941467045485002',
              fechaRegistro: '2026-11-22T15:00:00Z',
              telefono: '5512345678',
            },
          ],
        });
      }

      return crearRespuestaJson({}, 404);
    });

    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <AppRoutes />
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Abrir Panel Ejecutivo/i)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Abrir Panel Ejecutivo/i }));

    expect(await screen.findByText(/Panel Operativo Ejecutivo/i)).toBeInTheDocument();
    expect(await screen.findByText(/Mario Salazar Vega/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Nombre o apellidos/i), 'Mario');
    await user.selectOptions(screen.getByLabelText(/^Estado$/i), 'ACTIVOS');
    await user.click(screen.getByRole('button', { name: /Buscar clientes/i }));

    await waitFor(() => expect(busquedasClientes.length).toBeGreaterThanOrEqual(2));
    const filtroEnviado = busquedasClientes[busquedasClientes.length - 1];
    expect(filtroEnviado).toEqual({
      nombre: 'Mario',
      activo: true,
      page: 0,
      size: 10,
    });
    expect(Object.prototype.hasOwnProperty.call(filtroEnviado, 'curp')).toBe(false);

    await user.click(screen.getByRole('button', { name: /^Editar$/i }));
    const primerNombreModal = await screen.findByLabelText(/Primer nombre \*/i);
    await user.clear(primerNombreModal);
    await user.type(primerNombreModal, 'Mario Editado');
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

    await waitFor(() => expect(actualizaciones).toHaveLength(1));
    expect(await screen.findByText(/^Mario Editado Salazar Vega$/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Dar de baja/i }));
    await user.type(screen.getByLabelText(/Escribe BAJA para confirmar/i), 'BAJA');
    await user.click(screen.getByRole('button', { name: /Aplicar Baja Lógica/i }));

    await waitFor(() => expect(bajas).toEqual([{ clienteId: 7 }]));

    await user.click(screen.getByRole('button', { name: /Cuentas Bancarias/i }));
    expect(await screen.findByText('9941467045485002')).toBeInTheDocument();
    expect(busquedasCuentas[0]).toEqual({
      soloActivas: true,
      page: 0,
      size: 10,
    });

    await user.click(screen.getByRole('button', { name: /^Auditar compras$/i }));
    expect(await screen.findByText('Recarga $100 Auditoría')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/ID de usuario \*/i), '22');
    await user.click(screen.getByRole('button', { name: /Consultar usuario/i }));
    expect(await screen.findByText(/Usuario #22/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Recarga \$100 Auditoría/i }));
    expect(await screen.findByText(/Detalle de Compra Exitosa/i)).toBeInTheDocument();
  }, 15000);
});
