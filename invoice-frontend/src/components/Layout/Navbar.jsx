import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard':  { title: 'Dashboard',        subtitle: 'Overview of your business' },
  '/pos':        { title: 'POS Billing',       subtitle: 'Create new bills quickly' },
  '/invoices':   { title: 'Invoices',          subtitle: 'Manage all invoices' },
  '/products':   { title: 'Products',          subtitle: 'Manage your inventory' },
  '/categories': { title: 'Categories',        subtitle: 'Organise your products' },
  '/customers':  { title: 'Customers',         subtitle: 'Manage customer records' },
  '/suppliers':  { title: 'Suppliers',         subtitle: 'Manage your suppliers' },
  '/purchases':  { title: 'Purchases',         subtitle: 'Restock & purchase orders' },
  '/expenses':   { title: 'Expenses',          subtitle: 'Track business expenses' },
  '/payments':   { title: 'Payments & Dues',   subtitle: 'Manage pending payments' },
  '/returns':    { title: 'Returns & Refunds', subtitle: 'Handle return requests' },
  '/stock':      { title: 'Stock Management',  subtitle: 'Inventory levels & movements' },
  '/reports':    { title: 'Reports',           subtitle: 'Sales analytics & insights' },
  '/settings':   { title: 'Settings',          subtitle: 'Business configuration' },
  '/users':      { title: 'User Management',   subtitle: 'Manage staff accounts' },
};

const Navbar = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const key  = pathname.startsWith('/invoices/') ? '/invoices' : pathname;
  const page = PAGE_TITLES[key] || { title: 'InvoicePro', subtitle: '' };
  const now  = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      <div>
        <h1 className="text-lg font-bold text-gray-900 leading-tight">{page.title}</h1>
        {page.subtitle && <p className="text-xs text-gray-400 mt-0.5">{page.subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-xs">📅</span>
          <span className="text-xs text-gray-500 font-medium">{now}</span>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-indigo-800">{user?.name}</span>
            <span className="text-[10px] text-indigo-400">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;