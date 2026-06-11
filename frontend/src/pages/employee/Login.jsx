import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useEmployeeAuth } from '../../context/EmployeeAuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Card from '../../components/ui/Card.jsx';

export default function EmployeeLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, mustChangePassword, login } = useEmployeeAuth();
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (user?.role === 'employee') {
    if (mustChangePassword) {
      return <Navigate to="/employee/change-password" replace />;
    }
    return <Navigate to="/employee/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { mustChangePassword } = await login(phone, password);
      toast.success('Welcome back!');
      if (mustChangePassword) {
        navigate('/employee/change-password');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-brand-50/20 via-slate-50 to-indigo-50/30 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Diamond Pappadam</h1>
          <p className="mt-2 text-sm font-semibold text-brand-600 uppercase tracking-wider">Employee Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Phone Number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="Enter phone number"
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter password"
          />
          <Button type="submit" className="!w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Employee Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
