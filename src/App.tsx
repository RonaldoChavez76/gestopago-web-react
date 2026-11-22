import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SessionProvider } from './context/SessionContext';
import { AccountOverviewPage } from './pages/AccountOverviewPage';
import { CatalogPage } from './pages/CatalogPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
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
          <Route path="/historial" element={<HistoryPage />} />
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
