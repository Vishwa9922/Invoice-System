import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getDashboardApi, getSalesReportApi,
  getProductSalesApi, getCategorySalesApi,
  getTopProductsApi, exportExcelApi, exportCsvApi,
} from '../api/reportApi';
import Button from '../components/common/Button';
import Badge  from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { formatCurrency, formatDate } from '../utils/helpers';

const today      = new Date().toISOString().split('T')[0];
const monthStart = new Date(new Date().setDate(1)).toISOString().split('T')[0];
const TABS       = [
  { key: 'sales',      label: '📅 Daily Sales'   },
  { key: 'products',   label: '📦 Product-wise'  },
  { key: 'categories', label: '🗂️ Category-wise' },
  { key: 'top',        label: '🏆 Top Products'  },
];
const CAT_COLORS = ['bg-indigo-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-violet-500','bg-blue-500'];

const Reports = () => {
  const [tab,        setTab]        = useState('sales');
  const [from,       setFrom]       = useState(monthStart);
  const [to,         setTo]         = useState(today);
  const [dashboard,  setDashboard]  = useState(null);
  const [salesData,  setSalesData]  = useState([]);
  const [prodData,   setProdData]   = useState([]);
  const [catData,    setCatData]    = useState([]);
  const [topData,    setTopData]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [dashLoad,   setDashLoad]   = useState(true);
  const [exporting,  setExporting]  = useState('');

  useEffect(() => { fetchDashboard(); }, []);
  useEffect(() => { fetchReport(); }, [tab, from, to]);

  const fetchDashboard = async () => {
    setDashLoad(true);
    try { const res = await getDashboardApi(); setDashboard(res.data.data); }
    catch { toast.error('Dashboard failed'); }
    finally { setDashLoad(false); }
  };

  const fetchReport = async () => {
    if (!from || !to || from > to) return;
    setLoading(true);
    try {
      if      (tab === 'sales')      { const r = await getSalesReportApi(from, to);     setSalesData(r.data.data || []); }
      else if (tab === 'products')   { const r = await getProductSalesApi(from, to);    setProdData(r.data.data || []); }
      else if (tab === 'categories') { const r = await getCategorySalesApi(from, to);   setCatData(r.data.data || []); }
      else if (tab === 'top')        { const r = await getTopProductsApi(10);           setTopData(r.data.data || []); }
    } catch { toast.error('Report failed'); }
    finally  { setLoading(false); }
  };

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const res  = type === 'excel' ? await exportExcelApi(from, to) : await exportCsvApi(from, to);
      const ext  = type === 'excel' ? 'xlsx' : 'csv';
      const mime = type === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      const a    = document.createElement('a');
      a.href = url; a.download = `sales-${from}-to-${to}.${ext}`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export successful');
    } catch { toast.error('Export failed'); }
    finally  { setExporting(''); }
  };

  const salesTotal = salesData.reduce((s, r) => ({
    invoices: s.invoices + (r.invoiceCount || 0),
    revenue:  s.revenue  + Number(r.totalRevenue  || 0),
    tax:      s.tax      + Number(r.totalTax      || 0),
    discount: s.discount + Number(r.totalDiscount || 0),
  }), { invoices: 0, revenue: 0, tax: 0, discount: 0 });

  const prodTotal = prodData.reduce((s, r) => s + Number(r.totalRevenue || 0), 0);
  const catTotal  = catData.reduce((s, r)  => s + Number(r.totalRevenue || 0), 0);
  const maxQty    = topData[0]?.totalQuantitySold || 1;

  const Empty = ({ msg }) => (
    <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
      <span className="text-5xl">📊</span>
      <p className="text-sm">{msg}</p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Stat cards */}
      {dashLoad ? <Loader fullPage /> : dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Today's Rev",   value: formatCurrency(dashboard.todayRevenue),  sub: `${dashboard.todayInvoiceCount} bills`,  icon: '💰', bg: 'bg-indigo-500'  },
            { label: 'Monthly Rev',   value: formatCurrency(dashboard.monthRevenue),  sub: `${dashboard.monthInvoiceCount} bills`,  icon: '📈', bg: 'bg-emerald-500' },
            { label: 'Products',      value: dashboard.totalProducts,                  sub: 'Active',                                icon: '📦', bg: 'bg-amber-500'   },
            { label: 'Customers',     value: dashboard.totalCustomers,                 sub: 'Registered',                            icon: '👥', bg: 'bg-blue-500'    },
            { label: 'Low Stock',     value: dashboard.lowStockCount,                  sub: 'Below 10 units',                        icon: '⚠️', bg: 'bg-red-500'     },
          ].map((c, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">{c.label}</p>
                <p className="text-xl font-extrabold text-gray-900 leading-tight">{c.value ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
              </div>
              <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center text-lg shrink-0`}>
                {c.icon}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter + Export */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-end justify-between gap-3 flex-wrap">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500" />
          </div>
          <Button size="sm" onClick={fetchReport}>🔍 Apply</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" loading={exporting==='excel'} onClick={() => handleExport('excel')}>📊 Excel</Button>
          <Button variant="secondary" size="sm" loading={exporting==='csv'}   onClick={() => handleExport('csv')}>📄 CSV</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1.5 flex gap-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all
              ${tab === t.key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <Loader fullPage /> : (

          // Sales
          tab === 'sales' ? (
            salesData.length === 0 ? <Empty msg="No sales in selected range" /> : (
              <>
                <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-50">
                  {[['Total Bills', salesTotal.invoices],['Total Revenue',formatCurrency(salesTotal.revenue)],['Total Tax',formatCurrency(salesTotal.tax)],['Total Discount',formatCurrency(salesTotal.discount)]].map(([l,v],i) => (
                    <div key={i} className="px-5 py-4 border-r border-gray-100 last:border-0">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{l}</p>
                      <p className="text-lg font-extrabold text-gray-900">{v}</p>
                    </div>
                  ))}
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Date','Bills','Revenue','Tax','Discount','Avg Bill'].map((h,i) => (
                        <th key={i} className={`px-4 py-3 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.map((r, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{formatDate(r.date)}</td>
                        <td className="px-4 py-3 text-right"><Badge label={r.invoiceCount} type="info" /></td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(r.totalRevenue)}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">{formatCurrency(r.totalTax)}</td>
                        <td className="px-4 py-3 text-right text-sm text-emerald-600">{formatCurrency(r.totalDiscount)}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">
                          {r.invoiceCount > 0 ? formatCurrency(r.totalRevenue / r.invoiceCount) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )

          // Products
          ) : tab === 'products' ? (
            prodData.length === 0 ? <Empty msg="No product sales in selected range" /> : (
              <>
                <div className="grid grid-cols-2 border-b border-gray-100 bg-gray-50">
                  {[['Products Sold', prodData.length],['Total Revenue', formatCurrency(prodTotal)]].map(([l,v],i) => (
                    <div key={i} className="px-5 py-4 border-r border-gray-100 last:border-0">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{l}</p>
                      <p className="text-lg font-extrabold text-gray-900">{v}</p>
                    </div>
                  ))}
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['#','Product','Qty Sold','Revenue','% of Total'].map((h,i) => (
                        <th key={i} className={`px-4 py-3 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prodData.map((r, i) => {
                      const pct = prodTotal > 0 ? ((Number(r.totalRevenue) / prodTotal) * 100).toFixed(1) : 0;
                      return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-400">{i+1}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{r.productName}</td>
                          <td className="px-4 py-3 text-right"><Badge label={r.totalQuantitySold} type="info" /></td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(r.totalRevenue)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 min-w-[36px]">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )

          // Categories
          ) : tab === 'categories' ? (
            catData.length === 0 ? <Empty msg="No category sales in selected range" /> : (
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  {[['Categories', catData.length],['Total Revenue', formatCurrency(catTotal)]].map(([l,v],i) => (
                    <div key={i}>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">{l}</p>
                      <p className="text-lg font-extrabold text-gray-900">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {catData.map((r, i) => {
                    const pct   = catTotal > 0 ? ((Number(r.totalRevenue) / catTotal) * 100).toFixed(1) : 0;
                    const color = CAT_COLORS[i % CAT_COLORS.length];
                    return (
                      <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                          <div className="text-sm font-bold text-gray-900 flex-1 truncate">{r.productName}</div>
                          <span className="text-xs font-bold text-gray-500">{pct}%</span>
                        </div>
                        <div className="text-xl font-extrabold text-gray-900 mb-0.5">{formatCurrency(r.totalRevenue)}</div>
                        <div className="text-xs text-gray-400 mb-3">{r.totalQuantitySold} units</div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )

          // Top Products
          ) : tab === 'top' ? (
            topData.length === 0 ? <Empty msg="No sales data" /> : (
              <div className="p-4 space-y-3">
                {topData.map((r, i) => {
                  const pct    = ((r.totalQuantitySold / maxQty) * 100).toFixed(0);
                  const medals = ['🥇','🥈','🥉'];
                  return (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-2xl w-8 text-center shrink-0">
                        {medals[i] || <span className="text-sm font-bold text-gray-400">{i+1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 mb-2 truncate">{r.productName}</div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-extrabold text-indigo-600">{r.totalQuantitySold}</div>
                        <div className="text-xs text-gray-400">units</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : null
        )}
      </div>
    </div>
  );
};

export default Reports;
