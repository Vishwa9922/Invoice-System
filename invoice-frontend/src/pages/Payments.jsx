import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPendingDuesApi, recordPaymentApi, getWhatsAppReminderApi } from '../api/paymentApi';
import Button from '../components/common/Button';
import Modal  from '../components/common/Modal';
import Input  from '../components/common/Input';
import Badge  from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { formatCurrency } from '../utils/helpers';

const PAYMENT_MODES = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CREDIT'];

const Payments = () => {
  const [dues,       setDues]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [payModal,   setPayModal]   = useState(false);
  const [reminder,   setReminder]   = useState('');
  const [reminderOpen, setReminderOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [form,       setForm]       = useState({ amount: '', paymentMode: 'CASH', note: '' });
  const [saving,     setSaving]     = useState(false);

  useEffect(() => { fetchDues(); }, []);

  const fetchDues = async () => {
    setLoading(true);
    try {
      const res = await getPendingDuesApi();
      setDues(res.data.data || []);
    } catch { toast.error('Failed to load dues'); }
    finally  { setLoading(false); }
  };

  const openPay = (due) => {
    setSelected(due);
    setForm({ amount: due.dueAmount, paymentMode: 'CASH', note: '' });
    setPayModal(true);
  };

  const handlePay = async () => {
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter valid amount'); return; }
    setSaving(true);
    try {
      await recordPaymentApi({
        invoiceId:   selected.invoiceId,
        amount:      Number(form.amount),
        paymentMode: form.paymentMode,
        note:        form.note,
      });
      toast.success('Payment recorded!');
      setPayModal(false); fetchDues();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally       { setSaving(false); }
  };

  const openReminder = async (due) => {
    try {
      const res = await getWhatsAppReminderApi(due.invoiceId);
      setReminder(res.data.data);
      setReminderOpen(true);
    } catch { toast.error('Failed to generate reminder'); }
  };

  const copyReminder = () => {
    navigator.clipboard.writeText(reminder);
    toast.success('Copied to clipboard!');
  };

  const openWhatsApp = (mobile) => {
    const encoded = encodeURIComponent(reminder);
    window.open(`https://wa.me/91${mobile}?text=${encoded}`, '_blank');
  };

  const statusBadge = (status) => {
    if (status === 'PENDING') return <Badge label="Pending" type="danger" />;
    if (status === 'PARTIAL') return <Badge label="Partial" type="warning" />;
    return <Badge label="Paid" type="success" />;
  };

  const totalDue = dues.reduce((sum, d) => sum + Number(d.dueAmount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payments & Dues</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {dues.length} pending • Total due: <span className="text-red-500 font-semibold">{formatCurrency(totalDue)}</span>
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Due</p>
          <p className="text-2xl font-extrabold text-red-500 mt-1">{formatCurrency(totalDue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Invoices</p>
          <p className="text-2xl font-extrabold text-amber-500 mt-1">{dues.filter(d => d.paymentStatus === 'PENDING').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Partial Paid</p>
          <p className="text-2xl font-extrabold text-indigo-500 mt-1">{dues.filter(d => d.paymentStatus === 'PARTIAL').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <Loader fullPage /> : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Invoice', 'Customer', 'Mobile', 'Total', 'Paid', 'Due', 'Status', 'Actions'].map((h, i) => (
                  <th key={i} className="px-3 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dues.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <span className="text-4xl">✅</span>
                    <p className="text-sm font-semibold text-gray-600">No pending dues!</p>
                    <p className="text-xs">All invoices are paid.</p>
                  </div>
                </td></tr>
              ) : dues.map((due) => (
                <tr key={due.invoiceId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 text-sm font-mono font-semibold text-indigo-600">{due.invoiceNumber}</td>
                  <td className="px-3 py-3 text-sm font-medium text-gray-900">{due.customerName}</td>
                  <td className="px-3 py-3 text-sm text-gray-600">{due.mobile || '—'}</td>
                  <td className="px-3 py-3 text-sm font-bold">{formatCurrency(due.grandTotal)}</td>
                  <td className="px-3 py-3 text-sm text-emerald-600 font-semibold">{formatCurrency(due.paidAmount)}</td>
                  <td className="px-3 py-3 text-sm text-red-600 font-bold">{formatCurrency(due.dueAmount)}</td>
                  <td className="px-3 py-3">{statusBadge(due.paymentStatus)}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => openPay(due)}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg">
                        💰 Pay
                      </button>
                      <button onClick={() => openReminder(due)}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-green-50 text-green-600 hover:bg-green-100 rounded-lg">
                        📲 WA
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Payment Modal */}
      {selected && (
        <Modal isOpen={payModal} onClose={() => setPayModal(false)} title="Record Payment" width="max-w-md"
          footer={<><Button variant="secondary" onClick={() => setPayModal(false)}>Cancel</Button><Button loading={saving} onClick={handlePay}>Record</Button></>}
        >
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-600">Invoice:</span><span className="font-semibold">{selected.invoiceNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Customer:</span><span className="font-semibold">{selected.customerName}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Due Amount:</span><span className="font-bold text-red-600">{formatCurrency(selected.dueAmount)}</span></div>
            </div>
            <Input label="Amount (₹)" name="amount" type="number" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" required />
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Payment Mode</label>
              <select value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white">
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Note</label>
              <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Optional..." rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:border-indigo-500" />
            </div>
          </div>
        </Modal>
      )}

      {/* WhatsApp Reminder Modal */}
      <Modal isOpen={reminderOpen} onClose={() => setReminderOpen(false)} title="📲 WhatsApp Reminder" width="max-w-md"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="secondary" onClick={copyReminder}>📋 Copy</Button>
            {selected?.mobile && <Button onClick={() => openWhatsApp(selected.mobile)}>📲 Open WhatsApp</Button>}
            <Button variant="secondary" onClick={() => setReminderOpen(false)}>Close</Button>
          </div>
        }
      >
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{reminder}</pre>
        </div>
      </Modal>
    </div>
  );
};

export default Payments;