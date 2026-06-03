import { Link } from 'react-router-dom';

function RoleCard({ icon, title, description, to }) {
  return (
    <Link
      to={to}
      className="group flex min-h-[11rem] flex-col items-center justify-center rounded-2xl border-2 border-stone-200 bg-white px-6 py-8 text-center shadow-sm transition active:scale-[0.98] hover:border-brand-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:min-h-[14rem] sm:px-8 sm:py-10"
    >
      <span className="text-5xl sm:text-6xl" aria-hidden>
        {icon}
      </span>
      <h2 className="mt-4 text-xl font-bold text-stone-900 sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-stone-500 sm:text-base">
        {description}
      </p>
    </Link>
  );
}

export default function Landing() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-stone-100 px-4 py-8">
      <div className="flex w-full max-w-3xl flex-col items-center">
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-brand-300 bg-white shadow-sm sm:h-24 sm:w-24"
          aria-hidden
        >
          <span className="text-xs font-medium uppercase tracking-wider text-brand-600">Logo</span>
        </div>

        <h1 className="text-center text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
          Diamond Pappadam
        </h1>
        <p className="mt-2 text-center text-base text-stone-600 sm:text-lg">
          Production Management System
        </p>

        <div className="mt-12 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <RoleCard
            icon="👨‍💼"
            title="Admin"
            description="Manage production, approvals, payroll and reports."
            to="/admin/login"
          />
          <RoleCard
            icon="👷"
            title="Employee"
            description="Submit production and view earnings."
            to="/employee/login"
          />
        </div>
      </div>
    </div>
  );
}
