import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, LogOut, RotateCcw, ShieldAlert } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { ApiException } from '../core/network/apiClient';
import { ClienteService } from '../services/clienteService';

export interface InactiveAccountGateProps {
  clienteServiceOverride?: ClienteService;
}

export function InactiveAccountGate({ clienteServiceOverride }: InactiveAccountGateProps) {
  const navigate = useNavigate();
  const {
    apiClient,
    sesionActual,
    cargando,
    verificarVigenciaSesion,
    marcarCuentaActivaLocal,
    cerrarSesion,
  } = useSession();

  const clienteService = useMemo(
    () => clienteServiceOverride ?? new ClienteService({ apiClient }),
    [clienteServiceOverride, apiClient],
  );

  const [confirmacion, setConfirmacion] = useState('');
  const [reactivando, setReactivando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  if (!sesionActual) {
    return null;
  }

  const manejarReactivar = async (event: FormEvent) => {
    event.preventDefault();
    if (confirmacion.trim().toUpperCase() !== 'ACTIVAR') {
      setErrorMensaje('Escribe la palabra ACTIVAR para confirmar la reactivación.');
      return;
    }

    setReactivando(true);
    setErrorMensaje(null);
    try {
      let clienteId = sesionActual.clienteId;
      if (!clienteId) {
        await verificarVigenciaSesion();
        clienteId = apiClient.sessionStorage.currentSession?.clienteId;
      }
      if (!clienteId) {
        setErrorMensaje('No se identificó tu cliente asociado. Cierra sesión e intenta de nuevo.');
        return;
      }

      await clienteService.reactivarCliente(clienteId);
      marcarCuentaActivaLocal(true);
      await verificarVigenciaSesion();
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMensaje(
        error instanceof ApiException
          ? error.message
          : 'No fue posible reactivar tu cuenta en este momento.',
      );
    } finally {
      setReactivando(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="bg-white rounded-3xl border border-amber-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 mb-2">
              Cuenta Inactiva
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Tu cuenta está dada de baja temporalmente
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Mientras tu cuenta permanezca inactiva no puedes realizar compras, movimientos ni modificar tus datos o contraseña. Si deseas volver a operar en GestoPago, puedes reactivarla aquí mismo.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-fondo border border-borde p-4 text-xs sm:text-sm text-slate-700 space-y-1">
          <p>
            <span className="font-semibold text-slate-900">Titular:</span>{' '}
            {sesionActual.nombreCliente ?? sesionActual.correo}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Correo:</span> {sesionActual.correo}
          </p>
          {sesionActual.numeroCuenta && (
            <p>
              <span className="font-semibold text-slate-900">Cuenta vinculada:</span>{' '}
              <span className="font-mono">{sesionActual.numeroCuenta}</span>
            </p>
          )}
        </div>

        {errorMensaje && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex items-start gap-2.5 text-sm text-red-800"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMensaje}</span>
          </div>
        )}

        <form noValidate onSubmit={(e) => void manejarReactivar(e)} className="space-y-4">
          <div>
            <label
              htmlFor="reactivar-confirmacion"
              className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5"
            >
              Escribe <strong>ACTIVAR</strong> para reactivar tu cuenta
            </label>
            <input
              id="reactivar-confirmacion"
              type="text"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder="ACTIVAR"
              className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={confirmacion.trim().toUpperCase() !== 'ACTIVAR' || reactivando}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{reactivando ? 'Reactivando...' : 'Reactivar mi cuenta'}</span>
            </button>
            <button
              type="button"
              disabled={cargando || reactivando}
              onClick={() => void cerrarSesion()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-borde bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
