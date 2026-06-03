import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar.jsx';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-[100dvh] flex-col lg:flex-row">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-stone-200 bg-white/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="touch-target -ml-1 flex items-center justify-center rounded-lg text-stone-600 active:bg-stone-100"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-2 truncate text-base font-semibold text-brand-700">Admin</span>
        </header>

        <main
          key={location.pathname}
          className="flex-1 overflow-x-hidden overflow-y-auto p-3 pb-6 sm:p-4 md:p-6 lg:p-8"
        >
          <div className="page-shell">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
