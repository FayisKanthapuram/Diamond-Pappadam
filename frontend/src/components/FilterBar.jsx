import Button from './ui/Button.jsx';

export function FilterField({ label, children, className = '' }) {
  return (
    <div className={`w-full min-w-0 sm:w-auto sm:min-w-[140px] ${className}`}>
      {label && <label className="mb-1.5 block text-sm font-medium text-stone-700">{label}</label>}
      {children}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, children, className = '' }) {
  return (
    <FilterField label={label} className={className}>
      <select
        className="w-full min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
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
        className="w-full min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
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
