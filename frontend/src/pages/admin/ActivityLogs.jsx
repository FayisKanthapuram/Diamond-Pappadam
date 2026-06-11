import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { activityLogsApi } from '../../api/index.js';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Badge from '../../components/ui/Badge.jsx';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [action, setAction] = useState('');
  const [performedBy, setPerformedBy] = useState('');

  function loadLogs() {
    setLoading(true);
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (action) params.action = action;
    if (performedBy) params.performedBy = performedBy;

    activityLogsApi
      .list(params)
      .then((res) => {
        setLogs(res.data.logs);
        setActionTypes(res.data.actionTypes || []);
        setUsers(res.data.users || []);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load activity logs'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadLogs();
  }, [from, to, action, performedBy]);

  function handleResetFilters() {
    setFrom('');
    setTo('');
    setAction('');
    setPerformedBy('');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Logs"
        subtitle="Track and audit important actions performed in the system."
      />

      {/* Filters Section */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">From Date</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">To Date</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Action Type</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Actions</option>
              {actionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">User</label>
            <select
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </Card>

      {/* Logs Display */}
      <Card>
        {loading ? (
          <p className="py-8 text-center text-slate-500">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-slate-500">No activity logs found matching the filters.</p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="data-table-wrap">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-medium">
                    <th className="p-4 pl-6 font-semibold">Date & Time</th>
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold">Action</th>
                    <th className="p-4 pr-6 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <td className="p-4 pl-6 text-slate-600 font-mono whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-4 font-semibold text-slate-900">
                        {log.performedBy?.name || 'System / Unknown'}
                      </td>
                      <td className="p-4">
                        <Badge status={log.performedByRole === 'admin' ? 'active' : 'inactive'}>
                          {log.performedByRole}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-slate-600 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg break-words">
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="data-card-list p-4">
              {logs.map((log) => (
                <div key={log.id} className="data-card border border-slate-100 bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{log.performedBy?.name || 'System / Unknown'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <Badge status={log.performedByRole === 'admin' ? 'active' : 'inactive'}>
                      {log.performedByRole}
                    </Badge>
                  </div>
                  <div>
                    <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 mb-1.5">
                      {log.action}
                    </span>
                    <p className="text-sm text-slate-600 break-words">{log.description}</p>
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
