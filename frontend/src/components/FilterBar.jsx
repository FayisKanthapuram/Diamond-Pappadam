import Button from './ui/Button.jsx';

export function FilterField({ label, children, className = '' }) {
  return (
    <div className={`w-full min-w-0 sm:w-auto sm:min-w-[140px] ${className}`}>
      {label && <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>}
      {children}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, children, className = '' }) {
  return (
    <FilterField label={label} className={className}>
      <select
        className="w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 sm:text-sm"
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
    </FilterField>
  );
}

export function FilterDate({ label, value, onChange }) {
  return (
    <FilterField label={label}>
      <input
        type="date"
        className="w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 sm:text-sm"
        value={value}
        onChange={onChange}
      />
    </FilterField>
  );
}

export function FilterActions({ children, onApply, applyLabel = 'Apply', loading }) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      {children}
      {onApply && (
        <Button onClick={onApply} disabled={loading} className="w-full sm:w-auto">
          {loading ? 'Loading...' : applyLabel}
        </Button>
      )}
    </div>
  );
}
