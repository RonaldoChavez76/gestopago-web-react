import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SessionProvider } from './context/SessionContext';
import { AccountOverviewPage } from './pages/AccountOverviewPage';
import { AccountProfilePage } from './pages/AccountProfilePage';
import { CatalogPage } from './pages/CatalogPage';
import { ExecutiveDashboardPage } from './pages/ExecutiveDashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
import { PurchasePage } from './pages/PurchasePage';
import { RegisterPage } from './pages/RegisterPage';
import { TwoFactorPage } from './pages/TwoFactorPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/verificacion-2fa" element={<TwoFactorPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<AccountOverviewPage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/comprar" element={<PurchasePage />} />
          <Route path="/historial" element={<HistoryPage />} />
          <Route path="/perfil" element={<AccountProfilePage />} />
          <Route path="/ejecutivo" element={<ExecutiveDashboardPage />} />
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
