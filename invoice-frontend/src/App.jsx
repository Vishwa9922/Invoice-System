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
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/categories" element={
            <ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/products" element={
            <ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/customers" element={
            <ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/pos" element={
            <ProtectedRoute><POS /></ProtectedRoute>} />
          <Route path="/invoices" element={
            <ProtectedRoute><Invoices /></ProtectedRoute>} />
          <Route path="/invoices/:id" element={
            <ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />

          {/* Admin only */}
          <Route path="/reports" element={
            <ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;