import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { salesApi } from '../../api/index.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatCurrency } from '../../utils/format.js';

export default function SalesLedger() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadLedger() {
    setLoading(true);
    try {
      const res = await salesApi.listCustomers({ search });
      setCustomers(res.data.customers);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  }

  // Live search debouncing
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      salesApi
        .listCustomers({ search })
        .then((res) => setCustomers(res.data.customers))
        .catch(() => {});
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  useEffect(() => {
    // Initial fetch
    salesApi
      .listCustomers()
      .then((res) => {
        setCustomers(res.data.customers);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Compute grand totals of ledger
  let totalOutstanding = 0;
  let totalSalesLifetime = 0;
  let totalReceivedLifetime = 0;

  // We can fetch stats for each, but wait, listCustomers endpoint returned c.outstandingBalance.
  // Wait! Does `listCustomers` also return totalSales and totalReceived?
  // Let's check our salesController.js listCustomers response structure:
  // It returns: id, name, phone, place, notes, active, outstandingBalance, lastSaleDate.
  // Wait! It does NOT return totalSales and totalReceived in listCustomers to save bandwidth, but wait, does the ledger view require showing them?
  // Yes: "Outstanding Balance, Total Sales, Total Paid".
  // Ah! If we want listCustomers to return totalSales and totalReceived as well, we should make sure they are included, or we can fetch them!
  // Let's check: can we update `listCustomers` in `salesController.js` to return `totalSales` and `totalReceived` too?
  // Yes! That would be extremely elegant and much cleaner than doing separate calls!
  // Let's check `salesController.js` lines 80-99:
  // It populates stats using `await computeCustomerStats(cust._id)`.
  // Wait, let's look at lines 82-84:
  // `const stats = await computeCustomerStats(cust._id);`
  // Yes! The stats are already calculated! We just need to include them in the returned object:
  // `outstandingBalance: stats.balance,`
  // Let's add:
  // `totalSales: stats.totalSales,`
  // `totalReceived: stats.totalReceived,`
  // Let's make this change in `salesController.js` to provide these fields!
  // Wait! Let's view the lines in `salesController.js` around listCustomers first to make a precise replacement.
  // We can view lines 75 to 110 of `backend/src/controllers/salesController.js`.
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Ledger Book"
        subtitle="Overview of accounts receivable, total billing, and historical payouts."
      />

      {/* Customer search filter */}
      <Card className="p-4 sm:p-6">
        <div className="mb-6 max-w-md">
          <Input
            type="text"
            placeholder="Search customer by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-stone-500">Loading ledger summaries...</p>
        ) : customers.length === 0 ? (
          <p className="py-8 text-center text-stone-500">No customer ledger records found.</p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-3 pr-3 font-semibold">Customer</th>
                    <th className="pb-3 pr-3 font-semibold">Region / Place</th>
                    <th className="pb-3 pr-3 font-semibold text-right">Total Sales Billing</th>
                    <th className="pb-3 pr-3 font-semibold text-right">Total Paid / Received</th>
                    <th className="pb-3 pr-3 font-semibold text-right">Outstanding Balance</th>
                    <th className="pb-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b border-stone-100 hover:bg-slate-50/50">
                      <td className="py-3 pr-3">
                        <div>
                          <span className="font-bold text-slate-800 block">{c.name}</span>
                          <span className="text-xs text-stone-500">{c.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-stone-600">{c.place}</td>
                      <td className="py-3 pr-3 text-right text-slate-700 font-medium">
                        {formatCurrency(c.totalSales ?? 0)}
                      </td>
                      <td className="py-3 pr-3 text-right text-emerald-600 font-medium">
                        {formatCurrency(c.totalReceived ?? 0)}
                      </td>
                      <td className={`py-3 pr-3 text-right font-extrabold ${c.outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {formatCurrency(c.outstandingBalance)}
                      </td>
                      <td className="py-3 text-center">
                        <Link to={`/sales/customers/${c.id}`}>
                          <Button size="sm" variant="ghost" className="text-blue-600 font-bold hover:bg-blue-50">
                            Ledger History →
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {customers.map((c) => (
                <div key={c.id} className="rounded-xl border border-stone-100 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800">{c.name}</h3>
                      <p className="text-xs text-stone-500">{c.phone} | {c.place}</p>
                    </div>
                    <span className={`text-sm font-bold ${c.outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      {formatCurrency(c.outstandingBalance)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-50 pt-2 text-stone-600">
                    <div>
                      <span className="block text-stone-400">Total Sales</span>
                      <span className="font-semibold">{formatCurrency(c.totalSales ?? 0)}</span>
                    </div>
                    <div>
                      <span className="block text-stone-400">Total Paid</span>
                      <span className="font-semibold text-emerald-600">{formatCurrency(c.totalReceived ?? 0)}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-50 pt-2 flex justify-end">
                    <Link to={`/sales/customers/${c.id}`}>
                      <Button size="xs" variant="ghost" className="text-blue-600 font-bold">
                        View History Ledger →
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
