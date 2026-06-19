import { Route, Navigate } from 'react-router-dom';
import SalesProtectedRoute from '../components/SalesProtectedRoute.jsx';
import SalesLayout from '../layouts/SalesLayout.jsx';
import SalesLogin from '../pages/sales/Login.jsx';
import SalesChangePassword from '../pages/sales/ChangePassword.jsx';
import SalesDashboard from '../pages/sales/Dashboard.jsx';
import CustomerDetail from '../pages/sales/CustomerDetail.jsx';
import SalesEntry from '../pages/sales/SalesEntry.jsx';
import SalesList from '../pages/sales/SalesList.jsx';
import Ledger from '../pages/sales/Ledger.jsx';

export default function SalesRoutes() {
  return (
    <>
      <Route path="/sales/login" element={<SalesLogin />} />
      <Route
        path="/sales/change-password"
        element={
          <SalesProtectedRoute>
            <SalesChangePassword />
          </SalesProtectedRoute>
        }
      />
      <Route
        element={
          <SalesProtectedRoute>
            <SalesLayout />
          </SalesProtectedRoute>
        }
      >
        <Route path="/sales" element={<Navigate to="/sales/dashboard" replace />} />
        <Route path="/sales/dashboard" element={<SalesDashboard />} />
        <Route path="/sales/customers" element={<Navigate to="/sales/dashboard" replace />} />
        <Route path="/sales/customers/:id" element={<CustomerDetail />} />
        <Route path="/sales/sales" element={<SalesList />} />
        <Route path="/sales/sales/new" element={<SalesEntry />} />
        <Route path="/sales/ledger" element={<Ledger />} />
      </Route>
    </>
  );
}
