import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { settingsApi, gramTypesApi, qualityTypesApi } from '../../api/index.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import LookupTypeManager from '../../components/LookupTypeManager.jsx';

const TABS = [
  { id: 'rates', label: 'Pay Rates' },
  { id: 'gram', label: 'Gram Types' },
  { id: 'quality', label: 'Quality Types' },
];

export default function Settings() {
  const [tab, setTab] = useState('rates');
  const [dryMachineRate, setDryMachineRate] = useState('');
  const [nonMachineRate, setNonMachineRate] = useState('');
  const [gramTypes, setGramTypes] = useState([]);
  const [qualityTypes, setQualityTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      settingsApi.get(),
      gramTypesApi.list(),
      qualityTypesApi.list(),
    ])
      .then(([ratesRes, gramRes, qualityRes]) => {
        setDryMachineRate(String(ratesRes.data.dryMachineRate));
        setNonMachineRate(String(ratesRes.data.nonMachineRate));
        setGramTypes(gramRes.data.gramTypes);
        setQualityTypes(qualityRes.data.qualityTypes);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRatesSubmit(e) {
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
    <div className="w-full max-w-2xl">
      <PageHeader
        title="Settings"
        subtitle="Pay rates, gram types, and quality types for production entry."
      />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-stone-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`touch-target border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'border-brand-600 text-brand-800'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'rates' && (
        <Card title="Rate Per KG (Salary Calculation)">
          {loading ? (
            <p className="text-stone-500">Loading...</p>
          ) : (
            <form onSubmit={handleRatesSubmit} className="space-y-4">
              <p className="text-sm text-stone-500">
                Salary uses total Dry Machine KG and total Non-Machine KG only.
              </p>
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
      )}

      {tab === 'gram' && (
        <LookupTypeManager
          title="Gram Types"
          types={gramTypes}
          loading={loading}
          onCreate={(name) => gramTypesApi.create(name).then(() => load())}
          onUpdate={(id, data) => gramTypesApi.update(id, data).then(() => load())}
        />
      )}

      {tab === 'quality' && (
        <LookupTypeManager
          title="Quality Types"
          types={qualityTypes}
          loading={loading}
          onCreate={(name) => qualityTypesApi.create(name).then(() => load())}
          onUpdate={(id, data) => qualityTypesApi.update(id, data).then(() => load())}
        />
      )}
    </div>
  );
}
