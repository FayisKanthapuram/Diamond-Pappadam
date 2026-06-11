export default function StatCard({ label, value, sub, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sm:p-6 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm sm:normal-case sm:tracking-normal">
        {label}
      </p>
      <p className="mt-1.5 break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
      {sub && <div className="mt-2 text-xs leading-relaxed font-medium text-slate-400">{sub}</div>}
    </div>
  );
}
