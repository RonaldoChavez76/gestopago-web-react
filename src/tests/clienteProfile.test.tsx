import { render, screen, within } from '@testing-library/react';
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

function crearSesionActiva(): UserSession {
  return {
    accessToken: 'jwt-web-perfil',
    tokenType: 'Bearer',
    expiresIn: 900,
    plataforma: 'WEB',
    usuarioId: 15,
    clienteId: 7,
    correo: 'ana.lopez@correo.com',
    nombreCliente: 'Ana María López García',
    numeroCuenta: '4229215075268914',
    saldoCuenta: 3990,
  };
}

const CLIENTE_MOCK = {
  id: 7,
  primerNombre: 'Ana',
  segundoNombre: 'María',
  apellidoPaterno: 'López',
  apellidoMaterno: 'García',
  fechaNacimiento: '1996-05-12',
  curp: 'LOGA960512MDFRRL09',
  rfc: 'LOGA960512ABC',
  sexo: 'FEMENINO',
  nacionalidad: 'Mexicana',
  estadoCivil: 'Soltera',
  correo: 'ana.lopez@correo.com',
  telefonoMovil: '5511223344',
  telefonoAlternativo: '',
  ocupacion: 'Ingeniera',
  empresa: 'Tech MX',
  ingresoMensual: 25000.0,
  activo: true,
  domicilio: {
    calle: 'Av. Reforma',
    numeroExterior: '100',
    numeroInterior: '4B',
    colonia: 'Centro',
    municipio: 'Cuauhtémoc',
    estado: 'Ciudad de México',
    codigoPostal: '06000',
    pais: 'México',
  },
};

describe('Módulo Perfil del Cliente: Consulta, Edición, Contraseña y Baja Lógica', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('consulta perfil, actualiza datos y cambia contrasena correctamente', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());

    let putActualizarBody: Record<string, unknown> | null = null;
    let putPasswordBody: Record<string, unknown> | null = null;

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/clientes/consulta')) {
        return crearRespuestaJson({ success: true, data: CLIENTE_MOCK });
      }
      if (url.endsWith('/clientes/actualizar')) {
        putActualizarBody = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
        return crearRespuestaJson({
          success: true,
          data: {
            ...CLIENTE_MOCK,
            primerNombre: 'Ana Sofia',
            correo: 'ana.nueva@correo.com',
          },
        });
      }
      if (url.endsWith('/usuarios/password')) {
        putPasswordBody = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
        return crearRespuestaJson({
          success: true,
          message: 'Contraseña actualizada correctamente.',
          data: null,
        });
      }
      return crearRespuestaJson({}, 404);
    });

    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/perfil']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <AppRoutes />
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Mi Perfil y Administración de Cuenta'),
    ).toBeInTheDocument();
    expect(screen.getByText('CURP: LOGA960512MDFRRL09')).toBeInTheDocument();

    const nombreInput = screen.getByLabelText(/Primer nombre/i);
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Ana Sofia');

    const correoInput = screen.getByLabelText(/Correo electrónico/i);
    await user.clear(correoInput);
    await user.type(correoInput, 'ana.nueva@correo.com');

    await user.click(screen.getByRole('button', { name: /Guardar Cambios de Perfil/i }));

    expect(
      await screen.findByText('Los datos de tu cuenta y domicilio fueron actualizados correctamente.'),
    ).toBeInTheDocument();
    expect(putActualizarBody).not.toBeNull();
    expect(putActualizarBody!['clienteId']).toBe(7);
    expect(storage.obtenerSesion()?.correo).toBe('ana.nueva@correo.com');

    await user.type(screen.getByLabelText(/Contraseña actual/i), 'Prueba2026!');
    await user.type(screen.getByLabelText(/^Nueva contraseña \*/i), 'NuevaPas26$');
    await user.type(screen.getByLabelText(/Confirmar nueva contraseña/i), 'NuevaPas26$');
    await user.click(screen.getByRole('button', { name: /Actualizar Contraseña/i }));

    expect(await screen.findByText('Contraseña actualizada correctamente.')).toBeInTheDocument();
    expect(putPasswordBody).not.toBeNull();
    expect(putPasswordBody!['usuarioId']).toBe(15);
  });

  it('ejecuta baja logica tras confirmacion textual BAJA, limpia sesion y redirige a login', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());

    const deleteCalls: Array<Record<string, unknown>> = [];

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/clientes/consulta')) {
        return crearRespuestaJson({ success: true, data: CLIENTE_MOCK });
      }
      if (url.endsWith('/clientes/baja')) {
        deleteCalls.push(JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>);
        return crearRespuestaJson({
          success: true,
          message: 'Cliente dado de baja lógicamente.',
          data: null,
        });
      }
      return crearRespuestaJson({}, 404);
    });

    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: fetchMock });

    render(
      <MemoryRouter initialEntries={['/perfil']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <AppRoutes />
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Mi Perfil y Administración de Cuenta'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Dar de baja mi cuenta/i }));

    const dialog = await screen.findByRole('dialog');
    const confirmarBtn = within(dialog).getByRole('button', {
      name: /Confirmar baja definitiva/i,
    });
    expect(confirmarBtn).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/Escribe BAJA para confirmar/i), 'BAJA');
    expect(confirmarBtn).toBeEnabled();
    await user.click(confirmarBtn);

    expect(await screen.findByText('Bienvenido a GestoPago')).toBeInTheDocument();
    expect(
      screen.getByText('Tu cuenta fue dada de baja correctamente y tu sesión ha sido cerrada.'),
    ).toBeInTheDocument();
    expect(deleteCalls).toEqual([{ clienteId: 7 }]);
    expect(storage.obtenerSesion()).toBeNull();
  });
});
