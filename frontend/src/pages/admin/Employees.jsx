import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { employeesApi } from '../../api/index.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';

const emptyForm = { name: '', phone: '' };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [resetPassword, setResetPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Search, filter, and sorting state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');

  function load() {
    employeesApi
      .list()
      .then((res) => setEmployees(res.data.employees))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load employees'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  // Compute filtered and sorted list
  const filteredEmployees = employees
    .filter((emp) => {
      const term = search.toLowerCase().trim();
      const matchSearch =
        !term ||
        emp.name.toLowerCase().includes(term) ||
        emp.phone.includes(term);

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && emp.active) ||
        (statusFilter === 'disabled' && !emp.active);

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'created-desc') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'created-asc') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      return 0;
    });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setResetPassword('');
    setModalOpen(true);
  }

  function openEdit(emp) {
    setEditing(emp);
    setForm({ name: emp.name, phone: emp.phone });
    setResetPassword('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload = { name: form.name, phone: form.phone };
        if (resetPassword) payload.password = resetPassword;
        await employeesApi.update(editing.id, payload);
        toast.success('Employee updated');
      } else {
        const res = await employeesApi.create(form);
        toast.success(res.data.message || 'Employee added');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(emp) {
    try {
      await employeesApi.update(emp.id, { active: !emp.active });
      toast.success(emp.active ? 'Employee disabled' : 'Employee enabled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Default password 123456 — must change on first login."
        action={<Button onClick={openAdd}>Add Employee</Button>}
      />

      {/* Search & Filter Bar */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Search Employees</label>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none"
            >
              <option value="name-asc">Alphabetical (A - Z)</option>
              <option value="name-desc">Alphabetical (Z - A)</option>
              <option value="created-desc">Date Created (Newest First)</option>
              <option value="created-asc">Date Created (Oldest First)</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : employees.length === 0 ? (
          <p className="py-8 text-center text-slate-500">No employees yet.</p>
        ) : filteredEmployees.length === 0 ? (
          <p className="py-8 text-center text-slate-500">No employees match your search criteria.</p>
        ) : (
          <>
            <div className="data-card-list">
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="data-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-stone-900">{emp.name}</p>
                      <p className="mt-0.5 text-sm text-stone-500">{emp.phone}</p>
                    </div>
                    <Badge status={emp.active ? 'active' : 'inactive'}>
                      {emp.active ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="btn-stack mt-4">
                    <Button variant="ghost" onClick={() => openEdit(emp)}>
                      Edit
                    </Button>
                    <Button variant={emp.active ? 'danger' : 'secondary'} onClick={() => toggleActive(emp)}>
                      {emp.active ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="data-table-wrap">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Phone</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="border-b border-stone-100">
                      <td className="py-3 pr-4">{emp.name}</td>
                      <td className="py-3 pr-4">{emp.phone}</td>
                      <td className="py-3 pr-4">
                        <Badge status={emp.active ? 'active' : 'inactive'}>
                          {emp.active ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(emp)}>
                            Edit
                          </Button>
                          <Button size="sm" variant={emp.active ? 'danger' : 'secondary'} onClick={() => toggleActive(emp)}>
                            {emp.active ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          {editing ? (
            <Input
              label="Reset Password (optional)"
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          ) : (
            <p className="rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
              Default password: <strong>123456</strong> (must be changed on first login)
            </p>
          )}
          <div className="btn-stack">
            <Button type="submit" className="!w-full sm:!w-auto" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="secondary" className="!w-full sm:!w-auto" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
