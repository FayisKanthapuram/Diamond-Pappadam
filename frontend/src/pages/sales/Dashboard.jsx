import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { salesApi } from '../../api/index.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

export default function SalesDashboard() {
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // New Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [notes, setNotes] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [statsRes, custRes] = await Promise.all([
        salesApi.getDashboard(),
        salesApi.listCustomers({ search }),
      ]);
      setStats(statsRes.data);
      setCustomers(custRes.data.customers);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  // Reload customers when search query changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      salesApi
        .listCustomers({ search })
        .then((res) => setCustomers(res.data.customers))
        .catch(() => {});
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Load complete stats on mount
  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleCreateCustomer(e) {
    e.preventDefault();
    if (!name || !phone || !place) {
      return toast.error('Name, phone, and place are required');
    }

    const opBal = Number(openingBalance) || 0;
    if (opBal < 0) {
      return toast.error('Opening balance cannot be negative');
    }

    setSubmitting(true);
    try {
      await salesApi.createCustomer({
        name,
        phone,
        place,
        notes,
        openingBalance: opBal,
      });
      toast.success('Customer created successfully');
      setModalOpen(false);
      setName('');
      setPhone('');
      setPlace('');
      setNotes('');
      setOpeningBalance('');
      // Reload list & stats
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Dashboard"
        subtitle="Manage customer relationships, register orders, and track payments."
      />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Monthly Sales"
            value={formatCurrency(stats.monthlySalesAmount)}
            sub="Current calendar month"
          />
          <StatCard
            label="Monthly Collections"
            value={formatCurrency(stats.monthlyReceivedAmount)}
            sub="Received payments"
          />
          <StatCard
            label="Total Outstanding"
            value={formatCurrency(stats.totalOutstandingLiability)}
            sub="Receivables from customers"
            className="text-rose-600"
          />
          <StatCard
            label="Active Customers"
            value={stats.activeCustomersCount}
            sub="Registered accounts"
          />
        </div>
      )}

      {/* Customer Management Section */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search customer by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            ➕ Create Customer
          </Button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-stone-500">Loading customers...</p>
        ) : customers.length === 0 ? (
          <p className="py-8 text-center text-stone-500">No customers found.</p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-3 pr-3 font-semibold">Customer Name</th>
                    <th className="pb-3 pr-3 font-semibold">Phone</th>
                    <th className="pb-3 pr-3 font-semibold">Place</th>
                    <th className="pb-3 pr-3 font-semibold text-right">Outstanding Balance</th>
                    <th className="pb-3 pr-3 font-semibold text-center">Last Sale Date</th>
                    <th className="pb-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b border-stone-100 hover:bg-slate-50/50">
                      <td className="py-3 pr-3 font-bold text-slate-800">{c.name}</td>
                      <td className="py-3 pr-3 text-stone-600">{c.phone}</td>
                      <td className="py-3 pr-3 text-stone-600">{c.place}</td>
                      <td className={`py-3 pr-3 text-right font-bold ${c.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatCurrency(c.outstandingBalance)}
                      </td>
                      <td className="py-3 pr-3 text-center text-stone-500">
                        {c.lastSaleDate ? formatDate(c.lastSaleDate) : '—'}
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

            {/* Mobile Card List View */}
            <div className="md:hidden space-y-3">
              {customers.map((c) => (
                <div key={c.id} className="rounded-xl border border-stone-100 bg-white p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800">{c.name}</h3>
                      <p className="text-xs text-stone-500">{c.phone} | {c.place}</p>
                    </div>
                    <span className={`text-sm font-bold ${c.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatCurrency(c.outstandingBalance)}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-between items-center border-t border-slate-50 pt-2 text-xs">
                    <span className="text-stone-500">Last Sale: {c.lastSaleDate ? formatDate(c.lastSaleDate) : '—'}</span>
                    <Link to={`/sales/customers/${c.id}`}>
                      <Button size="xs" variant="ghost" className="text-blue-600 font-bold">
                        Ledger →
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Create Customer Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Customer"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Input
            label="Customer Name"
            placeholder="Enter customer's full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Place / Region"
            placeholder="e.g. Kozhikode"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Opening Balance"
            type="number"
            min="0"
            step="any"
            placeholder="Enter previous outstanding amount"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            disabled={submitting}
          />
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-stone-600">Notes (Optional)</label>
            <textarea
              className="rounded-lg border border-stone-200 p-2 text-sm focus:border-brand-500 focus:outline-none"
              rows="3"
              placeholder="Add extra details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="btn-stack pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {submitting ? 'Creating...' : 'Create Customer'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
