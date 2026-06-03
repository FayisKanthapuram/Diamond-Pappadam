import { Navigate, useLocation } from 'react-router-dom';
import { useEmployeeAuth } from '../context/EmployeeAuthContext.jsx';

export default function EmployeeProtectedRoute({ children }) {
  const { user, loading, mustChangePassword } = useEmployeeAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center p-4">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'employee') {
    return <Navigate to="/employee/login" state={{ from: location }} replace />;
  }

  if (mustChangePassword && !location.pathname.includes('change-password')) {
    return <Navigate to="/employee/change-password" replace />;
  }

  return children;
}
