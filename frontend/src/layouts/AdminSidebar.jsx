import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import Button from '../components/ui/Button.jsx';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/employees', label: 'Employees' },
  { to: '/admin/approvals', label: 'Production Approvals' },
  { to: '/admin/reports', label: 'Production Reports' },
  { to: '/admin/payroll', label: 'Payroll' },
  { to: '/admin/settings', label: 'Settings' },
];

export default function AdminSidebar({ open, onClose }) {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,18rem)] max-w-full flex-col border-r border-stone-200 bg-white shadow-xl transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Admin navigation"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-4">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-brand-700 sm:text-lg">Diamond Pappadam</h1>
            <p className="text-xs text-stone-500">Admin Portal</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target flex shrink-0 items-center justify-center rounded-lg text-stone-500 lg:hidden"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `mb-1 flex min-h-11 items-center rounded-lg px-4 text-base font-medium transition active:scale-[0.98] sm:text-sm ${
                  isActive
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-stone-600 active:bg-stone-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-stone-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-stone-500">Administrator</p>
          <Button variant="ghost" className="mt-3 w-full min-h-11" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
