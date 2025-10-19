const adminMiddleware = (req, res, next) => {
  try {
    // El authMiddleware ya debe haber verificado el token y agregado req.user
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Verificar si el usuario tiene rol de admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado. Se requieren permisos de administrador'
      });
    }

    next();

  } catch (error) {
    console.error('Error en middleware de admin:', error);
    return res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

module.exports = adminMiddleware;
