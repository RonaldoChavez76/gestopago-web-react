import { LogOut } from 'lucide-react';

export interface LogoutConfirmModalProps {
  abierto: boolean;
  cargando: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({
  abierto,
  cargando,
  onCancel,
  onConfirm,
}: LogoutConfirmModalProps) {
  if (!abierto) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-cierre-sesion"
    >
      <div className="w-full max-w-md rounded-2xl border border-borde bg-white p-6 shadow-xl">
        <h2 id="titulo-cierre-sesion" className="text-lg font-bold text-slate-900">
          Cerrar sesión segura
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          ¿Deseas finalizar tu sesión activa en este navegador? Esto liberará tu cuenta para iniciar
          sesión en Web o Móvil.
        </p>

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
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primario px-4 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
