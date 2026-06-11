export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>}
      <input
        className={`w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 sm:text-sm ${
          error ? 'border-rose-500 focus:ring-rose-500/10' : ''
        }`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
