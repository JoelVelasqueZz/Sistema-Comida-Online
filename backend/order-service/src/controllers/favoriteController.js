const pool = require('../config/database');

// Obtener todos los favoritos del usuario CON datos del producto
const getUserFavorites = async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;

    console.log('❤️ [Favorites] Obteniendo favoritos para user_id:', user_id);

    const result = await pool.query(
      `SELECT
        f.id as favorite_id,
        f.created_at,
        p.*,
        p.image_url as image  
       FROM favorites f
       INNER JOIN products p ON f.product_id = p.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [user_id]
    );

    console.log('❤️ [Favorites] Favoritos encontrados:', result.rows.length);

    res.json({
      success: true,
      favorites: result.rows
    });
  } catch (error) {
    console.error('❌ [Favorites] Error:', error);
    res.status(500).json({ error: 'Error al obtener favoritos' });
  }
};

// Agregar producto a favoritos
const addFavorite = async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;
    const { product_id } = req.params;

    console.log('❤️ [Favorites] Agregando favorito:', { user_id, product_id });

    // Verificar que el producto existe
    const productExists = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [product_id]
    );

    if (productExists.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Intentar insertar (puede fallar si ya existe por el UNIQUE constraint)
    try {
      const result = await pool.query(
        `INSERT INTO favorites (user_id, product_id)
         VALUES ($1, $2)
         RETURNING *`,
        [user_id, product_id]
      );

      console.log('✅ [Favorites] Favorito agregado');

      res.status(201).json({
        success: true,
        favorite: result.rows[0]
      });
    } catch (insertError) {
      // Si ya existe, no es error, simplemente informar
      if (insertError.code === '23505') { // unique_violation
        console.log('ℹ️ [Favorites] Producto ya estaba en favoritos');
        return res.status(200).json({
          success: true,
          message: 'Producto ya estaba en favoritos'
        });
      }
      throw insertError;
    }
  } catch (error) {
    console.error('❌ [Favorites] Error:', error);
    res.status(500).json({ error: 'Error al agregar favorito' });
  }
};

// Eliminar producto de favoritos
const removeFavorite = async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;
    const { product_id } = req.params;

    console.log('❤️ [Favorites] Eliminando favorito:', { user_id, product_id });

    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2 RETURNING *',
      [user_id, product_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorito no encontrado' });
    }

    console.log('✅ [Favorites] Favorito eliminado');

    res.json({ success: true });
  } catch (error) {
    console.error('❌ [Favorites] Error:', error);
    res.status(500).json({ error: 'Error al eliminar favorito' });
  }
};

// Verificar si un producto es favorito (útil para el toggle)
const isFavorite = async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;
    const { product_id } = req.params;

    const result = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2',
      [user_id, product_id]
    );

    res.json({
      success: true,
      isFavorite: result.rows.length > 0
    });
  } catch (error) {
    console.error('❌ [Favorites] Error:', error);
    res.status(500).json({ error: 'Error al verificar favorito' });
  }
};

module.exports = {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  isFavorite
};
