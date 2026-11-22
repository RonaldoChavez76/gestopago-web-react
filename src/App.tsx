import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Globe, Layers, ShieldCheck, Server } from 'lucide-react';
import {
  BACKEND_ENVIRONMENTS,
  type BackendEnvironmentId,
  type BackendEnvironmentOption,
  PLATAFORMA_WEB,
  getEnvironment,
  setEnvironment,
  subscribeEnvironment,
} from './config/apiConfig';

const RUTAS_ECOSISTEMA = [
  { ruta: '/login', titulo: 'Autenticación Web', estado: 'Fase 2' },
  { ruta: '/verificacion-2fa', titulo: 'Doble Factor (2FA OTP)', estado: 'Fase 2' },
  { ruta: '/catalogo', titulo: 'Catálogo GestoPago', estado: 'Fase 3' },
  { ruta: '/comprar', titulo: 'Compra de Productos', estado: 'Fase 4' },
  { ruta: '/historial', titulo: 'Historial Sincronizado', estado: 'Fase 5' },
];

function BaseArchitectureView() {
  const [entornoActual, setEntornoActual] = useState<BackendEnvironmentOption>(() =>
    getEnvironment(),
  );

  useEffect(() => {
    return subscribeEnvironment((nuevoEntorno) => {
      setEntornoActual(nuevoEntorno);
    });
  }, []);

  const manejarCambioEntorno = (id: BackendEnvironmentId) => {
    setEnvironment(id);
  };

  return (
    <div className="min-h-screen bg-fondo text-slate-900 flex flex-col">
      <header className="bg-white border-b border-borde">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primario flex items-center justify-center text-white shadow-sm">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                GestoPago Web
              </h1>
              <p className="text-xs text-slate-500">Ecosistema de Comercio Digital</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primario-suave text-primario">
            <ShieldCheck className="w-3.5 h-3.5" />
            Plataforma: {PLATAFORMA_WEB}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <section className="bg-white rounded-2xl border border-borde p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primario">
                Fase 1 Completada
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                Arquitectura Base React + TypeScript
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-2xl">
                Cliente HTTP centralizado con manejo de sesiones únicas, códigos 2FA, modelos
                tipados y soporte PWA listo para consumir las APIs REST reales de GestoPago.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-borde grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                <Server className="w-4 h-4 text-primario" />
                Entorno Backend REST Activo
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(BACKEND_ENVIRONMENTS).map((env) => {
                  const seleccionado = entornoActual.id === env.id;
                  return (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => manejarCambioEntorno(env.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        seleccionado
                          ? 'border-primario bg-primario-suave/60 ring-2 ring-primario/20'
                          : 'border-borde bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{env.etiqueta}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">{env.baseUrl}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-fondo rounded-xl p-4 border border-borde flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Endpoint Base Configurado
              </p>
              <p className="text-sm font-mono text-primario-oscuro mt-1.5 break-all">
                {entornoActual.baseUrl}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Almacenamiento de sesión: <span className="font-semibold">sessionStorage</span>
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-borde p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-primario" />
            <h3 className="text-base font-bold text-slate-900">
              Mapa de Rutas del Ecosistema Web
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {RUTAS_ECOSISTEMA.map((item) => (
              <div
                key={item.ruta}
                className="p-4 rounded-xl border border-borde bg-fondo/50 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.titulo}</p>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{item.ruta}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-borde text-primario">
                  {item.estado}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BaseArchitectureView />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/verificacion-2fa" element={<Navigate to="/" replace />} />
        <Route path="/catalogo" element={<Navigate to="/" replace />} />
        <Route path="/comprar" element={<Navigate to="/" replace />} />
        <Route path="/historial" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
