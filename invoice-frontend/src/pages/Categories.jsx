import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getCategoriesApi, createCategoryApi,
  updateCategoryApi, deleteCategoryApi,
} from '../api/categoryApi';
import Button     from '../components/common/Button';
import Modal      from '../components/common/Modal';
import Input      from '../components/common/Input';
import Badge      from '../components/common/Badge';
import Loader     from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import { formatDateTime } from '../utils/helpers';

const EMPTY = { name: '', description: '', active: true };

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total,      setTotal]      = useState(0);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [errors,     setErrors]     = useState({});
  const [saving,     setSaving]     = useState(false);
  const [deleteId,   setDeleteId]   = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  useEffect(() => { fetchCategories(); }, [page]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategoriesApi(page, 10);
      const d   = res.data.data;
      setCategories(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotal(d.totalElements || 0);
    } catch { toast.error('Failed to load categories'); }
    finally  { setLoading(false); }
  };

  const openCreate = () => { setEditItem(null); setForm(EMPTY); setErrors({}); setModalOpen(true); };
  const openEdit   = (c)  => { setEditItem(c); setForm({ name: c.name, description: c.description || '', active: c.active }); setErrors({}); setModalOpen(true); };
  const closeModal = ()   => { setModalOpen(false); setEditItem(null); setForm(EMPTY); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Category name is required';
    else if (form.name.length > 100) e.name = 'Max 100 characters';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (editItem) { await updateCategoryApi(editItem.id, form); toast.success('Category updated'); }
      else          { await createCategoryApi(form);               toast.success('Category created'); }
      closeModal(); fetchCategories();
    } catch (err) { toast.error(err.response?.data?.message || 'Something went wrong'); }
    finally       { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCategoryApi(deleteId);
      toast.success('Category deleted');
      setDeleteId(null); fetchCategories();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally       { setDeleting(false); }
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
          <h2 className="text-xl font-bold text-gray-900">Categories</h2>
          <p className="text-sm text-gray-400 mt-0.5">{total} categories total</p>
        </div>
        <Button icon="+" onClick={openCreate}>Add Category</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <Loader fullPage /> : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['#','Name','Description','Status','Created','Actions'].map((h,i) => (
                    <th key={i} className="px-4 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <span className="text-4xl">🗂️</span>
                      <p className="text-sm">No categories yet</p>
                      <Button size="sm" onClick={openCreate}>Add first category</Button>
                    </div>
                  </td></tr>
                ) : categories.map((cat, idx) => (
                  <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-400">{page * 10 + idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-sm text-gray-900">{cat.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {cat.description || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={cat.active ? 'Active' : 'Inactive'} type={cat.active ? 'success' : 'gray'} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(cat.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(cat)}
                          className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
                          ✏️ Edit
                        </button>
                        <button onClick={() => setDeleteId(cat.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
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
      <Modal isOpen={modalOpen} onClose={closeModal}
        title={editItem ? 'Edit Category' : 'Add New Category'}
        footer={<><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button loading={saving} onClick={handleSubmit}>{editItem ? 'Update' : 'Create'}</Button></>}
      >
        <div className="space-y-4">
          <Input label="Category Name" name="name" value={form.name} onChange={handleChange}
            placeholder="e.g. Electronics" error={errors.name} required />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Optional description..." rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </div>
          <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange}
              className="mt-0.5 accent-indigo-600" />
            <div>
              <div className="text-sm font-semibold text-gray-800">Active</div>
              <div className="text-xs text-gray-500">Inactive categories won't appear in product forms</div>
            </div>
          </label>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Category" width="max-w-sm"
        footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button></>}
      >
        <div className="text-center py-2 space-y-3">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-3xl mx-auto">🗑️</div>
          <p className="font-semibold text-gray-900">Delete this category?</p>
          <p className="text-sm text-gray-400">Soft delete — existing products won't be affected.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Categories;