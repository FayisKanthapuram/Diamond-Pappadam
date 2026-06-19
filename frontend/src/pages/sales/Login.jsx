import { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSalesAuth } from '../../context/SalesAuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';

export default function SalesLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, mustChangePassword, login } = useSalesAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/sales/dashboard';

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (user?.role === 'sales') {
    if (mustChangePassword) {
      return <Navigate to="/sales/change-password" replace />;
    }
    return <Navigate to="/sales/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!phone || !password) {
      return toast.error('Please fill in all fields');
    }

    setLoading(true);
    try {
      await login(phone, password);
      toast.success('Logged in successfully');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto w-full max-w-[24rem]">
        <div className="text-center">
          <span className="text-4xl" role="img" aria-label="diamond">💎</span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Diamond Pappadam
          </h1>
          <p className="mt-2 text-sm text-slate-400">Sales Portal Login</p>
        </div>

        <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur px-6 py-8 shadow-2xl sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="e.g. 8888888888"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              required
              className="bg-slate-900 border-white/[0.1] text-white focus:border-blue-500"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="bg-slate-900 border-white/[0.1] text-white focus:border-blue-500"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] font-bold text-white transition-all duration-200"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
