import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    // Redirect to appropriate dashboard based on user role
    const userRole = hasRole(['admin']) ? 'admin' : 
                     hasRole(['cashier']) ? 'cashier' : 
                     hasRole(['floor_manager']) ? 'floor-manager' :
                     hasRole(['player']) ? 'player' : null;
    
    if (userRole) {
      // Floor manager has a different route structure
      if (userRole === 'floor-manager') {
        return <Navigate to="/floor-manager" replace />;
      }
      return <Navigate to={`/${userRole}/dashboard`} replace />;
    }
    
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;