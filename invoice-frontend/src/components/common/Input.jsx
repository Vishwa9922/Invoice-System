const Input = ({
  label, name, value, onChange, onKeyDown,
  type = 'text', placeholder = '',
  error = '', required = false,
  disabled = false, icon, className = '',
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && (
      <label className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-sm border rounded-lg outline-none
          transition-colors duration-150 text-gray-900
          focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${icon ? 'pl-9' : ''}
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
        `}
      />
    </div>
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
);

export default Input;