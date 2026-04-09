import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getDashboardApi, getSalesReportApi, getTopProductsApi } from '../api/reportApi';
import { getInvoicesApi } from '../api/invoiceApi';
import { useAuth }        from '../context/AuthContext';
import StatCard           from '../components/dashboard/StatCard';
import Badge              from '../components/common/Badge';
import Loader             from '../components/common/Loader';
import Button             from '../components/common/Button';
import { formatCurrency, formatDateTime } from '../utils/helpers';

const COLORS = ['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#3B82F6'];

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();

  const [summary,    setSummary]    = useState(null);
  const [invoices,   setInvoices]   = useState([]);
  const [salesData,  setSalesData]  = useState([]);
  const [topProds,   setTopProds]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Last 7 days date range
  const today     = new Date().toISOString().split('T')[0];
  const weekAgo   = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [getInvoicesApi(0, 5)];
      if (isAdmin()) {
        promises.push(getDashboardApi());
        promises.push(getSalesReportApi(weekAgo, today));
        promises.push(getTopProductsApi(5));
      }
      const results = await Promise.all(promises);
      setInvoices(results[0].data.data.content || []);
      if (isAdmin()) {
        if (results[1]) setSummary(results[1].data.data);
        if (results[2]) setSalesData(results[2].data.data || []);
        if (results[3]) setTopProds(results[3].data.data || []);
      }
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullPage />;

  // Format sales data for chart
  const chartData = salesData.map(d => ({
    date:     new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    revenue:  Number(d.totalRevenue || 0),
    invoices: Number(d.invoiceCount || 0),
    tax:      Number(d.totalTax || 0),
  }));

  // Payment mode split for pie
  const paymentSplit = [
    { name: 'Cash',  value: invoices.filter(i => i.paymentMode === 'CASH').length  },
    { name: 'UPI',   value: invoices.filter(i => i.paymentMode === 'UPI').length   },
    { name: 'Card',  value: invoices.filter(i => i.paymentMode === 'CARD').length  },
  ].filter(p => p.value > 0);

  return (
    <div className="space-y-6">

      {/* ── Stat Cards ── */}
      {isAdmin() && summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(summary.todayRevenue)}
            subtitle={`${summary.todayInvoiceCount} invoices today`}
            icon="💰" color="indigo"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(summary.monthRevenue)}
            subtitle={`${summary.monthInvoiceCount} this month`}
            icon="📈" color="emerald"
          />
          <StatCard
            title="Total Products"
            value={summary.totalProducts}
            subtitle={
              summary.lowStockCount > 0
                ? `⚠️ ${summary.lowStockCount} low stock`
                : 'All stocked'
            }
            icon="📦" color="amber"
          />
          <StatCard
            title="Total Customers"
            value={summary.totalCustomers}
            subtitle="Registered"
            icon="👥" color="blue"
          />
        </div>
      )}

      {/* Low stock alert */}
      {isAdmin() && summary?.lowStockCount > 0 && (
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

      {/* ── Charts Row (Admin only) ── */}
      {isAdmin() && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Sales trend — area chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Revenue Trend</h3>
                <p className="text-xs text-gray-400">Last 7 days</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
                Full Report →
              </Button>
            </div>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No sales data for last 7 days
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`}
                  />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                    dot={{ fill: '#4F46E5', strokeWidth: 0, r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment mode split — pie chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900">Payment Split</h3>
              <p className="text-xs text-gray-400">Recent invoices</p>
            </div>
            {paymentSplit.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No payment data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={paymentSplit}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentSplit.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [val + ' invoices', name]}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Top Products + Invoice count bar ── */}
      {isAdmin() && topProds.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Top Selling Products</h3>
              <p className="text-xs text-gray-400">By quantity sold</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={topProds.map(p => ({
                name: p.productName.length > 12
                  ? p.productName.slice(0, 12) + '…'
                  : p.productName,
                qty:  Number(p.totalQuantitySold || 0),
              }))}
              layout="vertical"
              margin={{ left: 0, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#374151' }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip
                formatter={(val) => [val + ' units', 'Sold']}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar
                dataKey="qty"
                fill="#4F46E5"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Recent Invoices ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Recent Invoices</h3>
            <p className="text-xs text-gray-400 mt-0.5">Latest billing activity</p>
          </div>
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
                      <div className="text-xs text-gray-400">
                        {inv.customer?.mobileNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-sm">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={inv.paymentMode}
                        type={
                          inv.paymentMode === 'CASH' ? 'gray' :
                          inv.paymentMode === 'UPI'  ? 'info' : 'purple'
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={inv.status}
                        type={
                          inv.status === 'PAID'      ? 'success' :
                          inv.status === 'CANCELLED' ? 'danger'  : 'warning'
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDateTime(inv.createdAt)}
                    </td>
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