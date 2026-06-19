import { Navigate, useLocation } from 'react-router-dom';
import { useSalesAuth } from '../context/SalesAuthContext.jsx';

export default function SalesProtectedRoute({ children }) {
  const { user, loading, mustChangePassword } = useSalesAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center p-4">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'sales') {
    return <Navigate to="/sales/login" state={{ from: location }} replace />;
  }

  if (mustChangePassword && !location.pathname.includes('change-password')) {
    return <Navigate to="/sales/change-password" replace />;
  }

  return children;
}
