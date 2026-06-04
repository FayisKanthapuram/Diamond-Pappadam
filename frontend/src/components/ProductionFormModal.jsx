import { useState, useEffect, useMemo } from 'react';
import Modal from './ui/Modal.jsx';
import Input from './ui/Input.jsx';
import Button from './ui/Button.jsx';
import { settingsApi, gramTypesApi, qualityTypesApi } from '../api/index.js';
import ProductionItemsEditor, {
  productionToRows,
  rowsToPayload,
  sumRowsForPreview,
} from './ProductionItemsEditor.jsx';
import { formatCurrency } from '../utils/format.js';

export default function ProductionFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  rates: ratesProp,
  title,
  saving,
}) {
  const [date, setDate] = useState('');
  const [rows, setRows] = useState([]);
  const [notes, setNotes] = useState('');
  const [rates, setRates] = useState(ratesProp);
  const [gramTypes, setGramTypes] = useState([]);
  const [qualityTypes, setQualityTypes] = useState([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      ratesProp ? Promise.resolve({ data: ratesProp }) : settingsApi.get(),
      gramTypesApi.list(),
      qualityTypesApi.list(),
    ]).then(([ratesRes, gramRes, qualityRes]) => {
      if (!ratesProp) setRates(ratesRes.data);
      setGramTypes(gramRes.data.gramTypes.filter((g) => g.active));
      setQualityTypes(qualityRes.data.qualityTypes.filter((q) => q.active));
    });
  }, [open, ratesProp]);

  useEffect(() => {
    if (open && initial) {
      setDate(initial.date ? new Date(initial.date).toISOString().split('T')[0] : '');
      setRows(productionToRows(initial));
      setNotes(initial.notes || '');
      if (initial.dryMachineRate != null) {
        setRates({
          dryMachineRate: initial.dryMachineRate,
          nonMachineRate: initial.nonMachineRate,
        });
      }
    } else if (open && !initial) {
      setDate(new Date().toISOString().split('T')[0]);
      setRows(productionToRows(null));
      setNotes('');
    }
  }, [open, initial]);

  const preview = useMemo(() => {
    if (!rates) return null;
    const { dryMachineKg, nonMachineKg } = sumRowsForPreview(rows);
    const dryRate = initial?.dryMachineRate ?? rates?.dryMachineRate ?? 0;
    const nonRate = initial?.nonMachineRate ?? rates?.nonMachineRate ?? 0;
    const dryAmt = dryMachineKg * dryRate;
    const nonAmt = nonMachineKg * nonRate;
    return { dryMachineKg, nonMachineKg, dryAmt, nonAmt, total: dryAmt + nonAmt, dryRate, nonRate };
  }, [rows, initial, rates]);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      date,
      items: rowsToPayload(rows),
      notes,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

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
          placeholder="Overtime, correction, etc."
        />

        {preview && (preview.dryRate > 0 || preview.nonRate > 0) && (
          <div className="rounded-lg bg-brand-50 p-3 text-sm">
            <p>
              Totals: Dry {preview.dryMachineKg} kg · Non-Machine {preview.nonMachineKg} kg
            </p>
            <p>
              Rates: {formatCurrency(preview.dryRate)}/kg dry · {formatCurrency(preview.nonRate)}
              /kg non-machine
            </p>
            <p className="mt-1 font-semibold">Estimated original: {formatCurrency(preview.total)}</p>
          </div>
        )}

        <div className="btn-stack">
          <Button type="submit" className="!w-full sm:!w-auto" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button type="button" variant="secondary" className="!w-full sm:!w-auto" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
