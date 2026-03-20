import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDashboardApi } from '../api/reportApi';
import { getInvoicesApi }  from '../api/invoiceApi';
import { useAuth }         from '../context/AuthContext';
import StatCard            from '../components/dashboard/StatCard';
import Badge               from '../components/common/Badge';
import Loader              from '../components/common/Loader';
import Button              from '../components/common/Button';
import { formatCurrency, formatDateTime } from '../utils/helpers';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();
  const [summary,   setSummary]  = useState(null);
  const [invoices,  setInvoices] = useState([]);
  const [loading,   setLoading]  = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [getInvoicesApi(0, 5)];
      if (isAdmin()) promises.push(getDashboardApi());
      const results = await Promise.all(promises);
      setInvoices(results[0].data.data.content || []);
      if (isAdmin() && results[1]) setSummary(results[1].data.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className="space-y-6">

      {/* Stats */}
      {isAdmin() && summary && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-800">Today's Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Today's Revenue"  value={formatCurrency(summary.todayRevenue)}  subtitle={`${summary.todayInvoiceCount} invoices`}       icon="💰" color="indigo"  />
            <StatCard title="Monthly Revenue"  value={formatCurrency(summary.monthRevenue)}  subtitle={`${summary.monthInvoiceCount} this month`}       icon="📈" color="emerald" />
            <StatCard title="Total Products"   value={summary.totalProducts}                 subtitle="Active inventory"                                icon="📦" color="amber"   />
            <StatCard title="Total Customers"  value={summary.totalCustomers}                subtitle="Registered"                                     icon="👥" color="blue"    />
          </div>

          {summary.lowStockCount > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-xl">⚠️</span>
              <p className="text-sm text-amber-800 flex-1">
                <strong>{summary.lowStockCount} products</strong> are running low on stock.
              </p>
              <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
                View →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { icon: '🖥️', label: 'New Bill',    sub: 'Start POS billing',  path: '/pos',        bg: 'bg-indigo-500'  },
            { icon: '🧾', label: 'Invoices',     sub: 'View all invoices',  path: '/invoices',   bg: 'bg-emerald-500' },
            { icon: '📦', label: 'Products',     sub: 'Manage inventory',   path: '/products',   bg: 'bg-amber-500'   },
            { icon: '👥', label: 'Customers',    sub: 'Customer records',   path: '/customers',  bg: 'bg-blue-500'    },
            { icon: '🗂️', label: 'Categories',   sub: 'Organise products',  path: '/categories', bg: 'bg-violet-500'  },
            ...(isAdmin() ? [{ icon: '📊', label: 'Reports', sub: 'Analytics', path: '/reports', bg: 'bg-rose-500' }] : []),
          ].map((a, i) => (
            <button
              key={i}
              onClick={() => navigate(a.path)}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200
                hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
            >
              <div className={`w-10 h-10 ${a.bg} rounded-xl flex items-center justify-center text-xl shrink-0`}>
                {a.icon}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800">{a.label}</div>
                <div className="text-xs text-gray-400">{a.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">Recent Invoices</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
            View all →
          </Button>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-3">🧾</div>
            <p className="text-gray-400 text-sm mb-4">No invoices yet</p>
            <Button onClick={() => navigate('/pos')}>🖥️ Open POS</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Invoice #','Customer','Amount','Payment','Status','Date',''].map((h,i) => (
                    <th key={i} className="px-4 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-indigo-600 text-sm">
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-800">
                        {inv.customer?.name || 'Walk-in'}
                      </div>
                      <div className="text-xs text-gray-400">{inv.customer?.mobileNumber}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-sm">{formatCurrency(inv.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={inv.paymentMode}
                        type={inv.paymentMode === 'CASH' ? 'gray' : inv.paymentMode === 'UPI' ? 'info' : 'purple'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={inv.status}
                        type={inv.status === 'PAID' ? 'success' : inv.status === 'CANCELLED' ? 'danger' : 'warning'}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(inv.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">View →</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;