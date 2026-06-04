import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productionsApi, settingsApi, gramTypesApi, qualityTypesApi } from '../../api/index.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ProductionItemsEditor, {
  rowsToPayload,
  sumRowsForPreview,
} from '../../components/ProductionItemsEditor.jsx';
import { formatCurrency, todayInputValue } from '../../utils/format.js';

const initialRows = [
  {
    type: 'normal',
    method: 'dry',
    gramTypeId: '',
    qualityTypeId: '',
    specialType: '',
    kg: '',
  },
];

export default function AddProduction() {
  const [date, setDate] = useState(todayInputValue());
  const [rows, setRows] = useState(initialRows);
  const [notes, setNotes] = useState('');
  const [rates, setRates] = useState(null);
  const [gramTypes, setGramTypes] = useState([]);
  const [qualityTypes, setQualityTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([settingsApi.get(), gramTypesApi.list(), qualityTypesApi.list()])
      .then(([ratesRes, gramRes, qualityRes]) => {
        setRates(ratesRes.data);
        setGramTypes(gramRes.data.gramTypes.filter((g) => g.active));
        setQualityTypes(qualityRes.data.qualityTypes.filter((q) => q.active));
      })
      .catch(() => toast.error('Failed to load settings'));
  }, []);

  const preview = useMemo(() => {
    if (!rates) return null;
    const { dryMachineKg, nonMachineKg } = sumRowsForPreview(rows);
    const dryAmt = dryMachineKg * rates.dryMachineRate;
    const nonAmt = nonMachineKg * rates.nonMachineRate;
    return { dryMachineKg, nonMachineKg, dryAmt, nonAmt, total: dryAmt + nonAmt };
  }, [rows, rates]);

  async function handleSubmit(e) {
    e.preventDefault();
    const { dryMachineKg, nonMachineKg } = sumRowsForPreview(rows);
    if (dryMachineKg === 0 && nonMachineKg === 0) {
      toast.error('Enter at least some production');
      return;
    }
    setLoading(true);
    try {
      await productionsApi.create({
        date,
        items: rowsToPayload(rows),
        notes,
      });
      toast.success('Production submitted for approval');
      navigate('/employee/history');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <PageHeader
        title="Add Production"
        subtitle="Add one or more rows. Salary is calculated from total Dry Machine and Non-Machine KG."
      />
      <Card>
        {rates && (
          <p className="mb-4 text-sm text-stone-500">
            Rates: Dry {formatCurrency(rates.dryMachineRate)}/kg · Non-Machine{' '}
            {formatCurrency(rates.nonMachineRate)}/kg
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <ProductionItemsEditor
            rows={rows}
            onChange={setRows}
            gramTypes={gramTypes}
            qualityTypes={qualityTypes}
          />

          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Overtime, extra production..."
          />

          {preview && (
            <div className="rounded-lg bg-brand-50 p-4 text-sm">
              <p>Dry Machine total: {preview.dryMachineKg} kg → {formatCurrency(preview.dryAmt)}</p>
              <p>Non-Machine total: {preview.nonMachineKg} kg → {formatCurrency(preview.nonAmt)}</p>
              <p className="mt-2 text-base font-semibold">
                Estimated original amount: {formatCurrency(preview.total)}
              </p>
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
