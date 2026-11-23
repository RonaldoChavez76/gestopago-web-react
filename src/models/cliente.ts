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

export interface DatosClienteBase {
  primerNombre: string;
  segundoNombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  nacionalidad: string;
  estadoCivil: string;
  correo: string;
  telefonoMovil: string;
  telefonoAlternativo: string;
  ocupacion: string;
  empresa: string;
  ingresoMensual: string;
  domicilio: DomicilioPerfil;
}

export interface ClientePerfil extends DatosClienteBase {
  id: number;
  curp: string;
  rfc: string;
  activo: boolean;
}

export interface RegistroClienteForm extends DatosClienteBase {
  curp: string;
  rfc: string;
  password: string;
  confirmarPassword: string;
}

export interface RegistroClienteResultado {
  clienteId: number;
  usuarioId: number;
  cuentaId: number;
  numeroCuenta: string;
  correo: string;
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

export interface RegistroClientePayload extends ActualizarClientePayload {
  curp: string;
  rfc: string;
  password: string;
}

export const REGEX_PASSWORD_SEGURA =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const REGEX_CURP =
  /^[A-Z][AEIOUX][A-Z]{2}[0-9]{6}[HM][A-Z]{5}[A-Z0-9][0-9]$/i;
export const REGEX_RFC = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;

function textoLimpio(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function opcionalONull(valor: string): string | null {
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : null;
}

export function crearFormularioRegistroInicial(): RegistroClienteForm {
  return {
    primerNombre: '',
    segundoNombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    curp: '',
    rfc: '',
    sexo: 'MASCULINO',
    nacionalidad: 'Mexicana',
    estadoCivil: 'Soltero',
    correo: '',
    telefonoMovil: '',
    telefonoAlternativo: '',
    ocupacion: '',
    empresa: '',
    ingresoMensual: '',
    domicilio: {
      calle: '',
      numeroExterior: '',
      numeroInterior: '',
      colonia: '',
      municipio: '',
      estado: '',
      codigoPostal: '',
      pais: 'México',
    },
    password: '',
    confirmarPassword: '',
  };
}

export function esMayorDeEdad(fechaIso: string): boolean {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(fechaIso.trim())) {
    return false;
  }
  const [anioStr, mesStr, diaStr] = fechaIso.trim().split('-');
  const anio = Number.parseInt(anioStr, 10);
  const mes = Number.parseInt(mesStr, 10);
  const dia = Number.parseInt(diaStr, 10);
  const hoy = new Date();
  const limite = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
  const nacimiento = new Date(anio, mes - 1, dia);
  return nacimiento <= limite;
}

export function validarDatosClienteBase(datos: DatosClienteBase): string | null {
  if (datos.primerNombre.trim().length < 2) {
    return 'El primer nombre debe tener al menos 2 caracteres.';
  }
  if (
    datos.segundoNombre.trim().length > 0 &&
    datos.segundoNombre.trim().length < 2
  ) {
    return 'El segundo nombre debe tener al menos 2 caracteres si decides llenarlo.';
  }
  if (datos.apellidoPaterno.trim().length < 2) {
    return 'El apellido paterno debe tener al menos 2 caracteres.';
  }
  if (datos.apellidoMaterno.trim().length < 2) {
    return 'El apellido materno debe tener al menos 2 caracteres.';
  }
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(datos.fechaNacimiento.trim())) {
    return 'La fecha de nacimiento debe tener el formato AAAA-MM-DD.';
  }
  if (!esMayorDeEdad(datos.fechaNacimiento)) {
    return 'Debes ser mayor de 18 años para operar en GestoPago.';
  }
  if (!REGEX_EMAIL.test(datos.correo.trim())) {
    return 'Ingresa un correo electrónico válido.';
  }
  if (!/^[0-9]{10}$/.test(datos.telefonoMovil.trim())) {
    return 'El teléfono móvil debe tener exactamente 10 dígitos numéricos.';
  }
  if (
    datos.telefonoAlternativo.trim().length > 0 &&
    !/^[0-9]{10}$/.test(datos.telefonoAlternativo.trim())
  ) {
    return 'El teléfono alternativo debe tener 10 dígitos o permanecer vacío.';
  }
  if (datos.ocupacion.trim().length === 0 || datos.empresa.trim().length === 0) {
    return 'Ocupación y empresa son obligatorios.';
  }
  const ingreso = Number.parseFloat(datos.ingresoMensual.trim());
  if (Number.isNaN(ingreso) || ingreso <= 0) {
    return 'El ingreso mensual debe ser mayor a $0.00.';
  }
  const d = datos.domicilio;
  if (
    d.calle.trim().length === 0 ||
    d.numeroExterior.trim().length === 0 ||
    d.colonia.trim().length === 0 ||
    d.municipio.trim().length === 0 ||
    d.estado.trim().length === 0 ||
    d.pais.trim().length === 0
  ) {
    return 'Completa todos los campos obligatorios del domicilio.';
  }
  if (!/^[0-9]{5}$/.test(d.codigoPostal.trim())) {
    return 'El código postal debe tener exactamente 5 dígitos.';
  }
  return null;
}

export function validarFormularioRegistro(form: RegistroClienteForm): string | null {
  const errBase = validarDatosClienteBase(form);
  if (errBase) return errBase;
  if (!REGEX_CURP.test(form.curp.trim())) {
    return 'La CURP debe tener los 18 caracteres del formato oficial mexicano.';
  }
  if (!REGEX_RFC.test(form.rfc.trim())) {
    return 'El RFC debe tener 12 o 13 caracteres válidos (con homoclave).';
  }
  if (!REGEX_PASSWORD_SEGURA.test(form.password)) {
    return 'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.';
  }
  if (form.password !== form.confirmarPassword) {
    return 'La confirmación no coincide con la contraseña ingresada.';
  }
  return null;
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

export function toActualizarClientePayload(datos: DatosClienteBase): ActualizarClientePayload {
  const ingreso = Number.parseFloat(datos.ingresoMensual.trim());
  return {
    primerNombre: datos.primerNombre.trim(),
    segundoNombre: opcionalONull(datos.segundoNombre),
    apellidoPaterno: datos.apellidoPaterno.trim(),
    apellidoMaterno: datos.apellidoMaterno.trim(),
    fechaNacimiento: datos.fechaNacimiento.trim(),
    sexo: datos.sexo.trim(),
    nacionalidad: datos.nacionalidad.trim(),
    estadoCivil: datos.estadoCivil.trim(),
    correo: datos.correo.trim().toLowerCase(),
    telefonoMovil: datos.telefonoMovil.trim(),
    telefonoAlternativo: opcionalONull(datos.telefonoAlternativo),
    ocupacion: datos.ocupacion.trim(),
    empresa: datos.empresa.trim(),
    ingresoMensual: Number.isNaN(ingreso) ? 0 : ingreso,
    domicilio: {
      calle: datos.domicilio.calle.trim(),
      numeroExterior: datos.domicilio.numeroExterior.trim(),
      numeroInterior: opcionalONull(datos.domicilio.numeroInterior),
      colonia: datos.domicilio.colonia.trim(),
      municipio: datos.domicilio.municipio.trim(),
      estado: datos.domicilio.estado.trim(),
      codigoPostal: datos.domicilio.codigoPostal.trim(),
      pais: datos.domicilio.pais.trim(),
    },
  };
}

export function toRegistroClientePayload(form: RegistroClienteForm): RegistroClientePayload {
  return {
    ...toActualizarClientePayload(form),
    curp: form.curp.trim().toUpperCase(),
    rfc: form.rfc.trim().toUpperCase(),
    password: form.password,
  };
}

export function parseRegistroClienteResultado(
  json: Record<string, unknown>,
): RegistroClienteResultado {
  return {
    clienteId: Number(json.clienteId ?? 0),
    usuarioId: Number(json.usuarioId ?? 0),
    cuentaId: Number(json.cuentaId ?? 0),
    numeroCuenta: textoLimpio(json.numeroCuenta),
    correo: textoLimpio(json.correo),
  };
}

export function construirNombreCompleto(perfil: DatosClienteBase): string {
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
