import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getCustomersApi, searchCustomersApi,
  createCustomerApi, updateCustomerApi,
} from '../api/customerApi';
import { getInvoicesByCustomerApi } from '../api/invoiceApi';
import Button     from '../components/common/Button';
import Modal      from '../components/common/Modal';
import Input      from '../components/common/Input';
import Badge      from '../components/common/Badge';
import Loader     from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import { formatCurrency, formatDateTime, getInitials } from '../utils/helpers';
import { useDebounce } from '../hooks/useDebounce';

const EMPTY = { name: '', mobileNumber: '', email: '', address: '' };

const AVATAR_COLORS = [
  'bg-indigo-500','bg-emerald-500','bg-amber-500',
  'bg-rose-500','bg-violet-500','bg-blue-500','bg-pink-500',
];

const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
};

const Customers = () => {
  const navigate = useNavigate();

  const [customers,      setCustomers]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [page,           setPage]           = useState(0);
  const [totalPages,     setTotalPages]     = useState(0);
  const [total,          setTotal]          = useState(0);
  const [search,         setSearch]         = useState('');
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editItem,       setEditItem]       = useState(null);
  const [form,           setForm]           = useState(EMPTY);
  const [errors,         setErrors]         = useState({});
  const [saving,         setSaving]         = useState(false);
  const [detailOpen,     setDetailOpen]     = useState(false);
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [custInvoices,   setCustInvoices]   = useState([]);
  const [invLoading,     setInvLoading]     = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { setPage(0); }, [debouncedSearch]);
  useEffect(() => { fetchCustomers(); }, [page, debouncedSearch]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = debouncedSearch
        ? await searchCustomersApi(debouncedSearch, page, 10)
        : await getCustomersApi(page, 10);
      const d = res.data.data;
      setCustomers(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotal(d.totalElements || 0);
    } catch { toast.error('Failed to load customers'); }
    finally  { setLoading(false); }
  };

  const openDetail = async (cust) => {
    setDetailCustomer(cust);
    setDetailOpen(true);
    setInvLoading(true);
    try {
      const res = await getInvoicesByCustomerApi(cust.id, 0, 5);
      setCustInvoices(res.data.data.content || []);
    } catch { setCustInvoices([]); }
    finally  { setInvLoading(false); }
  };

  const openCreate = () => { setEditItem(null); setForm(EMPTY); setErrors({}); setModalOpen(true); };
  const openEdit   = (c)  => {
    setEditItem(c);
    setForm({ name: c.name||'', mobileNumber: c.mobileNumber, email: c.email||'', address: c.address||'' });
    setErrors({}); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditItem(null); setForm(EMPTY); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.mobileNumber?.trim())           e.mobileNumber = 'Mobile number is required';
    else if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) e.mobileNumber = 'Enter valid 10-digit mobile (6-9)';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter valid email';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (editItem) { await updateCustomerApi(editItem.id, form); toast.success('Customer updated'); }
      else          { await createCustomerApi(form);               toast.success('Customer created'); }
      closeModal(); fetchCustomers();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally       { setSaving(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customers</h2>
          <p className="text-sm text-gray-400 mt-0.5">{total} registered customers</p>
        </div>
        <Button icon="+" onClick={openCreate}>Add Customer</Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 max-w-md">
        <span className="text-gray-400 text-sm">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or mobile..."
          className="flex-1 py-2.5 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400" />
        {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <Loader fullPage /> : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Customer','Mobile','Email','Address','Joined','Actions'].map((h,i) => (
                    <th key={i} className="px-4 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <span className="text-4xl">👥</span>
                      <p className="text-sm">{search ? `No results for "${search}"` : 'No customers yet'}</p>
                      {!search && <Button size="sm" onClick={openCreate}>Add first customer</Button>}
                    </div>
                  </td></tr>
                ) : customers.map(cust => (
                  <tr key={cust.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => openDetail(cust)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${getAvatarColor(cust.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {getInitials(cust.name)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {cust.name || <span className="text-gray-400">No name</span>}
                          </div>
                          <div className="text-xs text-gray-400">ID #{cust.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">📱 {cust.mobileNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{cust.email || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{cust.address || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(cust.createdAt)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(cust)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg">
                          ✏️ Edit
                        </button>
                        <button onClick={() => openDetail(cust)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg">
                          👁 View
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
      <Modal isOpen={modalOpen} onClose={closeModal}
        title={editItem ? 'Edit Customer' : 'Add New Customer'}
        footer={<><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button loading={saving} onClick={handleSubmit}>{editItem ? 'Update' : 'Create'}</Button></>}
      >
        <div className="space-y-4">
          <Input label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Rahul Sharma" />
          <Input label="Mobile Number" name="mobileNumber" value={form.mobileNumber} onChange={handleChange} placeholder="9876543210" error={errors.mobileNumber} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="rahul@gmail.com" error={errors.email} />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Address</label>
            <textarea name="address" value={form.address} onChange={handleChange}
              placeholder="Enter address..." rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </div>
        </div>
      </Modal>

      {/* Detail Drawer */}
      {detailOpen && detailCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setDetailOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Customer Profile</h3>
              <button onClick={() => setDetailOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${getAvatarColor(detailCustomer.name)} flex items-center justify-center text-white text-xl font-bold shrink-0`}>
                  {getInitials(detailCustomer.name)}
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{detailCustomer.name || 'No name'}</div>
                  <div className="text-sm text-gray-500">📱 {detailCustomer.mobileNumber}</div>
                </div>
              </div>

              {/* Detail grid */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                {[
                  { label: 'Customer ID', value: `#${detailCustomer.id}` },
                  { label: 'Email',       value: detailCustomer.email || '—' },
                  { label: 'Address',     value: detailCustomer.address || '—' },
                  { label: 'Joined',      value: formatDateTime(detailCustomer.createdAt) },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-start gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-500 font-medium">{row.label}</span>
                    <span className="text-xs text-gray-800 text-right">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" fullWidth
                  onClick={() => { setDetailOpen(false); openEdit(detailCustomer); }}>
                  ✏️ Edit
                </Button>
                <Button size="sm" fullWidth
                  onClick={() => { setDetailOpen(false); navigate('/pos'); }}>
                  🖥️ New Bill
                </Button>
              </div>

              {/* Recent invoices */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Recent Invoices</h4>
                {invLoading ? <Loader size={24} fullPage /> :
                  custInvoices.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No invoices yet</p>
                  ) : (
                    <div className="space-y-2">
                      {custInvoices.map(inv => (
                        <div key={inv.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => { setDetailOpen(false); navigate(`/invoices/${inv.id}`); }}
                        >
                          <div>
                            <div className="text-xs font-bold text-indigo-600 font-mono">{inv.invoiceNumber}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{formatDateTime(inv.createdAt)}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm font-bold text-gray-900">{formatCurrency(inv.grandTotal)}</div>
                            <Badge label={inv.status} type={inv.status==='PAID'?'success':inv.status==='CANCELLED'?'danger':'warning'} />
                          </div>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" fullWidth
                        onClick={() => { setDetailOpen(false); navigate('/invoices'); }}>
                        View all invoices →
                      </Button>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;