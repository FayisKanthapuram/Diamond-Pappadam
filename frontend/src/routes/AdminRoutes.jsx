import { Route, Navigate } from 'react-router-dom';
import AdminProtectedRoute from '../components/AdminProtectedRoute.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import AdminLogin from '../pages/admin/Login.jsx';
import AdminChangePassword from '../pages/admin/ChangePassword.jsx';
import AdminDashboard from '../pages/admin/Dashboard.jsx';
import Employees from '../pages/admin/Employees.jsx';
import Reports from '../pages/admin/Reports.jsx';
import Payroll from '../pages/admin/Payroll.jsx';
import ProductionApprovals from '../pages/admin/ProductionApprovals.jsx';
import Settings from '../pages/admin/Settings.jsx';

export default function AdminRoutes() {
  return (
    <>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/change-password"
        element={
          <AdminProtectedRoute>
            <AdminChangePassword />
          </AdminProtectedRoute>
        }
      />
      <Route
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/employees" element={<Employees />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/approvals" element={<ProductionApprovals />} />
        <Route path="/admin/payroll" element={<Payroll />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Route>
    </>
  );
}
