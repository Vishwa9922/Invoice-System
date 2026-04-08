import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getExpensesApi, createExpenseApi, updateExpenseApi, deleteExpenseApi } from '../api/expenseApi';
import Button     from '../components/common/Button';
import Modal      from '../components/common/Modal';
import Input      from '../components/common/Input';
import Badge      from '../components/common/Badge';
import Loader     from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import { formatCurrency } from '../utils/helpers';

const CATEGORIES = ['RENT', 'SALARY', 'UTILITY', 'PURCHASE', 'MAINTENANCE', 'MARKETING', 'OTHER'];
const CAT_COLORS = { RENT: 'indigo', SALARY: 'purple', UTILITY: 'blue', PURCHASE: 'warning', MAINTENANCE: 'gray', MARKETING: 'success', OTHER: 'gray' };
const CAT_ICONS  = { RENT: '🏠', SALARY: '👨‍💼', UTILITY: '💡', PURCHASE: '🛒', MAINTENANCE: '🔧', MARKETING: '📣', OTHER: '📝' };

const EMPTY = { title: '', category: 'OTHER', amount: '', date: new Date().toISOString().split('T')[0], note: '' };

const Expenses = () => {
  const [expenses,   setExpenses]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total,      setTotal]      = useState(0);
  const [filterCat,  setFilterCat]  = useState('');
  const [from,       setFrom]       = useState('');
  const [to,         setTo]         = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [errors,     setErrors]     = useState({});
  const [saving,     setSaving]     = useState(false);
  const [deleteId,   setDeleteId]   = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  useEffect(() => { setPage(0); }, [filterCat, from, to]);
  useEffect(() => { fetchExpenses(); }, [page, filterCat, from, to]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await getExpensesApi(page, 10, filterCat, from, to);
      const d = res.data.data;
      setExpenses(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotal(d.totalElements || 0);
    } catch { toast.error('Failed to load expenses'); }
    finally  { setLoading(false); }
  };

  const openCreate = () => { setEditItem(null); setForm(EMPTY); setErrors({}); setModalOpen(true); };
  const openEdit   = (e)  => {
    setEditItem(e);
    setForm({ title: e.title, category: e.category, amount: e.amount, date: e.date, note: e.note || '' });
    setErrors({}); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditItem(null); setForm(EMPTY); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'Required';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter valid amount';
    if (!form.date) e.date = 'Required';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const payload = { ...form, amount: Number(form.amount) };
    setSaving(true);
    try {
      if (editItem) { await updateExpenseApi(editItem.id, payload); toast.success('Expense updated'); }
      else          { await createExpenseApi(payload);               toast.success('Expense added'); }
      closeModal(); fetchExpenses();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally       { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteExpenseApi(deleteId); toast.success('Expense deleted'); setDeleteId(null); fetchExpenses(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally     { setDeleting(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expenses</h2>
          <p className="text-sm text-gray-400 mt-0.5">{total} records • Page total: {formatCurrency(totalAmount)}</p>
        </div>
        <Button icon="+" onClick={openCreate}>Add Expense</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500 bg-white">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
        </select>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500 bg-white" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500 bg-white" />
        {(filterCat || from || to) && (
          <button onClick={() => { setFilterCat(''); setFrom(''); setTo(''); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg bg-white">
            ✕ Clear
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <Loader fullPage /> : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['#', 'Title', 'Category', 'Amount', 'Date', 'Note', 'Actions'].map((h, i) => (
                    <th key={i} className="px-3 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <span className="text-4xl">💸</span>
                      <p className="text-sm">No expenses found</p>
                      <Button size="sm" onClick={openCreate}>Add first expense</Button>
                    </div>
                  </td></tr>
                ) : expenses.map((exp, idx) => (
                  <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-xs text-gray-400">{page * 10 + idx + 1}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-gray-900">{exp.title}</td>
                    <td className="px-3 py-3">
                      <Badge label={`${CAT_ICONS[exp.category]} ${exp.category}`} type={CAT_COLORS[exp.category] || 'gray'} />
                    </td>
                    <td className="px-3 py-3 font-bold text-sm text-red-600">{formatCurrency(exp.amount)}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{exp.date}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 max-w-[180px] truncate">{exp.note || '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(exp)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg">
                          ✏️ Edit
                        </button>
                        <button onClick={() => setDeleteId(exp.id)}
                          className="px-2 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">
                          🗑️
                        </button>
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

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editItem ? 'Edit Expense' : 'Add Expense'} width="max-w-md"
        footer={<><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button loading={saving} onClick={handleSubmit}>{editItem ? 'Update' : 'Add'}</Button></>}
      >
        <div className="space-y-4">
          <Input label="Title" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Shop Rent" error={errors.title} required />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Category <span className="text-red-500">*</span></label>
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
              </select>
            </div>
            <Input label="Amount (₹)" name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="0.00" error={errors.amount} required />
          </div>
          <Input label="Date" name="date" type="date" value={form.date} onChange={handleChange} error={errors.date} required />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Note</label>
            <textarea name="note" value={form.note} onChange={handleChange}
              placeholder="Optional..." rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Expense" width="max-w-sm"
        footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button></>}
      >
        <div className="text-center py-2 space-y-3">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-3xl mx-auto">🗑️</div>
          <p className="font-semibold text-gray-900">Delete this expense?</p>
          <p className="text-sm text-gray-400">This action cannot be undone.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Expenses;