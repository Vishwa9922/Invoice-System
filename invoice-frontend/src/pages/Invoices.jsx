import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getInvoicesApi, filterInvoicesApi,
  cancelInvoiceApi, downloadInvoicePdfApi,
} from '../api/invoiceApi';
import Button     from '../components/common/Button';
import Badge      from '../components/common/Badge';
import Loader     from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import { formatCurrency, formatDateTime } from '../utils/helpers';

const today      = new Date().toISOString().split('T')[0];
const monthStart = new Date(new Date().setDate(1)).toISOString().split('T')[0];

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices,   setInvoices]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total,      setTotal]      = useState(0);
  const [from,       setFrom]       = useState(monthStart);
  const [to,         setTo]         = useState(today);
  const [filtered,   setFiltered]   = useState(false);
  const [cancelId,   setCancelId]   = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);

  useEffect(() => { fetchInvoices(); }, [page]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = filtered
        ? await filterInvoicesApi(from, to, page, 10)
        : await getInvoicesApi(page, 10);
      const d = res.data.data;
      setInvoices(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotal(d.totalElements || 0);
    } catch { toast.error('Failed to load invoices'); }
    finally  { setLoading(false); }
  };

  const handleFilter = async () => {
    if (!from || !to)  { toast.error('Select both dates'); return; }
    if (from > to)     { toast.error('From must be before To'); return; }
    setFiltered(true); setPage(0); setLoading(true);
    try {
      const res = await filterInvoicesApi(from, to, 0, 10);
      const d   = res.data.data;
      setInvoices(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotal(d.totalElements || 0);
    } catch { toast.error('Filter failed'); }
    finally  { setLoading(false); }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelInvoiceApi(cancelId);
      toast.success('Invoice cancelled');
      setCancelId(null); fetchInvoices();
    } catch (err) { toast.error(err.response?.data?.message || 'Cancel failed'); }
    finally       { setCancelling(false); }
  };

  const handlePdf = async (inv) => {
    setPdfLoading(inv.id);
    try {
      const res = await downloadInvoicePdfApi(inv.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href = url; a.download = `${inv.invoiceNumber}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('PDF failed'); }
    finally  { setPdfLoading(null); }
  };

  const statusBadge = (s) => <Badge label={s} type={s==='PAID'?'success':s==='CANCELLED'?'danger':'warning'} />;
  const payBadge    = (m) => <Badge label={m} type={m==='CASH'?'gray':m==='UPI'?'info':'purple'} />;

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
          <p className="text-sm text-gray-400 mt-0.5">{total} invoices {filtered ? '(filtered)' : 'total'}</p>
        </div>
        <Button onClick={() => navigate('/pos')}>🖥️ New Bill</Button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-end gap-3 flex-wrap">
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
        <Button size="sm" onClick={handleFilter}>🔍 Filter</Button>
        {filtered && (
          <Button variant="secondary" size="sm" onClick={() => { setFiltered(false); setPage(0); setTimeout(fetchInvoices, 0); }}>
            ✕ Clear
          </Button>
        )}
        {filtered && (
          <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-medium">
            📅 {from} → {to}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <Loader fullPage /> : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Invoice #','Customer','Items','Amount','Payment','Status','Date','Actions'].map((h,i) => (
                    <th key={i} className="px-4 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <span className="text-4xl">🧾</span>
                      <p className="text-sm">{filtered ? 'No invoices in this range' : 'No invoices yet'}</p>
                      {!filtered && <Button size="sm" onClick={() => navigate('/pos')}>Open POS</Button>}
                    </div>
                  </td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${inv.status==='CANCELLED' ? 'opacity-60' : ''}`}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-indigo-600 text-sm">{inv.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">{inv.customer?.name || 'Walk-in'}</div>
                      <div className="text-xs text-gray-400">{inv.customer?.mobileNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{inv.items?.length || 0} item(s)</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(inv.grandTotal)}</div>
                      {inv.discount > 0 && <div className="text-xs text-emerald-600">-{formatCurrency(inv.discount)}</div>}
                    </td>
                    <td className="px-4 py-3">{payBadge(inv.paymentMode)}</td>
                    <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(inv.createdAt)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm">👁</button>
                        <button onClick={() => handlePdf(inv)} disabled={pdfLoading===inv.id}
                          className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm">
                          {pdfLoading===inv.id ? '⏳' : '📥'}
                        </button>
                        {inv.status !== 'CANCELLED' && (
                          <button onClick={() => setCancelId(inv.id)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold">✕</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 border-t border-gray-100">
              <Pagination pageNumber={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Cancel confirm */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCancelId(null)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-sm text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Invoice?</h3>
            <p className="text-sm text-gray-500 mb-5">This will mark the invoice as cancelled. This cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setCancelId(null)}>Keep</Button>
              <Button variant="danger" loading={cancelling} onClick={handleCancel}>Cancel Invoice</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;