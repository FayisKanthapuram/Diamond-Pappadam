import { Route, Navigate } from 'react-router-dom';
import AdminProtectedRoute from '../components/AdminProtectedRoute.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import AdminLogin from '../pages/admin/Login.jsx';
import AdminChangePassword from '../pages/admin/ChangePassword.jsx';
import AdminDashboard from '../pages/admin/Dashboard.jsx';
import Employees from '../pages/admin/Employees.jsx';
import Reports from '../pages/admin/Reports.jsx';
import SalaryLedger from '../pages/admin/SalaryLedger.jsx';
import SalaryLedgerDetail from '../pages/admin/SalaryLedgerDetail.jsx';
import ProductionApprovals from '../pages/admin/ProductionApprovals.jsx';
import Settings from '../pages/admin/Settings.jsx';
import ActivityLogs from '../pages/admin/ActivityLogs.jsx';

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
        <Route path="/admin/salary-ledger" element={<SalaryLedger />} />
        <Route path="/admin/salary-ledger/:employeeId" element={<SalaryLedgerDetail />} />
        <Route path="/admin/payroll" element={<Navigate to="/admin/salary-ledger" replace />} />
        <Route path="/admin/payroll/*" element={<Navigate to="/admin/salary-ledger" replace />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/activity-logs" element={<ActivityLogs />} />
      </Route>
    </>
  );
}
