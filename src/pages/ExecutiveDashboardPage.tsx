import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Edit3,
  ReceiptText,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { formatearMonedaMxn } from '../components/AppLayout';
import { ExecutiveClientEditModal } from '../components/ExecutiveClientEditModal';
import { HistoryDetailModal } from '../components/HistoryDetailModal';
import { useSession } from '../context/SessionContext';
import { ApiException } from '../core/network/apiClient';
import { esUsuarioEjecutivo } from '../models/auth';
import { type ClientePerfil, construirNombreCompleto } from '../models/cliente';
import {
  type ClienteResumenEjecutivo,
  type CuentaResumenEjecutivo,
  type EstadoActivoFiltro,
  type FiltroBusquedaClientes,
  type FiltroBusquedaCuentas,
  type PageResponse,
  type UsuarioResumenEjecutivo,
  crearFiltrosClientesIniciales,
  crearFiltrosCuentasIniciales,
  validarFiltrosClientes,
} from '../models/ejecutivo';
import type { PurchaseTransactionResult } from '../models/transaction';
import { ClienteService } from '../services/clienteService';
import { EjecutivoService } from '../services/ejecutivoService';
import { TransactionService } from '../services/transactionService';

type PestanaEjecutivo = 'clientes' | 'cuentas' | 'usuarios';

export interface ExecutiveDashboardPageProps {
  ejecutivoServiceOverride?: EjecutivoService;
  clienteServiceOverride?: ClienteService;
  transactionServiceOverride?: TransactionService;
}

const INPUT_CLASS =
  'w-full rounded-xl border border-borde bg-white px-3 py-2 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20';

function formatearFechaCorta(valor?: string): string {
  if (!valor) return 'No disponible';
  const ms = Date.parse(valor);
  if (Number.isNaN(ms)) return valor;
  return new Date(ms).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ExecutiveDashboardPage({
  ejecutivoServiceOverride,
  clienteServiceOverride,
  transactionServiceOverride,
}: ExecutiveDashboardPageProps) {
  const { apiClient, sesionActual } = useSession();

  const ejecutivoService = useMemo(
    () => ejecutivoServiceOverride ?? new EjecutivoService({ apiClient }),
    [ejecutivoServiceOverride, apiClient],
  );
  const clienteService = useMemo(
    () => clienteServiceOverride ?? new ClienteService({ apiClient }),
    [clienteServiceOverride, apiClient],
  );
  const transactionService = useMemo(
    () => transactionServiceOverride ?? new TransactionService({ apiClient }),
    [transactionServiceOverride, apiClient],
  );

  const [pestana, setPestana] = useState<PestanaEjecutivo>('clientes');
  const [avisoGlobal, setAvisoGlobal] = useState<string | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  const [filtrosClientes, setFiltrosClientes] = useState<FiltroBusquedaClientes>(
    crearFiltrosClientesIniciales,
  );
  const [clientesPage, setClientesPage] =
    useState<PageResponse<ClienteResumenEjecutivo> | null>(null);
  const [cargandoClientes, setCargandoClientes] = useState(false);

  const [filtrosCuentas, setFiltrosCuentas] = useState<FiltroBusquedaCuentas>(
    crearFiltrosCuentasIniciales,
  );
  const [cuentasPage, setCuentasPage] =
    useState<PageResponse<CuentaResumenEjecutivo> | null>(null);
  const [cargandoCuentas, setCargandoCuentas] = useState(false);

  const [usuarioIdInput, setUsuarioIdInput] = useState('');
  const [usuarioConsultado, setUsuarioConsultado] =
    useState<UsuarioResumenEjecutivo | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(false);

  const [auditoriaClienteId, setAuditoriaClienteId] = useState('');
  const [auditoriaCuenta, setAuditoriaCuenta] = useState('');
  const [auditoriaUpc, setAuditoriaUpc] = useState('');
  const [comprasAuditadas, setComprasAuditadas] = useState<PurchaseTransactionResult[]>([]);
  const [auditoriaConsultada, setAuditoriaConsultada] = useState(false);
  const [cargandoAuditoria, setCargandoAuditoria] = useState(false);
  const [compraModal, setCompraModal] = useState<PurchaseTransactionResult | null>(null);

  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [cargandoDetalleCliente, setCargandoDetalleCliente] = useState(false);
  const [clienteEnEdicion, setClienteEnEdicion] = useState<ClientePerfil | null>(null);

  const [clienteParaBaja, setClienteParaBaja] = useState<ClientePerfil | null>(null);
  const [confirmacionBajaTexto, setConfirmacionBajaTexto] = useState('');
  const [procesandoBaja, setProcesandoBaja] = useState(false);

  const esEjecutivo = esUsuarioEjecutivo(sesionActual);

  const ejecutarBusquedaClientes = useCallback(
    async (criterios: FiltroBusquedaClientes) => {
      const errorValidacion = validarFiltrosClientes(criterios);
      if (errorValidacion) {
        setErrorGlobal(errorValidacion);
        return;
      }

      setCargandoClientes(true);
      setErrorGlobal(null);
      try {
        const resultado = await ejecutivoService.buscarClientes(criterios);
        setClientesPage(resultado);
      } catch (error) {
        setErrorGlobal(
          error instanceof ApiException
            ? error.message
            : 'No fue posible consultar la lista de clientes.',
        );
      } finally {
        setCargandoClientes(false);
      }
    },
    [ejecutivoService],
  );

  const ejecutarBusquedaCuentas = useCallback(
    async (criterios: FiltroBusquedaCuentas) => {
      if (
        criterios.clienteId.trim().length > 0 &&
        (!/^[0-9]+$/.test(criterios.clienteId.trim()) || Number(criterios.clienteId.trim()) <= 0)
      ) {
        setErrorGlobal('El ID de cliente para cuentas debe ser un entero positivo.');
        return;
      }

      setCargandoCuentas(true);
      setErrorGlobal(null);
      try {
        const resultado = await ejecutivoService.buscarCuentas(criterios);
        setCuentasPage(resultado);
      } catch (error) {
        setErrorGlobal(
          error instanceof ApiException
            ? error.message
            : 'No fue posible consultar las cuentas bancarias.',
        );
      } finally {
        setCargandoCuentas(false);
      }
    },
    [ejecutivoService],
  );

  const ejecutarAuditoriaCompras = useCallback(
    async (clienteIdStr: string, numeroCuentaStr: string) => {
      const idLimpio = clienteIdStr.trim();
      const cuentaLimpia = numeroCuentaStr.trim();

      if (idLimpio.length === 0 && cuentaLimpia.length === 0) {
        setErrorGlobal('Ingresa al menos un ID de cliente o número de cuenta para auditar compras.');
        return;
      }
      if (idLimpio.length > 0 && (!/^[0-9]+$/.test(idLimpio) || Number(idLimpio) <= 0)) {
        setErrorGlobal('El ID de cliente para auditoría debe ser un entero positivo.');
        return;
      }

      setCargandoAuditoria(true);
      setErrorGlobal(null);
      try {
        const lista = await transactionService.obtenerHistorialComprasExitosas({
          clienteId: idLimpio.length > 0 ? Number.parseInt(idLimpio, 10) : undefined,
          numeroCuenta: cuentaLimpia.length > 0 ? cuentaLimpia : undefined,
        });
        setComprasAuditadas(lista);
        setAuditoriaConsultada(true);
      } catch (error) {
        setErrorGlobal(
          error instanceof ApiException
            ? error.message
            : 'No fue posible obtener las compras exitosas del cliente.',
        );
      } finally {
        setCargandoAuditoria(false);
      }
    },
    [transactionService],
  );

  useEffect(() => {
    if (!esEjecutivo) return;
    void ejecutarBusquedaClientes(crearFiltrosClientesIniciales());
  }, [esEjecutivo, ejecutarBusquedaClientes]);

  if (!esEjecutivo) {
    return <Navigate to="/" replace />;
  }

  const cambiarPestana = (nueva: PestanaEjecutivo) => {
    setPestana(nueva);
    setErrorGlobal(null);
    if (nueva === 'cuentas' && cuentasPage === null && !cargandoCuentas) {
      void ejecutarBusquedaCuentas(filtrosCuentas);
    }
  };

  const abrirEdicionCliente = async (clienteId: number, respaldo?: ClientePerfil) => {
    setModalEditarAbierto(true);
    setCargandoDetalleCliente(true);
    setClienteEnEdicion(respaldo ?? null);
    setErrorGlobal(null);
    try {
      const detalle = await clienteService.consultarPerfil(clienteId);
      setClienteEnEdicion(detalle);
    } catch (error) {
      setModalEditarAbierto(false);
      setErrorGlobal(
        error instanceof ApiException
          ? error.message
          : 'No fue posible obtener el expediente completo del cliente.',
      );
    } finally {
      setCargandoDetalleCliente(false);
    }
  };

  const manejarClienteGuardado = (actualizado: ClientePerfil) => {
    setModalEditarAbierto(false);
    setClienteEnEdicion(null);
    setAvisoGlobal(
      `Datos del cliente #${actualizado.id} (${construirNombreCompleto(actualizado)}) actualizados correctamente.`,
    );
    setClientesPage((prev) =>
      prev
        ? {
            ...prev,
            content: prev.content.map((item) =>
              item.perfil.id === actualizado.id ? { ...item, perfil: actualizado } : item,
            ),
          }
        : prev,
    );
  };

  const confirmarBajaCliente = async () => {
    if (!clienteParaBaja) return;
    setProcesandoBaja(true);
    setErrorGlobal(null);
    try {
      await clienteService.darDeBaja(clienteParaBaja.id);
      const nombre = construirNombreCompleto(clienteParaBaja);
      const id = clienteParaBaja.id;
      setClienteParaBaja(null);
      setConfirmacionBajaTexto('');
      setAvisoGlobal(`Baja lógica aplicada correctamente al cliente #${id} (${nombre}).`);
      await ejecutarBusquedaClientes(filtrosClientes);
    } catch (error) {
      setErrorGlobal(
        error instanceof ApiException
          ? error.message
          : 'No fue posible aplicar la baja lógica al cliente.',
      );
    } finally {
      setProcesandoBaja(false);
    }
  };

  const verCuentasDeCliente = (clienteId: number) => {
    const siguientesFiltros: FiltroBusquedaCuentas = {
      numeroCuenta: '',
      clienteId: String(clienteId),
      soloActivas: false,
      page: 0,
      size: 10,
    };
    setFiltrosCuentas(siguientesFiltros);
    setPestana('cuentas');
    void ejecutarBusquedaCuentas(siguientesFiltros);
  };

  const irAAuditoria = (clienteId?: number, numeroCuenta?: string) => {
    const idStr = clienteId ? String(clienteId) : '';
    const cuentaStr = numeroCuenta ?? '';
    setAuditoriaClienteId(idStr);
    setAuditoriaCuenta(cuentaStr);
    setPestana('usuarios');
    void ejecutarAuditoriaCompras(idStr, cuentaStr);
  };

  const manejarConsultarUsuario = async (event: FormEvent) => {
    event.preventDefault();
    const limpio = usuarioIdInput.trim();
    if (!/^[0-9]+$/.test(limpio) || Number(limpio) <= 0) {
      setErrorGlobal('Ingresa un ID de usuario numérico positivo.');
      return;
    }

    setCargandoUsuario(true);
    setErrorGlobal(null);
    setUsuarioConsultado(null);
    try {
      const resultado = await ejecutivoService.consultarUsuarioPorId(Number.parseInt(limpio, 10));
      setUsuarioConsultado(resultado);
    } catch (error) {
      setErrorGlobal(
        error instanceof ApiException
          ? error.message
          : 'No fue posible consultar el usuario solicitado.',
      );
    } finally {
      setCargandoUsuario(false);
    }
  };

  const manejarConsultarUpc = async (event: FormEvent) => {
    event.preventDefault();
    const upcLimpio = auditoriaUpc.trim();
    if (upcLimpio.length === 0) {
      setErrorGlobal('Ingresa un folio UPC para consultar el comprobante.');
      return;
    }

    setCargandoAuditoria(true);
    setErrorGlobal(null);
    try {
      const comprobante = await transactionService.consultarDetallePorUpc(upcLimpio);
      setCompraModal(comprobante);
    } catch (error) {
      setErrorGlobal(
        error instanceof ApiException
          ? error.message
          : 'No se encontró un comprobante para el folio UPC proporcionado.',
      );
    } finally {
      setCargandoAuditoria(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-primario-oscuro p-6 sm:p-7 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
              <BriefcaseBusiness className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Panel Operativo Ejecutivo</h1>
              <p className="text-xs sm:text-sm text-white/80 mt-1">
                Búsqueda global de clientes, actualización de expedientes, consulta de cuentas, usuarios y auditoría transaccional.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center self-start sm:self-center px-3 py-1.5 rounded-full bg-amber-300 text-slate-900 text-xs font-bold">
            Rol Autorizado: EJECUTIVO
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => cambiarPestana('clientes')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              pestana === 'clientes'
                ? 'bg-white text-slate-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes</span>
          </button>
          <button
            type="button"
            onClick={() => cambiarPestana('cuentas')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              pestana === 'cuentas'
                ? 'bg-white text-slate-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Cuentas Bancarias</span>
          </button>
          <button
            type="button"
            onClick={() => cambiarPestana('usuarios')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              pestana === 'usuarios'
                ? 'bg-white text-slate-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Usuarios y Auditoría</span>
          </button>
        </div>
      </section>

      {avisoGlobal && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start justify-between gap-3 text-sm text-emerald-900"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{avisoGlobal}</span>
          </div>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setAvisoGlobal(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorGlobal && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start justify-between gap-3 text-sm text-red-900"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{errorGlobal}</span>
          </div>
          <button
            type="button"
            aria-label="Cerrar error"
            onClick={() => setErrorGlobal(null)}
            className="text-red-700 hover:text-red-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {pestana === 'clientes' && (
        <section className="space-y-5">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const actualizado = { ...filtrosClientes, page: 0 };
              setFiltrosClientes(actualizado);
              void ejecutarBusquedaClientes(actualizado);
            }}
            className="bg-white rounded-2xl border border-borde p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Search className="w-4 h-4 text-primario" />
              <h2>Filtros Combinados de Clientes</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label htmlFor="ej-filtro-nombre" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre o apellidos
                </label>
                <input
                  id="ej-filtro-nombre"
                  type="text"
                  placeholder="Ej. Ana López"
                  value={filtrosClientes.nombre}
                  onChange={(e) =>
                    setFiltrosClientes((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="ej-filtro-curp" className="block text-xs font-semibold text-slate-700 mb-1">
                  CURP
                </label>
                <input
                  id="ej-filtro-curp"
                  type="text"
                  maxLength={18}
                  placeholder="18 caracteres"
                  value={filtrosClientes.curp}
                  onChange={(e) =>
                    setFiltrosClientes((prev) => ({
                      ...prev,
                      curp: e.target.value.toUpperCase(),
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="ej-filtro-rfc" className="block text-xs font-semibold text-slate-700 mb-1">
                  RFC
                </label>
                <input
                  id="ej-filtro-rfc"
                  type="text"
                  maxLength={13}
                  placeholder="12 o 13 caracteres"
                  value={filtrosClientes.rfc}
                  onChange={(e) =>
                    setFiltrosClientes((prev) => ({
                      ...prev,
                      rfc: e.target.value.toUpperCase(),
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="ej-filtro-correo" className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  id="ej-filtro-correo"
                  type="email"
                  placeholder="cliente@correo.com"
                  value={filtrosClientes.correo}
                  onChange={(e) =>
                    setFiltrosClientes((prev) => ({ ...prev, correo: e.target.value }))
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="ej-filtro-cuenta" className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de cuenta
                </label>
                <input
                  id="ej-filtro-cuenta"
                  type="text"
                  placeholder="16 dígitos"
                  value={filtrosClientes.numeroCuenta}
                  onChange={(e) =>
                    setFiltrosClientes((prev) => ({ ...prev, numeroCuenta: e.target.value }))
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="ej-filtro-cliente-id" className="block text-xs font-semibold text-slate-700 mb-1">
                  ID de cliente
                </label>
                <input
                  id="ej-filtro-cliente-id"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej. 3"
                  value={filtrosClientes.clienteId}
                  onChange={(e) =>
                    setFiltrosClientes((prev) => ({
                      ...prev,
                      clienteId: e.target.value.replace(/[^0-9]/g, ''),
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="ej-filtro-activo" className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado
                </label>
                <select
                  id="ej-filtro-activo"
                  value={filtrosClientes.estadoActivo}
                  onChange={(e) =>
                    setFiltrosClientes((prev) => ({
                      ...prev,
                      estadoActivo: e.target.value as EstadoActivoFiltro,
                    }))
                  }
                  className={INPUT_CLASS}
                >
                  <option value="TODOS">Todos los estatus</option>
                  <option value="ACTIVOS">Solo activos</option>
                  <option value="INACTIVOS">Solo inactivos</option>
                </select>
              </div>

              <div>
                <label htmlFor="ej-filtro-desde" className="block text-xs font-semibold text-slate-700 mb-1">
                  Registrado desde
                </label>
                <input
                  id="ej-filtro-desde"
                  type="date"
                  value={filtrosClientes.registradoDesde}
                  onChange={(e) =>
                    setFiltrosClientes((prev) => ({
                      ...prev,
                      registradoDesde: e.target.value,
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="ej-filtro-hasta" className="block text-xs font-semibold text-slate-700 mb-1">
                  Registrado hasta
                </label>
                <input
                  id="ej-filtro-hasta"
                  type="date"
                  value={filtrosClientes.registradoHasta}
                  onChange={(e) =>
                    setFiltrosClientes((prev) => ({
                      ...prev,
                      registradoHasta: e.target.value,
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="submit"
                disabled={cargandoClientes}
                className="inline-flex items-center gap-2 rounded-xl bg-primario px-4 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-50 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{cargandoClientes ? 'Buscando...' : 'Buscar clientes'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const limpios = crearFiltrosClientesIniciales();
                  setFiltrosClientes(limpios);
                  void ejecutarBusquedaClientes(limpios);
                }}
                className="rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          </form>

          <div className="bg-white rounded-2xl border border-borde p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borde pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Resultados de Clientes ({clientesPage?.totalElements ?? 0})
              </h3>
              {clientesPage && (
                <span className="text-xs font-semibold text-slate-500">
                  Página {clientesPage.page + 1} de {clientesPage.totalPages}
                </span>
              )}
            </div>

            {cargandoClientes ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Consultando clientes en el servidor...
              </div>
            ) : !clientesPage || clientesPage.content.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                No se encontraron clientes con los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-3">
                {clientesPage.content.map((item) => {
                  const p = item.perfil;
                  const nombreCompleto = construirNombreCompleto(p) || `Cliente #${p.id}`;
                  return (
                    <article
                      key={p.id}
                      className="rounded-2xl border border-borde bg-fondo/50 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-bold">
                            ID #{p.id}
                          </span>
                          <span className="font-bold text-slate-900 truncate">{nombreCompleto}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              p.activo
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 break-all">
                          {p.correo} • Tel: {p.telefonoMovil || 'N/D'}
                        </p>
                        <p className="text-xs text-slate-500">
                          CURP: <span className="font-mono">{p.curp}</span> • RFC:{' '}
                          <span className="font-mono">{p.rfc}</span> • Alta:{' '}
                          {formatearFechaCorta(item.fechaCreacion)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => void abrirEdicionCliente(p.id, p)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-borde bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-primario" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => verCuentasDeCliente(p.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-borde bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-primario" />
                          <span>Ver cuentas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => irAAuditoria(p.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-borde bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <ReceiptText className="w-3.5 h-3.5 text-primario" />
                          <span>Auditoría</span>
                        </button>
                        {p.activo && (
                          <button
                            type="button"
                            onClick={() => {
                              setClienteParaBaja(p);
                              setConfirmacionBajaTexto('');
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Dar de baja</span>
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {clientesPage && clientesPage.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-borde">
                <button
                  type="button"
                  disabled={clientesPage.first || cargandoClientes}
                  onClick={() => {
                    const siguiente = { ...filtrosClientes, page: Math.max(0, filtrosClientes.page - 1) };
                    setFiltrosClientes(siguiente);
                    void ejecutarBusquedaClientes(siguiente);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-borde bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
                <span className="text-xs font-semibold text-slate-600">
                  Página {clientesPage.page + 1} / {clientesPage.totalPages}
                </span>
                <button
                  type="button"
                  disabled={clientesPage.last || cargandoClientes}
                  onClick={() => {
                    const siguiente = { ...filtrosClientes, page: filtrosClientes.page + 1 };
                    setFiltrosClientes(siguiente);
                    void ejecutarBusquedaClientes(siguiente);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-borde bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {pestana === 'cuentas' && (
        <section className="space-y-5">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const actualizadas = { ...filtrosCuentas, page: 0 };
              setFiltrosCuentas(actualizadas);
              void ejecutarBusquedaCuentas(actualizadas);
            }}
            className="bg-white rounded-2xl border border-borde p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2 text-base font-bold text-slate-900">
              <CreditCard className="w-4 h-4 text-primario" />
              <h2>Búsqueda de Cuentas Bancarias</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label htmlFor="ej-cuenta-numero" className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de cuenta
                </label>
                <input
                  id="ej-cuenta-numero"
                  type="text"
                  placeholder="Ej. 9941467045485002"
                  value={filtrosCuentas.numeroCuenta}
                  onChange={(e) =>
                    setFiltrosCuentas((prev) => ({ ...prev, numeroCuenta: e.target.value }))
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="ej-cuenta-cliente-id" className="block text-xs font-semibold text-slate-700 mb-1">
                  ID de cliente titular
                </label>
                <input
                  id="ej-cuenta-cliente-id"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej. 3"
                  value={filtrosCuentas.clienteId}
                  onChange={(e) =>
                    setFiltrosCuentas((prev) => ({
                      ...prev,
                      clienteId: e.target.value.replace(/[^0-9]/g, ''),
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <label className="inline-flex items-center gap-2.5 rounded-xl border border-borde bg-fondo px-3.5 py-2.5 text-sm font-medium text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtrosCuentas.soloActivas}
                  onChange={(e) =>
                    setFiltrosCuentas((prev) => ({ ...prev, soloActivas: e.target.checked }))
                  }
                  className="h-4 w-4 accent-primario"
                />
                <span>Solo cuentas activas</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="submit"
                disabled={cargandoCuentas}
                className="inline-flex items-center gap-2 rounded-xl bg-primario px-4 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-50 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{cargandoCuentas ? 'Buscando...' : 'Buscar cuentas'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const iniciales = crearFiltrosCuentasIniciales();
                  setFiltrosCuentas(iniciales);
                  void ejecutarBusquedaCuentas(iniciales);
                }}
                className="rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          </form>

          <div className="bg-white rounded-2xl border border-borde p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borde pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Cuentas Encontradas ({cuentasPage?.totalElements ?? 0})
              </h3>
              {cuentasPage && (
                <span className="text-xs font-semibold text-slate-500">
                  Página {cuentasPage.page + 1} de {cuentasPage.totalPages}
                </span>
              )}
            </div>

            {cargandoCuentas ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Consultando cuentas bancarias...
              </div>
            ) : !cuentasPage || cuentasPage.content.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                No se encontraron cuentas con los criterios indicados.
              </div>
            ) : (
              <div className="space-y-3">
                {cuentasPage.content.map((cuenta) => (
                  <article
                    key={cuenta.id}
                    className="rounded-2xl border border-borde bg-fondo/50 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {cuenta.numeroCuenta}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            cuenta.estatus.toUpperCase() === 'ACTIVA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {cuenta.estatus}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-primario-oscuro">
                        Saldo: {formatearMonedaMxn(cuenta.saldo)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Cuenta #{cuenta.id} • Titular Cliente #{cuenta.clienteId} • Apertura:{' '}
                        {formatearFechaCorta(cuenta.fechaApertura)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void abrirEdicionCliente(cuenta.clienteId)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-borde bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-primario" />
                        <span>Ver titular</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => irAAuditoria(cuenta.clienteId, cuenta.numeroCuenta)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-borde bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <ReceiptText className="w-3.5 h-3.5 text-primario" />
                        <span>Auditar compras</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {cuentasPage && cuentasPage.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-borde">
                <button
                  type="button"
                  disabled={cuentasPage.first || cargandoCuentas}
                  onClick={() => {
                    const siguiente = { ...filtrosCuentas, page: Math.max(0, filtrosCuentas.page - 1) };
                    setFiltrosCuentas(siguiente);
                    void ejecutarBusquedaCuentas(siguiente);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-borde bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
                <span className="text-xs font-semibold text-slate-600">
                  Página {cuentasPage.page + 1} / {cuentasPage.totalPages}
                </span>
                <button
                  type="button"
                  disabled={cuentasPage.last || cargandoCuentas}
                  onClick={() => {
                    const siguiente = { ...filtrosCuentas, page: filtrosCuentas.page + 1 };
                    setFiltrosCuentas(siguiente);
                    void ejecutarBusquedaCuentas(siguiente);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-borde bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {pestana === 'usuarios' && (
        <section className="space-y-6">
          <div className="bg-white rounded-2xl border border-borde p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-slate-900">
              <UserCheck className="w-4 h-4 text-primario" />
              <h2>Consulta de Usuario del Sistema</h2>
            </div>

            <form
              noValidate
              onSubmit={(e) => void manejarConsultarUsuario(e)}
              className="flex flex-col sm:flex-row gap-3 sm:items-end"
            >
              <div className="flex-1 max-w-xs">
                <label htmlFor="ej-usuario-id" className="block text-xs font-semibold text-slate-700 mb-1">
                  ID de usuario *
                </label>
                <input
                  id="ej-usuario-id"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej. 2"
                  value={usuarioIdInput}
                  onChange={(e) => setUsuarioIdInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className={INPUT_CLASS}
                />
              </div>
              <button
                type="submit"
                disabled={cargandoUsuario}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primario px-4 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-50 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{cargandoUsuario ? 'Consultando...' : 'Consultar usuario'}</span>
              </button>
            </form>

            {usuarioConsultado && (
              <div className="rounded-2xl border border-borde bg-fondo p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-bold">
                      Usuario #{usuarioConsultado.id}
                    </span>
                    <span className="font-semibold text-slate-900">{usuarioConsultado.correo}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        usuarioConsultado.activo
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {usuarioConsultado.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {usuarioConsultado.clienteId && (
                    <span className="text-xs font-semibold text-slate-600">
                      Cliente asociado #{usuarioConsultado.clienteId}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  Creación: {formatearFechaCorta(usuarioConsultado.fechaCreacion)} • Última actualización:{' '}
                  {formatearFechaCorta(usuarioConsultado.fechaActualizacion)}
                </p>

                {usuarioConsultado.clienteId && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void abrirEdicionCliente(usuarioConsultado.clienteId!)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-borde bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-primario" />
                      <span>Editar cliente titular</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => irAAuditoria(usuarioConsultado.clienteId)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-borde bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <ReceiptText className="w-3.5 h-3.5 text-primario" />
                      <span>Auditar compras del titular</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-borde p-5 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-base font-bold text-slate-900">
              <ReceiptText className="w-4 h-4 text-primario" />
              <h2>Auditoría de Compras Exitosas y Comprobantes UPC</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void ejecutarAuditoriaCompras(auditoriaClienteId, auditoriaCuenta);
                }}
                className="rounded-2xl border border-borde bg-fondo/50 p-4 space-y-3"
              >
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Historial por Cliente o Cuenta
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ej-aud-cliente-id" className="block text-xs font-semibold text-slate-700 mb-1">
                      ID de cliente
                    </label>
                    <input
                      id="ej-aud-cliente-id"
                      type="text"
                      inputMode="numeric"
                      placeholder="Ej. 3"
                      value={auditoriaClienteId}
                      onChange={(e) =>
                        setAuditoriaClienteId(e.target.value.replace(/[^0-9]/g, ''))
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="ej-aud-cuenta" className="block text-xs font-semibold text-slate-700 mb-1">
                      Número de cuenta
                    </label>
                    <input
                      id="ej-aud-cuenta"
                      type="text"
                      placeholder="16 dígitos"
                      value={auditoriaCuenta}
                      onChange={(e) => setAuditoriaCuenta(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={cargandoAuditoria}
                  className="inline-flex items-center gap-2 rounded-xl bg-primario px-4 py-2 text-xs font-semibold text-white hover:bg-primario-oscuro disabled:opacity-50 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{cargandoAuditoria ? 'Consultando...' : 'Consultar historial exitoso'}</span>
                </button>
              </form>

              <form
                noValidate
                onSubmit={(e) => void manejarConsultarUpc(e)}
                className="rounded-2xl border border-borde bg-fondo/50 p-4 space-y-3"
              >
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Verificación Directa por Folio UPC
                </p>
                <div>
                  <label htmlFor="ej-aud-upc" className="block text-xs font-semibold text-slate-700 mb-1">
                    Código UPC del comprobante
                  </label>
                  <input
                    id="ej-aud-upc"
                    type="text"
                    placeholder="Ej. 7501234567890"
                    value={auditoriaUpc}
                    onChange={(e) => setAuditoriaUpc(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <button
                  type="submit"
                  disabled={cargandoAuditoria}
                  className="inline-flex items-center gap-2 rounded-xl border border-borde bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  <ReceiptText className="w-3.5 h-3.5 text-primario" />
                  <span>Consultar detalle UPC</span>
                </button>
              </form>
            </div>

            {auditoriaConsultada && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Operaciones Exitosas Encontradas ({comprasAuditadas.length})
                </h3>
                {comprasAuditadas.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No existen compras exitosas registradas para ese cliente o cuenta.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {comprasAuditadas.map((compra, index) => (
                      <button
                        key={`${compra.idTx ?? 'tx'}-${compra.upc}-${index}`}
                        type="button"
                        onClick={() => setCompraModal(compra)}
                        className="w-full text-left rounded-2xl border border-borde bg-white p-4 hover:border-primario hover:bg-primario-suave/20 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-900">
                            {compra.nombreProducto ?? compra.upc}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            UPC: <span className="font-mono">{compra.upc}</span> • ID Tx:{' '}
                            {compra.idTx || 'N/D'} • Fecha: {compra.fechaMostrar}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-primario-oscuro">
                            {formatearMonedaMxn(compra.monto)}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            Ver recibo
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <ExecutiveClientEditModal
        abierto={modalEditarAbierto}
        cliente={clienteEnEdicion}
        cargandoDetalle={cargandoDetalleCliente}
        onClose={() => {
          setModalEditarAbierto(false);
          setClienteEnEdicion(null);
        }}
        onGuardado={manejarClienteGuardado}
        clienteServiceOverride={clienteService}
      />

      <HistoryDetailModal
        compra={compraModal}
        onClose={() => setCompraModal(null)}
        onVerificarEnServidor={(upc) => transactionService.consultarDetallePorUpc(upc)}
      />

      {clienteParaBaja && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-baja-ejecutivo"
        >
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 id="titulo-baja-ejecutivo" className="text-lg font-bold text-slate-900">
                  Confirmar Baja Lógica de Cliente
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Se desactivará al cliente #{clienteParaBaja.id} ({construirNombreCompleto(clienteParaBaja)}), su acceso y cuentas asociadas.
                </p>
              </div>
            </div>

            {sesionActual?.clienteId === clienteParaBaja.id && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Este registro corresponde a tu propio cliente actual.</span>
              </div>
            )}

            <div>
              <label htmlFor="ej-confirmar-baja" className="block text-xs font-semibold text-slate-700 mb-1">
                Escribe <strong>BAJA</strong> para confirmar
              </label>
              <input
                id="ej-confirmar-baja"
                type="text"
                value={confirmacionBajaTexto}
                onChange={(e) => setConfirmacionBajaTexto(e.target.value)}
                placeholder="BAJA"
                className={INPUT_CLASS}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={procesandoBaja}
                onClick={() => {
                  setClienteParaBaja(null);
                  setConfirmacionBajaTexto('');
                }}
                className="rounded-xl border border-borde bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmacionBajaTexto.trim().toUpperCase() !== 'BAJA' || procesandoBaja}
                onClick={() => void confirmarBajaCliente()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{procesandoBaja ? 'Aplicando baja...' : 'Aplicar Baja Lógica'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
