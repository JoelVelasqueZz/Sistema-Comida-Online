const pool = require('../config/database');

// ============================================
// OBTENER TODAS LAS CATEGORÍAS
// ============================================
const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, image_url, display_order 
       FROM categories 
       WHERE is_active = true 
       ORDER BY display_order ASC, name ASC`
    );

    res.json({
      categories: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// ============================================
// OBTENER CATEGORÍA POR ID
// ============================================
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, description, image_url, display_order 
       FROM categories 
       WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({ category: result.rows[0] });

  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
};

// ============================================
// OBTENER TODOS LOS PRODUCTOS
// ============================================
const getProducts = async (req, res) => {
  try {
    const { category_id, available } = req.query;

    let query = `
      SELECT p.id, p.name, p.description, p.price, p.image_url, 
             p.is_available, p.preparation_time, p.calories,
             c.id as category_id, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    // Filtrar por categoría si se proporciona
    if (category_id) {
      query += ` AND p.category_id = $${paramCount}`;
      values.push(category_id);
      paramCount++;
    }

    // Filtrar por disponibilidad si se proporciona
    if (available !== undefined) {
      query += ` AND p.is_available = $${paramCount}`;
      values.push(available === 'true');
      paramCount++;
    }

    query += ' ORDER BY p.name ASC';

    const result = await pool.query(query, values);

    res.json({
      products: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// ============================================
// OBTENER PRODUCTO POR ID (con extras)
// ============================================
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener producto
    const productResult = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, 
              p.is_available, p.preparation_time, p.calories,
              c.id as category_id, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const product = productResult.rows[0];

    // Obtener extras del producto
    const extrasResult = await pool.query(
      `SELECT id, name, price, is_available
       FROM product_extras
       WHERE product_id = $1 AND is_available = true
       ORDER BY name ASC`,
      [id]
    );

    product.extras = extrasResult.rows;

    res.json({ product });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// ============================================
// OBTENER PRODUCTOS POR CATEGORÍA
// ============================================
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, 
              p.is_available, p.preparation_time, p.calories
       FROM products p
       WHERE p.category_id = $1 AND p.is_available = true
       ORDER BY p.name ASC`,
      [categoryId]
    );

    res.json({
      products: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener productos por categoría:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// ============================================
// BUSCAR PRODUCTOS
// ============================================
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query; // query string

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Debes proporcionar al menos 2 caracteres para buscar' 
      });
    }

    const searchTerm = `%${q.toLowerCase()}%`;

    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, 
              p.is_available, p.preparation_time,
              c.id as category_id, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE (LOWER(p.name) LIKE $1 OR LOWER(p.description) LIKE $1)
       AND p.is_available = true
       ORDER BY p.name ASC
       LIMIT 20`,
      [searchTerm]
    );

    res.json({
      products: result.rows,
      total: result.rows.length,
      query: q
    });

  } catch (error) {
    console.error('Error al buscar productos:', error);
    res.status(500).json({ error: 'Error al buscar productos' });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  getProducts,
  getProductById,
  getProductsByCategory,
  searchProducts
};