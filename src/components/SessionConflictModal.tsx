import { AlertTriangle, Smartphone } from 'lucide-react';
import type { ConflictoSesion } from '../models/auth';

export interface SessionConflictModalProps {
  conflicto: ConflictoSesion | null;
  cargando: boolean;
  onCancel: () => void;
  onConfirmReplace: () => void;
}

export function SessionConflictModal({
  conflicto,
  cargando,
  onCancel,
  onConfirmReplace,
}: SessionConflictModalProps) {
  if (!conflicto) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-conflicto-sesion"
    >
      <div className="w-full max-w-md rounded-2xl border border-borde bg-white p-6 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 id="titulo-conflicto-sesion" className="text-lg font-bold text-slate-900">
            Sesión activa en {conflicto.plataformaActiva}
          </h2>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p>
            El sistema detectó que tu cuenta ya tiene una sesión activa en la plataforma{' '}
            <span className="font-semibold text-slate-900">{conflicto.plataformaActiva}</span>.
          </p>
          <p className="font-medium text-slate-800">
            Por políticas de seguridad bancaria, solo puedes mantener una sesión activa a la vez.
            ¿Deseas finalizar la sesión anterior para ingresar aquí?
          </p>
          {conflicto.fechaInicio && (
            <p className="rounded-lg bg-fondo px-3 py-2 text-xs text-slate-500">
              Inicio de sesión previa: {conflicto.fechaInicio}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={cargando}
            onClick={onCancel}
            className="rounded-xl border border-borde px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={cargando}
            onClick={onConfirmReplace}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primario px-4 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-50 cursor-pointer"
          >
            <Smartphone className="h-4 w-4" />
            Cerrar sesión anterior y continuar
          </button>
        </div>
      </div>
    </div>
  );
}
