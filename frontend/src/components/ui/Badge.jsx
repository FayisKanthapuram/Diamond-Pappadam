const styles = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-stone-100 text-stone-600',
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
};

export default function Badge({ status, children }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.inactive}`}>
      {children}
    </span>
  );
}
