const STATUS_CONFIG = {
  pending: { label: 'Pending', emoji: '🟡', className: 'bg-amber-50/60 text-amber-800 border border-amber-200/40' },
  approved: { label: 'Approved', emoji: '🟢', className: 'bg-emerald-50/60 text-emerald-800 border border-emerald-200/40' },
  rejected: { label: 'Rejected', emoji: '🔴', className: 'bg-rose-50/60 text-rose-800 border border-rose-200/40' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      <span aria-hidden>{config.emoji}</span>
      {config.label}
    </span>
  );
}
