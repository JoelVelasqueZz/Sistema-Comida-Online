import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente para proteger rutas que solo admins pueden acceder
 * Redirige a /menu si el usuario no es admin
 */
function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading-spinner loading-spinner-primary loading-spinner-xl"></div>
        <p className="text-lg text-muted">Verificando permisos...</p>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si no es admin, redirigir a menu con mensaje
  if (user.role !== 'admin') {
    return (
      <Navigate
        to="/menu"
        replace
        state={{ error: 'No tienes permisos para acceder a esta página' }}
      />
    );
  }

  // Usuario es admin, mostrar el contenido
  return children;
}

export default ProtectedAdminRoute;
