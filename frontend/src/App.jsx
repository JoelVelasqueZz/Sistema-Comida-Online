import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';

// Importar páginas
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Menu from './pages/Menu';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import Promociones from './pages/Promociones';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import MenuManagement from './pages/admin/MenuManagement';
import UserManagement from './pages/admin/UserManagement';
import Reports from './pages/admin/Reports';
import AvailableOrders from './pages/delivery/AvailableOrders';
import MyDeliveries from './pages/delivery/MyDeliveries';
import ConfirmPayment from './pages/ConfirmPayment';

// Importar componentes
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import WelcomeCouponModal from './components/WelcomeCouponModal';

// Componente para rutas protegidas
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Componente para rutas públicas (solo para usuarios no autenticados)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>;
  }

  if (user) {
    return <Navigate to="/menu" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Verificar si el usuario está autenticado y si ya vio el modal
    if (user) {
      const hasSeenModal = localStorage.getItem(`welcome_coupon_seen_${user.userId}`);
      if (!hasSeenModal) {
        // Mostrar modal después de un pequeño delay para mejor UX
        const timer = setTimeout(() => {
          setShowWelcomeModal(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
  };

  return (
    <>
      <Navbar />
      <WelcomeCouponModal
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
      />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/product/:id" element={<ProductDetail />} />

        {/* Ruta de confirmación de pago (pública - solo requiere token) */}
        <Route path="/confirm-payment/:orderId/:token" element={<ConfirmPayment />} />
        
        {/* Rutas de autenticación (solo para no autenticados) */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Rutas protegidas (requieren autenticación) */}
        <Route 
          path="/cart" 
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/checkout" 
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/promociones"
          element={
            <ProtectedRoute>
              <Promociones />
            </ProtectedRoute>
          }
        />

        {/* Rutas de Admin (Solo para usuarios con rol admin) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedAdminRoute>
              <AdminOrders />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <ProtectedAdminRoute>
              <MenuManagement />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedAdminRoute>
              <UserManagement />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedAdminRoute>
              <Reports />
            </ProtectedAdminRoute>
          }
        />

        {/* Rutas de Repartidor (Solo para usuarios con rol delivery) */}
        <Route
          path="/delivery/available-orders"
          element={
            <ProtectedRoute>
              <AvailableOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/my-deliveries"
          element={
            <ProtectedRoute>
              <MyDeliveries />
            </ProtectedRoute>
          }
        />

        {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

// Componente 404
function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1 style={{ fontSize: '72px', margin: 0 }}>404</h1>
      <h2>Página no encontrada</h2>
      <p>La página que buscas no existe</p>
      <a href="/" style={{ color: '#007bff', textDecoration: 'none', fontSize: '18px' }}>
        Volver al inicio
      </a>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;