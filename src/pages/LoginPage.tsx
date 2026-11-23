import { type FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  Info,
  Lock,
  LogIn,
  Mail,
  Monitor,
  Shield,
  UserPlus,
} from 'lucide-react';
import {
  BACKEND_ENVIRONMENTS,
  type BackendEnvironmentId,
  type BackendEnvironmentOption,
  PLATAFORMA_WEB,
  getEnvironment,
  setEnvironment,
  subscribeEnvironment,
} from '../config/apiConfig';
import { SessionConflictModal } from '../components/SessionConflictModal';
import { useSession } from '../context/SessionContext';
import { ApiException } from '../core/network/apiClient';
import type { ConflictoSesion } from '../models/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateRegistro = location.state as {
    correoRegistrado?: string;
    cuentaRegistrada?: string;
  } | null;

  const {
    estaAutenticado,
    cargando,
    mensajeAlertaSesion,
    limpiarAlertaSesion,
    iniciarPreLogin,
  } = useSession();

  const [correo, setCorreo] = useState(() => stateRegistro?.correoRegistrado ?? '');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);
  const [conflictoActivo, setConflictoActivo] = useState<ConflictoSesion | null>(null);
  const [entornoActual, setEntornoActual] = useState<BackendEnvironmentOption>(() =>
    getEnvironment(),
  );

  useEffect(() => {
    return subscribeEnvironment((nuevo) => setEntornoActual(nuevo));
  }, []);

  if (estaAutenticado) {
    return <Navigate to="/" replace />;
  }

  const validarCampos = (): string | null => {
    const correoLimpio = correo.trim();
    if (correoLimpio.length === 0) {
      return 'Ingresa tu correo electrónico.';
    }
    if (!correoLimpio.includes('@') || !correoLimpio.includes('.')) {
      return 'Ingresa un correo electrónico válido.';
    }
    if (password.length === 0) {
      return 'Ingresa tu contraseña.';
    }
    return null;
  };

  const ejecutarAutenticacion = async (forzarCierreSesion = false) => {
    const errorValidacion = validarCampos();
    if (errorValidacion) {
      setErrorFormulario(errorValidacion);
      return;
    }

    setErrorFormulario(null);
    limpiarAlertaSesion();

    try {
      await iniciarPreLogin({
        correo: correo.trim(),
        password,
        forzarCierreSesion,
      });
      setConflictoActivo(null);
      navigate('/verificacion-2fa');
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.statusCode === 409) {
          setConflictoActivo(
            error.conflictoSesion ?? {
              sesionActivaExistente: true,
              plataformaActiva: 'MOVIL',
              accionRequerida: error.message,
            },
          );
          return;
        }
        setErrorFormulario(error.message);
        return;
      }
      setErrorFormulario('No fue posible iniciar sesión. Intenta nuevamente.');
    }
  };

  const manejarSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ejecutarAutenticacion(false);
  };

  const manejarConfirmarReemplazo = () => {
    void ejecutarAutenticacion(true);
  };

  return (
    <div className="min-h-screen bg-fondo flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-5">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primario-suave text-primario flex items-center justify-center mb-4 shadow-xs">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bienvenido a GestoPago</h1>
          <p className="text-sm text-slate-600 mt-1">
            Comercio Digital con Autenticación 2FA y Sesión Única
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-borde p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
              <Monitor className="w-4 h-4 text-primario" />
              <span>Plataforma activa</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primario-suave text-primario-oscuro">
              Plataforma: {PLATAFORMA_WEB}
            </span>
          </div>

          <div className="border-t border-borde pt-3 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-primario shrink-0" />
            <label htmlFor="entorno-backend" className="sr-only">
              Entorno Backend
            </label>
            <select
              id="entorno-backend"
              value={entornoActual.id}
              onChange={(e) => setEnvironment(e.target.value as BackendEnvironmentId)}
              className="w-full text-xs sm:text-sm font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              {Object.values(BACKEND_ENVIRONMENTS).map((env) => (
                <option key={env.id} value={env.id}>
                  {env.etiqueta}
                </option>
              ))}
            </select>
          </div>
        </div>

        {stateRegistro?.correoRegistrado && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-start gap-2.5 text-sm text-emerald-900"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-medium">
              Cuenta registrada
              {stateRegistro.cuentaRegistrada ? ` (${stateRegistro.cuentaRegistrada})` : ''}. Inicia
              sesión con tu contraseña y código 2FA.
            </p>
          </div>
        )}

        {mensajeAlertaSesion && (
          <div
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-2.5 text-sm text-amber-900"
          >
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="font-medium">{mensajeAlertaSesion}</p>
          </div>
        )}

        <form
          noValidate
          onSubmit={manejarSubmit}
          className="bg-white rounded-2xl border border-borde p-6 space-y-4 shadow-xs"
        >
          <div>
            <label htmlFor="correo" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="correo"
                type="email"
                autoComplete="email"
                placeholder="correo@ejemplo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full rounded-xl border border-borde bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-borde bg-white pl-10 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
              />
              <button
                type="button"
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setMostrarPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorFormulario && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2.5 text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorFormulario}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primario px-4 py-3.5 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-60 transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{cargando ? 'Validando credenciales...' : 'Iniciar Sesión con 2FA'}</span>
          </button>

          <Link
            to="/registro"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-borde bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-primario" />
            <span>¿No tienes cuenta? Regístrate aquí</span>
          </Link>
        </form>
      </div>

      <SessionConflictModal
        conflicto={conflictoActivo}
        cargando={cargando}
        onCancel={() => setConflictoActivo(null)}
        onConfirmReplace={manejarConfirmarReemplazo}
      />
    </div>
  );
}
