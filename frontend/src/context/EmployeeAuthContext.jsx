import { createAuthProvider } from './createAuthProvider.jsx';

const { AuthProvider, useAuth } = createAuthProvider('employee', 'employee');

export { AuthProvider as EmployeeAuthProvider, useAuth as useEmployeeAuth };
