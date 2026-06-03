import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useEmployeeAuth } from '../../context/EmployeeAuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Card from '../../components/ui/Card.jsx';

export default function EmployeeLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useEmployeeAuth();
  const navigate = useNavigate();

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
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-brand-50 to-stone-100 p-3 sm:p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-brand-800 sm:text-2xl">Diamond Pappadam</h1>
          <p className="mt-1 text-sm text-stone-500">Employee Portal</p>
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
