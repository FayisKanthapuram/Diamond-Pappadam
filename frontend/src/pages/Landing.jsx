import { Link } from 'react-router-dom';

function RoleCard({ icon, title, description, to }) {
  return (
    <Link
      to={to}
      className="group flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md px-6 py-8 text-center shadow-2xl transition-all duration-300 active:scale-[0.98] hover:-translate-y-1 hover:border-brand-500/40 hover:bg-white/[0.06] hover:shadow-[0_20px_50px_rgba(56,122,255,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:min-h-[15rem] sm:px-8 sm:py-10"
    >
      <span className="text-5xl sm:text-6xl transition-transform duration-300 group-hover:scale-110" aria-hidden>
        {icon}
      </span>
      <h2 className="mt-5 text-xl font-extrabold tracking-tight text-white sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400 sm:text-base">
        {description}
      </p>
    </Link>
  );
}

export default function Landing() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 px-4 py-12 text-white">
      {/* Radial ambient glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-[120px]" />
      
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center">
        <div
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-500 p-[1px] shadow-[0_0_50px_rgba(31,94,255,0.2)]"
          aria-hidden
        >
          <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-slate-950">
            <span className="text-3xl">💎</span>
          </div>
        </div>

        <h1 className="text-center text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-brand-200 sm:text-5xl">
          Diamond Pappadam
        </h1>
        <p className="mt-3 text-center text-base text-slate-400 sm:text-lg max-w-md">
          Production Management & Ledger System
        </p>

        <div className="mt-12 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <RoleCard
            icon="👨‍💼"
            title="Admin Portal"
            description="Manage production approvals, view employee salaries, and generate ledger reports."
            to="/admin/login"
          />
          <RoleCard
            icon="👷"
            title="Employee Portal"
            description="Log daily production quantities, view historical entries, and track total earnings."
            to="/employee/login"
          />
        </div>
      </div>
    </div>
  );
}
