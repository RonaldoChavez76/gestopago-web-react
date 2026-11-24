import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { ApiException } from '../core/network/apiClient';
import type { PurchaseTransactionResult } from '../models/transaction';
import { PurchaseResultReceiptCard } from './PurchaseResultReceiptCard';

export interface HistoryDetailModalProps {
  compra: PurchaseTransactionResult | null;
  onClose: () => void;
  onVerificarEnServidor: (upc: string) => Promise<PurchaseTransactionResult>;
}

export function HistoryDetailModal({
  compra,
  onClose,
  onVerificarEnServidor,
}: HistoryDetailModalProps) {
  const [detalleActual, setDetalleActual] = useState<PurchaseTransactionResult | null>(compra);
  const [verificando, setVerificando] = useState(false);
  const [avisoVerificacion, setAvisoVerificacion] = useState<string | null>(null);
  const [errorVerificacion, setErrorVerificacion] = useState<string | null>(null);

  useEffect(() => {
    setDetalleActual(compra);
    setAvisoVerificacion(null);
    setErrorVerificacion(null);
  }, [compra]);

  if (!compra || !detalleActual) {
    return null;
  }

  const manejarVerificar = async () => {
    setVerificando(true);
    setAvisoVerificacion(null);
    setErrorVerificacion(null);
    try {
      const actualizado = await onVerificarEnServidor(detalleActual.upc);
      setDetalleActual(actualizado);
      setAvisoVerificacion('Comprobante verificado en tiempo real con el servidor.');
    } catch (error) {
      setErrorVerificacion(
        error instanceof ApiException
          ? error.message
          : 'No fue posible verificar el comprobante en el servidor.',
      );
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-detalle-compra"
    >
      <div className="w-full max-w-lg rounded-2xl border border-borde bg-white p-5 sm:p-6 shadow-xl my-8 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="titulo-detalle-compra" className="text-lg font-bold text-slate-900">
            {detalleActual.exitoso ? 'Detalle de Compra Exitosa' : 'Detalle de Compra Rechazada'}
          </h2>
          <button
            type="button"
            aria-label="Cerrar comprobante"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-fondo border border-borde p-3">
          <span className="text-xs text-slate-600">
            Folio UPC: <strong className="font-mono text-slate-900">{detalleActual.upc}</strong>
          </span>
          <button
            type="button"
            disabled={verificando}
            onClick={() => void manejarVerificar()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primario-suave px-3 py-1.5 text-xs font-bold text-primario-oscuro hover:bg-primario hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verificando ? 'animate-spin' : ''}`} />
            <span>Verificar en servidor por UPC</span>
          </button>
        </div>

        {avisoVerificacion && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2 text-xs sm:text-sm text-emerald-800"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{avisoVerificacion}</span>
          </div>
        )}

        {errorVerificacion && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-xs sm:text-sm text-red-800"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorVerificacion}</span>
          </div>
        )}

        <PurchaseResultReceiptCard resultado={detalleActual} />
      </div>
    </div>
  );
}
