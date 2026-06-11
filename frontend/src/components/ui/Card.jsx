export default function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sm:p-6 ${className}`}>
      {title && <h3 className="mb-4 text-base font-bold tracking-tight text-slate-800 sm:text-lg">{title}</h3>}
      {children}
    </div>
  );
}
