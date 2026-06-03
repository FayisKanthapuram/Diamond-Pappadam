export default function StatCard({ label, value, sub, className = '' }) {
  return (
    <div className={`rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500 sm:text-sm sm:normal-case sm:tracking-normal">
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-bold text-stone-900 sm:text-2xl">{value}</p>
      {sub && <div className="mt-1.5 text-xs leading-relaxed text-stone-400">{sub}</div>}
    </div>
  );
}
