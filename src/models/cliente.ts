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
  /^(?!.*\s)(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,72}$/;
export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
export const REGEX_CURP =
  /^[A-Z][AEIOUX][A-Z]{2}[0-9]{6}[HM][A-Z]{5}[A-Z0-9][0-9]$/i;
export const REGEX_RFC = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;
export const REGEX_SOLO_LETRAS =
  /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/;
export const REGEX_OCUPACION =
  /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü.\-/]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñÜü.\-/]+)*$/;
export const REGEX_EMPRESA =
  /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9.,&\-/]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9.,&\-/]+)*$/;
export const REGEX_CALLE =
  /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9.,#\-/]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9.,#\-/]+)*$/;
export const REGEX_COLONIA =
  /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9.\-]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9.\-]+)*$/;
export const REGEX_LUGAR =
  /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü.\-]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñÜü.\-]+)*$/;
export const REGEX_NUMERO_DOMICILIO = /^[A-Za-z0-9\-/]+$/;
export const REGEX_REFERENCIA_SERVICIO = /^[A-Za-z0-9\-]{4,40}$/;
export const REGEX_CUENTA_16 = /^[0-9]{16}$/;
export const REGEX_DIGITOS_REPETIDOS_10 = /^(\d)\1{9}$/;

export function sanitizarSoloLetras(valor: string, maxLength = 50): string {
  return valor
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü ]/g, '')
    .replace(/^\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength);
}

export function sanitizarSinEspacios(valor: string, maxLength = 100): string {
  return valor.replace(/\s+/g, '').slice(0, maxLength);
}

export function sanitizarSoloDigitos(valor: string, maxLength = 16): string {
  return valor.replace(/[^0-9]/g, '').slice(0, maxLength);
}

export function sanitizarCurp(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 18);
}

export function sanitizarRfc(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[^A-Z0-9&Ñ]/g, '')
    .slice(0, 13);
}

export function sanitizarNumeroDomicilio(valor: string): string {
  return valor.replace(/[^A-Za-z0-9\-/]/g, '').slice(0, 20);
}

export function sanitizarReferenciaServicio(valor: string): string {
  return valor.replace(/[^A-Za-z0-9\-]/g, '').slice(0, 40);
}

export function sanitizarDecimalPositivo(valor: string): string {
  const soloDigitosYPunto = valor.replace(/[^0-9.]/g, '');
  const partes = soloDigitosYPunto.split('.');
  if (partes.length === 1) {
    return partes[0].slice(0, 8);
  }
  return `${partes[0].slice(0, 8)}.${partes.slice(1).join('').slice(0, 2)}`;
}

export function sanitizarTextoOcupacion(valor: string): string {
  return valor
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü.\-/ ]/g, '')
    .replace(/^\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 80);
}

export function sanitizarTextoEmpresa(valor: string): string {
  return valor
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9.,&\-/ ]/g, '')
    .replace(/^\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 100);
}

export function sanitizarCalle(valor: string): string {
  return valor
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9.,#\-/ ]/g, '')
    .replace(/^\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 100);
}

export function sanitizarColonia(valor: string): string {
  return valor
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9.\- ]/g, '')
    .replace(/^\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 80);
}

export function sanitizarLugar(valor: string, maxLength = 80): string {
  return valor
    .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü.\- ]/g, '')
    .replace(/^\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength);
}

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

export function parsearFechaIsoValida(fechaIso: string): Date | null {
  const limpia = fechaIso.trim();
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(limpia)) {
    return null;
  }
  const [anioStr, mesStr, diaStr] = limpia.split('-');
  const anio = Number.parseInt(anioStr, 10);
  const mes = Number.parseInt(mesStr, 10);
  const dia = Number.parseInt(diaStr, 10);
  const fecha = new Date(anio, mes - 1, dia);
  if (
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    return null;
  }
  return fecha;
}

export function esMayorDeEdad(fechaIso: string): boolean {
  const nacimiento = parsearFechaIsoValida(fechaIso);
  if (!nacimiento) {
    return false;
  }
  const hoy = new Date();
  const limite18 = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
  const limite120 = new Date(hoy.getFullYear() - 120, hoy.getMonth(), hoy.getDate());
  return nacimiento <= limite18 && nacimiento >= limite120;
}

function validarCampoNombre(
  valor: string,
  etiqueta: string,
  obligatorio: boolean,
): string | null {
  const limpio = valor.trim();
  if (limpio.length === 0) {
    return obligatorio ? `El ${etiqueta} es obligatorio.` : null;
  }
  if (limpio.length < 2 || limpio.length > 50) {
    return obligatorio
      ? `El ${etiqueta} debe tener entre 2 y 50 caracteres.`
      : `El ${etiqueta} debe tener entre 2 y 50 caracteres si decides llenarlo.`;
  }
  if (!REGEX_SOLO_LETRAS.test(limpio)) {
    return `El ${etiqueta} solo debe contener letras y espacios simples.`;
  }
  return null;
}

export function validarCamposClienteBase(datos: DatosClienteBase): Record<string, string> {
  const errores: Record<string, string> = {};

  const errPrimerNombre = validarCampoNombre(datos.primerNombre, 'primer nombre', true);
  if (errPrimerNombre) errores.primerNombre = errPrimerNombre;

  const errSegundoNombre = validarCampoNombre(datos.segundoNombre, 'segundo nombre', false);
  if (errSegundoNombre) errores.segundoNombre = errSegundoNombre;

  const errApPaterno = validarCampoNombre(datos.apellidoPaterno, 'apellido paterno', true);
  if (errApPaterno) errores.apellidoPaterno = errApPaterno;

  const errApMaterno = validarCampoNombre(datos.apellidoMaterno, 'apellido materno', true);
  if (errApMaterno) errores.apellidoMaterno = errApMaterno;

  const fechaStr = datos.fechaNacimiento.trim();
  const fechaParseada = parsearFechaIsoValida(fechaStr);
  if (!fechaParseada) {
    errores.fechaNacimiento = 'La fecha de nacimiento debe ser una fecha real con formato AAAA-MM-DD.';
  } else if (!esMayorDeEdad(fechaStr)) {
    errores.fechaNacimiento = 'Debes tener entre 18 y 120 años para operar en GestoPago.';
  }

  const sexo = datos.sexo.trim();
  if (sexo.length === 0 || sexo.length > 20 || !REGEX_SOLO_LETRAS.test(sexo)) {
    errores.sexo = 'Selecciona un sexo válido (solo letras, máx. 20 caracteres).';
  }

  const nac = datos.nacionalidad.trim();
  if (nac.length < 3 || nac.length > 40 || !REGEX_SOLO_LETRAS.test(nac)) {
    errores.nacionalidad = 'La nacionalidad debe tener entre 3 y 40 letras.';
  }

  const estCiv = datos.estadoCivil.trim();
  if (estCiv.length < 3 || estCiv.length > 30 || !REGEX_SOLO_LETRAS.test(estCiv)) {
    errores.estadoCivil = 'El estado civil debe tener entre 3 y 30 letras.';
  }

  const correo = datos.correo.trim();
  if (correo.length < 6 || correo.length > 100 || /\s/.test(correo) || !REGEX_EMAIL.test(correo)) {
    errores.correo = 'Ingresa un correo electrónico válido sin espacios (6 a 100 caracteres).';
  }

  const telMovil = datos.telefonoMovil.trim();
  if (!/^[0-9]{10}$/.test(telMovil) || REGEX_DIGITOS_REPETIDOS_10.test(telMovil)) {
    errores.telefonoMovil =
      'El teléfono móvil debe tener exactamente 10 dígitos numéricos válidos sin repetir el mismo número.';
  }

  const telAlt = datos.telefonoAlternativo.trim();
  if (telAlt.length > 0) {
    if (!/^[0-9]{10}$/.test(telAlt) || REGEX_DIGITOS_REPETIDOS_10.test(telAlt)) {
      errores.telefonoAlternativo =
        'El teléfono alternativo debe tener 10 dígitos válidos o permanecer vacío.';
    } else if (telAlt === telMovil) {
      errores.telefonoAlternativo =
        'El teléfono alternativo debe ser distinto al teléfono móvil principal.';
    }
  }

  const ocupacion = datos.ocupacion.trim();
  if (ocupacion.length < 3 || ocupacion.length > 80 || !REGEX_OCUPACION.test(ocupacion)) {
    errores.ocupacion = 'La ocupación debe tener entre 3 y 80 caracteres y no incluir números.';
  }

  const empresa = datos.empresa.trim();
  if (empresa.length < 2 || empresa.length > 100 || !REGEX_EMPRESA.test(empresa)) {
    errores.empresa = 'La empresa debe tener entre 2 y 100 caracteres válidos.';
  }

  const ingresoStr = datos.ingresoMensual.trim();
  const ingreso = Number.parseFloat(ingresoStr);
  if (
    !/^[0-9]+(?:\.[0-9]{1,2})?$/.test(ingresoStr) ||
    Number.isNaN(ingreso) ||
    ingreso <= 0 ||
    ingreso > 99999999.99
  ) {
    errores.ingresoMensual =
      'El ingreso mensual debe ser un número positivo con máximo 2 decimales (hasta $99,999,999.99).';
  }

  const d = datos.domicilio;
  const calle = d.calle.trim();
  if (calle.length < 3 || calle.length > 100 || !REGEX_CALLE.test(calle)) {
    errores['domicilio.calle'] = 'La calle debe tener entre 3 y 100 caracteres válidos.';
  }

  const numExt = d.numeroExterior.trim();
  if (numExt.length < 1 || numExt.length > 20 || !REGEX_NUMERO_DOMICILIO.test(numExt)) {
    errores['domicilio.numeroExterior'] =
      'El número exterior debe tener de 1 a 20 caracteres alfanuméricos, guión o diagonal, sin espacios.';
  }

  const numInt = d.numeroInterior.trim();
  if (numInt.length > 0 && (numInt.length > 20 || !REGEX_NUMERO_DOMICILIO.test(numInt))) {
    errores['domicilio.numeroInterior'] =
      'El número interior debe tener máx. 20 caracteres alfanuméricos, guión o diagonal, sin espacios.';
  }

  const colonia = d.colonia.trim();
  if (colonia.length < 3 || colonia.length > 80 || !REGEX_COLONIA.test(colonia)) {
    errores['domicilio.colonia'] = 'La colonia debe tener entre 3 y 80 caracteres válidos.';
  }

  const municipio = d.municipio.trim();
  if (municipio.length < 3 || municipio.length > 80 || !REGEX_LUGAR.test(municipio)) {
    errores['domicilio.municipio'] =
      'El municipio o alcaldía debe tener entre 3 y 80 caracteres (solo letras).';
  }

  const estado = d.estado.trim();
  if (estado.length < 2 || estado.length > 60 || !REGEX_LUGAR.test(estado)) {
    errores['domicilio.estado'] =
      'El estado debe tener entre 2 y 60 caracteres (solo letras).';
  }

  if (!/^[0-9]{5}$/.test(d.codigoPostal.trim())) {
    errores['domicilio.codigoPostal'] =
      'El código postal debe tener exactamente 5 dígitos numéricos sin espacios.';
  }

  const pais = d.pais.trim();
  if (pais.length < 3 || pais.length > 50 || !REGEX_SOLO_LETRAS.test(pais)) {
    errores['domicilio.pais'] = 'El país debe tener entre 3 y 50 letras.';
  }

  return errores;
}

export function validarCamposRegistro(form: RegistroClienteForm): Record<string, string> {
  const errores = validarCamposClienteBase(form);
  const curp = form.curp.trim().toUpperCase();
  if (!REGEX_CURP.test(curp)) {
    errores.curp =
      'La CURP debe tener exactamente 18 caracteres válidos sin espacios según formato RENAPO.';
  }
  const rfc = form.rfc.trim().toUpperCase();
  if (!REGEX_RFC.test(rfc)) {
    errores.rfc =
      'El RFC debe tener 12 o 13 caracteres válidos sin espacios (incluyendo homoclave).';
  }
  if (!REGEX_PASSWORD_SEGURA.test(form.password)) {
    errores.password =
      'La contraseña debe tener entre 8 y 72 caracteres sin espacios, con mayúscula, minúscula, número y símbolo.';
  }
  if (form.confirmarPassword.length === 0 || form.password !== form.confirmarPassword) {
    errores.confirmarPassword = 'La confirmación no coincide con la contraseña ingresada.';
  }
  return errores;
}

export function validarDatosClienteBase(datos: DatosClienteBase): string | null {
  const errores = validarCamposClienteBase(datos);
  const primerError = Object.values(errores)[0];
  return primerError ?? null;
}

export function validarFormularioRegistro(form: RegistroClienteForm): string | null {
  const errores = validarCamposRegistro(form);
  const primerError = Object.values(errores)[0];
  return primerError ?? null;
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
