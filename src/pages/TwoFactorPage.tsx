import { type FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { ApiException } from '../core/network/apiClient';

function formatearTiempo(totalSegundos: number): string {
  const minutos = Math.floor(totalSegundos / 60)
    .toString()
    .padStart(2, '0');
  const segundos = (totalSegundos % 60).toString().padStart(2, '0');
  return `${minutos}:${segundos}`;
}

export function TwoFactorPage() {
  const navigate = useNavigate();
  const {
    estaAutenticado,
    retoPendiente,
    cargando,
    completarLoginCon2FA,
    reenviarCodigo2FA,
    cancelarReto2FA,
  } = useSession();

  const [codigoOtpInput, setCodigoOtpInput] = useState('');
  const [segundosRestantes, setSegundosRestantes] = useState(
    () => retoPendiente?.challenge.expiraEnSegundos ?? 300,
  );
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [avisoReenvio, setAvisoReenvio] = useState<string | null>(null);

  useEffect(() => {
    if (retoPendiente) {
      setSegundosRestantes(retoPendiente.challenge.expiraEnSegundos);
    }
  }, [retoPendiente]);

  useEffect(() => {
    if (!retoPendiente || segundosRestantes <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setSegundosRestantes((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retoPendiente, segundosRestantes]);

  if (estaAutenticado) {
    return <Navigate to="/" replace />;
  }

  if (!retoPendiente) {
    return <Navigate to="/login" replace />;
  }

  const { challenge } = retoPendiente;

  const usarCodigoGenerado = () => {
    setCodigoOtpInput(challenge.codigoOtp);
    setErrorMensaje(null);
    try {
      void navigator.clipboard?.writeText(challenge.codigoOtp);
    } catch {
    }
  };

  const manejarReenviar = async () => {
    setErrorMensaje(null);
    setAvisoReenvio(null);
    try {
      const nuevo = await reenviarCodigo2FA();
      setSegundosRestantes(nuevo.expiraEnSegundos);
      setAvisoReenvio('Nuevo código OTP de 6 dígitos generado en el servidor.');
    } catch (error) {
      setErrorMensaje(
        error instanceof ApiException
          ? error.message
          : 'No se pudo generar un nuevo código OTP.',
      );
    }
  };

  const manejarSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const codigoLimpio = codigoOtpInput.trim();
    if (codigoLimpio.length === 0) {
      setErrorMensaje('Ingresa el código OTP de 6 dígitos.');
      return;
    }
    if (!/^[0-9]{6}$/.test(codigoLimpio)) {
      setErrorMensaje('El código debe contener exactamente 6 dígitos numéricos.');
      return;
    }

    setErrorMensaje(null);
    setAvisoReenvio(null);

    try {
      await completarLoginCon2FA(codigoLimpio);
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMensaje(
        error instanceof ApiException
          ? error.message
          : 'El código de verificación es inválido o expiró.',
      );
    }
  };

  const manejarVolver = () => {
    cancelarReto2FA();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-fondo flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl border border-borde p-7 shadow-xs">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-primario-suave text-primario flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Verificación de Doble Factor (2FA)</h1>
          <p className="text-sm font-semibold text-primario mt-1">Código de Seguridad (OTP)</p>
          <p className="text-sm text-slate-600 mt-2">
            Ingresa el código temporal de 6 dígitos validado por el servidor para activar tu sesión
            única en <span className="font-semibold text-slate-900">{challenge.plataforma}</span>.
          </p>
        </div>

        {challenge.codigoOtp && (
          <div className="mt-5 rounded-xl border border-primario/25 bg-primario-suave/50 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700">
              <KeyRound className="w-3.5 h-3.5 text-primario" />
              <span>Código OTP generado para cuenta {challenge.numeroCuenta}:</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="text-2xl font-extrabold tracking-[0.35em] text-primario">
                {challenge.codigoOtp}
              </span>
              <button
                type="button"
                onClick={usarCodigoGenerado}
                className="inline-flex items-center gap-1 rounded-lg bg-white border border-borde px-2.5 py-1.5 text-xs font-semibold text-primario hover:bg-slate-50 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Usar código</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold">
          <Timer
            className={`w-4 h-4 ${segundosRestantes > 60 ? 'text-primario' : 'text-red-600'}`}
          />
          <span className={segundosRestantes > 60 ? 'text-primario' : 'text-red-600'}>
            {segundosRestantes > 0
              ? `Expira en ${formatearTiempo(segundosRestantes)}`
              : 'El código ha expirado. Solicita uno nuevo.'}
          </span>
        </div>

        <form noValidate onSubmit={(e) => void manejarSubmit(e)} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="codigo-otp"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Código de 6 dígitos
            </label>
            <input
              id="codigo-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Ej. 482910"
              value={codigoOtpInput}
              onChange={(e) => setCodigoOtpInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              className="w-full rounded-xl border border-borde bg-white px-4 py-3 text-center text-lg font-bold tracking-[0.35em] text-slate-900 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
          </div>

          {avisoReenvio && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2 text-xs sm:text-sm text-emerald-800"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{avisoReenvio}</span>
            </div>
          )}

          {errorMensaje && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2 text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMensaje}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando || segundosRestantes <= 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primario px-4 py-3.5 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-60 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{cargando ? 'Verificando en el servidor...' : 'Confirmar y Acceder'}</span>
          </button>

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              disabled={cargando}
              onClick={() => void manejarReenviar()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primario hover:bg-primario-suave/50 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Solicitar un nuevo código OTP</span>
            </button>
            <button
              type="button"
              disabled={cargando}
              onClick={manejarVolver}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al inicio de sesión</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
