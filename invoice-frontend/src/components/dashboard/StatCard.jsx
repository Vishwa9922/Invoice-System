const StatCard = ({ title, value, subtitle, icon, color = 'indigo' }) => {
  const colors = {
    indigo:  { bg: 'bg-indigo-50',  icon: 'bg-indigo-500',  text: 'text-indigo-600'  },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600' },
    amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-500',   text: 'text-amber-600'   },
    blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-500',    text: 'text-blue-600'    },
    red:     { bg: 'bg-red-50',     icon: 'bg-red-500',     text: 'text-red-600'     },
  };
  const c = colors[color] || colors.indigo;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {title}
          </p>
          <p className="text-2xl font-extrabold text-gray-900 leading-tight tracking-tight">
            {value ?? '—'}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center shrink-0`}>
          <div className={`w-9 h-9 ${c.icon} rounded-lg flex items-center justify-center`}>
            <span className="text-xl">{icon}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;