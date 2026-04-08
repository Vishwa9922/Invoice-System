import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from './Layout';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center',
      alignItems: 'center', height: '100vh' }}>
      Loading...
    </div>
  );

  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/dashboard" replace />;

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;