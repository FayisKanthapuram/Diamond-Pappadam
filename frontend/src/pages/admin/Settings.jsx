import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../api/index.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function Settings() {
  const [dryMachineRate, setDryMachineRate] = useState('');
  const [nonMachineRate, setNonMachineRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi
      .get()
      .then((res) => {
        setDryMachineRate(String(res.data.dryMachineRate));
        setNonMachineRate(String(res.data.nonMachineRate));
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.update({
        dryMachineRate: parseFloat(dryMachineRate),
        nonMachineRate: parseFloat(nonMachineRate),
      });
      toast.success('Rates updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      <PageHeader title="Production Settings" subtitle="Rates apply to new production entries only." />
      <Card title="Rate Per KG">
        {loading ? (
          <p className="text-stone-500">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Dry Machine Rate (₹/kg)"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={dryMachineRate}
              onChange={(e) => setDryMachineRate(e.target.value)}
              required
            />
            <Input
              label="Non-Machine Rate (₹/kg)"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={nonMachineRate}
              onChange={(e) => setNonMachineRate(e.target.value)}
              required
            />
            <Button type="submit" className="!w-full" disabled={saving}>
              {saving ? 'Saving...' : 'Save Rates'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
