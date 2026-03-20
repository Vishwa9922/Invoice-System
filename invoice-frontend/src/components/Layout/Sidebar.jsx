import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/dashboard',  label: 'Dashboard',   icon: '📊', adminOnly: false },
  { path: '/pos',        label: 'POS Billing',  icon: '🖥️', adminOnly: false },
  { path: '/invoices',   label: 'Invoices',     icon: '🧾', adminOnly: false },
  { path: '/products',   label: 'Products',     icon: '📦', adminOnly: false },
  { path: '/categories', label: 'Categories',   icon: '🗂️', adminOnly: false },
  { path: '/customers',  label: 'Customers',    icon: '👥', adminOnly: false },
  { path: '/reports',    label: 'Reports',      icon: '📈', adminOnly: true  },
];

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className="w-60 min-h-screen bg-[#1E1B4B] flex flex-col fixed left-0 top-0 bottom-0 z-50">

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
          ₹
        </div>
        <div>
          <div className="text-white font-bold text-base">InvoicePro</div>
          <div className="text-white/40 text-xs">Billing System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-3 pb-2">
          Menu
        </p>
        {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin()).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-150 no-underline
              ${isActive
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.adminOnly && (
              <span className="text-[9px] font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.name}</div>
            <div className="text-white/40 text-[10px]">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg
            bg-red-500/10 border border-red-500/20 text-red-300
            text-xs font-medium hover:bg-red-500/20 transition-colors"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;