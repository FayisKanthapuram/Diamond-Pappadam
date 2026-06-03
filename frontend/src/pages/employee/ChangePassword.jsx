import ChangePasswordForm from '../../components/ChangePasswordForm.jsx';
import { useEmployeeAuth } from '../../context/EmployeeAuthContext.jsx';

export default function EmployeeChangePassword() {
  return (
    <ChangePasswordForm
      realm="employee"
      useAuth={useEmployeeAuth}
      dashboardPath="/employee/dashboard"
    />
  );
}
