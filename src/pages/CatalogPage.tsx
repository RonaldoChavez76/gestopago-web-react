import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CloudOff,
  Filter,
  Info,
  RefreshCw,
  Search,
  SearchX,
  ShoppingCart,
  X,
} from 'lucide-react';
import { CatalogSkeletonGrid } from '../components/CatalogSkeletonGrid';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { ProductVisualBadge } from '../components/ProductVisualBadge';
import { useSession } from '../context/SessionContext';
import { ApiException } from '../core/network/apiClient';
import type { CatalogProduct, ProductCategory } from '../models/product';
import { CatalogService } from '../services/catalogService';

type CategoryFilter = 'Todos' | ProductCategory;

const CATEGORIAS_CATALOGO: CategoryFilter[] = [
  'Todos',
  'Recargas Telefónicas',
  'Pago de Servicios',
  'Entretenimiento y Pines',
];

export interface CatalogPageProps {
  catalogServiceOverride?: CatalogService;
}

export function CatalogPage({ catalogServiceOverride }: CatalogPageProps) {
  const navigate = useNavigate();
  const { apiClient } = useSession();

  const service = useMemo(
    () => catalogServiceOverride ?? new CatalogService({ apiClient }),
    [catalogServiceOverride, apiClient],
  );

  const [productos, setProductos] = useState<CatalogProduct[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoryFilter>('Todos');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [productoDetalle, setProductoDetalle] = useState<CatalogProduct | null>(null);

  const cargarCatalogo = useCallback(async () => {
    setCargando(true);
    setErrorMensaje(null);
    try {
      const lista = await service.obtenerCatalogoProductos();
      setProductos(lista);
    } catch (error) {
      if (error instanceof ApiException) {
        setErrorMensaje(error.message);
      } else {
        setErrorMensaje('No fue posible cargar el catálogo de productos GestoPago.');
      }
    } finally {
      setCargando(false);
    }
  }, [service]);

  useEffect(() => {
    void cargarCatalogo();
  }, [cargarCatalogo]);

  const contadoresPorCategoria = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      Todos: productos.length,
      'Recargas Telefónicas': 0,
      'Pago de Servicios': 0,
      'Entretenimiento y Pines': 0,
    };
    productos.forEach((prod) => {
      counts[prod.categoria] = (counts[prod.categoria] ?? 0) + 1;
    });
    return counts;
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const q = filtroBusqueda.trim().toLowerCase();
    return productos.filter((prod) => {
      if (soloDisponibles && !prod.disponible) {
        return false;
      }
      if (categoriaSeleccionada !== 'Todos' && prod.categoria !== categoriaSeleccionada) {
        return false;
      }
      if (q.length === 0) {
        return true;
      }
      return (
        prod.nombre.toLowerCase().includes(q) ||
        prod.servicio.toLowerCase().includes(q) ||
        prod.descripcion.toLowerCase().includes(q) ||
        prod.idProducto.toString().includes(q) ||
        prod.categoria.toLowerCase().includes(q)
      );
    });
  }, [productos, categoriaSeleccionada, filtroBusqueda, soloDisponibles]);

  const hayFiltrosActivos =
    categoriaSeleccionada !== 'Todos' || filtroBusqueda.trim().length > 0 || soloDisponibles;

  const limpiarFiltros = () => {
    setCategoriaSeleccionada('Todos');
    setFiltroBusqueda('');
    setSoloDisponibles(false);
  };

  const irACompra = (producto: CatalogProduct) => {
    setProductoDetalle(null);
    navigate('/comprar', { state: { producto } });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo de Productos GestoPago</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Consulta tiempo aire, pagos de servicios y pines electrónicos disponibles en línea.
          </p>
        </div>

        <button
          type="button"
          disabled={cargando}
          onClick={() => void cargarCatalogo()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-primario ${cargando ? 'animate-spin' : ''}`} />
          <span>Actualizar catálogo</span>
        </button>
      </div>

      <section className="bg-white rounded-2xl border border-borde p-4 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Buscar productos"
              placeholder="Buscar por producto, compañía o código (ej. Telcel, CFE, 582)..."
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              className="w-full rounded-xl border border-borde bg-fondo/40 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
            />
            {filtroBusqueda.length > 0 && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setFiltroBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            aria-pressed={soloDisponibles}
            onClick={() => setSoloDisponibles((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${soloDisponibles
              ? 'border-primario bg-primario-suave text-primario-oscuro'
              : 'border-borde bg-white text-slate-700 hover:bg-slate-50'
              }`}
          >
            <Filter className="w-4 h-4" />
            <span>Solo disponibles</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_CATALOGO.map((cat) => {
            const seleccionada = categoriaSeleccionada === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${seleccionada
                  ? 'bg-primario text-white border-primario'
                  : 'bg-fondo text-slate-700 border-borde hover:bg-slate-100'
                  }`}
              >
                {cat} ({contadoresPorCategoria[cat]})
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 pt-1 border-t border-borde">
          <span>Mostrando {productosFiltrados.length} productos</span>
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="font-semibold text-primario hover:text-primario-oscuro cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </section>

      {cargando && <CatalogSkeletonGrid />}

      {!cargando && errorMensaje && (
        <div className="bg-white rounded-2xl border border-borde p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <CloudOff className="w-7 h-7" />
          </div>
          <p className="text-base font-medium text-slate-800 max-w-md mx-auto">{errorMensaje}</p>
          <button
            type="button"
            onClick={() => void cargarCatalogo()}
            className="inline-flex items-center gap-2 rounded-xl bg-primario px-5 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar consulta</span>
          </button>
        </div>
      )}

      {!cargando && !errorMensaje && productosFiltrados.length === 0 && (
        <div className="bg-white rounded-2xl border border-borde p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-fondo text-slate-400 flex items-center justify-center mx-auto">
            <SearchX className="w-7 h-7" />
          </div>
          <p className="text-base font-medium text-slate-700">
            No se encontraron productos que coincidan con tu búsqueda.
          </p>
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-2 rounded-xl border border-borde bg-white px-4 py-2 text-sm font-semibold text-primario hover:bg-slate-50 cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {!cargando && !errorMensaje && productosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {productosFiltrados.map((producto) => (
            <article
              key={`${producto.idProducto}-${producto.nombre}`}
              className="bg-white rounded-2xl border border-borde p-5 flex flex-col justify-between gap-4 hover:border-primario/40 hover:shadow-sm transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <ProductVisualBadge producto={producto} />
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                        {producto.nombre}
                      </h2>
                      <p className="text-xs text-slate-500 break-words mt-0.5">
                        {producto.servicio}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${producto.disponible
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                      }`}
                  >
                    {producto.disponible ? 'Disponible' : 'No disponible'}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {producto.descripcion}
                </p>
              </div>

              <div className="pt-3.5 border-t border-borde space-y-3">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <p className="text-base font-extrabold text-primario-oscuro whitespace-nowrap">
                    {producto.precio > 0
                      ? `$${producto.precio.toFixed(2)} MXN`
                      : 'Monto abierto'}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500">
                    Prod #{producto.idProducto} • Serv #{producto.idServicio}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProductoDetalle(producto)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-borde px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-primario shrink-0" />
                    <span>Ver detalle</span>
                  </button>
                  <button
                    type="button"
                    disabled={!producto.disponible}
                    onClick={() => irACompra(producto)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primario-suave px-3 py-2 text-xs font-bold text-primario-oscuro hover:bg-primario hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                    <span>Comprar</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ProductDetailModal
        producto={productoDetalle}
        onClose={() => setProductoDetalle(null)}
        onSelectForPurchase={irACompra}
      />
    </div>
  );
}
