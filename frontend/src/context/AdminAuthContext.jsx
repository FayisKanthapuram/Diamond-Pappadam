import { createAuthProvider } from './createAuthProvider.jsx';

const { AuthProvider, useAuth } = createAuthProvider('admin', 'admin');

export { AuthProvider as AdminAuthProvider, useAuth as useAdminAuth };
