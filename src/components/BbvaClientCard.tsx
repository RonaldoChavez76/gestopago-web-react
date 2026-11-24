import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { formatearMonedaMxn } from './AppLayout';

export interface BbvaClientCardProps {
  nombreTitular: string;
  correo: string;
  numeroCuenta?: string;
  saldoCuenta?: number;
  plataforma: string;
  esEjecutivo?: boolean;
  cuentaActiva?: boolean;
  curp?: string;
  rfc?: string;
  clienteId?: number;
  headingTitular?: boolean;
}

function formatearNumeroCuenta(numeroCuenta: string, oculto: boolean): string {
  const limpio = numeroCuenta.replace(/\s+/g, '');
  if (limpio.length === 0) {
    return '•••• •••• •••• ••••';
  }
  if (oculto) {
    const ultimos = limpio.slice(-4);
    return `•••• •••• •••• ${ultimos}`;
  }
  const grupos = limpio.match(/.{1,4}/g);
  return grupos ? grupos.join(' ') : limpio;
}

export function BbvaClientCard({
  nombreTitular,
  correo,
  numeroCuenta = '4229215075268914',
  saldoCuenta,
  plataforma,
  esEjecutivo = false,
  cuentaActiva = true,
  curp,
  rfc,
  clienteId,
  headingTitular = false,
}: BbvaClientCardProps) {
  const [mostrarSaldo, setMostrarSaldo] = useState(true);
  const [ocultarCuenta, setOcultarCuenta] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const cuentaVisual = formatearNumeroCuenta(numeroCuenta, ocultarCuenta);

  const manejarCopiarCuenta = async () => {
    try {
      await navigator.clipboard?.writeText(numeroCuenta);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
    }
  };

  return (
    <section
      aria-label="Tarjeta digital del cliente"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-bbva-noche via-bbva-azul to-bbva-cielo p-6 sm:p-8 text-white shadow-lg border border-white/15"
    >
      <div className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-bbva-acento/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 flex flex-col justify-between gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-bbva-acento" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-sky-200 font-semibold">
                Banca Digital GestoPago
              </p>
              <p className="text-sm font-bold text-white">Cuenta Digital Débito</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-bbva-noche text-xs font-bold shadow-xs">
              2FA Verificado • {plataforma}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                esEjecutivo
                  ? 'bg-amber-300 text-slate-950'
                  : 'bg-white/15 text-white border border-white/20'
              }`}
            >
              Rol: {esEjecutivo ? 'EJECUTIVO' : 'CLIENTE'}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                cuentaActiva
                  ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/30'
                  : 'bg-red-500/30 text-red-100 border border-red-300/40'
              }`}
            >
              {cuentaActiva ? 'Cuenta Activa' : 'Cuenta Inactiva'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          <div className="md:col-span-7 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-sky-200 font-semibold">
                Saldo Disponible
              </span>
              <button
                type="button"
                aria-label={mostrarSaldo ? 'Ocultar saldo' : 'Mostrar saldo'}
                onClick={() => setMostrarSaldo((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 text-[11px] font-medium text-sky-100 hover:bg-white/20 cursor-pointer"
              >
                {mostrarSaldo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{mostrarSaldo ? 'Ocultar' : 'Mostrar'}</span>
              </button>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {mostrarSaldo ? formatearMonedaMxn(saldoCuenta) : '$ •••••• MXN'}
            </p>
          </div>

          <div className="md:col-span-5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 36 26"
                  className="w-8 h-6 rounded-md shadow-xs"
                >
                  <rect width="36" height="26" rx="4" fill="#E6C36B" />
                  <path
                    d="M12 1v24M24 1v24M1 9h11M24 9h11M1 17h11M24 17h11M12 13h12"
                    stroke="#9F7B24"
                    strokeWidth="1.2"
                    fill="none"
                  />
                </svg>
                <span className="text-[11px] uppercase tracking-wider text-sky-200 font-semibold">
                  Número de cuenta
                </span>
              </div>

              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="w-5 h-5 text-bbva-acento"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 15a5 5 0 0 0 0-6" />
                <path d="M9 17a8 8 0 0 0 0-10" />
                <path d="M13 19a11 11 0 0 0 0-14" />
              </svg>
            </div>

            <p className="font-mono text-sm sm:text-base font-bold tracking-widest text-white">
              {cuentaVisual}
            </p>

            <div className="flex items-center justify-end gap-2 pt-0.5">
              <button
                type="button"
                aria-label={ocultarCuenta ? 'Mostrar número de cuenta' : 'Ocultar número de cuenta'}
                onClick={() => setOcultarCuenta((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/20 cursor-pointer"
              >
                {ocultarCuenta ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{ocultarCuenta ? 'Ver número' : 'Ocultar'}</span>
              </button>
              <button
                type="button"
                aria-label="Copiar número de cuenta"
                onClick={() => void manejarCopiarCuenta()}
                className="inline-flex items-center gap-1 rounded-lg bg-bbva-acento/20 border border-bbva-acento/40 px-2.5 py-1 text-[11px] font-bold text-bbva-acento hover:bg-bbva-acento/30 cursor-pointer"
              >
                {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-sky-200 font-semibold">
              Titular de la cuenta
            </p>
            {headingTitular ? (
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{nombreTitular}</h1>
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-white truncate">{nombreTitular}</p>
            )}
            <p className="text-xs sm:text-sm text-sky-100/90 truncate">{correo}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {clienteId !== undefined && (
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 font-semibold text-sky-100">
                Cliente #{clienteId}
              </span>
            )}
            {curp && (
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 font-semibold text-white">
                CURP: {curp}
              </span>
            )}
            {rfc && (
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 font-semibold text-white">
                RFC: {rfc}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
