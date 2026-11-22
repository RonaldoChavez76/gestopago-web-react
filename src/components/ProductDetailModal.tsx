import { ShoppingBag, X } from 'lucide-react';
import type { CatalogProduct } from '../models/product';
import { ProductVisualBadge } from './ProductVisualBadge';

export interface ProductDetailModalProps {
  producto: CatalogProduct | null;
  onClose: () => void;
  onSelectForPurchase: (producto: CatalogProduct) => void;
}

function obtenerTipoOperacionTexto(producto: CatalogProduct): string {
  if (producto.esRecarga) {
    return 'Recarga Tiempo Aire';
  }
  if (producto.categoria === 'Entretenimiento y Pines') {
    return 'PIN Electrónico';
  }
  return 'Pago de Servicio';
}

export function ProductDetailModal({
  producto,
  onClose,
  onSelectForPurchase,
}: ProductDetailModalProps) {
  if (!producto) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-detalle-producto"
    >
      <div className="w-full max-w-lg rounded-2xl border border-borde bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <ProductVisualBadge producto={producto} size="lg" />
            <div className="min-w-0">
              <h2
                id="titulo-detalle-producto"
                className="text-lg font-bold text-slate-900 leading-snug"
              >
                {producto.nombre}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {producto.servicio} • {producto.categoria}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Cerrar detalle"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 rounded-xl bg-fondo border border-borde p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-slate-600">Precio / Importe</span>
            <span className="text-lg font-extrabold text-primario-oscuro">
              {producto.precio > 0
                ? `$${producto.precio.toFixed(2)} MXN`
                : 'Monto variable de recibo'}
            </span>
          </div>

          <div className="border-t border-borde pt-3 grid grid-cols-2 gap-3 text-xs sm:text-sm">
            <div>
              <span className="text-slate-500">ID Producto:</span>{' '}
              <span className="font-semibold text-slate-900">#{producto.idProducto}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500">ID Servicio:</span>{' '}
              <span className="font-semibold text-slate-900">#{producto.idServicio}</span>
            </div>
          </div>

          <div className="border-t border-borde pt-3 flex items-center justify-between gap-2 text-xs sm:text-sm">
            <span className="text-slate-600">
              Tipo de operación:{' '}
              <strong className="text-slate-900">{obtenerTipoOperacionTexto(producto)}</strong>
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                producto.disponible
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {producto.disponible ? 'Disponible' : 'No disponible'}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-bold text-slate-900">Descripción del producto</h3>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{producto.descripcion}</p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-borde px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            disabled={!producto.disponible}
            onClick={() => onSelectForPurchase(producto)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primario px-5 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Seleccionar para Compra</span>
          </button>
        </div>
      </div>
    </div>
  );
}
