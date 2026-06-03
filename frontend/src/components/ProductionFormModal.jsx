import { useState, useEffect, useMemo } from 'react';
import Modal from './ui/Modal.jsx';
import Input from './ui/Input.jsx';
import Button from './ui/Button.jsx';
import { formatCurrency } from '../utils/format.js';

export default function ProductionFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  rates,
  title,
  saving,
}) {
  const [date, setDate] = useState('');
  const [dryMachineKg, setDryMachineKg] = useState('');
  const [nonMachineKg, setNonMachineKg] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open && initial) {
      setDate(initial.date ? new Date(initial.date).toISOString().split('T')[0] : '');
      setDryMachineKg(String(initial.dryMachineKg ?? ''));
      setNonMachineKg(String(initial.nonMachineKg ?? ''));
      setNotes(initial.notes || '');
    } else if (open && !initial) {
      setDate(new Date().toISOString().split('T')[0]);
      setDryMachineKg('');
      setNonMachineKg('');
      setNotes('');
    }
  }, [open, initial]);

  const preview = useMemo(() => {
    const dry = parseFloat(dryMachineKg) || 0;
    const non = parseFloat(nonMachineKg) || 0;
    const dryRate = initial?.dryMachineRate ?? rates?.dryMachineRate ?? 0;
    const nonRate = initial?.nonMachineRate ?? rates?.nonMachineRate ?? 0;
    const dryAmt = dry * dryRate;
    const nonAmt = non * nonRate;
    return { dryAmt, nonAmt, total: dryAmt + nonAmt, dryRate, nonRate };
  }, [dryMachineKg, nonMachineKg, initial, rates]);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      date,
      dryMachineKg: parseFloat(dryMachineKg) || 0,
      nonMachineKg: parseFloat(nonMachineKg) || 0,
      notes,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input label="Dry Machine KG" type="number" min="0" step="0.01" value={dryMachineKg} onChange={(e) => setDryMachineKg(e.target.value)} />
        <Input label="Non-Machine KG" type="number" min="0" step="0.01" value={nonMachineKg} onChange={(e) => setNonMachineKg(e.target.value)} />
        <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Overtime, correction, etc." />
        {(preview.dryRate > 0 || preview.nonRate > 0) && (
          <div className="rounded-lg bg-brand-50 p-3 text-sm">
            <p>Rates: {formatCurrency(preview.dryRate)}/kg dry · {formatCurrency(preview.nonRate)}/kg non-machine</p>
            <p className="mt-1 font-semibold">Total: {formatCurrency(preview.total)}</p>
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
