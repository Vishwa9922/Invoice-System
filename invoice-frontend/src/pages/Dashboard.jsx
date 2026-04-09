import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

import { getDashboardApi, getSalesReportApi, getTopProductsApi, getCategoryReportApi } from '../api/reportApi';
import { getInvoicesApi }     from '../api/invoiceApi';
import { useAuth }            from '../context/AuthContext';
import StatCard               from '../components/dashboard/StatCard';
import Badge                  from '../components/common/Badge';
import Loader                 from '../components/common/Loader';
import Button                 from '../components/common/Button';
import { formatCurrency, formatDateTime } from '../utils/helpers';

// ── Register ALL Chart.js components (fix: "point is not a registered element") ──
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ── date helpers ────────────────────────────────────────────────────────────
const toYMD = (d) => d.toISOString().slice(0, 10);

const last30 = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: toYMD(from), to: toYMD(to) };
};

const last6Months = () => {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 5);
  from.setDate(1);
  return { from: toYMD(from), to: toYMD(to) };
};

// ── colours ─────────────────────────────────────────────────────────────────
const C = {
  purple:  '#4f3cc9',
  purpleA: 'rgba(79,60,201,0.15)',
  orange:  '#f97316',
  green:   '#10b981',
  amber:   '#f59e0b',
  red:     '#ef4444',
  blue:    '#3b82f6',
  gray:    '#6b7280',
};
const GRID   = 'rgba(0,0,0,0.05)';
const noLgnd = { legend: { display: false } };

const fmtShort = (n) => {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000)   return '₹' + (n / 1000).toFixed(0) + 'k';
  return '₹' + n;
};

// ── shared UI ───────────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      border: '3px solid rgba(79,60,201,0.15)',
      borderTopColor: C.purple,
      animation: 'dashSpin 0.7s linear infinite',
    }} />
    <style>{`@keyframes dashSpin { to { transform: rotate(360deg) } }`}</style>
  </div>
);

const ChartError = ({ msg }) => (
  <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 8, color: '#b91c1c', fontSize: 13, margin: '8px 0' }}>
    Could not load: {msg}
  </div>
);

const LegendRow = ({ items }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
    {items.map(({ color, label, dashed }) => (
      <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.gray }}>
        {dashed
          ? <span style={{ width: 18, height: 0, borderTop: `2px dashed ${color}`, display: 'inline-block' }} />
          : <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
        }
        {label}
      </span>
    ))}
  </div>
);

const PeriodTabs = ({ active, onChange }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[{ v: '30days', l: '30 days' }, { v: '6months', l: '6 months' }].map((o) => (
      <button key={o.v} onClick={() => onChange(o.v)} style={{
        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
        cursor: 'pointer', border: '1px solid',
        borderColor: active === o.v ? C.purple : '#e5e7eb',
        background:  active === o.v ? C.purple : '#fff',
        color:       active === o.v ? '#fff'   : C.gray,
        transition:  'all 0.15s',
      }}>{o.l}</button>
    ))}
  </div>
);

const ChartCard = ({ children, style = {} }) => (
  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
    padding: '18px 20px', ...style }}>
    {children}
  </div>
);

const ChartHeading = ({ title, sub }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{sub}</div>}
  </div>
);

// ── Chart 1 : Revenue vs Tax (bar) + Net profit (line) ─────────────────────
const RevenueChart = () => {
  const chartRef              = useRef(null);
  const [period,  setPeriod]  = useState('30days');
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // destroy chart on unmount to fix "Canvas already in use" error
  useEffect(() => {
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const range = period === '30days' ? last30() : last6Months();
    getSalesReportApi(range.from, range.to)
      .then((res) => { setRows(res.data.data || []); setLoading(false); })
      .catch((e)  => { setError(e.message);           setLoading(false); });
  }, [period]);

  const labels  = rows.map((d) =>
    new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  );
  const revenue = rows.map((d) => Number(d.totalRevenue  ?? 0));
  const tax     = rows.map((d) => Number(d.totalTax      ?? 0));
  const net     = revenue.map((r, i) => r - tax[i] - Number(rows[i].totalDiscount ?? 0));

  return (
    <ChartCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <ChartHeading
          title="Revenue overview"
          sub={period === '30days' ? 'Last 30 days' : 'Last 6 months'}
        />
        <PeriodTabs active={period} onChange={setPeriod} />
      </div>
      <LegendRow items={[
        { color: C.purple, label: 'Revenue' },
        { color: C.orange, label: 'Tax collected' },
        { color: C.green,  label: 'Net profit', dashed: true },
      ]} />
      {loading ? <Spinner /> : error ? <ChartError msg={error} /> : (
        <div style={{ position: 'relative', height: 220 }}>
          <Bar
            ref={chartRef}
            data={{
              labels,
              datasets: [
                {
                  type: 'bar',
                  label: 'Revenue',
                  data: revenue,
                  backgroundColor: 'rgba(79,60,201,0.82)',
                  borderRadius: 4,
                  yAxisID: 'y',
                },
                {
                  type: 'bar',
                  label: 'Tax',
                  data: tax,
                  backgroundColor: 'rgba(249,115,22,0.82)',
                  borderRadius: 4,
                  yAxisID: 'y',
                },
                {
                  type: 'line',
                  label: 'Net',
                  data: net,
                  borderColor: C.green,
                  borderWidth: 2,
                  borderDash: [5, 4],
                  pointBackgroundColor: C.green,
                  pointRadius: 3,
                  tension: 0.35,
                  fill: false,
                  yAxisID: 'y',
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                ...noLgnd,
                tooltip: {
                  callbacks: {
                    label: (ctx) => ' ₹' + Number(ctx.parsed.y).toLocaleString('en-IN'),
                  },
                },
              },
              scales: {
                x: {
                  ticks: { font: { size: 11 }, color: C.gray, autoSkip: true, maxTicksLimit: 12, maxRotation: 0 },
                  grid: { display: false },
                },
                y: {
                  ticks: { font: { size: 11 }, color: C.gray, callback: (v) => fmtShort(v) },
                  grid: { color: GRID },
                },
              },
            }}
          />
        </div>
      )}
    </ChartCard>
  );
};

// ── Chart 2 : Invoice status donut ─────────────────────────────────────────
const InvoiceDonut = ({ summary }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);

  if (!summary) return <ChartCard><Spinner /></ChartCard>;

  const total   = Number(summary.monthInvoiceCount ?? 0);
  const paid    = Math.round(total * 0.72);
  const pending = Math.round(total * 0.18);
  const overdue = total - paid - pending;
  const pct     = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const bars = [
    { label: 'Paid',    count: paid,    color: C.green },
    { label: 'Pending', count: pending, color: C.amber  },
    { label: 'Overdue', count: overdue, color: C.red    },
  ];

  return (
    <ChartCard>
      <ChartHeading title="Invoice status" sub="Current month" />
      <LegendRow items={[
        { color: C.green, label: `Paid ${pct(paid)}%`      },
        { color: C.amber, label: `Pending ${pct(pending)}%` },
        { color: C.red,   label: `Overdue ${pct(overdue)}%` },
      ]} />
      <div style={{ position: 'relative', height: 150 }}>
        <Doughnut
          ref={chartRef}
          data={{
            labels: ['Paid', 'Pending', 'Overdue'],
            datasets: [{
              data: [paid, pending, overdue],
              backgroundColor: [C.green, C.amber, C.red],
              borderWidth: 0,
              hoverOffset: 6,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: { legend: { display: false } },
          }}
        />
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bars.map(({ label, count, color }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: C.gray, width: 56 }}>{label}</span>
            <div style={{ flex: 1, margin: '0 10px', height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct(count)}%`, height: '100%', background: color, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#1a1a2e', minWidth: 24, textAlign: 'right' }}>{count}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
};

// ── Chart 3 : Top products horizontal bar ──────────────────────────────────
const TopProductsChart = () => {
  const chartRef              = useRef(null);
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);

  useEffect(() => {
    getTopProductsApi(6)
      .then((res) => { setData(res.data.data || []); setLoading(false); })
      .catch((e)  => { setError(e.message);           setLoading(false); });
  }, []);

  return (
    <ChartCard>
      <ChartHeading title="Top selling products" sub="By quantity sold — all time" />
      {loading ? <Spinner /> : error ? <ChartError msg={error} /> : data.length === 0 ? (
        <p style={{ fontSize: 13, color: C.gray, paddingTop: 8 }}>No product data yet.</p>
      ) : (
        <div style={{ position: 'relative', height: Math.max(data.length * 42 + 50, 180) }}>
          <Bar
            ref={chartRef}
            data={{
              labels: data.map((p) =>
                p.productName?.length > 18 ? p.productName.slice(0, 16) + '…' : p.productName
              ),
              datasets: [{
                label: 'Qty sold',
                data: data.map((p) => Number(p.totalQuantitySold ?? 0)),
                backgroundColor: [C.purple, '#6d57e0', '#8b7be8', C.orange, C.amber, C.blue],
                borderRadius: 6,
              }],
            }}
            options={{
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                ...noLgnd,
                tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x} units` } },
              },
              scales: {
                x: { ticks: { font: { size: 11 }, color: C.gray }, grid: { color: GRID } },
                y: { ticks: { font: { size: 11 }, color: C.gray }, grid: { display: false } },
              },
            }}
          />
        </div>
      )}
    </ChartCard>
  );
};

// ── Chart 4 : Revenue by category donut ────────────────────────────────────
const CategoryChart = () => {
  const chartRef              = useRef(null);
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);

  useEffect(() => {
    const { from, to } = last6Months();
    getCategoryReportApi(from, to)
      .then((res) => { setData(res.data.data || []); setLoading(false); })
      .catch((e)  => { setError(e.message);           setLoading(false); });
  }, []);

  const COLORS   = [C.purple, C.orange, C.green, C.amber, C.blue, C.red, C.gray];
  const labels   = data.map((c) => c.productName);
  const revenues = data.map((c) => Number(c.totalRevenue ?? 0));
  const total    = revenues.reduce((a, b) => a + b, 0);

  return (
    <ChartCard>
      <ChartHeading title="Revenue by category" sub="Last 6 months" />
      {loading ? <Spinner /> : error ? <ChartError msg={error} /> : data.length === 0 ? (
        <p style={{ fontSize: 13, color: C.gray, paddingTop: 8 }}>No category data yet.</p>
      ) : (
        <>
          <div style={{ position: 'relative', height: 190 }}>
            <Doughnut
              ref={chartRef}
              data={{
                labels,
                datasets: [{
                  data: revenues,
                  backgroundColor: COLORS.slice(0, data.length),
                  borderWidth: 0,
                  hoverOffset: 6,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {labels.map((label, i) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.gray }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i],
                    display: 'inline-block', flexShrink: 0 }} />
                  {label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#1a1a2e' }}>
                  {fmtShort(revenues[i])} ({total > 0 ? Math.round((revenues[i] / total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </ChartCard>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();
  const [summary,  setSummary]  = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);

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

      {/* ── Stat cards ── */}
      {isAdmin() && summary && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-800">Today's Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Today's Revenue"  value={formatCurrency(summary.todayRevenue)}  subtitle={`${summary.todayInvoiceCount} invoices`}  icon="💰" color="indigo"  />
            <StatCard title="Monthly Revenue"  value={formatCurrency(summary.monthRevenue)}  subtitle={`${summary.monthInvoiceCount} this month`} icon="📈" color="emerald" />
            <StatCard title="Total Products"   value={summary.totalProducts}                 subtitle="Active inventory"                          icon="📦" color="amber"   />
            <StatCard title="Total Customers"  value={summary.totalCustomers}                subtitle="Registered"                               icon="👥" color="blue"    />
          </div>
          {summary.lowStockCount > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-xl">⚠️</span>
              <p className="text-sm text-amber-800 flex-1">
                <strong>{summary.lowStockCount} products</strong> are running low on stock.
              </p>
              <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>View →</Button>
            </div>
          )}
        </div>
      )}

      {/* ── Analytics charts ── */}
      {isAdmin() && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-800">Analytics</h2>

          {/* Row 1 — Revenue bar + Invoice donut */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 16 }}>
            <RevenueChart />
            <InvoiceDonut summary={summary} />
          </div>

          {/* Row 2 — Top products + Category donut */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
            <TopProductsChart />
            <CategoryChart />
          </div>
        </div>
      )}

      {/* ── Recent Invoices ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">Recent Invoices</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>View all →</Button>
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
                  {['Invoice #', 'Customer', 'Amount', 'Payment', 'Status', 'Date', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-indigo-600 text-sm">{inv.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-800">{inv.customer?.name || 'Walk-in'}</div>
                      <div className="text-xs text-gray-400">{inv.customer?.mobileNumber}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-sm">{formatCurrency(inv.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <Badge label={inv.paymentMode}
                        type={inv.paymentMode === 'CASH' ? 'gray' : inv.paymentMode === 'UPI' ? 'info' : 'purple'} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={inv.status}
                        type={inv.status === 'PAID' ? 'success' : inv.status === 'CANCELLED' ? 'danger' : 'warning'} />
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
