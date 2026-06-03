import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productionsApi, settingsApi } from '../../api/index.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatCurrency, todayInputValue } from '../../utils/format.js';

export default function AddProduction() {
  const [date, setDate] = useState(todayInputValue());
  const [dryMachineKg, setDryMachineKg] = useState('');
  const [nonMachineKg, setNonMachineKg] = useState('');
  const [notes, setNotes] = useState('');
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    settingsApi.get().then((res) => setRates(res.data)).catch(() => {});
  }, []);

  const preview = useMemo(() => {
    if (!rates) return null;
    const dry = parseFloat(dryMachineKg) || 0;
    const non = parseFloat(nonMachineKg) || 0;
    const dryAmt = dry * rates.dryMachineRate;
    const nonAmt = non * rates.nonMachineRate;
    return { dryAmt, nonAmt, total: dryAmt + nonAmt };
  }, [dryMachineKg, nonMachineKg, rates]);

  async function handleSubmit(e) {
    e.preventDefault();
    const dry = parseFloat(dryMachineKg) || 0;
    const non = parseFloat(nonMachineKg) || 0;
    if (dry === 0 && non === 0) {
      toast.error('Enter at least some production');
      return;
    }
    setLoading(true);
    try {
      await productionsApi.create({ date, dryMachineKg: dry, nonMachineKg: non, notes });
      toast.success('Production submitted for approval');
      navigate('/employee/history');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      <PageHeader title="Add Production" />
      <Card>
        {rates && (
          <p className="mb-4 text-sm text-stone-500">
            Current rates: Dry {formatCurrency(rates.dryMachineRate)}/kg · Non-Machine{' '}
            {formatCurrency(rates.nonMachineRate)}/kg (saved on submit)
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input
            label="Dry Machine KG"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={dryMachineKg}
            onChange={(e) => setDryMachineKg(e.target.value)}
          />
          <Input
            label="Non-Machine KG"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={nonMachineKg}
            onChange={(e) => setNonMachineKg(e.target.value)}
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Overtime, extra production, correction..."
          />
          {preview && (
            <div className="rounded-lg bg-brand-50 p-4 text-sm">
              <p>Dry Machine: {formatCurrency(preview.dryAmt)}</p>
              <p>Non-Machine: {formatCurrency(preview.nonAmt)}</p>
              <p className="mt-2 text-base font-semibold">Total: {formatCurrency(preview.total)}</p>
            </div>
          )}
          <Button type="submit" className="!w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Production'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
