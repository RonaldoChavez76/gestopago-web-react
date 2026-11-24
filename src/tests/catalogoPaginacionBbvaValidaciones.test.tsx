import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BbvaClientCard } from '../components/BbvaClientCard';
import { ProductVisualBadge } from '../components/ProductVisualBadge';
import { SessionProvider } from '../context/SessionContext';
import { ApiClient } from '../core/network/apiClient';
import { SessionStorageService } from '../core/storage/sessionStorageService';
import type { UserSession } from '../models/auth';
import {
  crearFormularioRegistroInicial,
  validarDatosClienteBase,
  validarFormularioRegistro,
} from '../models/cliente';
import { parseCatalogProduct } from '../models/product';
import { AccountOverviewPage } from '../pages/AccountOverviewPage';
import { CatalogPage } from '../pages/CatalogPage';
import { PurchasePage } from '../pages/PurchasePage';
import { RegisterPage } from '../pages/RegisterPage';

function crearRespuestaJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function crearSesionActiva(): UserSession {
  return {
    accessToken: 'jwt-web-prueba',
    tokenType: 'Bearer',
    expiresIn: 900,
    plataforma: 'WEB',
    rol: 'CLIENTE',
    usuarioId: 10,
    clienteId: 1,
    nombreCliente: 'Ana María López García',
    correo: 'ana.lopez@correo.com',
    numeroCuenta: '4229215075268914',
    saldoCuenta: 4990,
  };
}

function crearCatalogoPaginadoMock(total: number) {
  return Array.from({ length: total }, (_, idx) => {
    const n = idx + 1;
    return {
      idProducto: 1000 + n,
      idServicio: n % 2 === 0 ? 133 : 76,
      producto: n <= 20 ? `Recarga Telcel Producto ${n}` : `Pago Servicio CFE ${n}`,
      servicio: n <= 20 ? 'Telcel' : 'CFE',
      precio: n <= 20 ? '50.00' : '0.00',
      tipoFront: n <= 20 ? '1' : '2',
      active: true,
      legend: `Descripción del producto ${n}`,
    };
  });
}

describe('Catálogo paginado, logos GestoPago, tarjeta BBVA y validaciones de formularios Web', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('pagina CatalogPage de 12 en 12, cambia tamano a 24 y reinicia a pagina 1 al filtrar', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      crearRespuestaJson({
        success: true,
        data: crearCatalogoPaginadoMock(30),
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

    expect(await screen.findByText('Recarga Telcel Producto 1')).toBeInTheDocument();
    expect(screen.getByText('Recarga Telcel Producto 12')).toBeInTheDocument();
    expect(screen.queryByText('Recarga Telcel Producto 13')).not.toBeInTheDocument();
    expect(screen.getByText('Mostrando 30 productos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Página siguiente/i }));
    expect(await screen.findByText('Recarga Telcel Producto 13')).toBeInTheDocument();
    expect(screen.queryByText('Recarga Telcel Producto 1')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/Productos por página/i), '24');
    expect(await screen.findByText('Recarga Telcel Producto 1')).toBeInTheDocument();
    expect(screen.getByText('Pago Servicio CFE 24')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Página siguiente/i }));
    expect(await screen.findByText('Pago Servicio CFE 25')).toBeInTheDocument();

    const searchInput = screen.getByRole('textbox', { name: /Buscar productos/i });
    await user.type(searchInput, 'CFE');
    expect(screen.getByText('Mostrando 10 productos')).toBeInTheDocument();
    expect(screen.getByText('Pago Servicio CFE 21')).toBeInTheDocument();
  });

  it('renderiza logo oficial de GestoPago por idServicio y usa icono fallback si falla la carga', () => {
    const producto = parseCatalogProduct({
      idProducto: 582,
      idServicio: 133,
      producto: 'Recarga Telcel $50',
      servicio: 'Telcel',
      precio: 50,
      tipoFront: '1',
      active: true,
    });

    expect(producto.logoUrl).toBe(
      'https://gestopago.portalventas.net/sistema/images/gestopago/servicios/133.png',
    );

    render(<ProductVisualBadge producto={producto} />);

    const img = screen.getByRole('img', { name: 'Logo de Telcel' });
    expect(img).toHaveAttribute(
      'src',
      'https://gestopago.portalventas.net/sistema/images/gestopago/servicios/133.png',
    );

    fireEvent.error(img);
    expect(screen.queryByRole('img', { name: 'Logo de Telcel' })).not.toBeInTheDocument();
  });

  it('muestra tarjeta BBVA en AccountOverviewPage con ocultar saldo/numero y copiar cuenta', async () => {
    const user = userEvent.setup();
    const storage = new SessionStorageService();
    storage.guardarSesion(crearSesionActiva());
    const apiClient = new ApiClient({
      sessionStorage: storage,
      fetchFn: vi.fn<typeof fetch>(),
    });

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <AccountOverviewPage />
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Ana María López García' })).toBeInTheDocument();
    expect(screen.getByText('4229 2150 7526 8914')).toBeInTheDocument();
    expect(screen.getByText('$4,990.00 MXN')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ocultar número de cuenta' }));
    expect(screen.getByText('•••• •••• •••• 8914')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ocultar saldo' }));
    expect(screen.getByText('$ •••••• MXN')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copiar número de cuenta' }));
    expect(writeTextMock).toHaveBeenCalledWith('4229215075268914');
    expect(screen.getByText('Copiado')).toBeInTheDocument();

    render(
      <BbvaClientCard
        nombreTitular="Cliente Fiscal"
        correo="fiscal@correo.com"
        plataforma="WEB"
        curp="CURPFISCAL12345678"
        rfc="RFCFISCAL1234"
      />,
    );
    expect(screen.getByText('CURP: CURPFISCAL12345678')).toBeInTheDocument();
    expect(screen.getByText('RFC: RFCFISCAL1234')).toBeInTheDocument();
  });

  it('aplica validaciones de longitud minima, solo letras, sin espacios y cuenta 16 digitos', async () => {
    const user = userEvent.setup();
    const form = crearFormularioRegistroInicial();
    form.primerNombre = 'Li';
    expect(validarDatosClienteBase(form)).toContain('3 y 50 caracteres');

    form.primerNombre = 'Ana';
    form.apellidoPaterno = 'Pérez';
    form.apellidoMaterno = 'López';
    form.fechaNacimiento = '1995-05-12';
    form.correo = 'ana@correo.com';
    form.telefonoMovil = '5555555555';
    expect(validarDatosClienteBase(form)).toContain('10 dígitos numéricos válidos');

    form.telefonoMovil = '5512345678';
    form.ocupacion = 'AB';
    expect(validarDatosClienteBase(form)).toContain('entre 3 y 80');

    form.ocupacion = 'Ingeniera';
    form.empresa = 'X';
    expect(validarDatosClienteBase(form)).toContain('entre 2 y 100');

    form.empresa = 'HP';
    form.ingresoMensual = '15000';
    form.domicilio.calle = 'Ab';
    expect(validarDatosClienteBase(form)).toContain('entre 3 y 100');

    form.domicilio.calle = 'Av. Reforma';
    form.domicilio.numeroExterior = '10-A';
    form.domicilio.colonia = 'Centro';
    form.domicilio.municipio = 'Monterrey';
    form.domicilio.estado = 'NL';
    form.domicilio.codigoPostal = '64000';
    form.curp = 'LOGA960512MDFRRL09';
    form.rfc = 'LOGA960512ABC';
    form.password = 'Clave 2026!';
    form.confirmarPassword = 'Clave 2026!';
    expect(validarFormularioRegistro(form)).toContain('entre 8 y 12 caracteres');

    form.password = 'ClaveSegura1!';
    form.confirmarPassword = 'ClaveSegura1!';
    expect(validarFormularioRegistro(form)).toContain('entre 8 y 12 caracteres');

    const storage = new SessionStorageService();
    const apiClient = new ApiClient({ sessionStorage: storage, fetchFn: vi.fn<typeof fetch>() });

    render(
      <MemoryRouter initialEntries={['/registro']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <RegisterPage />
        </SessionProvider>
      </MemoryRouter>,
    );

    const nombreInput = screen.getByLabelText(/Primer nombre/i);
    await user.type(nombreInput, 'Ana123! ');
    expect(nombreInput).toHaveValue('Ana ');

    const cpInput = screen.getByLabelText(/C\.P\./i);
    await user.type(cpInput, '06abc00099');
    expect(cpInput).toHaveValue('06000');

    storage.guardarSesion(crearSesionActiva());
    const prodServicio = parseCatalogProduct({
      idProducto: 701,
      idServicio: 76,
      producto: 'Pago Recibo CFE',
      servicio: 'CFE',
      precio: 0,
      tipoFront: '2',
      active: true,
    });
    render(
      <MemoryRouter initialEntries={['/comprar']}>
        <SessionProvider storageOverride={storage} apiClientOverride={apiClient} enableAutoSync={false}>
          <Routes>
            <Route path="/comprar" element={<PurchasePage productoOverride={prodServicio} />} />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );

    const cuentaInput = screen.getByLabelText(/Cuenta bancaria de cargo/i);
    await user.clear(cuentaInput);
    await user.type(cuentaInput, '42292150');
    await user.click(screen.getByRole('button', { name: /Continuar a Confirmación/i }));
    expect(
      await screen.findByText('La cuenta bancaria de cargo debe tener exactamente 16 dígitos numéricos.'),
    ).toBeInTheDocument();
  });
});
