const configs = {
  success: 'bg-emerald-100 text-emerald-800',
  danger:  'bg-red-100 text-red-800',
  warning: 'bg-amber-100 text-amber-800',
  info:    'bg-blue-100 text-blue-800',
  purple:  'bg-violet-100 text-violet-800',
  gray:    'bg-gray-100 text-gray-700',
};

const Badge = ({ label, type = 'gray', size = 'sm' }) => (
  <span className={`
    inline-flex items-center font-semibold rounded-full whitespace-nowrap
    ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
    ${configs[type]}
  `}>
    {label}
  </span>
);

export default Badge;