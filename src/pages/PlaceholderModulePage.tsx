import { Link } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';

export interface PlaceholderModulePageProps {
  titulo: string;
  descripcion: string;
  faseDestino: string;
}

export function PlaceholderModulePage({
  titulo,
  descripcion,
  faseDestino,
}: PlaceholderModulePageProps) {
  return (
    <div className="bg-white rounded-2xl border border-borde p-8 text-center max-w-xl mx-auto shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-primario-suave text-primario flex items-center justify-center mx-auto mb-4">
        <Layers className="w-6 h-6" />
      </div>
      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-fondo border border-borde text-primario mb-3">
        Programado para {faseDestino}
      </span>
      <h1 className="text-xl font-bold text-slate-900">{titulo}</h1>
      <p className="text-sm text-slate-600 mt-2">{descripcion}</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primario px-5 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Mi Cuenta y Sesión</span>
      </Link>
    </div>
  );
}
