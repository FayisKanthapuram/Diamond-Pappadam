export default function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      {title && <h3 className="mb-3 text-base font-semibold text-stone-800 sm:mb-4 sm:text-lg">{title}</h3>}
      {children}
    </div>
  );
}
