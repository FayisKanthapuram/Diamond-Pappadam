const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  secondary: 'bg-stone-200 text-stone-800 hover:bg-stone-300 active:bg-stone-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  ghost: 'bg-transparent text-stone-700 hover:bg-stone-100 active:bg-stone-200',
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
      className={`inline-flex w-full items-center justify-center rounded-lg font-medium transition disabled:opacity-50 sm:w-auto ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
