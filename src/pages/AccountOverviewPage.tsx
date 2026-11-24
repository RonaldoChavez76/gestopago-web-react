import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  CreditCard,
  ReceiptText,
  ShieldCheck,
  Store,
  UserCog,
} from 'lucide-react';
import { BbvaClientCard } from '../components/BbvaClientCard';
import { useSession } from '../context/SessionContext';
import { esCuentaActiva, esUsuarioEjecutivo } from '../models/auth';

export function AccountOverviewPage() {
  const { sesionActual } = useSession();

  if (!sesionActual) {
    return null;
  }

  const esEjecutivo = esUsuarioEjecutivo(sesionActual);
  const cuentaActiva = esCuentaActiva(sesionActual);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-7">
          <BbvaClientCard
            nombreTitular={sesionActual.nombreCliente ?? sesionActual.correo}
            correo={sesionActual.correo}
            numeroCuenta={sesionActual.numeroCuenta}
            saldoCuenta={sesionActual.saldoCuenta}
            plataforma={sesionActual.plataforma}
            esEjecutivo={esEjecutivo}
            cuentaActiva={cuentaActiva}
            clienteId={sesionActual.clienteId}
            headingTitular={true}
          />
        </div>

        <section className="xl:col-span-5 bg-white rounded-3xl border border-borde p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primario-suave text-primario flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Estado de Sesión Única Activa
                </h2>
                <p className="text-xs text-slate-500">
                  Protección bancaria con JWT y código OTP 2FA
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Tu sesión se encuentra protegida con JWT y vinculada exclusivamente a la plataforma{' '}
              <span className="font-semibold text-slate-900">{sesionActual.plataforma}</span>. Si
              intentas iniciar sesión desde otro dispositivo, el servidor detectará esta sesión
              activa y solicitará confirmación antes de reemplazarla.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-borde text-xs">
            <div className="rounded-2xl bg-fondo p-3 border border-borde">
              <p className="text-slate-500">Plataforma en uso</p>
              <p className="font-bold text-slate-900 mt-0.5">{sesionActual.plataforma}</p>
            </div>
            <div className="rounded-2xl bg-fondo p-3 border border-borde">
              <p className="text-slate-500">Tipo de cuenta</p>
              <p className="font-bold text-primario-oscuro mt-0.5">
                {esEjecutivo ? 'Ejecutivo GestoPago' : 'Cliente Digital'}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="bg-white rounded-3xl border border-borde p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primario" />
          <h2 className="text-lg font-bold text-slate-900">Accesos Rápidos de tu Cuenta</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            to="/catalogo"
            className="flex items-center gap-3 rounded-2xl bg-primario px-4 py-3.5 text-sm font-semibold text-white hover:bg-primario-oscuro transition-colors"
          >
            <Store className="w-5 h-5 shrink-0" />
            <span>Explorar Catálogo de Productos</span>
          </Link>
          <Link
            to="/historial"
            className="flex items-center gap-3 rounded-2xl border border-borde bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ReceiptText className="w-5 h-5 text-primario shrink-0" />
            <span>Consultar Historial de Compras</span>
          </Link>
          <Link
            to="/perfil"
            className="flex items-center gap-3 rounded-2xl border border-borde bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <UserCog className="w-5 h-5 text-primario shrink-0" />
            <span>Editar Perfil y Cuenta</span>
          </Link>
          {esEjecutivo && (
            <Link
              to="/ejecutivo"
              className="flex items-center gap-3 rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              <BriefcaseBusiness className="w-5 h-5 shrink-0" />
              <span>Abrir Panel Ejecutivo</span>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
