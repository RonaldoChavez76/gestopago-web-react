import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, MapPin, Save, User, X } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { ApiException } from '../core/network/apiClient';
import {
  type ClientePerfil,
  type DomicilioPerfil,
  sanitizarCalle,
  sanitizarColonia,
  sanitizarDecimalPositivo,
  sanitizarLugar,
  sanitizarNumeroDomicilio,
  sanitizarSinEspacios,
  sanitizarSoloDigitos,
  sanitizarSoloLetras,
  sanitizarTextoEmpresa,
  sanitizarTextoOcupacion,
  validarCamposClienteBase,
} from '../models/cliente';
import { ClienteService } from '../services/clienteService';

export interface ExecutiveClientEditModalProps {
  abierto: boolean;
  cliente: ClientePerfil | null;
  cargandoDetalle?: boolean;
  onClose: () => void;
  onGuardado: (actualizado: ClientePerfil) => void;
  clienteServiceOverride?: ClienteService;
}

function claseInput(tieneError: boolean): string {
  return `w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
    tieneError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-borde focus:border-primario focus:ring-primario/20'
  }`;
}

export function ExecutiveClientEditModal({
  abierto,
  cliente,
  cargandoDetalle = false,
  onClose,
  onGuardado,
  clienteServiceOverride,
}: ExecutiveClientEditModalProps) {
  const { apiClient } = useSession();
  const service = useMemo(
    () => clienteServiceOverride ?? new ClienteService({ apiClient }),
    [clienteServiceOverride, apiClient],
  );

  const [form, setForm] = useState<ClientePerfil | null>(cliente);
  const [guardando, setGuardando] = useState(false);
  const [erroresCampos, setErroresCampos] = useState<Record<string, string>>({});
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  useEffect(() => {
    setForm(cliente);
    setErroresCampos({});
    setErrorMensaje(null);
  }, [cliente, abierto]);

  if (!abierto) {
    return null;
  }

  const limpiarErrorCampo = (clave: string) => {
    setErroresCampos((prev) => {
      if (!prev[clave]) return prev;
      const copia = { ...prev };
      delete copia[clave];
      return copia;
    });
  };

  const actualizarCampo = <K extends keyof Omit<ClientePerfil, 'domicilio' | 'id' | 'activo' | 'curp' | 'rfc'>>(
    campo: K,
    valor: ClientePerfil[K],
  ) => {
    setForm((prev) => (prev ? { ...prev, [campo]: valor } : prev));
    limpiarErrorCampo(String(campo));
  };

  const actualizarDomicilio = <K extends keyof DomicilioPerfil>(
    campo: K,
    valor: string,
  ) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            domicilio: { ...prev.domicilio, [campo]: valor },
          }
        : prev,
    );
    limpiarErrorCampo(`domicilio.${String(campo)}`);
  };

  const renderError = (clave: string) => {
    const msg = erroresCampos[clave];
    if (!msg) return null;
    return <p className="text-[11px] font-medium text-red-600 mt-1">{msg}</p>;
  };

  const manejarGuardar = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;

    const errores = validarCamposClienteBase(form);
    const primerError = Object.values(errores)[0];
    if (primerError) {
      setErroresCampos(errores);
      setErrorMensaje(primerError);
      return;
    }

    setErroresCampos({});
    setGuardando(true);
    setErrorMensaje(null);
    try {
      const actualizado = await service.actualizarPerfil(form.id, form);
      onGuardado(actualizado);
    } catch (error) {
      setErrorMensaje(
        error instanceof ApiException
          ? error.message
          : 'No fue posible actualizar los datos del cliente.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-editar-cliente-ejecutivo"
    >
      <div className="w-full max-w-4xl rounded-2xl border border-borde bg-white p-5 sm:p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-borde pb-3">
          <div>
            <h2 id="titulo-editar-cliente-ejecutivo" className="text-lg font-bold text-slate-900">
              Editar Expediente del Cliente {form ? `#${form.id}` : ''}
            </h2>
            {form && (
              <div className="flex flex-wrap gap-2 mt-2 text-xs font-semibold text-slate-700">
                <span className="px-2.5 py-1 rounded-lg bg-fondo border border-borde">
                  CURP: {form.curp}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-fondo border border-borde">
                  RFC: {form.rfc}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg ${
                    form.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {form.activo ? 'Cliente Activo' : 'Cliente Inactivo'}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Cerrar edición de cliente"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cargandoDetalle || !form ? (
          <div className="py-10 text-center text-sm text-slate-600">
            Cargando expediente completo del cliente...
          </div>
        ) : (
          <form noValidate onSubmit={(e) => void manejarGuardar(e)} className="space-y-5">
            {errorMensaje && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2 text-xs sm:text-sm text-red-800"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMensaje}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <User className="w-4 h-4 text-primario" />
                <span>Datos Personales y Contacto</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="ej-edit-primer-nombre" className="block text-xs font-semibold text-slate-700 mb-1">
                    Primer nombre *
                  </label>
                  <input
                    id="ej-edit-primer-nombre"
                    type="text"
                    minLength={3}
                    maxLength={50}
                    value={form.primerNombre}
                    onChange={(e) => actualizarCampo('primerNombre', sanitizarSoloLetras(e.target.value, 50))}
                    className={claseInput(Boolean(erroresCampos.primerNombre))}
                  />
                  {renderError('primerNombre')}
                </div>
                <div>
                  <label htmlFor="ej-edit-segundo-nombre" className="block text-xs font-semibold text-slate-700 mb-1">
                    Segundo nombre
                  </label>
                  <input
                    id="ej-edit-segundo-nombre"
                    type="text"
                    maxLength={50}
                    value={form.segundoNombre}
                    onChange={(e) => actualizarCampo('segundoNombre', sanitizarSoloLetras(e.target.value, 50))}
                    className={claseInput(Boolean(erroresCampos.segundoNombre))}
                  />
                  {renderError('segundoNombre')}
                </div>
                <div>
                  <label htmlFor="ej-edit-apellido-paterno" className="block text-xs font-semibold text-slate-700 mb-1">
                    Apellido paterno *
                  </label>
                  <input
                    id="ej-edit-apellido-paterno"
                    type="text"
                    minLength={3}
                    maxLength={50}
                    value={form.apellidoPaterno}
                    onChange={(e) =>
                      actualizarCampo('apellidoPaterno', sanitizarSoloLetras(e.target.value, 50))
                    }
                    className={claseInput(Boolean(erroresCampos.apellidoPaterno))}
                  />
                  {renderError('apellidoPaterno')}
                </div>
                <div>
                  <label htmlFor="ej-edit-apellido-materno" className="block text-xs font-semibold text-slate-700 mb-1">
                    Apellido materno *
                  </label>
                  <input
                    id="ej-edit-apellido-materno"
                    type="text"
                    minLength={3}
                    maxLength={50}
                    value={form.apellidoMaterno}
                    onChange={(e) =>
                      actualizarCampo('apellidoMaterno', sanitizarSoloLetras(e.target.value, 50))
                    }
                    className={claseInput(Boolean(erroresCampos.apellidoMaterno))}
                  />
                  {renderError('apellidoMaterno')}
                </div>
                <div>
                  <label htmlFor="ej-edit-correo" className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo electrónico *
                  </label>
                  <input
                    id="ej-edit-correo"
                    type="email"
                    minLength={6}
                    maxLength={100}
                    value={form.correo}
                    onChange={(e) => actualizarCampo('correo', sanitizarSinEspacios(e.target.value, 100))}
                    className={claseInput(Boolean(erroresCampos.correo))}
                  />
                  {renderError('correo')}
                </div>
                <div>
                  <label htmlFor="ej-edit-telefono" className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono móvil (10 dígitos) *
                  </label>
                  <input
                    id="ej-edit-telefono"
                    type="tel"
                    inputMode="numeric"
                    minLength={10}
                    maxLength={10}
                    value={form.telefonoMovil}
                    onChange={(e) =>
                      actualizarCampo('telefonoMovil', sanitizarSoloDigitos(e.target.value, 10))
                    }
                    className={claseInput(Boolean(erroresCampos.telefonoMovil))}
                  />
                  {renderError('telefonoMovil')}
                </div>
                <div>
                  <label htmlFor="ej-edit-telefono-alt" className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono alternativo
                  </label>
                  <input
                    id="ej-edit-telefono-alt"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.telefonoAlternativo}
                    onChange={(e) =>
                      actualizarCampo('telefonoAlternativo', sanitizarSoloDigitos(e.target.value, 10))
                    }
                    className={claseInput(Boolean(erroresCampos.telefonoAlternativo))}
                  />
                  {renderError('telefonoAlternativo')}
                </div>
                <div>
                  <label htmlFor="ej-edit-nacimiento" className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de nacimiento *
                  </label>
                  <input
                    id="ej-edit-nacimiento"
                    type="date"
                    value={form.fechaNacimiento}
                    onChange={(e) => actualizarCampo('fechaNacimiento', e.target.value)}
                    className={claseInput(Boolean(erroresCampos.fechaNacimiento))}
                  />
                  {renderError('fechaNacimiento')}
                </div>
                <div>
                  <label htmlFor="ej-edit-sexo" className="block text-xs font-semibold text-slate-700 mb-1">
                    Sexo *
                  </label>
                  <input
                    id="ej-edit-sexo"
                    type="text"
                    maxLength={20}
                    value={form.sexo}
                    onChange={(e) => actualizarCampo('sexo', sanitizarSoloLetras(e.target.value, 20))}
                    className={claseInput(Boolean(erroresCampos.sexo))}
                  />
                  {renderError('sexo')}
                </div>
                <div>
                  <label htmlFor="ej-edit-nacionalidad" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nacionalidad *
                  </label>
                  <input
                    id="ej-edit-nacionalidad"
                    type="text"
                    minLength={3}
                    maxLength={40}
                    value={form.nacionalidad}
                    onChange={(e) => actualizarCampo('nacionalidad', sanitizarSoloLetras(e.target.value, 40))}
                    className={claseInput(Boolean(erroresCampos.nacionalidad))}
                  />
                  {renderError('nacionalidad')}
                </div>
                <div>
                  <label htmlFor="ej-edit-estado-civil" className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado civil *
                  </label>
                  <input
                    id="ej-edit-estado-civil"
                    type="text"
                    minLength={3}
                    maxLength={30}
                    value={form.estadoCivil}
                    onChange={(e) => actualizarCampo('estadoCivil', sanitizarSoloLetras(e.target.value, 30))}
                    className={claseInput(Boolean(erroresCampos.estadoCivil))}
                  />
                  {renderError('estadoCivil')}
                </div>
                <div>
                  <label htmlFor="ej-edit-ocupacion" className="block text-xs font-semibold text-slate-700 mb-1">
                    Ocupación *
                  </label>
                  <input
                    id="ej-edit-ocupacion"
                    type="text"
                    minLength={3}
                    maxLength={80}
                    value={form.ocupacion}
                    onChange={(e) => actualizarCampo('ocupacion', sanitizarTextoOcupacion(e.target.value))}
                    className={claseInput(Boolean(erroresCampos.ocupacion))}
                  />
                  {renderError('ocupacion')}
                </div>
                <div>
                  <label htmlFor="ej-edit-empresa" className="block text-xs font-semibold text-slate-700 mb-1">
                    Empresa *
                  </label>
                  <input
                    id="ej-edit-empresa"
                    type="text"
                    minLength={2}
                    maxLength={100}
                    value={form.empresa}
                    onChange={(e) => actualizarCampo('empresa', sanitizarTextoEmpresa(e.target.value))}
                    className={claseInput(Boolean(erroresCampos.empresa))}
                  />
                  {renderError('empresa')}
                </div>
                <div>
                  <label htmlFor="ej-edit-ingreso" className="block text-xs font-semibold text-slate-700 mb-1">
                    Ingreso mensual (MXN) *
                  </label>
                  <input
                    id="ej-edit-ingreso"
                    type="text"
                    inputMode="decimal"
                    value={form.ingresoMensual}
                    onChange={(e) => actualizarCampo('ingresoMensual', sanitizarDecimalPositivo(e.target.value))}
                    className={claseInput(Boolean(erroresCampos.ingresoMensual))}
                  />
                  {renderError('ingresoMensual')}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-borde">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-primario" />
                <span>Domicilio</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="ej-edit-calle" className="block text-xs font-semibold text-slate-700 mb-1">
                    Calle *
                  </label>
                  <input
                    id="ej-edit-calle"
                    type="text"
                    minLength={3}
                    maxLength={100}
                    value={form.domicilio.calle}
                    onChange={(e) => actualizarDomicilio('calle', sanitizarCalle(e.target.value))}
                    className={claseInput(Boolean(erroresCampos['domicilio.calle']))}
                  />
                  {renderError('domicilio.calle')}
                </div>
                <div>
                  <label htmlFor="ej-edit-num-ext" className="block text-xs font-semibold text-slate-700 mb-1">
                    Número exterior *
                  </label>
                  <input
                    id="ej-edit-num-ext"
                    type="text"
                    minLength={1}
                    maxLength={20}
                    value={form.domicilio.numeroExterior}
                    onChange={(e) =>
                      actualizarDomicilio('numeroExterior', sanitizarNumeroDomicilio(e.target.value))
                    }
                    className={claseInput(Boolean(erroresCampos['domicilio.numeroExterior']))}
                  />
                  {renderError('domicilio.numeroExterior')}
                </div>
                <div>
                  <label htmlFor="ej-edit-num-int" className="block text-xs font-semibold text-slate-700 mb-1">
                    Número interior
                  </label>
                  <input
                    id="ej-edit-num-int"
                    type="text"
                    maxLength={20}
                    value={form.domicilio.numeroInterior}
                    onChange={(e) =>
                      actualizarDomicilio('numeroInterior', sanitizarNumeroDomicilio(e.target.value))
                    }
                    className={claseInput(Boolean(erroresCampos['domicilio.numeroInterior']))}
                  />
                  {renderError('domicilio.numeroInterior')}
                </div>
                <div>
                  <label htmlFor="ej-edit-colonia" className="block text-xs font-semibold text-slate-700 mb-1">
                    Colonia *
                  </label>
                  <input
                    id="ej-edit-colonia"
                    type="text"
                    minLength={3}
                    maxLength={80}
                    value={form.domicilio.colonia}
                    onChange={(e) => actualizarDomicilio('colonia', sanitizarColonia(e.target.value))}
                    className={claseInput(Boolean(erroresCampos['domicilio.colonia']))}
                  />
                  {renderError('domicilio.colonia')}
                </div>
                <div>
                  <label htmlFor="ej-edit-municipio" className="block text-xs font-semibold text-slate-700 mb-1">
                    Municipio / Alcaldía *
                  </label>
                  <input
                    id="ej-edit-municipio"
                    type="text"
                    minLength={3}
                    maxLength={80}
                    value={form.domicilio.municipio}
                    onChange={(e) => actualizarDomicilio('municipio', sanitizarLugar(e.target.value, 80))}
                    className={claseInput(Boolean(erroresCampos['domicilio.municipio']))}
                  />
                  {renderError('domicilio.municipio')}
                </div>
                <div>
                  <label htmlFor="ej-edit-estado" className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado *
                  </label>
                  <input
                    id="ej-edit-estado"
                    type="text"
                    minLength={2}
                    maxLength={60}
                    value={form.domicilio.estado}
                    onChange={(e) => actualizarDomicilio('estado', sanitizarLugar(e.target.value, 60))}
                    className={claseInput(Boolean(erroresCampos['domicilio.estado']))}
                  />
                  {renderError('domicilio.estado')}
                </div>
                <div>
                  <label htmlFor="ej-edit-cp" className="block text-xs font-semibold text-slate-700 mb-1">
                    Código postal (5 dígitos) *
                  </label>
                  <input
                    id="ej-edit-cp"
                    type="text"
                    inputMode="numeric"
                    minLength={5}
                    maxLength={5}
                    value={form.domicilio.codigoPostal}
                    onChange={(e) =>
                      actualizarDomicilio('codigoPostal', sanitizarSoloDigitos(e.target.value, 5))
                    }
                    className={claseInput(Boolean(erroresCampos['domicilio.codigoPostal']))}
                  />
                  {renderError('domicilio.codigoPostal')}
                </div>
                <div>
                  <label htmlFor="ej-edit-pais" className="block text-xs font-semibold text-slate-700 mb-1">
                    País *
                  </label>
                  <input
                    id="ej-edit-pais"
                    type="text"
                    minLength={3}
                    maxLength={50}
                    value={form.domicilio.pais}
                    onChange={(e) => actualizarDomicilio('pais', sanitizarSoloLetras(e.target.value, 50))}
                    className={claseInput(Boolean(erroresCampos['domicilio.pais']))}
                  />
                  {renderError('domicilio.pais')}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-3 border-t border-borde">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primario px-5 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{guardando ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
