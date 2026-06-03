export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-sm font-medium text-stone-700">{label}</label>}
      <input
        className={`w-full min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:text-sm ${
          error ? 'border-red-500' : ''
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
