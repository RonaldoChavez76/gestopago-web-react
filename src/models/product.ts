export type ProductCategory =
  | 'Recargas Telefónicas'
  | 'Pago de Servicios'
  | 'Entretenimiento y Pines';

export interface CatalogProduct {
  idProducto: number;
  idServicio: number;
  nombre: string;
  servicio: string;
  categoria: ProductCategory;
  tipoFront: string;
  precio: number;
  disponible: boolean;
  descripcion: string;
  tipoReferencia?: string;
  esRecarga: boolean;
}

function inferirMarcaServicio(nombre: string): string {
  const upper = nombre.toUpperCase();
  if (upper.includes('TELCEL') || upper.includes('AMIGO')) return 'Telcel';
  if (upper.includes('MOVISTAR')) return 'Movistar';
  if (upper.includes('AT&T') || upper.includes('ATT') || upper.includes('UNEFON')) {
    return 'AT&T / Unefon';
  }
  if (upper.includes('BAIT')) return 'Bait';
  if (upper.includes('CFE') || upper.includes('LUZ')) return 'CFE Electricidad';
  if (upper.includes('TELMEX') || upper.includes('INFINITUM')) return 'Telmex';
  if (upper.includes('TOTALPLAY')) return 'Totalplay';
  if (upper.includes('IZZI')) return 'izzi';
  if (upper.includes('SKY') || upper.includes('VETV')) return 'Sky';
  if (
    upper.includes('NETFLIX') ||
    upper.includes('SPOTIFY') ||
    upper.includes('XBOX') ||
    upper.includes('PLAYSTATION') ||
    upper.includes('STEAM') ||
    upper.includes('NINTENDO') ||
    upper.includes('GOOGLE') ||
    upper.includes('AMAZON')
  ) {
    return 'Pines Digitales';
  }
  return 'GestoPago';
}

function inferirIdServicio(nombre: string, servicio: string, idProducto: number): number {
  const upper = `${nombre} ${servicio}`.toUpperCase();
  if (upper.includes('TELCEL')) return 133;
  if (upper.includes('MOVISTAR')) return 134;
  if (upper.includes('AT&T') || upper.includes('ATT')) return 135;
  if (upper.includes('CFE')) return 76;
  if (upper.includes('TELMEX')) return 77;
  return idProducto > 0 ? idProducto : 133;
}

function clasificarCategoria(
  nombre: string,
  servicio: string,
  tipoFront?: string,
): ProductCategory {
  const upper = `${nombre} ${servicio}`.toUpperCase();
  if (
    upper.includes('NETFLIX') ||
    upper.includes('SPOTIFY') ||
    upper.includes('XBOX') ||
    upper.includes('PLAYSTATION') ||
    upper.includes('STEAM') ||
    upper.includes('PIN') ||
    upper.includes('CINEPOLIS') ||
    upper.includes('AMAZON') ||
    upper.includes('GOOGLE')
  ) {
    return 'Entretenimiento y Pines';
  }
  if (
    tipoFront === '1' ||
    upper.includes('RECARGA') ||
    upper.includes('TIEMPO AIRE') ||
    upper.includes('PAQUETE') ||
    upper.includes('AMIGO') ||
    upper.includes('TELCEL') ||
    upper.includes('MOVISTAR') ||
    upper.includes('AT&T') ||
    upper.includes('UNEFON') ||
    upper.includes('BAIT') ||
    upper.includes('VIRGIN')
  ) {
    return 'Recargas Telefónicas';
  }
  return 'Pago de Servicios';
}

function construirDescripcion(
  nombre: string,
  servicio: string,
  categoria: ProductCategory,
  precio: number,
): string {
  const montoStr =
    precio > 0 ? ` por $${precio.toFixed(2)} MXN` : ' con monto abierto o de recibo';
  if (categoria === 'Recargas Telefónicas') {
    return `Acreditación inmediata de tiempo aire / datos móviles para ${servicio} (${nombre})${montoStr} a número celular de 10 dígitos.`;
  }
  if (categoria === 'Entretenimiento y Pines') {
    return `Adquisición de código o PIN electrónico para ${nombre} (${servicio})${montoStr} con entrega inmediata en tu comprobante.`;
  }
  return `Pago electrónico de recibo o referencia para el servicio ${servicio} (${nombre})${montoStr} procesado en línea vía GestoPago.`;
}

export function parseCatalogProduct(json: Record<string, unknown>): CatalogProduct {
  const rawIdProd = json.idProducto ?? json.productId ?? json.id ?? '0';
  const idProducto = Number.parseInt(String(rawIdProd), 10) || 0;

  const nombre = String(json.producto ?? json.name ?? `Producto #${idProducto}`).trim();
  const servicio = String(json.servicio ?? inferirMarcaServicio(nombre)).trim();

  const rawIdServ = json.idServicio;
  const parsedIdServ =
    rawIdServ !== undefined && rawIdServ !== null
      ? Number.parseInt(String(rawIdServ), 10)
      : Number.NaN;
  const idServicio = Number.isNaN(parsedIdServ)
    ? inferirIdServicio(nombre, servicio, idProducto)
    : parsedIdServ;

  const precioRaw = json.precio ?? json.price ?? 0;
  const precio =
    typeof precioRaw === 'number'
      ? precioRaw
      : Number.parseFloat(String(precioRaw)) || 0;

  const tipoFrontRaw =
    json.tipoFront !== undefined && json.tipoFront !== null
      ? String(json.tipoFront)
      : undefined;
  const categoria = clasificarCategoria(nombre, servicio, tipoFrontRaw);
  const tipoFront = tipoFrontRaw ?? (categoria === 'Recargas Telefónicas' ? '1' : '2');

  const disponible =
    typeof json.disponible === 'boolean'
      ? json.disponible
      : typeof json.active === 'boolean'
        ? json.active
        : true;

  const legendRaw = json.legend ?? json.leyenda;
  const legend = legendRaw !== undefined && legendRaw !== null ? String(legendRaw).trim() : '';
  const descripcion =
    legend.length > 0 ? legend : construirDescripcion(nombre, servicio, categoria, precio);

  const esRecarga = tipoFront === '1' || categoria === 'Recargas Telefónicas';

  return {
    idProducto,
    idServicio,
    nombre,
    servicio,
    categoria,
    tipoFront,
    precio,
    disponible,
    descripcion,
    tipoReferencia:
      json.tipoReferencia !== undefined && json.tipoReferencia !== null
        ? String(json.tipoReferencia)
        : undefined,
    esRecarga,
  };
}
