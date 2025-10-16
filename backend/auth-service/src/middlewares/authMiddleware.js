const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No se proporcionó token de autenticación' 
      });
    }

    // Extraer el token
    const token = authHeader.split(' ')[1];

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Agregar información del usuario al request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    return res.status(500).json({ error: 'Error al verificar autenticación' });
  }
};

module.exports = authMiddleware;