import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { salaryLedgerApi } from '../../api/index.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import SalaryLedgerSummary from '../../components/SalaryLedgerSummary.jsx';
import PaymentHistoryTable from '../../components/PaymentHistoryTable.jsx';
import { FilterDate, FilterActions } from '../../components/FilterBar.jsx';
import { todayInputValue } from '../../utils/format.js';

export default function SalaryLedgerDetail() {
  const { employeeId } = useParams();
  const printRef = useRef(null);
  const [ledger, setLedger] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayInputValue());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    salaryLedgerApi
      .getEmployee(employeeId, params)
      .then((res) => setLedger(res.data.ledger))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load ledger'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [employeeId]);

  async function handleAddPayment(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await salaryLedgerApi.addPayment(employeeId, {
        amount: parseFloat(amount),
        date,
        note,
      });
      toast.success('Payment recorded');
      setPaymentOpen(false);
      setAmount('');
      setNote('');
      setDate(todayInputValue());
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading && !ledger) {
    return <p className="py-8 text-center text-stone-500">Loading...</p>;
  }

  if (!ledger) return null;

  return (
    <div>
      <div className="mb-4 print:hidden">
        <Link to="/admin/salary-ledger" className="text-sm font-medium text-brand-700 hover:underline">
          ← All employees
        </Link>
      </div>

      <div ref={printRef} className="print-ledger">
        <div className="print:hidden">
          <PageHeader
            title="Salary Ledger"
            subtitle="Balance = total approved net earnings minus all payments."
          />
        </div>

        <div className="mb-6 print:block hidden">
          <h1 className="text-xl font-bold">Salary Ledger — {ledger.employeeName}</h1>
          <p className="text-sm text-stone-600">Diamond Pappadam</p>
        </div>

        <div className="mb-6">
          <SalaryLedgerSummary
            employeeName={ledger.employeeName}
            totalEarned={ledger.totalEarned}
            totalPaid={ledger.totalPaid}
            balance={ledger.balance}
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
          <Button onClick={() => setPaymentOpen(true)}>Add Payment</Button>
          <Button variant="secondary" onClick={handlePrint}>
            Print Ledger
          </Button>
        </div>

        <Card title="Payment History" className="print:border-0 print:shadow-none">
          <div className="filter-stack mb-4 print:hidden">
            <FilterDate label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
            <FilterDate label="To" value={to} onChange={(e) => setTo(e.target.value)} />
            <FilterActions onApply={load} loading={loading} />
          </div>
          <PaymentHistoryTable payments={ledger.payments} />
        </Card>
      </div>

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Add Payment">
        <form onSubmit={handleAddPayment} className="space-y-4">
          <Input
            label="Amount (₹)"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Weekly Salary, Advance Payment"
          />
          <p className="text-xs text-stone-500">
            Examples: Weekly Salary, Advance Payment, Festival Advance, Emergency Payment
          </p>
          <div className="btn-stack">
            <Button type="submit" className="!w-full" disabled={saving}>
              {saving ? 'Saving...' : 'Record Payment'}
            </Button>
            <Button type="button" variant="secondary" className="!w-full" onClick={() => setPaymentOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
