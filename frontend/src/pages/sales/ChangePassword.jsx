import ChangePasswordForm from '../../components/ChangePasswordForm.jsx';
import { useSalesAuth } from '../../context/SalesAuthContext.jsx';

export default function SalesChangePassword() {
  return (
    <ChangePasswordForm
      realm="sales"
      useAuth={useSalesAuth}
      dashboardPath="/sales/dashboard"
    />
  );
}
