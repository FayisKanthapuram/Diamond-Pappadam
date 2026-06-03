const STATUS_CONFIG = {
  pending: { label: 'Pending', emoji: '🟡', className: 'bg-amber-50 text-amber-800' },
  approved: { label: 'Approved', emoji: '🟢', className: 'bg-emerald-50 text-emerald-800' },
  rejected: { label: 'Rejected', emoji: '🔴', className: 'bg-red-50 text-red-800' },
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
