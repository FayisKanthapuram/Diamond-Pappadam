export default function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizeClass = size === 'lg' ? 'sm:max-w-2xl' : size === 'xl' ? 'sm:max-w-4xl' : 'sm:max-w-md';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 flex max-h-[min(92dvh,100%)] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[90vh] sm:rounded-xl ${sizeClass}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-4 py-4 sm:px-6">
          <h2 id="modal-title" className="pr-4 text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="touch-target flex items-center justify-center rounded-lg text-stone-400 active:bg-stone-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
