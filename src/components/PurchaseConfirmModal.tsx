import { LockOpen, ShieldCheck } from 'lucide-react';
import type { CatalogProduct } from '../models/product';

export interface PurchaseConfirmModalProps {
  abierto: boolean;
  producto: CatalogProduct;
  destino: string;
  cuenta: string;
  monto: number;
  procesando: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PurchaseConfirmModal({
  abierto,
  producto,
  destino,
  cuenta,
  monto,
  procesando,
  onCancel,
  onConfirm,
}: PurchaseConfirmModalProps) {
  if (!abierto) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-confirmar-compra"
    >
      <div className="w-full max-w-md rounded-2xl border border-borde bg-white p-6 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primario-suave text-primario">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 id="titulo-confirmar-compra" className="text-lg font-bold text-slate-900">
            Confirmar Intención de Compra
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Por favor verifica los datos antes de autorizar el cargo a tu cuenta:
          </p>
        </div>

        <div className="mt-5 rounded-xl bg-fondo border border-borde p-4 space-y-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Producto:</span>
            <span className="font-semibold text-slate-900 text-right">{producto.nombre}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Servicio:</span>
            <span className="font-semibold text-slate-900 text-right">{producto.servicio}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">
              {producto.esRecarga ? 'Teléfono destino:' : 'Referencia:'}
            </span>
            <span className="font-semibold text-slate-900 text-right">{destino}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Cuenta de cargo:</span>
            <span className="font-semibold text-slate-900 text-right">{cuenta}</span>
          </div>
          <div className="border-t border-borde pt-2.5 flex justify-between gap-3 items-center">
            <span className="text-slate-700 font-semibold">Importe total:</span>
            <span className="text-base font-extrabold text-primario-oscuro">
              ${monto.toFixed(2)} MXN
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={procesando}
            onClick={onCancel}
            className="rounded-xl border border-borde px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={procesando}
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primario px-5 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-50 cursor-pointer"
          >
            <LockOpen className="w-4 h-4" />
            <span>Confirmar y Pagar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
