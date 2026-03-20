import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getProductsApi, searchProductsApi, createProductApi, updateProductApi, deleteProductApi } from '../api/productApi';
import { getActiveCategoriesApi } from '../api/categoryApi';
import Button     from '../components/common/Button';
import Modal      from '../components/common/Modal';
import Input      from '../components/common/Input';
import Badge      from '../components/common/Badge';
import Loader     from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import { formatCurrency } from '../utils/helpers';
import { useDebounce }    from '../hooks/useDebounce';

const EMPTY = { name:'',description:'',sku:'',barcode:'',price:'',taxPercent:'0',stock:'0',categoryId:'',active:true };

const Products = () => {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
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

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { setPage(0); }, [debouncedSearch]);
  useEffect(() => { fetchProducts(); }, [page, debouncedSearch]);

  const fetchCategories = async () => {
    try { const res = await getActiveCategoriesApi(); setCategories(res.data.data || []); }
    catch { toast.error('Failed to load categories'); }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = debouncedSearch
        ? await searchProductsApi(debouncedSearch, page, 10)
        : await getProductsApi(page, 10);
      const d = res.data.data;
      setProducts(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotal(d.totalElements || 0);
    } catch { toast.error('Failed to load products'); }
    finally  { setLoading(false); }
  };

  const openCreate = () => { setEditItem(null); setForm(EMPTY); setErrors({}); setModalOpen(true); };
  const openEdit   = (p)  => {
    setEditItem(p);
    setForm({ name:p.name, description:p.description||'', sku:p.sku, barcode:p.barcode||'', price:p.price, taxPercent:p.taxPercent, stock:p.stock, categoryId:p.categoryId, active:p.active });
    setErrors({}); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditItem(null); setForm(EMPTY); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.name?.trim())  e.name = 'Required';
    if (!form.sku?.trim())   e.sku  = 'Required';
    if (!form.price || Number(form.price) <= 0) e.price = 'Enter valid price';
    if (!form.categoryId)    e.categoryId = 'Required';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const payload = { ...form, price: Number(form.price), taxPercent: Number(form.taxPercent||0), stock: Number(form.stock||0), categoryId: Number(form.categoryId) };
    setSaving(true);
    try {
      if (editItem) { await updateProductApi(editItem.id, payload); toast.success('Product updated'); }
      else          { await createProductApi(payload);               toast.success('Product created'); }
      closeModal(); fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally       { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteProductApi(deleteId); toast.success('Product deleted'); setDeleteId(null); fetchProducts(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally     { setDeleting(false); }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const stockBadge = (stock) => {
    if (stock === 0) return <Badge label="Out of stock" type="danger" />;
    if (stock < 10)  return <Badge label={`Low: ${stock}`} type="warning" />;
    return <Badge label={stock} type="success" />;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-400 mt-0.5">{total} products total</p>
        </div>
        <Button icon="+" onClick={openCreate}>Add Product</Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 max-w-md">
        <span className="text-gray-400">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, SKU or barcode..."
          className="flex-1 py-2.5 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400" />
        {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <Loader fullPage /> : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['#','Product','SKU','Category','Price','Tax','Stock','Status','Actions'].map((h,i) => (
                    <th key={i} className="px-3 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <span className="text-4xl">📦</span>
                      <p className="text-sm">{search ? `No results for "${search}"` : 'No products yet'}</p>
                      {!search && <Button size="sm" onClick={openCreate}>Add first product</Button>}
                    </div>
                  </td></tr>
                ) : products.map((prod, idx) => (
                  <tr key={prod.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-xs text-gray-400">{page*10+idx+1}</td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-semibold text-gray-900">{prod.name}</div>
                      {prod.barcode && <div className="text-xs text-gray-400 font-mono mt-0.5">📷 {prod.barcode}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{prod.sku}</span>
                    </td>
                    <td className="px-3 py-3"><Badge label={prod.categoryName} type="info" /></td>
                    <td className="px-3 py-3 font-bold text-sm">{formatCurrency(prod.price)}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 text-center">{prod.taxPercent}%</td>
                    <td className="px-3 py-3 text-center">{stockBadge(prod.stock)}</td>
                    <td className="px-3 py-3 text-center">
                      <Badge label={prod.active ? 'Active' : 'Inactive'} type={prod.active ? 'success' : 'gray'} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(prod)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg">
                          ✏️ Edit
                        </button>
                        <button onClick={() => setDeleteId(prod.id)}
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
      <Modal isOpen={modalOpen} onClose={closeModal} title={editItem ? 'Edit Product' : 'Add New Product'} width="max-w-xl"
        footer={<><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button loading={saving} onClick={handleSubmit}>{editItem ? 'Update' : 'Create'}</Button></>}
      >
        <div className="space-y-4">
          <Input label="Product Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Samsung Galaxy S24" error={errors.name} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="SKU" name="sku" value={form.sku} onChange={handleChange} placeholder="SAM-S24-001" error={errors.sku} required />
            <Input label="Barcode" name="barcode" value={form.barcode} onChange={handleChange} placeholder="8901234567890" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (₹)" name="price" type="number" value={form.price} onChange={handleChange} placeholder="0.00" error={errors.price} required />
            <Input label="Tax %" name="taxPercent" type="number" value={form.taxPercent} onChange={handleChange} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Stock" name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="0" />
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Category <span className="text-red-500">*</span></label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white
                  ${errors.categoryId ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Optional..." rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </div>
          <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="mt-0.5 accent-indigo-600" />
            <div>
              <div className="text-sm font-semibold text-gray-800">Active</div>
              <div className="text-xs text-gray-500">Inactive products won't appear in POS</div>
            </div>
          </label>
        </div>
      </Modal>

      {/* Delete */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Product" width="max-w-sm"
        footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button></>}
      >
        <div className="text-center py-2 space-y-3">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-3xl mx-auto">🗑️</div>
          <p className="font-semibold text-gray-900">Delete this product?</p>
          <p className="text-sm text-gray-400">Soft delete — invoice history won't be affected.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Products;