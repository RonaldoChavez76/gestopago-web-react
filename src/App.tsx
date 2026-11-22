import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SessionProvider } from './context/SessionContext';
import { AccountOverviewPage } from './pages/AccountOverviewPage';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderModulePage } from './pages/PlaceholderModulePage';
import { TwoFactorPage } from './pages/TwoFactorPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verificacion-2fa" element={<TwoFactorPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<AccountOverviewPage />} />
          <Route
            path="/catalogo"
            element={
              <PlaceholderModulePage
                titulo="Catálogo Dinámico de Productos GestoPago"
                descripcion="Aquí se mostrarán las recargas telefónicas, pagos de servicios y pines digitales consumidos directamente desde el backend REST."
                faseDestino="Fase 3"
              />
            }
          />
          <Route
            path="/comprar"
            element={
              <PlaceholderModulePage
                titulo="Módulo Transaccional de Compras"
                descripcion="Flujo de compra con confirmación previa y clasificación de estados (exitosa, rechazada, pendiente y error de comunicación)."
                faseDestino="Fase 4"
              />
            }
          />
          <Route
            path="/historial"
            element={
              <PlaceholderModulePage
                titulo="Historial de Compras Exitosas"
                descripcion="Consulta sincronizada entre la aplicación móvil Flutter y la plataforma web React mostrando únicamente transacciones exitosas."
                faseDestino="Fase 5"
              />
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </BrowserRouter>
  );
}

export default App;
