const styles = {
  active: 'bg-emerald-50/60 text-emerald-800 border border-emerald-200/40',
  inactive: 'bg-slate-100/60 text-slate-600 border border-slate-200/40',
  pending: 'bg-amber-50/60 text-amber-800 border border-amber-200/40',
  paid: 'bg-emerald-50/60 text-emerald-800 border border-emerald-200/40',
};

export default function Badge({ status, children }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.inactive}`}>
      {children}
    </span>
  );
}
