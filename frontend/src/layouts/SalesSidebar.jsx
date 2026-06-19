import { NavLink, useNavigate } from 'react-router-dom';
import { useSalesAuth } from '../context/SalesAuthContext.jsx';
import Button from '../components/ui/Button.jsx';

const salesLinks = [
  { to: '/sales/dashboard', label: 'Dashboard' },
  { to: '/sales/customers', label: 'Customers' },
  { to: '/sales/sales', label: 'Sales' },
  { to: '/sales/ledger', label: 'Ledger' },
];

export default function SalesSidebar({ open, onClose }) {
  const { user, logout } = useSalesAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/sales/login', { replace: true });
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
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,18rem)] max-w-full flex-col border-r border-slate-800 bg-slate-900 shadow-2xl transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sales navigation"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5">
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold tracking-tight text-white sm:text-lg">Diamond Pappadam</h1>
            <p className="text-xs font-semibold text-blue-400">Sales Portal</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target flex shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-white active:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavLink
            to="/"
            onClick={onClose}
            className="flex min-h-11 items-center rounded-xl px-4 text-base font-semibold transition-all duration-200 active:scale-[0.98] sm:text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          >
            Home
          </NavLink>
          {salesLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex min-h-11 items-center rounded-xl px-4 text-base font-semibold transition-all duration-200 active:scale-[0.98] sm:text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-slate-950/20">
          <p className="truncate text-sm font-bold text-slate-200">{user?.name}</p>
          <p className="text-xs font-medium text-slate-400">Sales Manager</p>
          <Button 
            variant="ghost" 
            className="mt-4 w-full min-h-11 text-slate-400 hover:text-blue-400 hover:bg-blue-950/20 active:bg-blue-950/30 font-bold border border-slate-800" 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
