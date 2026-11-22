import { Link } from 'react-router-dom';
import { ReceiptText, ShieldCheck, Store } from 'lucide-react';
import { formatearMonedaMxn } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';

export function AccountOverviewPage() {
  const { sesionActual } = useSession();

  if (!sesionActual) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-primario to-primario-oscuro p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {sesionActual.nombreCliente ?? sesionActual.correo}
          </h1>
          <span className="inline-flex items-center self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-white text-primario-oscuro text-xs font-bold shadow-xs">
            2FA Verificado • {sesionActual.plataforma}
          </span>
        </div>

        <div className="mt-6">
          <p className="text-sm text-white/80">Saldo Disponible</p>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1">
            {formatearMonedaMxn(sesionActual.saldoCuenta)}
          </p>
        </div>

        <p className="mt-4 text-xs sm:text-sm text-white/90">
          Cuenta: {sesionActual.numeroCuenta ?? '4229215075268914'} • Correo: {sesionActual.correo}
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-borde p-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-primario" />
          <h2 className="text-lg font-bold text-slate-900">Estado de Sesión Única Activa</h2>
        </div>

        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Tu sesión se encuentra protegida con JWT y vinculada exclusivamente a la plataforma{' '}
          <span className="font-semibold text-slate-900">{sesionActual.plataforma}</span>. Si
          intentas iniciar sesión desde otro dispositivo, el servidor detectará esta sesión activa y
          solicitará confirmación antes de reemplazarla.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 rounded-xl bg-primario px-5 py-3 text-sm font-semibold text-white hover:bg-primario-oscuro transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Explorar Catálogo de Productos</span>
          </Link>
          <Link
            to="/historial"
            className="inline-flex items-center gap-2 rounded-xl border border-borde bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ReceiptText className="w-4 h-4 text-primario" />
            <span>Consultar Historial de Compras</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
