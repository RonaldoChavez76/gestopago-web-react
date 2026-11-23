import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  MapPin,
  RefreshCw,
  Save,
  ShieldAlert,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { ApiException } from '../core/network/apiClient';
import {
  type ClientePerfil,
  REGEX_PASSWORD_SEGURA,
  construirNombreCompleto,
  validarDatosClienteBase,
} from '../models/cliente';
import { ClienteService } from '../services/clienteService';

export interface AccountProfilePageProps {
  clienteServiceOverride?: ClienteService;
}

export function AccountProfilePage({ clienteServiceOverride }: AccountProfilePageProps) {
  const navigate = useNavigate();
  const {
    apiClient,
    sesionActual,
    verificarVigenciaSesion,
    actualizarPerfilLocal,
    cerrarSesionTrasBaja,
  } = useSession();

  const service = useMemo(
    () => clienteServiceOverride ?? new ClienteService({ apiClient }),
    [clienteServiceOverride, apiClient],
  );

  const [perfil, setPerfil] = useState<ClientePerfil | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);
  const [exitoPerfil, setExitoPerfil] = useState<string | null>(null);

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [exitoPassword, setExitoPassword] = useState<string | null>(null);

  const [modalBajaAbierto, setModalBajaAbierto] = useState(false);
  const [confirmacionBajaTexto, setConfirmacionBajaTexto] = useState('');
  const [procesandoBaja, setProcesandoBaja] = useState(false);
  const [errorBaja, setErrorBaja] = useState<string | null>(null);

  const cargarPerfil = useCallback(async () => {
    setCargandoPerfil(true);
    setErrorCarga(null);
    try {
      let clienteId = sesionActual?.clienteId;
      if (!clienteId) {
        await verificarVigenciaSesion();
        clienteId = apiClient.sessionStorage.currentSession?.clienteId;
      }
      if (!clienteId) {
        setErrorCarga(
          'No se identificó tu identificador de cliente. Cierra sesión e inicia nuevamente para sincronizar tu cuenta.',
        );
        return;
      }
      const datos = await service.consultarPerfil(clienteId);
      setPerfil(datos);
    } catch (error) {
      if (error instanceof ApiException && error.statusCode === 401) {
        return;
      }
      setErrorCarga(
        error instanceof ApiException
          ? error.message
          : 'No fue posible consultar los datos de tu cuenta.',
      );
    } finally {
      setCargandoPerfil(false);
    }
  }, [apiClient, sesionActual?.clienteId, service, verificarVigenciaSesion]);

  useEffect(() => {
    void cargarPerfil();
  }, [cargarPerfil]);

  const actualizarCampo = <K extends keyof ClientePerfil>(campo: K, valor: ClientePerfil[K]) => {
    setPerfil((prev) => (prev ? { ...prev, [campo]: valor } : prev));
  };

  const actualizarDomicilio = (
    campo: keyof ClientePerfil['domicilio'],
    valor: string,
  ) => {
    setPerfil((prev) =>
      prev ? { ...prev, domicilio: { ...prev.domicilio, [campo]: valor } } : prev,
    );
  };

  const manejarGuardarPerfil = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!perfil) return;

    setErrorPerfil(null);
    setExitoPerfil(null);

    const err = validarDatosClienteBase(perfil);
    if (err) {
      setErrorPerfil(err);
      return;
    }

    setGuardandoPerfil(true);
    try {
      const actualizado = await service.actualizarPerfil(perfil.id, perfil);
      setPerfil(actualizado);
      actualizarPerfilLocal({
        nombreCliente: construirNombreCompleto(actualizado),
        correo: actualizado.correo,
      });
      setExitoPerfil('Los datos de tu cuenta y domicilio fueron actualizados correctamente.');
    } catch (error) {
      if (error instanceof ApiException && error.statusCode === 401) {
        return;
      }
      setErrorPerfil(
        error instanceof ApiException
          ? error.message
          : 'No fue posible actualizar los datos del cliente.',
      );
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const manejarCambiarPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorPassword(null);
    setExitoPassword(null);

    if (passwordActual.trim().length === 0) {
      setErrorPassword('Ingresa tu contraseña actual.');
      return;
    }
    if (!REGEX_PASSWORD_SEGURA.test(passwordNueva)) {
      setErrorPassword(
        'La nueva contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo.',
      );
      return;
    }
    if (passwordNueva !== confirmarPassword) {
      setErrorPassword('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setGuardandoPassword(true);
    try {
      let usuarioId = sesionActual?.usuarioId;
      if (!usuarioId) {
        await verificarVigenciaSesion();
        usuarioId = apiClient.sessionStorage.currentSession?.usuarioId;
      }
      if (!usuarioId) {
        setErrorPassword(
          'No se pudo obtener tu identificador de usuario. Cierra sesión e inicia nuevamente.',
        );
        return;
      }

      const mensaje = await service.cambiarPassword({
        usuarioId,
        passwordActual,
        passwordNueva,
      });
      setPasswordActual('');
      setPasswordNueva('');
      setConfirmarPassword('');
      setExitoPassword(mensaje);
    } catch (error) {
      if (error instanceof ApiException && error.statusCode === 401) {
        return;
      }
      setErrorPassword(
        error instanceof ApiException
          ? error.message
          : 'No fue posible actualizar la contraseña.',
      );
    } finally {
      setGuardandoPassword(false);
    }
  };

  const manejarConfirmarBaja = async () => {
    const clienteId = perfil?.id ?? sesionActual?.clienteId;
    if (!clienteId) return;

    setProcesandoBaja(true);
    setErrorBaja(null);
    try {
      await service.darDeBaja(clienteId);
      setModalBajaAbierto(false);
      cerrarSesionTrasBaja();
      navigate('/login', { replace: true });
    } catch (error) {
      if (error instanceof ApiException && error.statusCode === 401) {
        return;
      }
      setErrorBaja(
        error instanceof ApiException
          ? error.message
          : 'No fue posible procesar la baja lógica de tu cuenta.',
      );
    } finally {
      setProcesandoBaja(false);
    }
  };

  if (cargandoPerfil) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-2xl bg-white border border-borde animate-pulse" />
        <div className="h-80 rounded-2xl bg-white border border-borde animate-pulse" />
      </div>
    );
  }

  if (errorCarga || !perfil) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-6 space-y-4">
        <div className="flex items-start gap-2.5 text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{errorCarga ?? 'No se cargó el perfil.'}</p>
        </div>
        <button
          type="button"
          onClick={() => void cargarPerfil()}
          className="inline-flex items-center gap-2 rounded-xl bg-primario px-4 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reintentar consulta</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-borde p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primario-suave text-primario flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Mi Perfil y Administración de Cuenta
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Actualiza tus datos de contacto, contraseña de acceso o solicita la baja lógica de tu cuenta.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-fondo border border-borde text-slate-700">
            CURP: {perfil.curp}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-fondo border border-borde text-slate-700">
            RFC: {perfil.rfc}
          </span>
        </div>
      </div>

      <form
        noValidate
        onSubmit={(e) => void manejarGuardarPerfil(e)}
        className="bg-white rounded-2xl border border-borde p-6 shadow-xs space-y-6"
      >
        <div className="flex items-center gap-2 border-b border-borde pb-3">
          <User className="w-5 h-5 text-primario" />
          <h2 className="text-lg font-bold text-slate-900">Datos Personales</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="perfil-primer-nombre" className="block text-xs font-semibold text-slate-700 mb-1">
              Primer nombre *
            </label>
            <input
              id="perfil-primer-nombre"
              type="text"
              value={perfil.primerNombre}
              onChange={(e) => actualizarCampo('primerNombre', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="perfil-segundo-nombre" className="block text-xs font-semibold text-slate-700 mb-1">
              Segundo nombre
            </label>
            <input
              id="perfil-segundo-nombre"
              type="text"
              value={perfil.segundoNombre}
              onChange={(e) => actualizarCampo('segundoNombre', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="perfil-apellido-paterno" className="block text-xs font-semibold text-slate-700 mb-1">
              Apellido paterno *
            </label>
            <input
              id="perfil-apellido-paterno"
              type="text"
              value={perfil.apellidoPaterno}
              onChange={(e) => actualizarCampo('apellidoPaterno', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="perfil-apellido-materno" className="block text-xs font-semibold text-slate-700 mb-1">
              Apellido materno *
            </label>
            <input
              id="perfil-apellido-materno"
              type="text"
              value={perfil.apellidoMaterno}
              onChange={(e) => actualizarCampo('apellidoMaterno', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="perfil-correo" className="block text-xs font-semibold text-slate-700 mb-1">
              Correo electrónico *
            </label>
            <input
              id="perfil-correo"
              type="email"
              value={perfil.correo}
              onChange={(e) => actualizarCampo('correo', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="perfil-telefono-movil" className="block text-xs font-semibold text-slate-700 mb-1">
              Teléfono móvil (10 dígitos) *
            </label>
            <input
              id="perfil-telefono-movil"
              type="tel"
              maxLength={10}
              value={perfil.telefonoMovil}
              onChange={(e) => actualizarCampo('telefonoMovil', e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="perfil-telefono-alt" className="block text-xs font-semibold text-slate-700 mb-1">
              Teléfono alternativo
            </label>
            <input
              id="perfil-telefono-alt"
              type="tel"
              maxLength={10}
              value={perfil.telefonoAlternativo}
              onChange={(e) =>
                actualizarCampo('telefonoAlternativo', e.target.value.replace(/[^0-9]/g, ''))
              }
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="perfil-fecha-nacimiento" className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de nacimiento *
            </label>
            <input
              id="perfil-fecha-nacimiento"
              type="date"
              value={perfil.fechaNacimiento}
              onChange={(e) => actualizarCampo('fechaNacimiento', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="perfil-sexo" className="block text-xs font-semibold text-slate-700 mb-1">
              Sexo *
            </label>
            <input
              id="perfil-sexo"
              type="text"
              value={perfil.sexo}
              onChange={(e) => actualizarCampo('sexo', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="perfil-estado-civil" className="block text-xs font-semibold text-slate-700 mb-1">
              Estado civil *
            </label>
            <input
              id="perfil-estado-civil"
              type="text"
              value={perfil.estadoCivil}
              onChange={(e) => actualizarCampo('estadoCivil', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="perfil-nacionalidad" className="block text-xs font-semibold text-slate-700 mb-1">
              Nacionalidad *
            </label>
            <input
              id="perfil-nacionalidad"
              type="text"
              value={perfil.nacionalidad}
              onChange={(e) => actualizarCampo('nacionalidad', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="perfil-ingreso" className="block text-xs font-semibold text-slate-700 mb-1">
              Ingreso mensual (MXN) *
            </label>
            <input
              id="perfil-ingreso"
              type="number"
              step="0.01"
              value={perfil.ingresoMensual}
              onChange={(e) => actualizarCampo('ingresoMensual', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="perfil-ocupacion" className="block text-xs font-semibold text-slate-700 mb-1">
              Ocupación *
            </label>
            <input
              id="perfil-ocupacion"
              type="text"
              value={perfil.ocupacion}
              onChange={(e) => actualizarCampo('ocupacion', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="perfil-empresa" className="block text-xs font-semibold text-slate-700 mb-1">
              Empresa *
            </label>
            <input
              id="perfil-empresa"
              type="text"
              value={perfil.empresa}
              onChange={(e) => actualizarCampo('empresa', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-borde pb-3 pt-2">
          <MapPin className="w-5 h-5 text-primario" />
          <h2 className="text-lg font-bold text-slate-900">Domicilio Registrado</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="dom-calle" className="block text-xs font-semibold text-slate-700 mb-1">
              Calle *
            </label>
            <input
              id="dom-calle"
              type="text"
              value={perfil.domicilio.calle}
              onChange={(e) => actualizarDomicilio('calle', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="dom-ext" className="block text-xs font-semibold text-slate-700 mb-1">
              Número exterior *
            </label>
            <input
              id="dom-ext"
              type="text"
              value={perfil.domicilio.numeroExterior}
              onChange={(e) => actualizarDomicilio('numeroExterior', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="dom-int" className="block text-xs font-semibold text-slate-700 mb-1">
              Número interior
            </label>
            <input
              id="dom-int"
              type="text"
              value={perfil.domicilio.numeroInterior}
              onChange={(e) => actualizarDomicilio('numeroInterior', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="dom-colonia" className="block text-xs font-semibold text-slate-700 mb-1">
              Colonia *
            </label>
            <input
              id="dom-colonia"
              type="text"
              value={perfil.domicilio.colonia}
              onChange={(e) => actualizarDomicilio('colonia', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="dom-municipio" className="block text-xs font-semibold text-slate-700 mb-1">
              Municipio / Alcaldía *
            </label>
            <input
              id="dom-municipio"
              type="text"
              value={perfil.domicilio.municipio}
              onChange={(e) => actualizarDomicilio('municipio', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="dom-estado" className="block text-xs font-semibold text-slate-700 mb-1">
              Estado *
            </label>
            <input
              id="dom-estado"
              type="text"
              value={perfil.domicilio.estado}
              onChange={(e) => actualizarDomicilio('estado', e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dom-cp" className="block text-xs font-semibold text-slate-700 mb-1">
                C.P. *
              </label>
              <input
                id="dom-cp"
                type="text"
                maxLength={5}
                value={perfil.domicilio.codigoPostal}
                onChange={(e) =>
                  actualizarDomicilio('codigoPostal', e.target.value.replace(/[^0-9]/g, ''))
                }
                className="w-full rounded-xl border border-borde bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
              />
            </div>

            <div>
              <label htmlFor="dom-pais" className="block text-xs font-semibold text-slate-700 mb-1">
                País *
              </label>
              <input
                id="dom-pais"
                type="text"
                value={perfil.domicilio.pais}
                onChange={(e) => actualizarDomicilio('pais', e.target.value)}
                className="w-full rounded-xl border border-borde bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
              />
            </div>
          </div>
        </div>

        {errorPerfil && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2 text-sm text-red-800"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorPerfil}</span>
          </div>
        )}

        {exitoPerfil && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2 text-sm text-emerald-800"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{exitoPerfil}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={guardandoPerfil}
            className="inline-flex items-center gap-2 rounded-xl bg-primario px-5 py-3 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-60 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{guardandoPerfil ? 'Guardando cambios...' : 'Guardar Cambios de Perfil'}</span>
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          noValidate
          onSubmit={(e) => void manejarCambiarPassword(e)}
          className="bg-white rounded-2xl border border-borde p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-borde pb-3">
            <KeyRound className="w-5 h-5 text-primario" />
            <h2 className="text-lg font-bold text-slate-900">Cambiar Contraseña</h2>
          </div>

          <div>
            <label htmlFor="pass-actual" className="block text-xs font-semibold text-slate-700 mb-1">
              Contraseña actual *
            </label>
            <input
              id="pass-actual"
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div>
            <label htmlFor="pass-nueva" className="block text-xs font-semibold text-slate-700 mb-1">
              Nueva contraseña *
            </label>
            <input
              id="pass-nueva"
              type="password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Mínimo 8 caracteres incluyendo mayúscula, minúscula, número y símbolo.
            </p>
          </div>

          <div>
            <label htmlFor="pass-confirmar" className="block text-xs font-semibold text-slate-700 mb-1">
              Confirmar nueva contraseña *
            </label>
            <input
              id="pass-confirmar"
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          {errorPassword && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2 text-xs sm:text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorPassword}</span>
            </div>
          )}

          {exitoPassword && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2 text-xs sm:text-sm text-emerald-800"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{exitoPassword}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={guardandoPassword}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primario-suave px-4 py-3 text-sm font-bold text-primario-oscuro hover:bg-primario hover:text-white disabled:opacity-60 transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>{guardandoPassword ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
          </button>
        </form>

        <section className="bg-white rounded-2xl border border-red-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-700 border-b border-red-100 pb-3">
              <ShieldAlert className="w-5 h-5" />
              <h2 className="text-lg font-bold">Dar de Baja Cuenta</h2>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Esta operación realiza la baja lógica de tu perfil en GestoPago Digital. Tu registro
              fiscal permanece respaldado en auditoría, pero tu acceso de usuario, tus cuentas
              activas y todas tus sesiones abiertas en Web y Móvil quedarán inhabilitados de inmediato.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmacionBajaTexto('');
              setErrorBaja(null);
              setModalBajaAbierto(true);
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Dar de baja mi cuenta</span>
          </button>
        </section>
      </div>

      {modalBajaAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-baja-cuenta"
        >
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-red-700">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 id="titulo-baja-cuenta" className="text-lg font-bold text-slate-900">
                  Confirmar Baja Lógica de Cuenta
                </h3>
              </div>
              <button
                type="button"
                disabled={procesandoBaja}
                onClick={() => setModalBajaAbierto(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Al confirmar, tu usuario y cuentas bancarias pasarán a estado{' '}
              <strong className="text-slate-900">inactivo</strong> y se cerrarán todas tus sesiones
              activas. Para continuar, escribe <strong>BAJA</strong> en el campo inferior.
            </p>

            <div>
              <label htmlFor="confirmar-baja-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Escribe BAJA para confirmar
              </label>
              <input
                id="confirmar-baja-input"
                type="text"
                placeholder="BAJA"
                value={confirmacionBajaTexto}
                onChange={(e) => setConfirmacionBajaTexto(e.target.value)}
                className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>

            {errorBaja && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2 text-xs sm:text-sm text-red-800"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorBaja}</span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={procesandoBaja}
                onClick={() => setModalBajaAbierto(false)}
                className="rounded-xl border border-borde px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={procesandoBaja || confirmacionBajaTexto.trim().toUpperCase() !== 'BAJA'}
                onClick={() => void manejarConfirmarBaja()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{procesandoBaja ? 'Procesando baja...' : 'Confirmar baja definitiva'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
