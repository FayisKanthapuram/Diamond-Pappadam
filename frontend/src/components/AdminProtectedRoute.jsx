import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

export default function AdminProtectedRoute({ children }) {
  const { user, loading, mustChangePassword } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center p-4">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (mustChangePassword && !location.pathname.includes('change-password')) {
    return <Navigate to="/admin/change-password" replace />;
  }

  return children;
}
