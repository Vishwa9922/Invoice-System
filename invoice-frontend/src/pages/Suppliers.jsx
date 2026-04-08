import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getSuppliersApi, createSupplierApi, updateSupplierApi, deleteSupplierApi } from '../api/supplierApi';
import Button     from '../components/common/Button';
import Modal      from '../components/common/Modal';
import Input      from '../components/common/Input';
import Badge      from '../components/common/Badge';
import Loader     from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import { useDebounce } from '../hooks/useDebounce';

const EMPTY = { name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '', active: true };

const Suppliers = () => {
  const [suppliers,  setSuppliers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total,      setTotal]      = useState(0);
  const [search,     setSearch]     = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [errors,     setErrors]     = useState({});
  const [saving,     setSaving]     = useState(false);
  const [deleteId,   setDeleteId]   = useState(null);
  const [deleting,   setDeleting]   = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { setPage(0); }, [debouncedSearch]);
  useEffect(() => { fetchSuppliers(); }, [page, debouncedSearch]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await getSuppliersApi(page, 10, debouncedSearch);
      const d = res.data.data;
      setSuppliers(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotal(d.totalElements || 0);
    } catch { toast.error('Failed to load suppliers'); }
    finally  { setLoading(false); }
  };

  const openCreate = () => { setEditItem(null); setForm(EMPTY); setErrors({}); setModalOpen(true); };
  const openEdit   = (s)  => {
    setEditItem(s);
    setForm({ name: s.name, contactPerson: s.contactPerson || '', phone: s.phone || '', email: s.email || '', address: s.address || '', gstNumber: s.gstNumber || '', active: s.active });
    setErrors({}); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditItem(null); setForm(EMPTY); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Required';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (editItem) { await updateSupplierApi(editItem.id, form); toast.success('Supplier updated'); }
      else          { await createSupplierApi(form);               toast.success('Supplier created'); }
      closeModal(); fetchSuppliers();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally       { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteSupplierApi(deleteId); toast.success('Supplier deleted'); setDeleteId(null); fetchSuppliers(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally     { setDeleting(false); }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Suppliers</h2>
          <p className="text-sm text-gray-400 mt-0.5">{total} suppliers total</p>
        </div>
        <Button icon="+" onClick={openCreate}>Add Supplier</Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 max-w-md">
        <span className="text-gray-400">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="flex-1 py-2.5 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400" />
        {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <Loader fullPage /> : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['#', 'Supplier', 'Contact', 'Phone', 'Email', 'GST No.', 'Status', 'Actions'].map((h, i) => (
                    <th key={i} className="px-3 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <span className="text-4xl">🏭</span>
                      <p className="text-sm">{search ? `No results for "${search}"` : 'No suppliers yet'}</p>
                      {!search && <Button size="sm" onClick={openCreate}>Add first supplier</Button>}
                    </div>
                  </td></tr>
                ) : suppliers.map((s, idx) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-xs text-gray-400">{page * 10 + idx + 1}</td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{s.contactPerson || '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{s.phone || '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{s.email || '—'}</td>
                    <td className="px-3 py-3">
                      {s.gstNumber
                        ? <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{s.gstNumber}</span>
                        : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <Badge label={s.active ? 'Active' : 'Inactive'} type={s.active ? 'success' : 'gray'} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(s)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg">
                          ✏️ Edit
                        </button>
                        <button onClick={() => setDeleteId(s.id)}
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
      <Modal isOpen={modalOpen} onClose={closeModal} title={editItem ? 'Edit Supplier' : 'Add New Supplier'} width="max-w-xl"
        footer={<><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button loading={saving} onClick={handleSubmit}>{editItem ? 'Update' : 'Create'}</Button></>}
      >
        <div className="space-y-4">
          <Input label="Supplier Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. ABC Traders" error={errors.name} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Contact Person" name="contactPerson" value={form.contactPerson} onChange={handleChange} placeholder="John Doe" />
            <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="abc@example.com" />
            <Input label="GST Number" name="gstNumber" value={form.gstNumber} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Address</label>
            <textarea name="address" value={form.address} onChange={handleChange}
              placeholder="Full address..." rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </div>
          <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="mt-0.5 accent-indigo-600" />
            <div>
              <div className="text-sm font-semibold text-gray-800">Active</div>
              <div className="text-xs text-gray-500">Inactive suppliers won't appear in purchases</div>
            </div>
          </label>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Supplier" width="max-w-sm"
        footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button></>}
      >
        <div className="text-center py-2 space-y-3">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-3xl mx-auto">🗑️</div>
          <p className="font-semibold text-gray-900">Delete this supplier?</p>
          <p className="text-sm text-gray-400">This will soft-delete the supplier.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Suppliers;