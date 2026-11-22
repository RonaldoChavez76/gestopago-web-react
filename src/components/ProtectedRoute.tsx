import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

export function ProtectedRoute() {
  const { estaAutenticado } = useSession();

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
