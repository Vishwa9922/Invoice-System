import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';

import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import Categories     from './pages/Categories';
import Products       from './pages/Products';
import Customers      from './pages/Customers';
import POS            from './pages/POS';
import Invoices       from './pages/Invoices';
import InvoiceDetail  from './pages/InvoiceDetail';
import Reports        from './pages/Reports';
import Suppliers      from './pages/Suppliers';
import Purchases      from './pages/Purchases';
import Expenses       from './pages/Expenses';
import Payments       from './pages/Payments';
import Returns        from './pages/Returns';
import Stock          from './pages/Stock';
import Settings       from './pages/Settings';
import Users          from './pages/Users';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected — ADMIN + CASHIER */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/products"   element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/customers"  element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/pos"        element={<ProtectedRoute><POS /></ProtectedRoute>} />
          <Route path="/invoices"   element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
          <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
          <Route path="/suppliers"  element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
          <Route path="/purchases"  element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
          <Route path="/expenses"   element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/payments"   element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/returns"    element={<ProtectedRoute><Returns /></ProtectedRoute>} />
          <Route path="/stock"      element={<ProtectedRoute><Stock /></ProtectedRoute>} />

          {/* Admin only */}
          <Route path="/reports"    element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
          <Route path="/settings"   element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
          <Route path="/users"      element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;