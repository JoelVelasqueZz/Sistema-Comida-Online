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
// OBTENER TODOS LOS PRODUCTOS (Solo disponibles para clientes)
// ============================================
const getProducts = async (req, res) => {
  try {
    const { category_id } = req.query;

    let query = `
      SELECT p.id, p.name, p.description, p.price, p.image_url,
             p.is_available, p.preparation_time, p.calories,
             c.id as category_id, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_available = true
    `;
    const values = [];
    let paramCount = 1;

    // Filtrar por categoría si se proporciona
    if (category_id) {
      query += ` AND p.category_id = $${paramCount}`;
      values.push(category_id);
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

// ============================================
// ADMIN: CREAR CATEGORÍA
// ============================================
const createCategory = async (req, res) => {
  try {
    const { name, description, image_url, display_order, is_active } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await pool.query(
      `INSERT INTO categories (name, description, image_url, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), description || null, image_url || null, display_order || 0, is_active !== false]
    );

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      category: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

// ============================================
// ADMIN: ACTUALIZAR CATEGORÍA
// ============================================
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url, display_order, is_active } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await pool.query(
      `UPDATE categories
       SET name = $1, description = $2, image_url = $3, display_order = $4, is_active = $5
       WHERE id = $6
       RETURNING *`,
      [name.trim(), description || null, image_url || null, display_order || 0, is_active !== false, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({
      message: 'Categoría actualizada exitosamente',
      category: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

// ============================================
// ADMIN: ELIMINAR CATEGORÍA
// ============================================
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay productos en esta categoría
    const productsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
      [id]
    );

    if (parseInt(productsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar la categoría porque tiene productos asociados'
      });
    }

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({
      message: 'Categoría eliminada exitosamente',
      category: result.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};

// ============================================
// ADMIN: OBTENER TODAS LAS CATEGORÍAS (incluye inactivas)
// ============================================
const getAllCategoriesAdmin = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, image_url, display_order, is_active, created_at
       FROM categories
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
// ADMIN: CREAR PRODUCTO
// ============================================
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category_id, image_url, preparation_time, calories, is_available } = req.body;

    // Validaciones
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (!price || parseFloat(price) <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
    }

    if (!category_id) {
      return res.status(400).json({ error: 'La categoría es requerida' });
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, price, category_id, image_url, preparation_time, calories, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name.trim(),
        description || null,
        parseFloat(price),
        category_id,
        image_url || null,
        parseInt(preparation_time) || 15,
        parseInt(calories) || null,
        is_available !== false
      ]
    );

    res.status(201).json({
      message: 'Producto creado exitosamente',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// ============================================
// ADMIN: ACTUALIZAR PRODUCTO
// ============================================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category_id, image_url, preparation_time, calories, is_available } = req.body;

    // Validaciones
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (!price || parseFloat(price) <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
    }

    const result = await pool.query(
      `UPDATE products
       SET name = $1, description = $2, price = $3, category_id = $4, image_url = $5,
           preparation_time = $6, calories = $7, is_available = $8
       WHERE id = $9
       RETURNING *`,
      [
        name.trim(),
        description || null,
        parseFloat(price),
        category_id,
        image_url || null,
        parseInt(preparation_time) || 15,
        parseInt(calories) || null,
        is_available !== false,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({
      message: 'Producto actualizado exitosamente',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// ============================================
// ADMIN: ELIMINAR PRODUCTO
// ============================================
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Eliminar extras asociados primero
    await pool.query('DELETE FROM product_extras WHERE product_id = $1', [id]);

    // Eliminar producto
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({
      message: 'Producto eliminado exitosamente',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

// ============================================
// ADMIN: CAMBIAR DISPONIBILIDAD DE PRODUCTO
// ============================================
const toggleProductAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE products
       SET is_available = NOT is_available
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({
      message: 'Disponibilidad actualizada exitosamente',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error al cambiar disponibilidad:', error);
    res.status(500).json({ error: 'Error al cambiar disponibilidad' });
  }
};

// ============================================
// ADMIN: OBTENER TODOS LOS PRODUCTOS (incluye no disponibles)
// ============================================
const getAllProductsAdmin = async (req, res) => {
  try {
    const { category_id, search } = req.query;

    let query = `
      SELECT p.id, p.name, p.description, p.price, p.image_url,
             p.is_available, p.preparation_time, p.calories, p.created_at,
             c.id as category_id, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (category_id) {
      query += ` AND p.category_id = $${paramCount}`;
      values.push(category_id);
      paramCount++;
    }

    if (search && search.trim().length > 0) {
      query += ` AND (LOWER(p.name) LIKE $${paramCount} OR LOWER(p.description) LIKE $${paramCount})`;
      values.push(`%${search.toLowerCase()}%`);
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
// ADMIN: OBTENER EXTRAS DE UN PRODUCTO (incluye no disponibles)
// ============================================
const getProductExtrasAdmin = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `SELECT id, name, price, is_available, created_at
       FROM product_extras
       WHERE product_id = $1
       ORDER BY name ASC`,
      [productId]
    );

    res.json({
      extras: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener extras:', error);
    res.status(500).json({ error: 'Error al obtener extras' });
  }
};

// ============================================
// ADMIN: CREAR EXTRA
// ============================================
const createExtra = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, price, is_available } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (!price || parseFloat(price) < 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor o igual a 0' });
    }

    const result = await pool.query(
      `INSERT INTO product_extras (product_id, name, price, is_available)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [productId, name.trim(), parseFloat(price), is_available !== false]
    );

    res.status(201).json({
      message: 'Extra creado exitosamente',
      extra: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear extra:', error);
    res.status(500).json({ error: 'Error al crear extra' });
  }
};

// ============================================
// ADMIN: ACTUALIZAR EXTRA
// ============================================
const updateExtra = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, is_available } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (!price || parseFloat(price) < 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor o igual a 0' });
    }

    const result = await pool.query(
      `UPDATE product_extras
       SET name = $1, price = $2, is_available = $3
       WHERE id = $4
       RETURNING *`,
      [name.trim(), parseFloat(price), is_available !== false, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Extra no encontrado' });
    }

    res.json({
      message: 'Extra actualizado exitosamente',
      extra: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar extra:', error);
    res.status(500).json({ error: 'Error al actualizar extra' });
  }
};

// ============================================
// ADMIN: ELIMINAR EXTRA
// ============================================
const deleteExtra = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM product_extras WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Extra no encontrado' });
    }

    res.json({
      message: 'Extra eliminado exitosamente',
      extra: result.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar extra:', error);
    res.status(500).json({ error: 'Error al eliminar extra' });
  }
};

module.exports = {
  // Rutas públicas
  getCategories,
  getCategoryById,
  getProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,

  // Rutas de admin - Categorías
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,

  // Rutas de admin - Productos
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,

  // Rutas de admin - Extras
  getProductExtrasAdmin,
  createExtra,
  updateExtra,
  deleteExtra
};