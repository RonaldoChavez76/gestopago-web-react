import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  CheckCircle2,
  Globe,
  LogOut,
  Monitor,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Store,
  UserCog,
  Wallet,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { LogoutConfirmModal } from './LogoutConfirmModal';

const ENLACES_NAVEGACION = [
  { to: '/', etiquetaDesktop: 'Mi Cuenta y Sesión', etiquetaMovil: 'Mi Sesión', icon: ShieldCheck },
  { to: '/catalogo', etiquetaDesktop: 'Catálogo', etiquetaMovil: 'Catálogo', icon: Store },
  { to: '/historial', etiquetaDesktop: 'Historial Exitoso', etiquetaMovil: 'Historial', icon: ReceiptText },
  { to: '/perfil', etiquetaDesktop: 'Mi Perfil', etiquetaMovil: 'Perfil', icon: UserCog },
];

export function formatearMonedaMxn(monto?: number): string {
  if (monto === undefined || monto === null || Number.isNaN(monto)) {
    return 'Sincronizando...';
  }
  return `$${monto.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MXN`;
}

export function AppLayout() {
  const { sesionActual, cargando, verificarVigenciaSesion, cerrarSesion } = useSession();
  const [modalLogoutAbierto, setModalLogoutAbierto] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [avisoVigencia, setAvisoVigencia] = useState<string | null>(null);

  if (!sesionActual) {
    return null;
  }

  const manejarVerificarVigencia = async () => {
    setVerificando(true);
    setAvisoVigencia(null);
    const activa = await verificarVigenciaSesion();
    setVerificando(false);
    if (activa) {
      setAvisoVigencia('Sesión única verificada y activa en el servidor.');
      window.setTimeout(() => setAvisoVigencia(null), 4000);
    }
  };

  const manejarConfirmarCierre = async () => {
    await cerrarSesion();
    setModalLogoutAbierto(false);
  };

  return (
    <div className="min-h-screen bg-fondo text-slate-900 flex flex-col lg:flex-row">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-borde">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-borde">
          <div className="w-9 h-9 rounded-xl bg-primario flex items-center justify-center text-white">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">GestoPago Web</p>
            <p className="text-xs text-slate-500 truncate">Comercio Digital</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {ENLACES_NAVEGACION.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive
                    ? 'bg-primario-suave text-primario-oscuro'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.etiquetaDesktop}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-borde space-y-3">
          <div className="rounded-xl bg-fondo p-3 border border-borde">
            <p className="text-xs text-slate-500">Saldo disponible</p>
            <p className="text-base font-bold text-primario-oscuro mt-0.5">
              {formatearMonedaMxn(sesionActual.saldoCuenta)}
            </p>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {sesionActual.nombreCliente ?? sesionActual.correo}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:pl-64 pb-16 lg:pb-0">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-borde">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Globe className="w-5 h-5 text-primario lg:hidden shrink-0" />
              <span className="font-bold text-slate-900 text-sm sm:text-base truncate">
                Ecosistema Digital GestoPago
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primario-suave text-primario-oscuro shrink-0">
                <Monitor className="w-3.5 h-3.5" />
                Sesión {sesionActual.plataforma}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={verificando}
                onClick={() => void manejarVerificarVigencia()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-borde bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 text-primario ${verificando ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Verificar vigencia</span>
              </button>
              <button
                type="button"
                disabled={cargando}
                onClick={() => setModalLogoutAbierto(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-borde bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 disabled:opacity-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>

          {avisoVigencia && (
            <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-2">
              <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{avisoVigencia}</span>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-borde grid grid-cols-4">
        {ENLACES_NAVEGACION.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => void verificarVigenciaSesion()}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 text-xs font-semibold ${isActive ? 'text-primario' : 'text-slate-500'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.etiquetaMovil}</span>
            </NavLink>
          );
        })}
      </nav>

      <LogoutConfirmModal
        abierto={modalLogoutAbierto}
        cargando={cargando}
        onCancel={() => setModalLogoutAbierto(false)}
        onConfirm={() => void manejarConfirmarCierre()}
      />
    </div>
  );
}
