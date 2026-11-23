import { type ClientePerfil, parseClientePerfil } from './cliente';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ClienteResumenEjecutivo {
  perfil: ClientePerfil;
  fechaCreacion?: string;
}

export type EstadoActivoFiltro = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';

export interface FiltroBusquedaClientes {
  nombre: string;
  curp: string;
  rfc: string;
  correo: string;
  numeroCuenta: string;
  clienteId: string;
  estadoActivo: EstadoActivoFiltro;
  registradoDesde: string;
  registradoHasta: string;
  page: number;
  size: number;
}

export interface CuentaResumenEjecutivo {
  id: number;
  numeroCuenta: string;
  clienteId: number;
  saldo: number;
  estatus: string;
  fechaApertura?: string;
}

export interface FiltroBusquedaCuentas {
  numeroCuenta: string;
  clienteId: string;
  soloActivas: boolean;
  page: number;
  size: number;
}

export interface UsuarioResumenEjecutivo {
  id: number;
  clienteId?: number;
  correo: string;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

function toStringOptional(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

export function crearFiltrosClientesIniciales(): FiltroBusquedaClientes {
  return {
    nombre: '',
    curp: '',
    rfc: '',
    correo: '',
    numeroCuenta: '',
    clienteId: '',
    estadoActivo: 'TODOS',
    registradoDesde: '',
    registradoHasta: '',
    page: 0,
    size: 10,
  };
}

export function crearFiltrosCuentasIniciales(): FiltroBusquedaCuentas {
  return {
    numeroCuenta: '',
    clienteId: '',
    soloActivas: true,
    page: 0,
    size: 10,
  };
}

export function validarFiltrosClientes(filtros: FiltroBusquedaClientes): string | null {
  if (
    filtros.clienteId.trim().length > 0 &&
    (!/^[0-9]+$/.test(filtros.clienteId.trim()) || Number(filtros.clienteId.trim()) <= 0)
  ) {
    return 'El ID de cliente debe ser un número entero positivo.';
  }
  if (
    filtros.registradoDesde.trim().length > 0 &&
    filtros.registradoHasta.trim().length > 0 &&
    filtros.registradoDesde.trim() > filtros.registradoHasta.trim()
  ) {
    return 'La fecha inicial de registro no puede ser posterior a la fecha final.';
  }
  return null;
}

export function toBuscarClientesPayload(filtros: FiltroBusquedaClientes): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    page: filtros.page,
    size: filtros.size,
  };

  const asignarTexto = (clave: string, valor: string, transformar?: (v: string) => string) => {
    const limpio = valor.trim();
    if (limpio.length > 0) {
      payload[clave] = transformar ? transformar(limpio) : limpio;
    }
  };

  asignarTexto('nombre', filtros.nombre);
  asignarTexto('curp', filtros.curp, (v) => v.toUpperCase());
  asignarTexto('rfc', filtros.rfc, (v) => v.toUpperCase());
  asignarTexto('correo', filtros.correo, (v) => v.toLowerCase());
  asignarTexto('numeroCuenta', filtros.numeroCuenta);

  const idTexto = filtros.clienteId.trim();
  if (idTexto.length > 0) {
    const parsedId = Number.parseInt(idTexto, 10);
    if (!Number.isNaN(parsedId) && parsedId > 0) {
      payload.clienteId = parsedId;
    }
  }

  if (filtros.estadoActivo === 'ACTIVOS') {
    payload.activo = true;
  } else if (filtros.estadoActivo === 'INACTIVOS') {
    payload.activo = false;
  }

  asignarTexto('registradoDesde', filtros.registradoDesde);
  asignarTexto('registradoHasta', filtros.registradoHasta);

  return payload;
}

export function toBuscarCuentasPayload(filtros: FiltroBusquedaCuentas): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    soloActivas: filtros.soloActivas,
    page: filtros.page,
    size: filtros.size,
  };

  const cuentaLimpia = filtros.numeroCuenta.trim();
  if (cuentaLimpia.length > 0) {
    payload.numeroCuenta = cuentaLimpia;
  }

  const idTexto = filtros.clienteId.trim();
  if (idTexto.length > 0) {
    const parsedId = Number.parseInt(idTexto, 10);
    if (!Number.isNaN(parsedId) && parsedId > 0) {
      payload.clienteId = parsedId;
    }
  }

  return payload;
}

export function parseClienteResumenEjecutivo(
  json: Record<string, unknown>,
): ClienteResumenEjecutivo {
  return {
    perfil: parseClientePerfil(json),
    fechaCreacion: toStringOptional(json.fechaCreacion),
  };
}

export function parseCuentaResumenEjecutivo(json: Record<string, unknown>): CuentaResumenEjecutivo {
  return {
    id: toNumberValue(json.id, 0),
    numeroCuenta: String(json.numeroCuenta ?? ''),
    clienteId: toNumberValue(json.clienteId, 0),
    saldo: toNumberValue(json.saldo, 0),
    estatus: String(json.estatus ?? 'ACTIVA'),
    fechaApertura: toStringOptional(json.fechaApertura),
  };
}

export function parseUsuarioResumenEjecutivo(json: Record<string, unknown>): UsuarioResumenEjecutivo {
  const clienteId = toNumberValue(json.clienteId, -1);
  return {
    id: toNumberValue(json.id, 0),
    clienteId: clienteId > 0 ? clienteId : undefined,
    correo: String(json.correo ?? ''),
    activo: typeof json.activo === 'boolean' ? json.activo : true,
    fechaCreacion: toStringOptional(json.fechaCreacion),
    fechaActualizacion: toStringOptional(json.fechaActualizacion),
  };
}

export function parsePageResponse<T>(
  raw: Record<string, unknown> | undefined,
  mapper: (item: Record<string, unknown>) => T,
): PageResponse<T> {
  const contentRaw = Array.isArray(raw?.content) ? raw.content : [];
  const content = contentRaw
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
    )
    .map(mapper);

  const page = toNumberValue(raw?.page, 0);
  const size = toNumberValue(raw?.size, 10);
  const totalElements = toNumberValue(raw?.totalElements, content.length);
  const totalPages = Math.max(1, toNumberValue(raw?.totalPages, 1));

  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    first: typeof raw?.first === 'boolean' ? raw.first : page <= 0,
    last: typeof raw?.last === 'boolean' ? raw.last : page + 1 >= totalPages,
  };
}
