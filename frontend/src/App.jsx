import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './context/AdminAuthContext.jsx';
import { useEmployeeAuth } from './context/EmployeeAuthContext.jsx';
import AdminRoutes from './routes/AdminRoutes.jsx';
import EmployeeRoutes from './routes/EmployeeRoutes.jsx';

function RootRedirect() {
  const { user: adminUser, loading: adminLoading, mustChangePassword: adminMcp } = useAdminAuth();
  const { user: employeeUser, loading: employeeLoading, mustChangePassword: employeeMcp } =
    useEmployeeAuth();

  if (adminLoading || employeeLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (adminUser) {
    if (adminMcp) return <Navigate to="/admin/change-password" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (employeeUser) {
    if (employeeMcp) return <Navigate to="/employee/change-password" replace />;
    return <Navigate to="/employee/dashboard" replace />;
  }

  return <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Navigate to="/admin/login" replace />} />
      {AdminRoutes()}
      {EmployeeRoutes()}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
