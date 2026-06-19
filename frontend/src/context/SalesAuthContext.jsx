import { createAuthProvider } from './createAuthProvider.jsx';

const { AuthProvider, useAuth } = createAuthProvider('sales', 'sales');

export { AuthProvider as SalesAuthProvider, useAuth as useSalesAuth };
