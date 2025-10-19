// ============================================
// MIDDLEWARE DE AUTORIZACIÓN POR ROLES
// ============================================

/**
 * Middleware para verificar que el usuario tenga uno de los roles permitidos
 * Debe usarse DESPUÉS del authMiddleware
 *
 * @param  {...string} allowedRoles - Roles permitidos para acceder a la ruta
 * @returns {Function} Middleware de Express
 *
 * @example
 * // Permitir solo admins
 * router.get('/admin/users', authMiddleware, authorize('admin'), getUsers);
 *
 * @example
 * // Permitir admins y delivery
 * router.patch('/orders/:id', authMiddleware, authorize('admin', 'delivery'), updateOrder);
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado (debe pasar por authMiddleware primero)
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: 'No autenticado. Debes iniciar sesión primero.'
      });
    }

    // Verificar si el rol del usuario está en los roles permitidos
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acceso denegado. No tienes permisos para realizar esta acción.',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
    }

    // Usuario autorizado, continuar
    next();
  };
};

/**
 * Middleware para verificar que el usuario sea admin
 * Atajo para authorize('admin')
 */
const isAdmin = authorize('admin');

/**
 * Middleware para verificar que el usuario sea customer
 * Atajo para authorize('customer')
 */
const isCustomer = authorize('customer');

/**
 * Middleware para verificar que el usuario sea delivery
 * Atajo para authorize('delivery')
 */
const isDelivery = authorize('delivery');

/**
 * Middleware para verificar que el usuario sea admin o delivery
 * Útil para rutas de gestión de pedidos
 */
const isAdminOrDelivery = authorize('admin', 'delivery');

module.exports = {
  authorize,
  isAdmin,
  isCustomer,
  isDelivery,
  isAdminOrDelivery
};
