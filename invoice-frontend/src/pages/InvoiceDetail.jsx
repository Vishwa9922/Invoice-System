import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getInvoiceByIdApi, cancelInvoiceApi, downloadInvoicePdfApi } from '../api/invoiceApi';
import Button from '../components/common/Button';
import Badge  from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import SignaturePad from '../components/common/SignaturePad';

const InvoiceDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [invoice,    setInvoice]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [signature,     setSignature]     = useState(null);
  const [signMode,      setSignMode]      = useState(''); // 'pad' | 'upload' | ''
  const [showSignPanel, setShowSignPanel] = useState(false);

  useEffect(() => { fetchInvoice(); }, [id]);

  const fetchInvoice = async () => {
    setLoading(true);
    try { const res = await getInvoiceByIdApi(id); setInvoice(res.data.data); }
    catch { toast.error('Invoice not found'); navigate('/invoices'); }
    finally { setLoading(false); }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelInvoiceApi(id);
      toast.success('Invoice cancelled');
      setShowCancel(false); fetchInvoice();
    } catch (err) { toast.error(err.response?.data?.message || 'Cancel failed'); }
    finally       { setCancelling(false); }
  };

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      const res = await downloadInvoicePdfApi(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href = url; a.download = `${invoice.invoiceNumber}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('PDF failed'); }
    finally  { setPdfLoading(false); }
  };

  const handleSignatureUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    setSignature(ev.target.result);
    setShowSignPanel(false);
    toast.success('Signature added!');
  };
  reader.readAsDataURL(file);
};

  if (loading) return <Loader fullPage />;
  if (!invoice) return null;

  const statusMap = { PAID: 'success', CANCELLED: 'danger', PENDING: 'warning' };
  const payMap    = { CASH: 'gray', UPI: 'info', CARD: 'purple' };

  return (
    <div className="space-y-5">

      {/* Topbar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/invoices')}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
          ← Back to Invoices
        </button>
        <div className="flex gap-2">
          {invoice.status !== 'CANCELLED' && (
            <Button variant="secondary" size="sm" onClick={() => setShowCancel(true)}>
              ✕ Cancel Invoice
            </Button>
          )}
          <Button size="sm" loading={pdfLoading} onClick={handlePdf}>📥 Download PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

        {/* Left */}
        <div className="space-y-4">

          {/* Invoice header */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-mono text-2xl font-extrabold text-indigo-600">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-sm text-gray-400 mt-1">{formatDateTime(invoice.createdAt)}</div>
              </div>
              <div className="flex gap-2">
                <Badge label={invoice.status} type={statusMap[invoice.status] || 'gray'} size="lg" />
                <Badge label={invoice.paymentMode} type={payMap[invoice.paymentMode] || 'gray'} size="lg" />
              </div>
            </div>
            {invoice.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                📝 {invoice.notes}
              </div>
            )}
          </div>

          {/* Items table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Items ({invoice.items?.length})</h3>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Product','Qty','Unit Price','Tax','Total'].map((h,i) => (
                    <th key={i} className={`px-4 py-3 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.productName}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-700 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm text-gray-500">{item.taxPercent}%</div>
                      <div className="text-xs text-gray-400">{formatCurrency(item.lineTax)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end p-5 border-t border-gray-100">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax</span><span className="font-semibold">{formatCurrency(invoice.totalTax)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span><span className="font-semibold">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Grand Total</span>
                  <span className="text-2xl font-extrabold text-indigo-600">{formatCurrency(invoice.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">

          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">Customer</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
                {invoice.customer?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="font-bold text-gray-900">{invoice.customer?.name || 'Walk-in'}</div>
                <div className="text-sm text-gray-500">📱 {invoice.customer?.mobileNumber}</div>
              </div>
            </div>
            {invoice.customer?.email && <div className="text-sm text-gray-500 mb-1">📧 {invoice.customer.email}</div>}
            {invoice.customer?.address && <div className="text-sm text-gray-500 mb-3">📍 {invoice.customer.address}</div>}
            <Button variant="ghost" size="sm" fullWidth onClick={() => navigate('/customers')}>
              View Customer →
            </Button>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 pb-3 border-b border-gray-100">Summary</h3>
            <div className="space-y-0">
              {[
                { l: 'Invoice #', v: invoice.invoiceNumber },
                { l: 'Date',      v: formatDateTime(invoice.createdAt) },
                { l: 'Items',     v: `${invoice.items?.length || 0} product(s)` },
                { l: 'Payment',   v: invoice.paymentMode },
                { l: 'Status',    v: invoice.status },
              ].map((r, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{r.l}</span>
                  <span className="text-xs font-semibold text-gray-800">{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-sm font-bold text-gray-900 mb-3 pb-3 border-b border-gray-100">Actions</h3>
            <Button variant="secondary" fullWidth loading={pdfLoading} onClick={handlePdf}>📥 Download PDF</Button>
            <Button variant="ghost"     fullWidth onClick={() => navigate('/pos')}>🖥️ New Bill</Button>
            {invoice.status !== 'CANCELLED' && (
              <Button variant="secondary" fullWidth onClick={() => setShowCancel(true)}
                className="text-red-500 border-red-200 hover:bg-red-50">
                ✕ Cancel Invoice
              </Button>
            )}
          </div>

          {/* Signature Card */}
<div className="bg-white rounded-xl border border-gray-200 p-5">
  <h3 className="text-sm font-bold text-gray-900 mb-3 pb-3 border-b border-gray-100">
    ✍️ Signature
  </h3>

  {signature ? (
    <div className="space-y-3">
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center justify-center">
        <img src={signature} alt="Signature" className="max-h-20 object-contain" />
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" fullWidth
          onClick={() => { setSignature(null); setShowSignPanel(false); }}>
          Remove
        </Button>
        <Button size="sm" fullWidth loading={pdfLoading} onClick={handlePdf}>
          📥 PDF with Sign
        </Button>
      </div>
    </div>
  ) : (
    <div className="space-y-2">
      {!showSignPanel ? (
        <>
          <button
            onClick={() => { setShowSignPanel(true); setSignMode('pad'); }}
            className="w-full py-2.5 text-sm font-medium border-2 border-dashed border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            ✍️ Draw Signature
          </button>
          <label className="w-full py-2.5 text-sm font-medium border-2 border-dashed border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center">
            📁 Upload Signature
            <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
          </label>
        </>
      ) : (
        <SignaturePad
          onSave={(dataUrl) => {
            setSignature(dataUrl);
            setShowSignPanel(false);
            toast.success('Signature saved!');
          }}
          onClose={() => setShowSignPanel(false)}
        />
      )}
    </div>
  )}
</div>
        </div>
      </div>

      {/* Cancel confirm */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCancel(false)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-sm text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Invoice?</h3>
            <p className="text-sm text-gray-500 mb-5">
              <strong>{invoice.invoiceNumber}</strong> will be marked as cancelled. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setShowCancel(false)}>Keep</Button>
              <Button variant="danger" loading={cancelling} onClick={handleCancel}>Cancel Invoice</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;