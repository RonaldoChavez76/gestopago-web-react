import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, MapPin, Save, User, X } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { ApiException } from '../core/network/apiClient';
import {
  type ClientePerfil,
  type DomicilioPerfil,
  validarDatosClienteBase,
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

const INPUT_CLASS =
  'w-full rounded-xl border border-borde bg-white px-3 py-2 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20';

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
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  useEffect(() => {
    setForm(cliente);
    setErrorMensaje(null);
  }, [cliente, abierto]);

  if (!abierto) {
    return null;
  }

  const actualizarCampo = <K extends keyof Omit<ClientePerfil, 'domicilio' | 'id' | 'activo' | 'curp' | 'rfc'>>(
    campo: K,
    valor: ClientePerfil[K],
  ) => {
    setForm((prev) => (prev ? { ...prev, [campo]: valor } : prev));
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
  };

  const manejarGuardar = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;

    const err = validarDatosClienteBase(form);
    if (err) {
      setErrorMensaje(err);
      return;
    }

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
      <div className="w-full max-w-3xl rounded-2xl border border-borde bg-white p-5 sm:p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto space-y-5">
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
                    value={form.primerNombre}
                    onChange={(e) => actualizarCampo('primerNombre', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-segundo-nombre" className="block text-xs font-semibold text-slate-700 mb-1">
                    Segundo nombre
                  </label>
                  <input
                    id="ej-edit-segundo-nombre"
                    type="text"
                    value={form.segundoNombre}
                    onChange={(e) => actualizarCampo('segundoNombre', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-apellido-paterno" className="block text-xs font-semibold text-slate-700 mb-1">
                    Apellido paterno *
                  </label>
                  <input
                    id="ej-edit-apellido-paterno"
                    type="text"
                    value={form.apellidoPaterno}
                    onChange={(e) => actualizarCampo('apellidoPaterno', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-apellido-materno" className="block text-xs font-semibold text-slate-700 mb-1">
                    Apellido materno *
                  </label>
                  <input
                    id="ej-edit-apellido-materno"
                    type="text"
                    value={form.apellidoMaterno}
                    onChange={(e) => actualizarCampo('apellidoMaterno', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-correo" className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo electrónico *
                  </label>
                  <input
                    id="ej-edit-correo"
                    type="email"
                    value={form.correo}
                    onChange={(e) => actualizarCampo('correo', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-telefono" className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono móvil (10 dígitos) *
                  </label>
                  <input
                    id="ej-edit-telefono"
                    type="tel"
                    maxLength={10}
                    value={form.telefonoMovil}
                    onChange={(e) =>
                      actualizarCampo('telefonoMovil', e.target.value.replace(/[^0-9]/g, ''))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-telefono-alt" className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono alternativo
                  </label>
                  <input
                    id="ej-edit-telefono-alt"
                    type="tel"
                    maxLength={10}
                    value={form.telefonoAlternativo}
                    onChange={(e) =>
                      actualizarCampo('telefonoAlternativo', e.target.value.replace(/[^0-9]/g, ''))
                    }
                    className={INPUT_CLASS}
                  />
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
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-sexo" className="block text-xs font-semibold text-slate-700 mb-1">
                    Sexo *
                  </label>
                  <input
                    id="ej-edit-sexo"
                    type="text"
                    value={form.sexo}
                    onChange={(e) => actualizarCampo('sexo', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-nacionalidad" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nacionalidad *
                  </label>
                  <input
                    id="ej-edit-nacionalidad"
                    type="text"
                    value={form.nacionalidad}
                    onChange={(e) => actualizarCampo('nacionalidad', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-estado-civil" className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado civil *
                  </label>
                  <input
                    id="ej-edit-estado-civil"
                    type="text"
                    value={form.estadoCivil}
                    onChange={(e) => actualizarCampo('estadoCivil', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-ocupacion" className="block text-xs font-semibold text-slate-700 mb-1">
                    Ocupación *
                  </label>
                  <input
                    id="ej-edit-ocupacion"
                    type="text"
                    value={form.ocupacion}
                    onChange={(e) => actualizarCampo('ocupacion', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-empresa" className="block text-xs font-semibold text-slate-700 mb-1">
                    Empresa *
                  </label>
                  <input
                    id="ej-edit-empresa"
                    type="text"
                    value={form.empresa}
                    onChange={(e) => actualizarCampo('empresa', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-ingreso" className="block text-xs font-semibold text-slate-700 mb-1">
                    Ingreso mensual (MXN) *
                  </label>
                  <input
                    id="ej-edit-ingreso"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.ingresoMensual}
                    onChange={(e) => actualizarCampo('ingresoMensual', e.target.value)}
                    className={INPUT_CLASS}
                  />
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
                    value={form.domicilio.calle}
                    onChange={(e) => actualizarDomicilio('calle', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-num-ext" className="block text-xs font-semibold text-slate-700 mb-1">
                    Número exterior *
                  </label>
                  <input
                    id="ej-edit-num-ext"
                    type="text"
                    value={form.domicilio.numeroExterior}
                    onChange={(e) => actualizarDomicilio('numeroExterior', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-num-int" className="block text-xs font-semibold text-slate-700 mb-1">
                    Número interior
                  </label>
                  <input
                    id="ej-edit-num-int"
                    type="text"
                    value={form.domicilio.numeroInterior}
                    onChange={(e) => actualizarDomicilio('numeroInterior', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-colonia" className="block text-xs font-semibold text-slate-700 mb-1">
                    Colonia *
                  </label>
                  <input
                    id="ej-edit-colonia"
                    type="text"
                    value={form.domicilio.colonia}
                    onChange={(e) => actualizarDomicilio('colonia', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-municipio" className="block text-xs font-semibold text-slate-700 mb-1">
                    Municipio / Alcaldía *
                  </label>
                  <input
                    id="ej-edit-municipio"
                    type="text"
                    value={form.domicilio.municipio}
                    onChange={(e) => actualizarDomicilio('municipio', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-estado" className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado *
                  </label>
                  <input
                    id="ej-edit-estado"
                    type="text"
                    value={form.domicilio.estado}
                    onChange={(e) => actualizarDomicilio('estado', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-cp" className="block text-xs font-semibold text-slate-700 mb-1">
                    Código postal (5 dígitos) *
                  </label>
                  <input
                    id="ej-edit-cp"
                    type="text"
                    maxLength={5}
                    value={form.domicilio.codigoPostal}
                    onChange={(e) =>
                      actualizarDomicilio('codigoPostal', e.target.value.replace(/[^0-9]/g, ''))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ej-edit-pais" className="block text-xs font-semibold text-slate-700 mb-1">
                    País *
                  </label>
                  <input
                    id="ej-edit-pais"
                    type="text"
                    value={form.domicilio.pais}
                    onChange={(e) => actualizarDomicilio('pais', e.target.value)}
                    className={INPUT_CLASS}
                  />
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
