import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { salesApi } from '../../api/index.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

export default function SalesList() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadSales() {
    setLoading(true);
    try {
      const res = await salesApi.listSales();
      setSales(res.data.sales);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load sales list');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Sales Log"
          subtitle="View and manage historical sales transactions and client invoices."
        />
        <Link to="/sales/sales/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
            ➕ Record New Sale
          </Button>
        </Link>
      </div>

      <Card className="p-4 sm:p-6">
        {loading ? (
          <p className="py-8 text-center text-stone-500">Loading sales records...</p>
        ) : sales.length === 0 ? (
          <p className="py-8 text-center text-stone-500">No sales transactions logged yet.</p>
        ) : (
          <>
            {/* Desktop Sales Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-3 pr-3 font-semibold">Date</th>
                    <th className="pb-3 pr-3 font-semibold">Customer</th>
                    <th className="pb-3 pr-3 font-semibold">Region</th>
                    <th className="pb-3 pr-3 font-semibold text-right">Invoice Total</th>
                    <th className="pb-3 pr-3 font-semibold text-right">Amount Received</th>
                    <th className="pb-3 pr-3 font-semibold text-right">Remaining Balance</th>
                    <th className="pb-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-stone-100 hover:bg-slate-50/50">
                      <td className="py-3 pr-3 font-mono text-stone-600">{formatDate(sale.date)}</td>
                      <td className="py-3 pr-3 font-bold text-slate-800">
                        <Link to={`/sales/customers/${sale.customerId}`} className="text-blue-600 hover:underline">
                          {sale.customerName}
                        </Link>
                      </td>
                      <td className="py-3 pr-3 text-stone-600">{sale.customerPlace}</td>
                      <td className="py-3 pr-3 text-right font-bold text-slate-800">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="py-3 pr-3 text-right font-semibold text-emerald-600">
                        {formatCurrency(sale.receivedAmount)}
                      </td>
                      <td className={`py-3 pr-3 text-right font-extrabold ${sale.balanceAmount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {formatCurrency(sale.balanceAmount)}
                      </td>
                      <td className="py-3 text-stone-500 text-xs italic truncate max-w-xs" title={sale.notes}>
                        {sale.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Sales Cards */}
            <div className="md:hidden space-y-3">
              {sales.map((sale) => (
                <div key={sale.id} className="rounded-xl border border-stone-100 bg-white p-4 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-xs text-stone-500">
                    <span className="font-mono">{formatDate(sale.date)}</span>
                    <span>{sale.customerPlace}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">
                      <Link to={`/sales/customers/${sale.customerId}`} className="text-blue-600 hover:underline">
                        {sale.customerName}
                      </Link>
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-50 pt-2 text-stone-600">
                    <div>
                      <span className="block text-stone-400">Total</span>
                      <span className="font-bold text-slate-800">{formatCurrency(sale.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="block text-stone-400">Received</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(sale.receivedAmount)}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-stone-400">Balance</span>
                      <span className={`font-bold ${sale.balanceAmount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {formatCurrency(sale.balanceAmount)}
                      </span>
                    </div>
                  </div>
                  {sale.notes && (
                    <p className="text-[11px] text-stone-400 italic bg-stone-50 p-1.5 rounded-md mt-2">
                      Notes: {sale.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
