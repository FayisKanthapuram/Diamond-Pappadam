import { Route, Navigate } from 'react-router-dom';
import EmployeeProtectedRoute from '../components/EmployeeProtectedRoute.jsx';
import EmployeeLayout from '../layouts/EmployeeLayout.jsx';
import EmployeeLogin from '../pages/employee/Login.jsx';
import EmployeeChangePassword from '../pages/employee/ChangePassword.jsx';
import EmployeeDashboard from '../pages/employee/Dashboard.jsx';
import AddProduction from '../pages/employee/AddProduction.jsx';
import MyProduction from '../pages/employee/MyProduction.jsx';
import MySalaryLedger from '../pages/employee/MySalaryLedger.jsx';

export default function EmployeeRoutes() {
  return (
    <>
      <Route path="/employee/login" element={<EmployeeLogin />} />
      <Route
        path="/employee/change-password"
        element={
          <EmployeeProtectedRoute>
            <EmployeeChangePassword />
          </EmployeeProtectedRoute>
        }
      />
      <Route
        element={
          <EmployeeProtectedRoute>
            <EmployeeLayout />
          </EmployeeProtectedRoute>
        }
      >
        <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee/production" element={<AddProduction />} />
        <Route path="/employee/history" element={<MyProduction />} />
        <Route path="/employee/salary-ledger" element={<MySalaryLedger />} />
        <Route path="/employee/earnings" element={<Navigate to="/employee/salary-ledger" replace />} />
      </Route>
    </>
  );
}
