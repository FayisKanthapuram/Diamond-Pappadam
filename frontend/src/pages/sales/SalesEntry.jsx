import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { salesApi } from '../../api/index.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatCurrency } from '../../utils/format.js';

const UNIT_TYPES = ['KG', 'Packet'];
const DESCRIPTION_SUGGESTIONS = [
  '3g 1st',
  '5g 2nd',
  '20 Rs Packet (1st)',
  '50 Rs Packet (1st)',
];

export default function SalesEntry() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([
    { description: '', unit: 'KG', quantity: '', rate: '', amount: 0 },
  ]);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    salesApi
      .listCustomers()
      .then((res) => {
        // filter active customers
        setCustomers(res.data.customers.filter((c) => c.active));
        setLoading(false);
      })
      .catch((err) => {
        toast.error('Failed to load customers');
        setLoading(false);
      });
  }, []);

  // Recalculate row amount
  function handleItemChange(index, field, value) {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'quantity' || field === 'rate') {
      const q = Number(updated[index].quantity) || 0;
      const r = Number(updated[index].rate) || 0;
      updated[index].amount = q * r;
    }

    setItems(updated);
  }

  function handleAddRow() {
    setItems([
      ...items,
      { description: '', unit: 'KG', quantity: '', rate: '', amount: 0 },
    ]);
  }

  function handleRemoveRow(index) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const received = Number(receivedAmount) || 0;
  const balance = Math.max(0, subtotal - received);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!customerId) return toast.error('Please select a customer');
    if (!date) return toast.error('Please select a sale date');

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.description.trim()) {
        return toast.error(`Row ${i + 1}: Description is required`);
      }
      const qty = Number(it.quantity);
      const rt = Number(it.rate);
      if (isNaN(qty) || qty <= 0) {
        return toast.error(`Row ${i + 1}: Quantity must be greater than 0`);
      }
      if (isNaN(rt) || rt <= 0) {
        return toast.error(`Row ${i + 1}: Rate must be greater than 0`);
      }
    }

    setSubmitting(true);
    try {
      await salesApi.createSale({
        customerId,
        date,
        items,
        receivedAmount: received,
        notes,
      });
      toast.success('Sale created successfully');
      navigate('/sales/sales');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create sale order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="New Sale Entry"
          subtitle="Record sales details, apply item breakdowns, and capture payments."
        />
        <Link to="/sales/sales">
          <Button variant="secondary" className="font-bold">
            ← Cancel
          </Button>
        </Link>
      </div>

      <Card className="p-4 sm:p-6">
        {loading ? (
          <p className="text-stone-500">Loading form...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-stone-600">Select Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="rounded-lg border border-stone-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
                  required
                  disabled={submitting}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.place}) - Bal: Rs. {c.outstandingBalance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Sale Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            {/* Items table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800">Sale Line Items</h2>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddRow}
                  disabled={submitting}
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 font-bold"
                >
                  ➕ Add Row
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500">
                      <th className="pb-2 pr-3 font-semibold w-1/3">Item Description</th>
                      <th className="pb-2 pr-3 font-semibold w-24">Unit</th>
                      <th className="pb-2 pr-3 font-semibold w-24">Quantity</th>
                      <th className="pb-2 pr-3 font-semibold w-24">Rate (INR)</th>
                      <th className="pb-2 pr-3 font-semibold text-right w-32">Amount</th>
                      <th className="pb-2 font-semibold text-center w-16">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b border-stone-50 py-2">
                        {/* Description with datalist suggestions */}
                        <td className="py-2 pr-3">
                          <input
                            type="text"
                            list={`desc-suggestions-${idx}`}
                            className="w-full rounded-lg border border-stone-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
                            placeholder="e.g. 3g 1st"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            required
                            disabled={submitting}
                          />
                          <datalist id={`desc-suggestions-${idx}`}>
                            {DESCRIPTION_SUGGESTIONS.map((s) => (
                              <option key={s} value={s} />
                            ))}
                          </datalist>
                        </td>

                        {/* Unit dropdown */}
                        <td className="py-2 pr-3">
                          <select
                            className="w-full rounded-lg border border-stone-200 p-2 text-sm focus:border-brand-500 focus:outline-none bg-white"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            disabled={submitting}
                          >
                            {UNIT_TYPES.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Quantity input */}
                        <td className="py-2 pr-3">
                          <input
                            type="number"
                            className="w-full rounded-lg border border-stone-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
                            placeholder="0"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            required
                            disabled={submitting}
                            min="0.01"
                            step="any"
                          />
                        </td>

                        {/* Rate input */}
                        <td className="py-2 pr-3">
                          <input
                            type="number"
                            className="w-full rounded-lg border border-stone-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
                            placeholder="0"
                            value={item.rate}
                            onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                            required
                            disabled={submitting}
                            min="0.01"
                            step="any"
                          />
                        </td>

                        {/* Amount */}
                        <td className="py-2 pr-3 text-right font-semibold text-slate-800">
                          {formatCurrency(item.amount)}
                        </td>

                        {/* Action remove */}
                        <td className="py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            disabled={items.length === 1 || submitting}
                            className="text-stone-400 hover:text-rose-600 disabled:opacity-30"
                            title="Delete row"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations and Payments details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-stone-200 pt-6">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-stone-600">Sale Notes (Optional)</label>
                  <textarea
                    className="rounded-lg border border-stone-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
                    rows="3"
                    placeholder="Enter sales references..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Totals summary block */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Subtotal Amount:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Received Amount (during sale):</span>
                  <div className="w-36">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full rounded-lg border border-stone-200 p-1.5 text-right text-sm focus:border-brand-500 focus:outline-none"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      disabled={submitting}
                      min="0"
                      step="any"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-base font-extrabold border-t border-stone-200 pt-3 text-slate-900">
                  <span>Remaining Balance:</span>
                  <span className="text-rose-600">{formatCurrency(balance)}</span>
                </div>
              </div>
            </div>

            {/* Submission buttons */}
            <div className="btn-stack border-t border-stone-100 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {submitting ? 'Creating Sale...' : 'Submit Sale Invoice'}
              </Button>
              <Link to="/sales/sales">
                <Button type="button" variant="secondary" disabled={submitting}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
