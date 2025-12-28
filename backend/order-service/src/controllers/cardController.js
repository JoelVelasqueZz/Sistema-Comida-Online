const pool = require('../config/database');

// Obtener todas las tarjetas del usuario
const getUserCards = async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;

    console.log('💳 [Cards] Obteniendo tarjetas para user_id:', user_id);

    const result = await pool.query(
      `SELECT * FROM saved_cards
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [user_id]
    );

    console.log('💳 [Cards] Tarjetas encontradas:', result.rows.length);

    res.json({
      success: true,
      cards: result.rows
    });
  } catch (error) {
    console.error('❌ [Cards] Error:', error);
    res.status(500).json({ error: 'Error al obtener tarjetas' });
  }
};

// Guardar nueva tarjeta (desde checkout)
const saveCard = async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;
    const { card_type, last_four_digits, cardholder_name, expiry_month, expiry_year, is_default } = req.body;

    console.log('💳 [Cards] Guardando tarjeta para user_id:', user_id);
    console.log('💳 [Cards] Últimos 4 dígitos:', last_four_digits);

    // Validaciones
    if (!card_type || !last_four_digits || !cardholder_name || !expiry_month || !expiry_year) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (last_four_digits.length !== 4 || !/^\d{4}$/.test(last_four_digits)) {
      return res.status(400).json({ error: 'Últimos 4 dígitos inválidos' });
    }

    // Validar mes (1-12)
    const month = parseInt(expiry_month);
    if (isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Mes de expiración inválido' });
    }

    // Validar año (actual o futuro)
    const year = parseInt(expiry_year);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < currentYear) {
      return res.status(400).json({ error: 'Año de expiración inválido' });
    }

    // Verificar si ya existe una tarjeta con los mismos últimos 4 dígitos
    const existingCard = await pool.query(
      'SELECT id FROM saved_cards WHERE user_id = $1 AND last_four_digits = $2',
      [user_id, last_four_digits]
    );

    if (existingCard.rows.length > 0) {
      console.log('ℹ️ [Cards] Tarjeta ya existe');
      return res.status(200).json({
        success: true,
        message: 'Tarjeta ya guardada',
        card: existingCard.rows[0]
      });
    }

    // Si se marca como predeterminada, quitar ese flag de las demás
    if (is_default) {
      await pool.query(
        'UPDATE saved_cards SET is_default = false WHERE user_id = $1',
        [user_id]
      );
    }

    // Si es la primera tarjeta, marcarla como predeterminada automáticamente
    const cardCount = await pool.query(
      'SELECT COUNT(*) as count FROM saved_cards WHERE user_id = $1',
      [user_id]
    );
    const isFirstCard = parseInt(cardCount.rows[0].count) === 0;

    const result = await pool.query(
      `INSERT INTO saved_cards (user_id, card_type, last_four_digits, cardholder_name, expiry_month, expiry_year, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, card_type, last_four_digits, cardholder_name, month, year, is_default || isFirstCard]
    );

    console.log('✅ [Cards] Tarjeta guardada:', result.rows[0].id);

    res.status(201).json({
      success: true,
      card: result.rows[0]
    });
  } catch (error) {
    console.error('❌ [Cards] Error:', error);
    res.status(500).json({ error: 'Error al guardar tarjeta' });
  }
};

// Marcar tarjeta como predeterminada
const setDefaultCard = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.userId || req.user.id;

    console.log('💳 [Cards] Marcando como predeterminada:', id);

    // Quitar predeterminada de todas
    await pool.query(
      'UPDATE saved_cards SET is_default = false WHERE user_id = $1',
      [user_id]
    );

    // Marcar esta como predeterminada
    const result = await pool.query(
      `UPDATE saved_cards
       SET is_default = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    console.log('✅ [Cards] Tarjeta marcada como predeterminada');

    res.json({
      success: true,
      card: result.rows[0]
    });
  } catch (error) {
    console.error('❌ [Cards] Error:', error);
    res.status(500).json({ error: 'Error al establecer tarjeta predeterminada' });
  }
};

// Eliminar tarjeta
const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.userId || req.user.id;

    console.log('💳 [Cards] Eliminando tarjeta:', id);

    const result = await pool.query(
      'DELETE FROM saved_cards WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    console.log('✅ [Cards] Tarjeta eliminada');

    res.json({ success: true });
  } catch (error) {
    console.error('❌ [Cards] Error:', error);
    res.status(500).json({ error: 'Error al eliminar tarjeta' });
  }
};

module.exports = {
  getUserCards,
  saveCard,
  setDefaultCard,
  deleteCard
};
