const authMiddleware = (req, res, next) => {
  try {
    // El API Gateway ya validó el token y envía los headers
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!userId) {
      return res.status(401).json({ 
        error: 'No se encontró información de autenticación' 
      });
    }

    req.user = {
      userId,
      role: userRole
    };

    next();
  } catch (error) {
    console.error('Error en authMiddleware:', error);
    return res.status(500).json({ error: 'Error al verificar autenticación' });
  }
};

module.exports = authMiddleware;