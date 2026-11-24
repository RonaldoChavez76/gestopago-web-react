import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Hourglass,
  ReceiptText,
  RotateCcw,
  WifiOff,
  XCircle,
} from 'lucide-react';
import type {
  EstadoCompraResultado,
  PurchaseTransactionResult,
} from '../models/transaction';

export interface PurchaseResultReceiptCardProps {
  resultado: PurchaseTransactionResult;
  onVolverCatalogo?: () => void;
  onVerHistorial?: () => void;
  onReintentar?: () => void;
}

interface EstiloResultadoConfig {
  tituloEstado: string;
  etiquetaCorta: string;
  avisoAdicional?: string;
  borderClass: string;
  iconBgClass: string;
  iconTextClass: string;
  titleClass: string;
}

function obtenerEstiloResultado(estado: EstadoCompraResultado): EstiloResultadoConfig {
  switch (estado) {
    case 'exitosa':
      return {
        tituloEstado: '¡Compra Exitosa!',
        etiquetaCorta: 'EXITOSA (Confirmada)',
        borderClass: 'border-emerald-300',
        iconBgClass: 'bg-emerald-50',
        iconTextClass: 'text-emerald-700',
        titleClass: 'text-emerald-800',
      };
    case 'rechazada':
      return {
        tituloEstado: 'Compra Rechazada',
        etiquetaCorta: 'RECHAZADA (Sin cargo)',
        borderClass: 'border-red-300',
        iconBgClass: 'bg-red-50',
        iconTextClass: 'text-red-700',
        titleClass: 'text-red-800',
      };
    case 'pendiente':
      return {
        tituloEstado: 'Compra Pendiente de Conciliación',
        etiquetaCorta: 'PENDIENTE (En verificación)',
        avisoAdicional:
          'No repitas el cargo de inmediato. Verifica el estado final en tu historial de compras.',
        borderClass: 'border-amber-300',
        iconBgClass: 'bg-amber-50',
        iconTextClass: 'text-amber-700',
        titleClass: 'text-amber-900',
      };
    case 'errorComunicacion':
      return {
        tituloEstado: 'Error de Comunicación',
        etiquetaCorta: 'ERROR DE COMUNICACIÓN',
        avisoAdicional:
          'Ocurrió un problema de conectividad con el servidor o el proveedor externo GestoPago.',
        borderClass: 'border-orange-300',
        iconBgClass: 'bg-orange-50',
        iconTextClass: 'text-orange-700',
        titleClass: 'text-orange-900',
      };
  }
}

export function PurchaseResultReceiptCard({
  resultado,
  onVolverCatalogo,
  onVerHistorial,
  onReintentar,
}: PurchaseResultReceiptCardProps) {
  const config = obtenerEstiloResultado(resultado.estadoVisual);

  const copiarPin = () => {
    if (!resultado.pin) return;
    try {
      void navigator.clipboard?.writeText(resultado.pin);
    } catch {
    }
  };

  return (
    <div className={`bg-white rounded-2xl border-2 ${config.borderClass} p-6 sm:p-7 shadow-xs`}>
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center ${config.iconBgClass} ${config.iconTextClass}`}
        >
          {resultado.estadoVisual === 'exitosa' && <CheckCircle2 className="w-9 h-9" />}
          {resultado.estadoVisual === 'rechazada' && <XCircle className="w-9 h-9" />}
          {resultado.estadoVisual === 'pendiente' && <Hourglass className="w-9 h-9" />}
          {resultado.estadoVisual === 'errorComunicacion' && <WifiOff className="w-9 h-9" />}
        </div>

        <h2 className={`mt-4 text-2xl font-bold ${config.titleClass}`}>{config.tituloEstado}</h2>
        {(resultado.exitoso ||
          !resultado.motivoRechazo ||
          resultado.motivoRechazo !== resultado.mensaje) && (
          <p className="mt-1.5 text-sm text-slate-600">{resultado.mensaje}</p>
        )}
        {config.avisoAdicional && (
          <p className="mt-2 rounded-lg bg-fondo px-3 py-2 text-xs font-medium text-slate-700 border border-borde">
            {config.avisoAdicional}
          </p>
        )}
      </div>

      <div className="mt-6 rounded-xl bg-fondo border border-borde p-4 space-y-2.5 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Estado de la operación</span>
          <span className="font-bold text-slate-900 text-right">{config.etiquetaCorta}</span>
        </div>
        {!resultado.exitoso && resultado.motivoRechazo && (
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-3 rounded-lg bg-red-50/80 border border-red-200 px-3 py-2">
            <span className="text-red-700 font-semibold shrink-0">Motivo específico del rechazo</span>
            <span className="font-bold text-red-900 sm:text-right">
              {resultado.motivoRechazo}
            </span>
          </div>
        )}
        {!resultado.exitoso && resultado.codigo && (
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Código de rechazo</span>
            <span className="font-bold font-mono text-red-800 text-right">{resultado.codigo}</span>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Producto adquirido</span>
          <span className="font-bold text-slate-900 text-right">
            {resultado.nombreProducto ?? `Producto #${resultado.idProducto ?? '-'}`}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Importe de la operación</span>
          <span className="font-bold text-slate-900 text-right">
            ${resultado.monto.toFixed(2)} MXN
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Destino / Referencia</span>
          <span className="font-bold text-slate-900 text-right">{resultado.destinoMostrar}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Folio UPC</span>
          <span className="font-bold font-mono text-slate-900 text-right">{resultado.upc}</span>
        </div>
        {resultado.idTx && (
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Referencia GestoPago (idTx)</span>
            <span className="font-bold font-mono text-slate-900 text-right">{resultado.idTx}</span>
          </div>
        )}
        {resultado.numAutorizacion && (
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Número de Autorización</span>
            <span className="font-bold font-mono text-slate-900 text-right">
              {resultado.numAutorizacion}
            </span>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Fecha y hora</span>
          <span className="font-bold text-slate-900 text-right">{resultado.fechaMostrar}</span>
        </div>
        {resultado.numeroCuenta && (
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Cuenta bancaria</span>
            <span className="font-bold font-mono text-slate-900 text-right">
              {resultado.numeroCuenta}
            </span>
          </div>
        )}
        {resultado.nuevoSaldoCuenta !== undefined && (
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Nuevo saldo disponible</span>
            <span className="font-extrabold text-primario-oscuro text-right">
              ${resultado.nuevoSaldoCuenta.toFixed(2)} MXN
            </span>
          </div>
        )}
        {resultado.pin && resultado.pin.trim().length > 0 && (
          <div className="border-t border-borde pt-3 flex items-center justify-between gap-2">
            <span className="font-bold text-slate-900">PIN / Código: {resultado.pin}</span>
            <button
              type="button"
              aria-label="Copiar PIN"
              onClick={copiarPin}
              className="inline-flex items-center gap-1 rounded-lg border border-borde bg-white px-2.5 py-1 text-xs font-semibold text-primario hover:bg-slate-50 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        {resultado.exitoso && onVerHistorial && (
          <button
            type="button"
            onClick={onVerHistorial}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primario px-4 py-3 text-sm font-semibold text-white hover:bg-primario-oscuro transition-colors cursor-pointer"
          >
            <ReceiptText className="w-4 h-4" />
            <span>Ver en Mi Historial de Compras Exitosas</span>
          </button>
        )}

        {!resultado.exitoso && onReintentar && (
          <button
            type="button"
            onClick={onReintentar}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primario px-4 py-3 text-sm font-semibold text-white hover:bg-primario-oscuro transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Intentar nuevamente</span>
          </button>
        )}

        {onVolverCatalogo && (
          <button
            type="button"
            onClick={onVolverCatalogo}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-borde bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </button>
        )}
      </div>
    </div>
  );
}
