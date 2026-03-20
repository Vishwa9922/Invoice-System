const variants = {
  primary:   'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
  danger:    'bg-red-500 hover:bg-red-600 text-white border-transparent',
  success:   'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent',
  ghost:     'bg-transparent hover:bg-indigo-50 text-indigo-600 border-indigo-200',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-lg',
};

const Button = ({
  children, onClick, type = 'button',
  variant = 'primary', size = 'md',
  disabled = false, loading = false,
  icon, fullWidth = false, className = '',
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center gap-1.5
      font-semibold border transition-all duration-150
      disabled:opacity-60 disabled:cursor-not-allowed
      ${variants[variant]} ${sizes[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `}
  >
    {loading
      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      : icon && <span>{icon}</span>
    }
    {children}
  </button>
);

export default Button;