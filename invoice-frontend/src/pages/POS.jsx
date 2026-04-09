import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getProductsApi, getProductByBarcodeApi } from '../api/productApi';
import { searchCustomersApi } from '../api/customerApi';
import { posCheckoutApi } from '../api/posApi';
import { downloadInvoicePdfApi } from '../api/invoiceApi';
import Badge  from '../components/common/Badge';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import SignaturePad from '../components/common/SignaturePad';
import { formatCurrency } from '../utils/helpers';

const PAYMENT_MODES = ['CASH', 'UPI', 'CARD'];
const PAY_ICONS     = { CASH: '💵', UPI: '📱', CARD: '💳' };

const POS = () => {
  const [cart,          setCart]          = useState([]);
  const [discount,      setDiscount]      = useState('');
  const [payment,       setPayment]       = useState('CASH');
  const [notes,         setNotes]         = useState('');
  const [mobile,        setMobile]        = useState('');
  const [customerName,  setCustomerName]  = useState('');
  const [customer,      setCustomer]      = useState(null);
  const [mobileStatus,  setMobileStatus]  = useState('');

  // ✅ signature states INSIDE component
  const [signature,     setSignature]     = useState(null);
  const [showSignPad,   setShowSignPad]   = useState(false);
  
  const [searchQuery,   setSearchQuery]   = useState('');
  const [allProducts,   setAllProducts]   = useState([]);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [highlightedIdx,setHighlightedIdx]= useState(-1);
  const [isLoading,     setIsLoading]     = useState(true);

  const [checking,      setChecking]      = useState(false);
  const [successInvoice,setSuccessInvoice]= useState(null);
  const [showSuccess,   setShowSuccess]   = useState(false);

  // Customer name autocomplete
  const [customerSuggestions,  setCustomerSuggestions]  = useState([]);
  const [showCustDropdown,     setShowCustDropdown]     = useState(false);
  const [custHighlightIdx,     setCustHighlightIdx]     = useState(-1);
  const [custSearching,        setCustSearching]        = useState(false);
  const custDebounceRef = useRef(null);

  const searchRef   = useRef(null);
  const mobileRef   = useRef(null);
  const custNameRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProductsApi(0, 1000);
        setAllProducts(res.data.data.content || []);
      } catch (err) {
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKeyDown = async (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(prev => (prev < filteredProducts.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIdx(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && highlightedIdx >= 0 && filteredProducts[highlightedIdx]) {
        addToCart(filteredProducts[highlightedIdx]);
      } else {
        const val = searchQuery.trim();
        if (!val) return;
        try {
          const res = await getProductByBarcodeApi(val);
          if (res.data.data) {
            addToCart(res.data.data);
            toast.success(`${res.data.data.name} added`);
          }
        } catch {
          // Keep showing dropdown if barcode fails
        }
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setHighlightedIdx(-1);
    setShowDropdown(true);
  };

  const handleCustomerNameChange = (e) => {
    const val = e.target.value;
    setCustomerName(val);
    setCustomer(null);
    setMobile('');
    setMobileStatus('');
    setCustHighlightIdx(-1);

    if (custDebounceRef.current) clearTimeout(custDebounceRef.current);
    if (val.trim().length < 1) { setCustomerSuggestions([]); setShowCustDropdown(false); return; }

    setShowCustDropdown(true);
    custDebounceRef.current = setTimeout(async () => {
      setCustSearching(true);
      try {
        const res = await searchCustomersApi(val.trim(), 0, 8);
        setCustomerSuggestions(res.data.data?.content || []);
      } catch { setCustomerSuggestions([]); }
      finally { setCustSearching(false); }
    }, 250);
  };

  const handleSelectCustomer = (cust) => {
    setCustomer(cust);
    setCustomerName(cust.name || '');
    setMobile(cust.mobileNumber || '');
    setMobileStatus('found');
    setShowCustDropdown(false);
    setCustomerSuggestions([]);
    toast.success(`✓ ${cust.name} selected`);
  };

  const handleCustNameKeyDown = (e) => {
    if (!showCustDropdown || customerSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCustHighlightIdx(prev => Math.min(prev + 1, customerSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCustHighlightIdx(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && custHighlightIdx >= 0) {
      e.preventDefault();
      handleSelectCustomer(customerSuggestions[custHighlightIdx]);
    } else if (e.key === 'Escape') {
      setShowCustDropdown(false);
    }
  };

  const addToCart = (product) => {
    if (!product.active) { toast.error('Product is inactive'); return; }
    if (product.stock === 0) { toast.error('Out of stock'); return; }
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id);
      if (ex) {
        if (ex.quantity >= product.stock) { toast.error(`Max stock: ${product.stock}`); return prev; }
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearchQuery(''); setShowDropdown(false);
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      if (qty > i.product.stock) { toast.error(`Max: ${i.product.stock}`); return i; }
      return { ...i, quantity: qty };
    }));
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.product.id !== productId));

  const clearCart = () => {
    setCart([]); setDiscount(''); setNotes('');
    setMobile(''); setCustomerName(''); setCustomer(null);
    setMobileStatus(''); setPayment('CASH');
    setCustomerSuggestions([]); setShowCustDropdown(false);
    setSignature(null);
    setShowSignPad(false);
  };

  const subtotal   = cart.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const totalTax   = cart.reduce((s, i) => s + (Number(i.product.price) * Number(i.product.taxPercent) / 100) * i.quantity, 0);
  const grandTotal = Math.max(0, subtotal + totalTax - (Number(discount) || 0));

  const handleCheckout = async () => {
    if (!customerName.trim()) { toast.error('Enter customer name'); custNameRef.current?.focus(); return; }
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) { toast.error('Enter valid mobile number'); mobileRef.current?.focus(); return; }
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    setChecking(true);
    try {
      // ✅ Single checkout call with signature
      const res = await posCheckoutApi({
        mobileNumber: mobile,
        customerName: customerName || undefined,
        items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        paymentMode: payment,
        discount: Number(discount) || 0,
        notes: notes || undefined,
        signatureBase64: signature || undefined,
      });
      setSuccessInvoice(res.data.data);
      setShowSuccess(true);
      toast.success(`Invoice ${res.data.data.invoiceNumber} created!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Checkout failed'); }
    finally       { setChecking(false); }
  };

  const handleDownloadPdf = async () => {
    if (!successInvoice) return;
    try {
      const res = await downloadInvoicePdfApi(successInvoice.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href = url; a.download = `${successInvoice.invoiceNumber}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('PDF failed'); }
  };

  const handleNewBill = () => { clearCart(); setShowSuccess(false); setSuccessInvoice(null); searchRef.current?.focus(); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 h-[calc(100vh-112px)]">

      {/* ── LEFT ── */}
      <div className="flex flex-col gap-4 overflow-hidden">

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200 relative">
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="text-gray-400">🔍</span>
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search product or scan barcode + Enter..."
              className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
              autoComplete="off"
            />
            {isLoading && <Loader size={16} />}
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setShowDropdown(false); setHighlightedIdx(-1); }}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >✕</button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && filteredProducts.length > 0 && (
            <div className="absolute left-0 right-0 top-full bg-white border border-gray-200 border-t-0 rounded-b-xl shadow-xl z-50 max-h-72 overflow-y-auto">
              {filteredProducts.map((prod, idx) => (
                <div key={prod.id}
                  className={`flex justify-between items-center px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                    highlightedIdx === idx ? 'bg-indigo-50' : 'hover:bg-indigo-50'
                  }`}
                  onClick={() => addToCart(prod)}
                  onMouseEnter={() => setHighlightedIdx(idx)}
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{prod.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{prod.sku} • {prod.categoryName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-indigo-600">{formatCurrency(prod.price)}</div>
                    <div className={`text-xs mt-0.5 ${prod.stock === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {prod.stock === 0 ? 'Out of stock' : `Stock: ${prod.stock}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showDropdown && filteredProducts.length === 0 && !isLoading && (
            <div className="px-4 py-3 text-sm text-gray-400 text-center border-t border-gray-100">
              No products found for "{searchQuery}"
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="text-6xl">🛒</span>
              <p className="text-base font-semibold text-gray-500">Cart is empty</p>
              <p className="text-sm text-gray-400">Search for products or scan a barcode above</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-800">
                  Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})
                </span>
                <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  🗑️ Clear
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.map(item => {
                  const lineTotal = Number(item.product.price) * item.quantity;
                  const lineTax   = (Number(item.product.price) * Number(item.product.taxPercent) / 100) * item.quantity;
                  return (
                    <div key={item.product.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatCurrency(item.product.price)} each
                          {item.product.taxPercent > 0 && ` • Tax ${item.product.taxPercent}%`}
                        </div>
                        <div className="text-xs text-gray-500">Tax: {formatCurrency(lineTax)}</div>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-bold transition-colors">
                          −
                        </button>
                        <input type="number" value={item.quantity} min={1} max={item.product.stock}
                          onChange={e => updateQty(item.product.id, Number(e.target.value))}
                          className="w-10 h-7 text-center text-sm font-bold border border-gray-200 rounded-lg outline-none" />
                        <button onClick={() => updateQty(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-bold transition-colors">
                          +
                        </button>
                      </div>

                      <div className="text-sm font-bold text-gray-900 min-w-[72px] text-right">
                        {formatCurrency(lineTotal)}
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-lg">✕</button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className="flex flex-col gap-3 overflow-y-auto">

        {/* Customer */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">👤 Customer</p>

          <div className="relative mb-2">
            <div className="flex items-center gap-2 border rounded-lg px-3 py-2 transition-colors
              focus-within:border-indigo-500 border-gray-300">
              <span className="text-gray-400 text-sm">🔍</span>
              <input
                ref={custNameRef}
                value={customerName}
                onChange={handleCustomerNameChange}
                onKeyDown={handleCustNameKeyDown}
                onBlur={() => setTimeout(() => setShowCustDropdown(false), 150)}
                onFocus={() => customerName.trim() && setShowCustDropdown(true)}
                placeholder="Customer name *"
                className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
                autoComplete="off"
              />
              {custSearching && <span className="w-3 h-3 border-2 border-indigo-400/40 border-t-indigo-500 rounded-full animate-spin" />}
              {customerName && !custSearching && (
                <button onClick={() => { setCustomerName(''); setMobile(''); setCustomer(null); setMobileStatus(''); setCustomerSuggestions([]); setShowCustDropdown(false); }}
                  className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
              )}
            </div>

            {showCustDropdown && customerSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                {customerSuggestions.map((cust, idx) => (
                  <div key={cust.id}
                    onMouseDown={() => handleSelectCustomer(cust)}
                    onMouseEnter={() => setCustHighlightIdx(idx)}
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-gray-50 last:border-0 transition-colors
                      ${custHighlightIdx === idx ? 'bg-indigo-50' : 'hover:bg-indigo-50'}`}>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{cust.name}</div>
                      <div className="text-xs text-gray-400">{cust.mobileNumber}</div>
                    </div>
                    <span className="text-xs text-indigo-400 font-medium">Select →</span>
                  </div>
                ))}
              </div>
            )}
            {showCustDropdown && customerName.trim().length >= 1 && customerSuggestions.length === 0 && !custSearching && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 px-4 py-3">
                <p className="text-xs text-amber-700 font-medium">👤 New customer — will be created on checkout</p>
              </div>
            )}
          </div>

          {mobileStatus === 'found' && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mb-2">
              <span>✓</span> Existing customer
            </div>
          )}

          <input ref={mobileRef} value={mobile}
            onChange={e => { if (!customer) { setMobile(e.target.value); setMobileStatus(e.target.value ? 'new' : ''); } }}
            placeholder="Mobile number *"
            maxLength={10}
            readOnly={!!customer}
            className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
              ${customer ? 'bg-gray-50 text-gray-500 cursor-default border-gray-200' :
                mobileStatus === 'new' ? 'border-amber-400 bg-amber-50' : 'border-gray-300 focus:border-indigo-500'}`}
          />
          {!customer && mobile && !/^[6-9]\d{9}$/.test(mobile) && (
            <p className="text-xs text-red-500 mt-1">Valid 10-digit mobile required</p>
          )}
        </div>

        {/* Payment */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">💳 Payment Mode</p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_MODES.map(mode => (
              <button key={mode} onClick={() => setPayment(mode)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all
                  ${payment === mode
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                {PAY_ICONS[mode]} {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">🧾 Bill Summary</p>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span className="font-semibold">{formatCurrency(totalTax)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Discount</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-xs">₹</span>
                <input type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                  placeholder="0" min={0}
                  className="w-20 px-2 py-1 text-sm text-right border border-gray-200 rounded-lg outline-none focus:border-indigo-400" />
              </div>
            </div>
            <div className="border-t border-gray-100 pt-2.5">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Grand Total</span>
                <span className="text-2xl font-extrabold text-indigo-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">📝 Notes</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Any special instructions..." rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>

        {/* Signature */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">✍️ Signature</p>

          {signature ? (
            <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-3">
              <img src={signature} alt="Signature" className="max-h-16 mx-auto object-contain mb-2" />
              <div className="flex gap-2">
                <button onClick={() => setShowSignPad(true)}
                  className="flex-1 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                  ✏️ Redo
                </button>
                <button onClick={() => setSignature(null)}
                  className="flex-1 py-1.5 text-xs font-semibold border border-red-200 rounded-lg text-red-500 hover:bg-red-50">
                  🗑️ Remove
                </button>
              </div>
            </div>
          ) : showSignPad ? (
            <SignaturePad
              onSave={(dataUrl) => { setSignature(dataUrl); setShowSignPad(false); }}
              onClose={() => setShowSignPad(false)}
            />
          ) : (
            <button onClick={() => setShowSignPad(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
              ✍️ Add Signature
            </button>
          )}
        </div>

        {/* Checkout */}
        <button onClick={handleCheckout} disabled={cart.length === 0 || checking}
          className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all
            flex items-center justify-center gap-2
            ${cart.length === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}>
          {checking
            ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
            : `✓ Checkout — ${formatCurrency(grandTotal)}`
          }
        </button>
      </div>

      {/* Success Modal */}
      {showSuccess && successInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Bill Created!</h2>
            <div className="inline-block bg-indigo-50 text-indigo-700 font-mono font-bold text-base px-4 py-1.5 rounded-full mb-5">
              {successInvoice.invoiceNumber}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2.5">
              {[
                { l: 'Customer', v: successInvoice.customer?.name || 'Walk-in' },
                { l: 'Mobile',   v: successInvoice.customer?.mobileNumber },
                { l: 'Items',    v: `${successInvoice.items?.length} item(s)` },
              ].map((r, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-500">{r.l}</span>
                  <span className="font-semibold text-gray-900">{r.v}</span>
                </div>
              ))}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Payment</span>
                <Badge label={successInvoice.paymentMode}
                  type={successInvoice.paymentMode==='CASH'?'gray':successInvoice.paymentMode==='UPI'?'info':'purple'} />
              </div>
              <div className="border-t border-gray-200 pt-2.5 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Paid</span>
                <span className="text-xl font-extrabold text-indigo-600">
                  {formatCurrency(successInvoice.grandTotal)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" fullWidth onClick={handleDownloadPdf}>📥 PDF</Button>
              <Button fullWidth onClick={handleNewBill}>🖥️ New Bill</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;