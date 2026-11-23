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

function crearSesion(rol: 'CLIENTE' | 'EJECUTIVO', cuentaActiva: boolean): UserSession {
  return {
    accessToken: 'jwt-reactivacion',
    tokenType: 'Bearer',
    expiresIn: 900,
    expiresAt: new Date(Date.now() + 900_000).toISOString(),
    sessionId: 'sid-r',
    plataforma: 'WEB',
    rol,
    cuentaActiva,
    usuarioId: 10,
    clienteId: 3,
    nombreCliente: 'Ana Prueba',
    correo: 'ana.prueba@example.com',
    numeroCuenta: '9941467045485002',
    saldoCuenta: 3680,
  };
}

function clienteInactivoFixture(activo: boolean) {
  return {
    id: 7,
    primerNombre: 'Mario',
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

describe('Modo Cuenta Inactiva y Reactivación en Web', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('bloquea movimientos y permite al usuario reactivar su propia cuenta inactiva', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesion('CLIENTE', false));

    let cuentaActivaEnServidor = false;
    const reactivaciones: Array<Record<string, unknown>> = [];

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/clientes/reactivar') && init?.method === 'PUT') {
        reactivaciones.push(JSON.parse(String(init.body ?? '{}')) as Record<string, unknown>);
        cuentaActivaEnServidor = true;
        return crearRespuestaJson({
          success: true,
          message: 'Cliente reactivado correctamente.',
          data: null,
        });
      }
      if (url.endsWith('/auth/sesion')) {
        return crearRespuestaJson({
          success: true,
          data: {
            activa: true,
            usuarioId: 10,
            clienteId: 3,
            nombreCliente: 'Ana Prueba',
            correo: 'ana.prueba@example.com',
            numeroCuenta: '9941467045485002',
            saldoCuenta: 3680,
            rol: 'CLIENTE',
            cuentaActiva: cuentaActivaEnServidor,
          },
        });
      }
      return crearRespuestaJson({}, 404);
    });

    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/comprar']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <AppRoutes />
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Tu cuenta está dada de baja temporalmente/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Catálogo/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Realizar Compra GestoPago/i)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/Escribe ACTIVAR para reactivar tu cuenta/i), 'ACTIVAR');
    await user.click(screen.getByRole('button', { name: /Reactivar mi cuenta/i }));

    await waitFor(() => expect(reactivaciones).toEqual([{ clienteId: 3 }]));
    expect(await screen.findByText(/Estado de Sesión Única Activa/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Catálogo/i }).length).toBeGreaterThan(0);
  }, 15000);

  it('impide editar clientes inactivos al EJECUTIVO y permite reactivarlos desde Panel Ejecutivo', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesion('EJECUTIVO', true));

    let clienteActivo = false;
    const reactivaciones: Array<Record<string, unknown>> = [];

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = String(input);
      const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

      if (url.endsWith('/clientes/busqueda')) {
        return crearRespuestaJson({
          success: true,
          data: {
            content: [clienteInactivoFixture(clienteActivo)],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
            first: true,
            last: true,
          },
        });
      }
      if (url.endsWith('/clientes/reactivar') && init?.method === 'PUT') {
        reactivaciones.push(body);
        clienteActivo = true;
        return crearRespuestaJson({
          success: true,
          message: 'Cliente reactivado correctamente.',
          data: null,
        });
      }
      return crearRespuestaJson({}, 404);
    });

    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/ejecutivo']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <AppRoutes />
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Mario Salazar Vega/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Editar$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Dar de baja/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Reactivar$/i }));
    expect(await screen.findByText(/Confirmar Reactivación de Cliente/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Reactivar Cliente/i }));

    await waitFor(() => expect(reactivaciones).toEqual([{ clienteId: 7 }]));
    expect(await screen.findByRole('button', { name: /^Editar$/i })).toBeInTheDocument();
  }, 15000);
});
