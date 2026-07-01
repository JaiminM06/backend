import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import PageLoader from '../ui/PageLoader.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading, error } = useAuth();

  if (loading) return <PageLoader label="Verifying session..." />;

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-red-500 font-medium">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-colors"
      >
        Retry
      </button>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
