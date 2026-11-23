export interface DomicilioPerfil {
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigoPostal: string;
  pais: string;
}

export interface ClientePerfil {
  id: number;
  primerNombre: string;
  segundoNombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  curp: string;
  rfc: string;
  sexo: string;
  nacionalidad: string;
  estadoCivil: string;
  correo: string;
  telefonoMovil: string;
  telefonoAlternativo: string;
  ocupacion: string;
  empresa: string;
  ingresoMensual: string;
  activo: boolean;
  domicilio: DomicilioPerfil;
}

export interface ActualizarClientePayload {
  primerNombre: string;
  segundoNombre: string | null;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  nacionalidad: string;
  estadoCivil: string;
  correo: string;
  telefonoMovil: string;
  telefonoAlternativo: string | null;
  ocupacion: string;
  empresa: string;
  ingresoMensual: number;
  domicilio: {
    calle: string;
    numeroExterior: string;
    numeroInterior: string | null;
    colonia: string;
    municipio: string;
    estado: string;
    codigoPostal: string;
    pais: string;
  };
}

function textoLimpio(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function parseClientePerfil(json: Record<string, unknown>): ClientePerfil {
  const domRaw = (json.domicilio as Record<string, unknown> | undefined) ?? {};
  const ingresoRaw = json.ingresoMensual;
  const ingresoStr =
    typeof ingresoRaw === 'number'
      ? ingresoRaw.toString()
      : textoLimpio(ingresoRaw, '0');

  return {
    id: Number(json.id ?? 0),
    primerNombre: textoLimpio(json.primerNombre),
    segundoNombre: textoLimpio(json.segundoNombre),
    apellidoPaterno: textoLimpio(json.apellidoPaterno),
    apellidoMaterno: textoLimpio(json.apellidoMaterno),
    fechaNacimiento: textoLimpio(json.fechaNacimiento),
    curp: textoLimpio(json.curp),
    rfc: textoLimpio(json.rfc),
    sexo: textoLimpio(json.sexo),
    nacionalidad: textoLimpio(json.nacionalidad, 'Mexicana'),
    estadoCivil: textoLimpio(json.estadoCivil),
    correo: textoLimpio(json.correo),
    telefonoMovil: textoLimpio(json.telefonoMovil),
    telefonoAlternativo: textoLimpio(json.telefonoAlternativo),
    ocupacion: textoLimpio(json.ocupacion),
    empresa: textoLimpio(json.empresa),
    ingresoMensual: ingresoStr,
    activo: typeof json.activo === 'boolean' ? json.activo : true,
    domicilio: {
      calle: textoLimpio(domRaw.calle),
      numeroExterior: textoLimpio(domRaw.numeroExterior),
      numeroInterior: textoLimpio(domRaw.numeroInterior),
      colonia: textoLimpio(domRaw.colonia),
      municipio: textoLimpio(domRaw.municipio),
      estado: textoLimpio(domRaw.estado),
      codigoPostal: textoLimpio(domRaw.codigoPostal),
      pais: textoLimpio(domRaw.pais, 'México'),
    },
  };
}

function opcionalONull(valor: string): string | null {
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : null;
}

export function toActualizarClientePayload(perfil: ClientePerfil): ActualizarClientePayload {
  const ingreso = Number.parseFloat(perfil.ingresoMensual.trim());
  return {
    primerNombre: perfil.primerNombre.trim(),
    segundoNombre: opcionalONull(perfil.segundoNombre),
    apellidoPaterno: perfil.apellidoPaterno.trim(),
    apellidoMaterno: perfil.apellidoMaterno.trim(),
    fechaNacimiento: perfil.fechaNacimiento.trim(),
    sexo: perfil.sexo.trim(),
    nacionalidad: perfil.nacionalidad.trim(),
    estadoCivil: perfil.estadoCivil.trim(),
    correo: perfil.correo.trim().toLowerCase(),
    telefonoMovil: perfil.telefonoMovil.trim(),
    telefonoAlternativo: opcionalONull(perfil.telefonoAlternativo),
    ocupacion: perfil.ocupacion.trim(),
    empresa: perfil.empresa.trim(),
    ingresoMensual: Number.isNaN(ingreso) ? 0 : ingreso,
    domicilio: {
      calle: perfil.domicilio.calle.trim(),
      numeroExterior: perfil.domicilio.numeroExterior.trim(),
      numeroInterior: opcionalONull(perfil.domicilio.numeroInterior),
      colonia: perfil.domicilio.colonia.trim(),
      municipio: perfil.domicilio.municipio.trim(),
      estado: perfil.domicilio.estado.trim(),
      codigoPostal: perfil.domicilio.codigoPostal.trim(),
      pais: perfil.domicilio.pais.trim(),
    },
  };
}

export function construirNombreCompleto(perfil: ClientePerfil): string {
  return [
    perfil.primerNombre,
    perfil.segundoNombre,
    perfil.apellidoPaterno,
    perfil.apellidoMaterno,
  ]
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join(' ');
}
