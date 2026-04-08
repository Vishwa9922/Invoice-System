import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getStockSummaryApi, adjustStockApi, getStockMovementsApi, getExpiryAlertsApi } from '../api/stockApi';
import { getProductsApi, searchProductsApi } from '../api/productApi';
import Button     from '../components/common/Button';
import Modal      from '../components/common/Modal';
import Input      from '../components/common/Input';
import Badge      from '../components/common/Badge';
import Loader     from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import { formatCurrency } from '../utils/helpers';
import { useDebounce } from '../hooks/useDebounce';

const MOV_TYPES   = ['MANUAL', 'DAMAGE', 'CORRECTION'];
const MOV_COLORS  = { SALE: 'danger', PURCHASE: 'success', RETURN: 'info', MANUAL: 'gray', DAMAGE: 'warning', CORRECTION: 'purple' };

const Stock = () => {
  const [tab,       setTab]       = useState('overview'); // overview | movements | expiry
  const [summary,   setSummary]   = useState(null);
  const [alerts,    setAlerts]    = useState(null);
  const [products,  setProducts]  = useState([]);
  const [movements, setMovements] = useState([]);
  const [movPage,   setMovPage]   = useState(0);
  const [movTotal,  setMovTotal]  = useState(0);
  const [movTotalPages, setMovTotalPages] = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustModal, setAdjustModal] = useState(false);
  const [adjForm,   setAdjForm]   = useState({ productId: '', quantity: '', movementType: 'MANUAL', note: '' });
  const [saving,    setSaving]    = useState(false);
  const [prodPage,  setProdPage]  = useState(0);
  const [prodTotalPages, setProdTotalPages] = useState(0);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { fetchSummary(); fetchAlerts(); }, []);
  useEffect(() => { fetchProducts(); }, [prodPage, debouncedSearch]);
  useEffect(() => { if (selectedProduct) fetchMovements(); }, [selectedProduct, movPage]);

  const fetchSummary = async () => {
    try { const res = await getStockSummaryApi(); setSummary(res.data.data); }
    catch { toast.error('Failed to load summary'); }
  };

  const fetchAlerts = async () => {
    try { const res = await getExpiryAlertsApi(); setAlerts(res.data.data); }
    catch {}
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = debouncedSearch
        ? await searchProductsApi(debouncedSearch, prodPage, 10)
        : await getProductsApi(prodPage, 10);
      const d = res.data.data;
      setProducts(d.content || []);
      setProdTotalPages(d.totalPages || 0);
    } catch { toast.error('Failed to load products'); }
    finally  { setLoading(false); }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await getStockMovementsApi(selectedProduct.id, movPage, 10);
      const d = res.data.data;
      setMovements(d.content || []);
      setMovTotal(d.totalElements || 0);
      setMovTotalPages(d.totalPages || 0);
    } catch { toast.error('Failed to load movements'); }
    finally  { setLoading(false); }
  };

  const openAdjust = (product) => {
    setAdjForm({ productId: product.id, quantity: '', movementType: 'MANUAL', note: '' });
    setAdjustModal(true);
  };

  const handleAdjust = async () => {
    if (!adjForm.quantity) { toast.error('Enter quantity'); return; }
    setSaving(true);
    try {
      await adjustStockApi({
        productId:    Number(adjForm.productId),
        quantity:     Number(adjForm.quantity),
        movementType: adjForm.movementType,
        note:         adjForm.note,
        adjustedBy:   'admin',
      });
      toast.success('Stock adjusted!');
      setAdjustModal(false); fetchProducts(); fetchSummary();
      if (selectedProduct?.id === Number(adjForm.productId)) fetchMovements();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally       { setSaving(false); }
  };

  const stockBadge = (stock, threshold) => {
    if (stock === 0) return <Badge label="Out of Stock" type="danger" />;
    if (stock <= threshold) return <Badge label={`Low: ${stock}`} type="warning" />;
    return <Badge label={stock} type="success" />;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Stock Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">Inventory levels, movements & expiry</p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Products</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{summary.totalProducts}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Out of Stock</p>
            <p className="text-2xl font-extrabold text-red-500 mt-1">{summary.outOfStock}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Low Stock</p>
            <p className="text-2xl font-extrabold text-amber-500 mt-1">{summary.lowStock}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock Value</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{formatCurrency(summary.totalStockValue)}</p>
          </div>
        </div>
      )}

      {/* Alert Bar */}
      {alerts && (alerts.expiringSoon > 0 || alerts.expired > 0) && (
        <div className="flex gap-3">
          {alerts.expiringSoon > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
              <span>⚠️</span>
              <span className="text-sm font-semibold text-amber-700">{alerts.expiringSoon} products expiring in 30 days</span>
            </div>
          )}
          {alerts.expired > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl">
              <span>🚨</span>
              <span className="text-sm font-semibold text-red-700">{alerts.expired} products already expired</span>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['overview', '📦 Overview'], ['movements', '📋 Movements']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors
              ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 max-w-md">
            <span className="text-gray-400">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="flex-1 py-2.5 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400" />
            {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? <Loader fullPage /> : (
              <>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Product', 'SKU', 'Category', 'Stock', 'Threshold', 'Purchase Price', 'Expiry', 'Actions'].map((h, i) => (
                        <th key={i} className="px-3 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 text-sm font-semibold text-gray-900">{p.name}</td>
                        <td className="px-3 py-3"><span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{p.sku}</span></td>
                        <td className="px-3 py-3"><Badge label={p.categoryName} type="info" /></td>
                        <td className="px-3 py-3">{stockBadge(p.stock, p.lowStockThreshold || 10)}</td>
                        <td className="px-3 py-3 text-sm text-gray-500">{p.lowStockThreshold || 10}</td>
                        <td className="px-3 py-3 text-sm text-gray-700">{p.purchasePrice ? formatCurrency(p.purchasePrice) : '—'}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{p.expiryDate || '—'}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => openAdjust(p)}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg">
                              ± Adjust
                            </button>
                            <button onClick={() => { setSelectedProduct(p); setMovPage(0); setTab('movements'); }}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg">
                              📋 History
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 border-t border-gray-100">
                  <Pagination pageNumber={prodPage} totalPages={prodTotalPages} onPageChange={setProdPage} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Movements Tab */}
      {tab === 'movements' && (
        <div className="space-y-3">
          {!selectedProduct ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <span className="text-4xl">📋</span>
                <p className="text-sm">Select a product from Overview to view movement history</p>
                <Button variant="secondary" size="sm" onClick={() => setTab('overview')}>Go to Overview</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => { setSelectedProduct(null); setTab('overview'); }}
                    className="text-sm text-indigo-600 hover:underline">← Back</button>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-xs text-gray-500">Current stock: {selectedProduct.stock}</p>
                  </div>
                </div>
                <button onClick={() => openAdjust(selectedProduct)}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg">
                  ± Adjust Stock
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? <Loader fullPage /> : (
                  <>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          {['Date', 'Type', 'Change', 'Before', 'After', 'Note', 'By'].map((h, i) => (
                            <th key={i} className="px-3 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {movements.length === 0 ? (
                          <tr><td colSpan={7} className="py-10 text-center text-gray-400 text-sm">No movement history</td></tr>
                        ) : movements.map(m => (
                          <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-3 text-xs text-gray-500">{new Date(m.createdAt).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3"><Badge label={m.movementType} type={MOV_COLORS[m.movementType] || 'gray'} /></td>
                            <td className="px-3 py-3">
                              <span className={`text-sm font-bold ${m.quantityChanged > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {m.quantityChanged > 0 ? '+' : ''}{m.quantityChanged}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600">{m.stockBefore}</td>
                            <td className="px-3 py-3 text-sm font-semibold text-gray-900">{m.stockAfter}</td>
                            <td className="px-3 py-3 text-xs text-gray-500 max-w-[160px] truncate">{m.note || '—'}</td>
                            <td className="px-3 py-3 text-xs text-gray-500">{m.createdBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 border-t border-gray-100">
                      <Pagination pageNumber={movPage} totalPages={movTotalPages} onPageChange={setMovPage} />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Adjust Stock Modal */}
      <Modal isOpen={adjustModal} onClose={() => setAdjustModal(false)} title="Adjust Stock" width="max-w-sm"
        footer={<><Button variant="secondary" onClick={() => setAdjustModal(false)}>Cancel</Button><Button loading={saving} onClick={handleAdjust}>Adjust</Button></>}
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            ⚠️ Positive = stock in, Negative = stock out
          </div>
          <Input label="Quantity (+ or -)" name="quantity" type="number" value={adjForm.quantity}
            onChange={e => setAdjForm(f => ({ ...f, quantity: e.target.value }))} placeholder="e.g. -5 or +10" required />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Movement Type</label>
            <select value={adjForm.movementType} onChange={e => setAdjForm(f => ({ ...f, movementType: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white">
              {MOV_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Note</label>
            <textarea value={adjForm.note} onChange={e => setAdjForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Reason for adjustment..." rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:border-indigo-500" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Stock;