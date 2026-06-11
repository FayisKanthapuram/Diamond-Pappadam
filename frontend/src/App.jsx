import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import AdminRoutes from './routes/AdminRoutes.jsx';
import EmployeeRoutes from './routes/EmployeeRoutes.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        {AdminRoutes()}
        {EmployeeRoutes()}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <InstallPrompt />
    </>
  );
}
