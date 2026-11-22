import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SessionProvider } from './context/SessionContext';
import { AccountOverviewPage } from './pages/AccountOverviewPage';
import { CatalogPage } from './pages/CatalogPage';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderModulePage } from './pages/PlaceholderModulePage';
import { PurchasePage } from './pages/PurchasePage';
import { TwoFactorPage } from './pages/TwoFactorPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verificacion-2fa" element={<TwoFactorPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<AccountOverviewPage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/comprar" element={<PurchasePage />} />
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
