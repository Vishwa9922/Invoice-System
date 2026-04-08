import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getSettingsApi, updateSettingsApi } from '../api/settingsApi';
import Button from '../components/common/Button';
import Input  from '../components/common/Input';
import Loader from '../components/common/Loader';

const EMPTY = {
  businessName: '', address: '', phone: '', email: '',
  gstNumber: '', logoUrl: '', currency: 'INR',
  defaultTaxRate: '', invoicePrefix: 'INV',
  lowStockAlertEnabled: true, expiryAlertDays: 30,
};

const Settings = () => {
  const [form,    setForm]    = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await getSettingsApi();
      const d   = res.data.data;
      setForm({
        businessName:        d.businessName || '',
        address:             d.address || '',
        phone:               d.phone || '',
        email:               d.email || '',
        gstNumber:           d.gstNumber || '',
        logoUrl:             d.logoUrl || '',
        currency:            d.currency || 'INR',
        defaultTaxRate:      d.defaultTaxRate || '',
        invoicePrefix:       d.invoicePrefix || 'INV',
        lowStockAlertEnabled: d.lowStockAlertEnabled ?? true,
        expiryAlertDays:     d.expiryAlertDays || 30,
      });
    } catch { toast.error('Failed to load settings'); }
    finally  { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettingsApi({
        ...form,
        defaultTaxRate: form.defaultTaxRate ? Number(form.defaultTaxRate) : null,
        expiryAlertDays: Number(form.expiryAlertDays),
      });
      toast.success('Settings saved!');
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving settings'); }
    finally       { setSaving(false); }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Business Settings</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage your business profile and preferences</p>
      </div>

      {/* Business Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
          🏢 Business Information
        </h3>
        <Input label="Business Name" name="businessName" value={form.businessName} onChange={handleChange} placeholder="e.g. My Shop" />
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Address</label>
          <textarea name="address" value={form.address} onChange={handleChange}
            placeholder="Full business address..." rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="shop@example.com" />
        </div>
        <Input label="GST Number" name="gstNumber" value={form.gstNumber} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
        <Input label="Logo URL" name="logoUrl" value={form.logoUrl} onChange={handleChange} placeholder="https://..." />
      </div>

      {/* Invoice Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
          🧾 Invoice Settings
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Invoice Prefix" name="invoicePrefix" value={form.invoicePrefix} onChange={handleChange} placeholder="INV" />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Currency</label>
            <select name="currency" value={form.currency} onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white">
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>
        <Input label="Default Tax Rate (%)" name="defaultTaxRate" type="number" value={form.defaultTaxRate} onChange={handleChange} placeholder="18" />
      </div>

      {/* Alert Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
          🔔 Alert Settings
        </h3>
        <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
          <input type="checkbox" name="lowStockAlertEnabled" checked={form.lowStockAlertEnabled} onChange={handleChange} className="mt-0.5 accent-indigo-600" />
          <div>
            <div className="text-sm font-semibold text-gray-800">Low Stock Alerts</div>
            <div className="text-xs text-gray-500">Get daily alerts when products are below threshold</div>
          </div>
        </label>
        <Input label="Expiry Alert Days" name="expiryAlertDays" type="number" value={form.expiryAlertDays} onChange={handleChange} placeholder="30" />
        <p className="text-xs text-gray-400">Alert will trigger {form.expiryAlertDays} days before product expiry</p>
      </div>

      <div className="flex justify-end">
        <Button loading={saving} onClick={handleSave}>💾 Save Settings</Button>
      </div>
    </div>
  );
};

export default Settings;