const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98] shadow-sm shadow-brand-500/10',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-[0.98]',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] shadow-sm shadow-rose-500/10',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200',
};

const sizes = {
  default: 'min-h-11 px-4 py-2.5 text-base sm:min-h-10 sm:py-2 sm:text-sm',
  sm: 'min-h-9 px-3 py-2 text-sm',
  icon: 'min-h-11 min-w-11 p-0',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex w-full items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 sm:w-auto ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
