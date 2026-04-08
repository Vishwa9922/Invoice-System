import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPurchasesApi, createPurchaseApi, cancelPurchaseApi, getPurchaseByIdApi } from '../api/purchaseApi';
import { getSuppliersApi } from '../api/supplierApi';
import { getProductsApi }  from '../api/productApi';
import Button     from '../components/common/Button';
import Modal      from '../components/common/Modal';
import Input      from '../components/common/Input';
import Badge      from '../components/common/Badge';
import Loader     from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import { formatCurrency } from '../utils/helpers';

const PAYMENT_MODES = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CREDIT'];

const EMPTY_FORM = { supplierId: '', paymentMode: 'CASH', note: '', purchaseDate: new Date().toISOString().split('T')[0], items: [] };
const EMPTY_ITEM = { productId: '', quantity: 1, purchasePrice: '' };

const Purchases = () => {
  const [purchases,  setPurchases]  = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total,      setTotal]      = useState(0);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [cancelId,   setCancelId]   = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { fetchSuppliers(); fetchProducts(); }, []);
  useEffect(() => { fetchPurchases(); }, [page]);

  const fetchSuppliers = async () => {
    try { const res = await getSuppliersApi(0, 100); setSuppliers(res.data.data?.content || []); }
    catch { toast.error('Failed to load suppliers'); }
  };

  const fetchProducts = async () => {
    try { const res = await getProductsApi(0, 500); setProducts(res.data.data?.content || []); }
    catch { toast.error('Failed to load products'); }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await getPurchasesApi(page, 10);
      const d = res.data.data;
      setPurchases(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotal(d.totalElements || 0);
    } catch { toast.error('Failed to load purchases'); }
    finally  { setLoading(false); }
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, items: [{ ...EMPTY_ITEM }] });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setForm(EMPTY_FORM); };

  const openDetail = async (id) => {
    try {
      const res = await getPurchaseByIdApi(id);
      setDetailItem(res.data.data);
      setDetailOpen(true);
    } catch { toast.error('Failed to load purchase detail'); }
  };

  // Item handlers
  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [field]: val };
    return { ...f, items };
  });

  const getTotal = () => form.items.reduce((sum, it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.purchasePrice) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async () => {
    if (form.items.length === 0) { toast.error('Add at least one item'); return; }
    const invalidItem = form.items.find(it => !it.productId || !it.purchasePrice || Number(it.purchasePrice) <= 0 || Number(it.quantity) < 1);
    if (invalidItem) { toast.error('Fill all item details properly'); return; }

    const payload = {
      supplierId:   form.supplierId ? Number(form.supplierId) : null,
      paymentMode:  form.paymentMode,
      note:         form.note,
      purchaseDate: form.purchaseDate,
      items: form.items.map(it => ({
        productId:     Number(it.productId),
        quantity:      Number(it.quantity),
        purchasePrice: Number(it.purchasePrice),
      })),
    };
    setSaving(true);
    try {
      await createPurchaseApi(payload);
      toast.success('Purchase created — stock updated!');
      closeModal(); fetchPurchases();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally       { setSaving(false); }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelPurchaseApi(cancelId);
      toast.success('Purchase cancelled — stock reversed');
      setCancelId(null); fetchPurchases();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally       { setCancelling(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Purchases</h2>
          <p className="text-sm text-gray-400 mt-0.5">{total} purchases total</p>
        </div>
        <Button icon="+" onClick={openCreate}>New Purchase</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <Loader fullPage /> : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['#', 'Date', 'Supplier', 'Items', 'Total', 'Payment', 'Status', 'Actions'].map((h, i) => (
                    <th key={i} className="px-3 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <span className="text-4xl">🛒</span>
                      <p className="text-sm">No purchases yet</p>
                      <Button size="sm" onClick={openCreate}>Create first purchase</Button>
                    </div>
                  </td></tr>
                ) : purchases.map((p, idx) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-xs text-gray-400">{page * 10 + idx + 1}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{p.purchaseDate}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{p.supplierName || '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 text-center">{p.items?.length || 0}</td>
                    <td className="px-3 py-3 font-bold text-sm">{formatCurrency(p.totalAmount)}</td>
                    <td className="px-3 py-3"><Badge label={p.paymentMode} type="info" /></td>
                    <td className="px-3 py-3">
                      <Badge label={p.cancelled ? 'Cancelled' : 'Active'} type={p.cancelled ? 'danger' : 'success'} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openDetail(p.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg">
                          👁️ View
                        </button>
                        {!p.cancelled && (
                          <button onClick={() => setCancelId(p.id)}
                            className="px-2 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">
                            ✕ Cancel
                          </button>
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

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="New Purchase / Restock" width="max-w-2xl"
        footer={<>
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button loading={saving} onClick={handleSubmit}>Create Purchase</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Supplier</label>
              <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white">
                <option value="">No supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Payment Mode</label>
              <select value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white">
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <Input label="Purchase Date" name="purchaseDate" type="date" value={form.purchaseDate}
            onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Items</label>
              <button onClick={addItem} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="col-span-5">
                    <select value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white">
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="1" value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-center" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" min="0" value={item.purchasePrice}
                      onChange={e => updateItem(i, 'purchasePrice', e.target.value)}
                      placeholder="Price ₹"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500" />
                  </div>
                  <div className="col-span-1 text-xs text-gray-500 font-medium text-right">
                    {formatCurrency((Number(item.quantity) || 0) * (Number(item.purchasePrice) || 0))}
                  </div>
                  <div className="col-span-1 text-right">
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <div className="bg-indigo-50 px-4 py-2 rounded-lg">
                <span className="text-sm text-gray-600">Total: </span>
                <span className="text-sm font-bold text-indigo-700">{formatCurrency(getTotal())}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Note</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Optional note..." rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {detailItem && (
        <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={`Purchase #${detailItem.id}`} width="max-w-xl"
          footer={<Button variant="secondary" onClick={() => setDetailOpen(false)}>Close</Button>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Supplier:</span> <span className="font-semibold">{detailItem.supplierName || '—'}</span></div>
              <div><span className="text-gray-500">Date:</span> <span className="font-semibold">{detailItem.purchaseDate}</span></div>
              <div><span className="text-gray-500">Payment:</span> <Badge label={detailItem.paymentMode} type="info" /></div>
              <div><span className="text-gray-500">Status:</span> <Badge label={detailItem.cancelled ? 'Cancelled' : 'Active'} type={detailItem.cancelled ? 'danger' : 'success'} /></div>
            </div>
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-500">Product</th>
                  <th className="px-3 py-2 text-center text-xs font-bold text-gray-500">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-gray-500">Price</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {detailItem.items?.map(it => (
                  <tr key={it.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{it.productName}</td>
                    <td className="px-3 py-2 text-center">{it.quantity}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(it.purchasePrice)}</td>
                    <td className="px-3 py-2 text-right font-bold">{formatCurrency(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-50">
                  <td colSpan={3} className="px-3 py-2 text-right font-bold text-sm">Grand Total</td>
                  <td className="px-3 py-2 text-right font-bold text-indigo-700">{formatCurrency(detailItem.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
            {detailItem.note && <p className="text-sm text-gray-500">Note: {detailItem.note}</p>}
          </div>
        </Modal>
      )}

      {/* Cancel Confirm */}
      <Modal isOpen={!!cancelId} onClose={() => setCancelId(null)} title="Cancel Purchase" width="max-w-sm"
        footer={<><Button variant="secondary" onClick={() => setCancelId(null)}>No</Button><Button variant="danger" loading={cancelling} onClick={handleCancel}>Yes, Cancel</Button></>}
      >
        <div className="text-center py-2 space-y-3">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-3xl mx-auto">⚠️</div>
          <p className="font-semibold text-gray-900">Cancel this purchase?</p>
          <p className="text-sm text-gray-400">Stock will be reversed automatically.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Purchases;