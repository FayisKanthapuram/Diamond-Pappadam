import ChangePasswordForm from '../../components/ChangePasswordForm.jsx';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';

export default function AdminChangePassword() {
  return (
    <ChangePasswordForm
      realm="admin"
      useAuth={useAdminAuth}
      dashboardPath="/admin/dashboard"
    />
  );
}
