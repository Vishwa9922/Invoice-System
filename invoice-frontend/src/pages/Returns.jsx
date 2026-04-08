import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getReturnsApi, createReturnApi, approveReturnApi, rejectReturnApi } from '../api/returnApi';
import { getInvoiceByNumberApi } from '../api/invoiceApi';
import Button     from '../components/common/Button';
import Modal      from '../components/common/Modal';
import Input      from '../components/common/Input';
import Badge      from '../components/common/Badge';
import Loader     from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import { formatCurrency } from '../utils/helpers';

const STATUS_COLORS = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' };
const PAYMENT_MODES = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'];

const Returns = () => {
  const [returns,    setReturns]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total,      setTotal]      = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [processing, setProcessing] = useState(null);

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoice,       setInvoice]       = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [returnItems,   setReturnItems]   = useState([]);
  const [returnReason,  setReturnReason]  = useState('');
  const [refundMode,    setRefundMode]    = useState('CASH');

  useEffect(() => { setPage(0); }, [statusFilter]);
  useEffect(() => { fetchReturns(); }, [page, statusFilter]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await getReturnsApi(page, 10, statusFilter);
      const d = res.data.data;
      setReturns(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotal(d.totalElements || 0);
    } catch { toast.error('Failed to load returns'); }
    finally  { setLoading(false); }
  };

  const searchInvoice = async () => {
    if (!invoiceNumber.trim()) return;
    setInvoiceLoading(true);
    try {
      const res = await getInvoiceByNumberApi(invoiceNumber.trim());
      const inv = res.data.data;
      setInvoice(inv);
      setReturnItems(inv.items.map(it => ({ productId: it.productId, productName: it.productName, quantity: 0, maxQty: it.quantity, unitPrice: it.unitPrice })));
    } catch { toast.error('Invoice not found'); setInvoice(null); setReturnItems([]); }
    finally  { setInvoiceLoading(false); }
  };

  const updateQty = (i, val) => {
    setReturnItems(prev => {
      const arr = [...prev];
      arr[i] = { ...arr[i], quantity: Math.min(Math.max(0, Number(val)), arr[i].maxQty) };
      return arr;
    });
  };

  const closeModal = () => {
    setModalOpen(false); setInvoiceNumber(''); setInvoice(null);
    setReturnItems([]); setReturnReason(''); setRefundMode('CASH');
  };

  const handleSubmit = async () => {
    const items = returnItems.filter(it => it.quantity > 0);
    if (items.length === 0) { toast.error('Select at least one item to return'); return; }
    setSaving(true);
    try {
      await createReturnApi({
        invoiceId:    invoice.id,
        returnReason: returnReason,
        refundMode:   refundMode,
        items: items.map(it => ({ productId: it.productId, quantity: it.quantity })),
      });
      toast.success('Return request created!');
      closeModal(); fetchReturns();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally       { setSaving(false); }
  };

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await approveReturnApi(id);
      toast.success('Return approved — stock restored!');
      fetchReturns();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally       { setProcessing(null); }
  };

  const handleReject = async (id) => {
    setProcessing(id);
    try {
      await rejectReturnApi(id);
      toast.success('Return rejected');
      fetchReturns();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally       { setProcessing(null); }
  };

  const refundTotal = returnItems.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Returns & Refunds</h2>
          <p className="text-sm text-gray-400 mt-0.5">{total} return requests</p>
        </div>
        <Button icon="+" onClick={() => setModalOpen(true)}>New Return</Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 text-sm rounded-full font-medium border transition-colors
              ${statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <Loader fullPage /> : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['#', 'Invoice', 'Customer', 'Items', 'Refund', 'Reason', 'Status', 'Actions'].map((h, i) => (
                    <th key={i} className="px-3 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {returns.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <span className="text-4xl">↩️</span>
                      <p className="text-sm">No return requests</p>
                    </div>
                  </td></tr>
                ) : returns.map((r, idx) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-xs text-gray-400">{page * 10 + idx + 1}</td>
                    <td className="px-3 py-3 text-sm font-mono font-semibold text-indigo-600">{r.invoiceNumber}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{r.customerName}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 text-center">{r.returnItems?.length || 0}</td>
                    <td className="px-3 py-3 font-bold text-sm text-emerald-600">{formatCurrency(r.refundAmount)}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 max-w-[140px] truncate">{r.returnReason || '—'}</td>
                    <td className="px-3 py-3"><Badge label={r.status} type={STATUS_COLORS[r.status]} /></td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => { setDetailItem(r); setDetailOpen(true); }}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg">
                          👁️
                        </button>
                        {r.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleApprove(r.id)} disabled={processing === r.id}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg disabled:opacity-50">
                              ✓ Approve
                            </button>
                            <button onClick={() => handleReject(r.id)} disabled={processing === r.id}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-50">
                              ✕ Reject
                            </button>
                          </>
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

      {/* Create Return Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="New Return Request" width="max-w-xl"
        footer={<><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button loading={saving} onClick={handleSubmit} disabled={!invoice}>Submit Return</Button></>}
      >
        <div className="space-y-4">
          {/* Search Invoice */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Invoice Number</label>
            <div className="flex gap-2">
              <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchInvoice()}
                placeholder="e.g. INV-2026-00001"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              <Button onClick={searchInvoice} loading={invoiceLoading}>Search</Button>
            </div>
          </div>

          {invoice && (
            <>
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-600">Customer:</span><span className="font-semibold">{invoice.customerName}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Total:</span><span className="font-bold">{formatCurrency(invoice.grandTotal)}</span></div>
              </div>

              {/* Items with qty */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Select Return Items</label>
                <div className="space-y-2">
                  {returnItems.map((it, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{it.productName}</div>
                        <div className="text-xs text-gray-500">Max: {it.maxQty} • {formatCurrency(it.unitPrice)} each</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(i, it.quantity - 1)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold flex items-center justify-center">-</button>
                        <span className="w-8 text-center text-sm font-bold">{it.quantity}</span>
                        <button onClick={() => updateQty(i, it.quantity + 1)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold flex items-center justify-center">+</button>
                      </div>
                    </div>
                  ))}
                </div>
                {refundTotal > 0 && (
                  <div className="mt-2 flex justify-end">
                    <div className="bg-emerald-50 px-4 py-2 rounded-lg">
                      <span className="text-sm text-gray-600">Refund: </span>
                      <span className="text-sm font-bold text-emerald-700">{formatCurrency(refundTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Refund Mode</label>
                  <select value={refundMode} onChange={e => setRefundMode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white">
                    {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Return Reason</label>
                  <input value={returnReason} onChange={e => setReturnReason(e.target.value)}
                    placeholder="e.g. Defective item"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500" />
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Detail Modal */}
      {detailItem && (
        <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={`Return #${detailItem.id}`} width="max-w-md"
          footer={<Button variant="secondary" onClick={() => setDetailOpen(false)}>Close</Button>}
        >
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-gray-500">Invoice:</span> <span className="font-semibold">{detailItem.invoiceNumber}</span></div>
              <div><span className="text-gray-500">Customer:</span> <span className="font-semibold">{detailItem.customerName}</span></div>
              <div><span className="text-gray-500">Refund:</span> <span className="font-bold text-emerald-600">{formatCurrency(detailItem.refundAmount)}</span></div>
              <div><span className="text-gray-500">Status:</span> <Badge label={detailItem.status} type={STATUS_COLORS[detailItem.status]} /></div>
            </div>
            {detailItem.returnReason && <p className="text-gray-500">Reason: <span className="text-gray-900">{detailItem.returnReason}</span></p>}
            <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead><tr className="bg-gray-50"><th className="px-3 py-2 text-left text-xs font-bold text-gray-500">Product</th><th className="px-3 py-2 text-center text-xs font-bold text-gray-500">Qty</th><th className="px-3 py-2 text-right text-xs font-bold text-gray-500">Refund</th></tr></thead>
              <tbody>
                {detailItem.returnItems?.map(it => (
                  <tr key={it.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{it.productName}</td>
                    <td className="px-3 py-2 text-center">{it.quantity}</td>
                    <td className="px-3 py-2 text-right font-bold">{formatCurrency(it.refundAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Returns;