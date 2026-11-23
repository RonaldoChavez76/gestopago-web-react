import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { SessionProvider } from '../context/SessionContext';
import { ApiClient } from '../core/network/apiClient';
import { SessionStorageService } from '../core/storage/sessionStorageService';

function crearRespuestaJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Módulo de Registro de Nuevos Clientes en Web', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('navega desde Login hacia /registro, valida campos y registra cliente en POST /clientes', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    let payloadEnviado: Record<string, unknown> | null = null;

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/clientes') && init?.method === 'POST') {
        payloadEnviado = JSON.parse(String(init.body ?? '{}')) as Record<string, unknown>;
        return crearRespuestaJson(
          {
            success: true,
            message: 'Cliente registrado correctamente.',
            data: {
              clienteId: 25,
              usuarioId: 30,
              cuentaId: 40,
              numeroCuenta: '9941467045485999',
              correo: 'nuevo.cliente@correo.com',
            },
          },
          201,
        );
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

    expect(
      screen.queryByRole('button', { name: /Cargar credenciales de prueba/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /¿No tienes cuenta\? Regístrate aquí/i }));
    expect(await screen.findByText('Crear Cuenta en GestoPago')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Primer nombre/i), 'Carlos');
    await user.type(screen.getByLabelText(/Apellido paterno/i), 'Ramírez');
    await user.type(screen.getByLabelText(/Apellido materno/i), 'Soto');
    await user.type(screen.getByLabelText(/CURP/i), 'RASO000115HDFRRL01');
    await user.type(screen.getByLabelText(/RFC/i), 'RASO000115AB1');
    await user.type(screen.getByLabelText(/Fecha nacimiento/i), '2000-01-15');
    await user.type(screen.getByLabelText(/Correo electrónico/i), 'nuevo.cliente@correo.com');
    await user.type(screen.getByLabelText(/Teléfono móvil/i), '5512345678');
    await user.type(screen.getByLabelText(/Ocupación/i), 'Ingeniero');
    await user.type(screen.getByLabelText(/Empresa/i), 'Tech MX');
    await user.type(screen.getByLabelText(/Ingreso mensual/i), '20000');

    await user.type(screen.getByLabelText(/Calle/i), 'Av. Reforma');
    await user.type(screen.getByLabelText(/Número exterior/i), '120');
    await user.type(screen.getByLabelText(/Colonia/i), 'Centro');
    await user.type(screen.getByLabelText(/Municipio/i), 'Cuauhtémoc');
    await user.type(screen.getByLabelText(/Estado \*/i), 'CDMX');
    await user.type(screen.getByLabelText(/C\.P\./i), '06000');

    await user.type(screen.getByLabelText(/^Contraseña \*/i), 'Segura2026!');
    await user.type(screen.getByLabelText(/Confirmar contraseña/i), 'Segura2026!');

    await user.click(screen.getByRole('button', { name: /Registrar Cuenta/i }));

    expect(await screen.findByText('¡Cuenta Registrada!')).toBeInTheDocument();
    expect(screen.getByText('9941467045485999')).toBeInTheDocument();
    expect(payloadEnviado).not.toBeNull();
    expect(payloadEnviado!['curp']).toBe('RASO000115HDFRRL01');
    expect(payloadEnviado!['correo']).toBe('nuevo.cliente@correo.com');

    await user.click(screen.getByRole('button', { name: /Ir a Iniciar Sesión/i }));

    expect(await screen.findByText('Bienvenido a GestoPago')).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo electrónico/i)).toHaveValue('nuevo.cliente@correo.com');
    expect(screen.getByText(/Cuenta registrada \(9941467045485999\)/i)).toBeInTheDocument();
  }, 15000);
});
