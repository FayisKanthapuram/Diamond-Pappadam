import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { salaryLedgerApi } from '../../api/index.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import SalaryLedgerSummary from '../../components/SalaryLedgerSummary.jsx';
import PaymentHistoryTable from '../../components/PaymentHistoryTable.jsx';
import { FilterDate, FilterActions } from '../../components/FilterBar.jsx';

export default function MySalaryLedger() {
  const printRef = useRef(null);
  const [ledger, setLedger] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    salaryLedgerApi
      .mine(params)
      .then((res) => setLedger(res.data.ledger))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load salary ledger'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading && !ledger) {
    return <p className="py-8 text-center text-stone-500">Loading...</p>;
  }

  if (!ledger) return null;

  return (
    <div ref={printRef} className="print-ledger max-w-3xl">
      <div className="print:hidden">
        <PageHeader
          title="My Salary Ledger"
          subtitle="View-only. Payments are recorded by admin."
        />
      </div>

      <div className="mb-4 print:block hidden">
        <h1 className="text-xl font-bold">Salary Ledger — {ledger.employeeName}</h1>
      </div>

      <div className="mb-6">
        <SalaryLedgerSummary
          totalEarned={ledger.totalEarned}
          totalPaid={ledger.totalPaid}
          balance={ledger.balance}
        />
      </div>

      <div className="mb-4 print:hidden">
        <Button variant="secondary" onClick={() => window.print()}>
          Print Ledger
        </Button>
      </div>

      <Card title="Payment History">
        <div className="filter-stack mb-4 print:hidden">
          <FilterDate label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
          <FilterDate label="To" value={to} onChange={(e) => setTo(e.target.value)} />
          <FilterActions onApply={load} loading={loading} applyLabel="Filter" />
        </div>
        <PaymentHistoryTable payments={ledger.payments} />
      </Card>
    </div>
  );
}
