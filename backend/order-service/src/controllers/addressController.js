const pool = require('../config/database');

// Obtener todas las direcciones del usuario
const getUserAddresses = async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;

    console.log('🏠 [Addresses] Obteniendo direcciones para user_id:', user_id);

    const result = await pool.query(
      `SELECT * FROM addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [user_id]
    );

    console.log('🏠 [Addresses] Direcciones encontradas:', result.rows.length);

    res.json({
      success: true,
      addresses: result.rows
    });
  } catch (error) {
    console.error('❌ [Addresses] Error:', error);
    res.status(500).json({ error: 'Error al obtener direcciones' });
  }
};

// Crear nueva dirección
const createAddress = async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;
    const { street, city, postal_code, reference, is_default } = req.body;

    console.log('🏠 [Addresses] Creando dirección para user_id:', user_id);
    console.log('🏠 [Addresses] Datos:', { street, city, postal_code, reference, is_default });

    // Validaciones
    if (!street || !city) {
      return res.status(400).json({ error: 'Calle y ciudad son requeridos' });
    }

    // Si se marca como predeterminada, quitar ese flag de las demás
    if (is_default) {
      await pool.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1',
        [user_id]
      );
    }

    const result = await pool.query(
      `INSERT INTO addresses (user_id, street, city, postal_code, reference, is_default)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, street, city, postal_code, reference, is_default || false]
    );

    console.log('✅ [Addresses] Dirección creada:', result.rows[0].id);

    res.status(201).json({
      success: true,
      address: result.rows[0]
    });
  } catch (error) {
    console.error('❌ [Addresses] Error:', error);
    res.status(500).json({ error: 'Error al crear dirección' });
  }
};

// Actualizar dirección
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.userId || req.user.id;
    const { street, city, postal_code, reference } = req.body;

    console.log('🏠 [Addresses] Actualizando dirección:', id);

    const result = await pool.query(
      `UPDATE addresses
       SET street = $1, city = $2, postal_code = $3, reference = $4, updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [street, city, postal_code, reference, id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dirección no encontrada' });
    }

    console.log('✅ [Addresses] Dirección actualizada');

    res.json({
      success: true,
      address: result.rows[0]
    });
  } catch (error) {
    console.error('❌ [Addresses] Error:', error);
    res.status(500).json({ error: 'Error al actualizar dirección' });
  }
};

// Marcar dirección como predeterminada
const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.userId || req.user.id;

    console.log('🏠 [Addresses] Marcando como predeterminada:', id);

    // Quitar predeterminada de todas
    await pool.query(
      'UPDATE addresses SET is_default = false WHERE user_id = $1',
      [user_id]
    );

    // Marcar esta como predeterminada
    const result = await pool.query(
      `UPDATE addresses
       SET is_default = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dirección no encontrada' });
    }

    console.log('✅ [Addresses] Dirección marcada como predeterminada');

    res.json({
      success: true,
      address: result.rows[0]
    });
  } catch (error) {
    console.error('❌ [Addresses] Error:', error);
    res.status(500).json({ error: 'Error al establecer dirección predeterminada' });
  }
};

// Eliminar dirección
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.userId || req.user.id;

    console.log('🏠 [Addresses] Eliminando dirección:', id);

    const result = await pool.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dirección no encontrada' });
    }

    console.log('✅ [Addresses] Dirección eliminada');

    res.json({ success: true });
  } catch (error) {
    console.error('❌ [Addresses] Error:', error);
    res.status(500).json({ error: 'Error al eliminar dirección' });
  }
};

module.exports = {
  getUserAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress
};
