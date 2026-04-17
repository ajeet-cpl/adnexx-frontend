import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserRoles } from '@/utils/auth';

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function RoleGuard({ allowed, children }) {
  const roles = getUserRoles();
  const hasAccess = allowed.some((r) => roles.includes(r));

  if (!hasAccess) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
