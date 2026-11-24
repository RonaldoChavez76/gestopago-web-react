import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ReceiptText,
  RefreshCw,
  Search,
  Smartphone,
  Store,
  X,
  XCircle,
} from 'lucide-react';
import { HistoryDetailModal } from '../components/HistoryDetailModal';
import { useSession } from '../context/SessionContext';
import { ApiException } from '../core/network/apiClient';
import type { PurchaseTransactionResult } from '../models/transaction';
import { TransactionService } from '../services/transactionService';

type TipoFiltroHistorial = 'Todas' | 'Recargas' | 'Servicios';
type EstadoFiltroHistorial = 'Todos' | 'Exitosas' | 'Rechazadas';

export interface HistoryPageProps {
  transactionServiceOverride?: TransactionService;
}

export function HistoryPage({ transactionServiceOverride }: HistoryPageProps) {
  const { apiClient, sesionActual } = useSession();

  const service = useMemo(
    () => transactionServiceOverride ?? new TransactionService({ apiClient }),
    [transactionServiceOverride, apiClient],
  );

  const [transacciones, setTransacciones] = useState<PurchaseTransactionResult[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltroHistorial>('Todas');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltroHistorial>('Todos');
  const [cargando, setCargando] = useState(true);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [compraSeleccionada, setCompraSeleccionada] =
    useState<PurchaseTransactionResult | null>(null);

  const cargarHistorial = useCallback(async () => {
    setCargando(true);
    setErrorMensaje(null);
    try {
      const lista = await service.obtenerHistorialCompleto({
        clienteId: sesionActual?.clienteId,
        numeroCuenta: sesionActual?.numeroCuenta,
      });
      setTransacciones(lista);
    } catch (error) {
      if (error instanceof ApiException) {
        setErrorMensaje(error.message);
      } else {
        setErrorMensaje('No fue posible consultar tu historial de operaciones.');
      }
    } finally {
      setCargando(false);
    }
  }, [service, sesionActual?.clienteId, sesionActual?.numeroCuenta]);

  useEffect(() => {
    void cargarHistorial();
  }, [cargarHistorial]);

  const comprasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return transacciones.filter((item) => {
      if (estadoFiltro === 'Exitosas' && !item.exitoso) {
        return false;
      }
      if (estadoFiltro === 'Rechazadas' && item.exitoso) {
        return false;
      }
      const esRecarga = item.tipoOperacion.toUpperCase() === 'RECARGA';
      if (tipoFiltro === 'Recargas' && !esRecarga) {
        return false;
      }
      if (tipoFiltro === 'Servicios' && esRecarga) {
        return false;
      }
      if (q.length === 0) {
        return true;
      }
      const prod = (item.nombreProducto ?? item.tipoOperacion).toLowerCase();
      const upc = item.upc.toLowerCase();
      const idTx = (item.idTx ?? '').toLowerCase();
      const auth = (item.numAutorizacion ?? '').toLowerCase();
      const dest = item.destinoMostrar.toLowerCase();
      const motivo = (item.motivoRechazo ?? item.mensaje ?? '').toLowerCase();
      return (
        prod.includes(q) ||
        upc.includes(q) ||
        idTx.includes(q) ||
        auth.includes(q) ||
        dest.includes(q) ||
        motivo.includes(q)
      );
    });
  }, [transacciones, busqueda, tipoFiltro, estadoFiltro]);

  const conteoExitosas = useMemo(
    () => comprasFiltradas.filter((item) => item.exitoso).length,
    [comprasFiltradas],
  );

  const conteoRechazadas = useMemo(
    () => comprasFiltradas.filter((item) => !item.exitoso).length,
    [comprasFiltradas],
  );

  const totalAcumulado = useMemo(
    () => comprasFiltradas.filter((item) => item.exitoso).reduce((acc, item) => acc + item.monto, 0),
    [comprasFiltradas],
  );

  const hayFiltrosActivos =
    busqueda.trim().length > 0 || tipoFiltro !== 'Todas' || estadoFiltro !== 'Todos';

  const limpiarFiltros = () => {
    setBusqueda('');
    setTipoFiltro('Todas');
    setEstadoFiltro('Todos');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de Compras Exitosas</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Operaciones exitosas y rechazadas con el motivo específico sincronizadas entre móvil y web
          </p>
        </div>

        <button
          type="button"
          disabled={cargando}
          onClick={() => void cargarHistorial()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-primario ${cargando ? 'animate-spin' : ''}`} />
          <span>Sincronizar historial</span>
        </button>
      </div>

      <section className="rounded-2xl bg-primario-suave/60 border border-primario/20 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-sm font-bold text-slate-900">
                Operaciones Exitosas: {conteoExitosas}
              </p>
              {conteoRechazadas > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                  Rechazadas / Fallidas: {conteoRechazadas}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">
              Cuenta asociada: {sesionActual?.numeroCuenta ?? '4229215075268914'}
            </p>
          </div>
        </div>

        <p className="text-base sm:text-lg font-extrabold text-primario-oscuro">
          Total operado: ${totalAcumulado.toFixed(2)} MXN
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-borde p-4 space-y-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Buscar en historial"
            placeholder="Buscar por producto, UPC, idTx, autorización, teléfono o motivo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-xl border border-borde bg-fondo/40 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
          />
          {busqueda.length > 0 && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {(['Todas', 'Recargas', 'Servicios'] as TipoFiltroHistorial[]).map((tipo) => {
              const activo = tipoFiltro === tipo;
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoFiltro(tipo)}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                    activo
                      ? 'bg-primario text-white border-primario'
                      : 'bg-fondo text-slate-700 border-borde hover:bg-slate-100'
                  }`}
                >
                  {tipo}
                </button>
              );
            })}

            <span className="h-5 w-px bg-borde mx-1 hidden sm:inline-block" />

            {(['Todos', 'Exitosas', 'Rechazadas'] as EstadoFiltroHistorial[]).map((estado) => {
              const activo = estadoFiltro === estado;
              return (
                <button
                  key={estado}
                  type="button"
                  onClick={() => setEstadoFiltro(estado)}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                    activo
                      ? estado === 'Rechazadas'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-bbva-azul text-white border-bbva-azul'
                      : 'bg-white text-slate-700 border-borde hover:bg-slate-100'
                  }`}
                >
                  {estado}
                </button>
              );
            })}
          </div>

          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-xs sm:text-sm font-semibold text-primario hover:text-primario-oscuro cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </section>

      {cargando && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">
            Consultando historial de operaciones...
          </p>
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-borde bg-white p-5 flex items-center justify-between gap-4 animate-pulse"
            >
              <div className="flex items-center gap-3.5 flex-1">
                <div className="w-11 h-11 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-6 bg-slate-200 rounded w-20" />
            </div>
          ))}
        </div>
      )}

      {!cargando && errorMensaje && (
        <div className="bg-white rounded-2xl border border-borde p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <p className="text-base font-medium text-slate-800 max-w-md mx-auto">{errorMensaje}</p>
          <button
            type="button"
            onClick={() => void cargarHistorial()}
            className="inline-flex items-center gap-2 rounded-xl bg-primario px-5 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {!cargando && !errorMensaje && comprasFiltradas.length === 0 && (
        <div className="bg-white rounded-2xl border border-borde p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-fondo text-slate-400 flex items-center justify-center mx-auto">
            <ReceiptText className="w-7 h-7" />
          </div>
          <p className="text-base font-bold text-slate-800">
            Aún no se registran compras exitosas con este filtro.
          </p>
          <p className="text-sm text-slate-500">
            Las compras confirmadas en Web o Móvil aparecerán aquí de inmediato.
          </p>
          <div className="pt-2">
            {hayFiltrosActivos ? (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex items-center gap-2 rounded-xl border border-borde bg-white px-4 py-2 text-sm font-semibold text-primario hover:bg-slate-50 cursor-pointer"
              >
                Limpiar filtros
              </button>
            ) : (
              <Link
                to="/catalogo"
                className="inline-flex items-center gap-2 rounded-xl bg-primario px-5 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro"
              >
                <Store className="w-4 h-4" />
                <span>Ir al Catálogo</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {!cargando && !errorMensaje && comprasFiltradas.length > 0 && (
        <div className="space-y-3">
          {comprasFiltradas.map((compra) => {
            const esRecarga = compra.tipoOperacion.toUpperCase() === 'RECARGA';
            const tituloProducto =
              compra.nombreProducto && compra.nombreProducto.trim().length > 0
                ? compra.nombreProducto
                : esRecarga
                  ? 'Recarga Telefónica'
                  : 'Pago de Servicio';

            return (
              <article
                key={`${compra.upc}-${compra.idTx ?? compra.fechaMostrar}`}
                className={`bg-white rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all ${
                  compra.exitoso
                    ? 'border-borde hover:border-primario/40 hover:shadow-xs'
                    : 'border-red-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                      compra.exitoso
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {!compra.exitoso ? (
                      <XCircle className="w-5 h-5" />
                    ) : esRecarga ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <ReceiptText className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-slate-900 truncate">
                      {tituloProducto}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Fecha: {compra.fechaMostrar}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 break-all">
                      Ref/Tel: {compra.destinoMostrar} • ID Tx: {compra.idTx ?? compra.upc}
                    </p>
                    {!compra.exitoso && (compra.motivoRechazo || compra.mensaje) && (
                      <p className="mt-2 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-800">
                        <span className="font-bold">Motivo del rechazo: </span>
                        {compra.motivoRechazo ?? compra.mensaje}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-borde pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p
                      className={`text-base font-extrabold ${
                        compra.exitoso ? 'text-primario-oscuro' : 'text-slate-700'
                      }`}
                    >
                      ${compra.monto.toFixed(2)} MXN
                    </p>
                    <span
                      className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        compra.exitoso
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {compra.exitoso ? 'EXITOSA' : compra.estadoRaw}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCompraSeleccionada(compra)}
                    className="inline-flex items-center gap-1 rounded-xl border border-borde bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <span>Ver comprobante</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <HistoryDetailModal
        compra={compraSeleccionada}
        onClose={() => setCompraSeleccionada(null)}
        onVerificarEnServidor={(upc) => service.consultarDetallePorUpc(upc)}
      />
    </div>
  );
}
