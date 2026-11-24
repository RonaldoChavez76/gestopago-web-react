export type EstadoCompraResultado =
  | 'exitosa'
  | 'rechazada'
  | 'pendiente'
  | 'errorComunicacion';

export interface PurchaseTransactionResult {
  upc: string;
  tipoOperacion: string;
  idProducto?: number;
  idServicio?: number;
  nombreProducto?: string;
  exitoso: boolean;
  estadoRaw: string;
  estadoVisual: EstadoCompraResultado;
  codigo?: string;
  mensaje: string;
  motivoRechazo?: string;
  idTx?: string;
  numAutorizacion?: string;
  monto: number;
  comision?: string;
  fecha?: string;
  telefono?: string;
  referencia?: string;
  pin?: string;
  legend?: string;
  numeroCuenta?: string;
  nuevoSaldoCuenta?: number;
  fechaRegistro?: string;
  fechaMostrar: string;
  destinoMostrar: string;
}

export interface TransactionFallbacks {
  nombreProductoFallback?: string;
  idProductoFallback?: number;
  idServicioFallback?: number;
}

function toIntOrUndefined(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) return Math.trunc(value);
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function toStringOrUndefined(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value);
  return text.length > 0 ? text : undefined;
}

export function parsePurchaseTransactionResult(
  json: Record<string, unknown>,
  fallbacks?: TransactionFallbacks,
): PurchaseTransactionResult {
  const estadoStr = String(json.estado ?? '').toUpperCase();
  const exitosoFlag =
    typeof json.exitoso === 'boolean' ? json.exitoso : estadoStr === 'EXITOSA';
  const monto = toNumberOrUndefined(json.monto) ?? 0;

  let estadoVisual: EstadoCompraResultado;
  if (exitosoFlag || estadoStr === 'EXITOSA') {
    estadoVisual = 'exitosa';
  } else if (estadoStr === 'TIMEOUT' || estadoStr === 'PENDIENTE') {
    estadoVisual = 'pendiente';
  } else if (estadoStr === 'RECHAZADA' || estadoStr === 'DUPLICADA') {
    estadoVisual = 'rechazada';
  } else {
    estadoVisual = 'errorComunicacion';
  }

  const fecha = toStringOrUndefined(json.fecha);
  const fechaRegistro = toStringOrUndefined(json.fechaRegistro);
  const telefono = toStringOrUndefined(json.telefono);
  const referencia = toStringOrUndefined(json.referencia);

  let fechaMostrar: string;
  if (fecha && fecha.trim().length > 0) {
    fechaMostrar = fecha;
  } else if (fechaRegistro && fechaRegistro.trim().length > 0) {
    fechaMostrar = fechaRegistro.replace('T', ' ').split('.')[0];
  } else {
    fechaMostrar = new Date().toISOString().replace('T', ' ').split('.')[0];
  }

  const destinoMostrar =
    referencia && referencia.trim().length > 0 ? referencia : (telefono ?? '-');

  const motivoRechazo = toStringOrUndefined(json.motivoRechazo);

  return {
    upc: String(json.upc ?? 'SIN-UPC'),
    tipoOperacion: String(json.tipoOperacion ?? 'RECARGA'),
    idProducto: toIntOrUndefined(json.idProducto) ?? fallbacks?.idProductoFallback,
    idServicio: toIntOrUndefined(json.idServicio) ?? fallbacks?.idServicioFallback,
    nombreProducto:
      toStringOrUndefined(json.nombreProducto) ?? fallbacks?.nombreProductoFallback,
    exitoso: estadoVisual === 'exitosa',
    estadoRaw: estadoStr === '' ? 'DESCONOCIDO' : estadoStr,
    estadoVisual,
    codigo: toStringOrUndefined(json.codigo),
    mensaje: String(json.mensaje ?? 'Operación procesada'),
    motivoRechazo: estadoVisual === 'exitosa' ? undefined : (motivoRechazo ?? toStringOrUndefined(json.mensaje)),
    idTx: toStringOrUndefined(json.idTx),
    numAutorizacion: toStringOrUndefined(json.numAutorizacion),
    monto,
    comision: toStringOrUndefined(json.comisionFormateada ?? json.comision),
    fecha,
    telefono,
    referencia,
    pin: toStringOrUndefined(json.pin),
    legend: toStringOrUndefined(json.legend),
    numeroCuenta: toStringOrUndefined(json.numeroCuenta),
    nuevoSaldoCuenta: toNumberOrUndefined(json.nuevoSaldoCuenta ?? json.saldoCliente),
    fechaRegistro,
    fechaMostrar,
    destinoMostrar,
  };
}
