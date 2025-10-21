const pool = require('../config/database');

// ============================================
// REPORTE DE VENTAS
// ============================================
const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'daily' } = req.query;

    // Validaciones
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate y endDate son requeridos' });
    }

    // Formato de fecha según agrupación
    const dateFormats = {
      daily: 'YYYY-MM-DD',
      weekly: 'IYYY-IW',
      monthly: 'YYYY-MM',
      yearly: 'YYYY'
    };

    const dateFormat = dateFormats[groupBy] || dateFormats.daily;

    const result = await pool.query(
      `SELECT
        TO_CHAR(created_at, $3) as period,
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(AVG(total), 0) as average_order_value,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY TO_CHAR(created_at, $3)
      ORDER BY period DESC`,
      [startDate, endDate, dateFormat]
    );

    // Calcular totales generales
    const totals = {
      totalOrders: 0,
      totalRevenue: 0,
      deliveredOrders: 0,
      cancelledOrders: 0
    };

    result.rows.forEach(row => {
      totals.totalOrders += parseInt(row.total_orders);
      totals.totalRevenue += parseFloat(row.total_revenue);
      totals.deliveredOrders += parseInt(row.delivered_orders);
      totals.cancelledOrders += parseInt(row.cancelled_orders);
    });

    totals.averageOrderValue = totals.totalOrders > 0 ? totals.totalRevenue / totals.totalOrders : 0;

    res.json({
      success: true,
      data: result.rows,
      totals,
      filters: { startDate, endDate, groupBy }
    });

  } catch (error) {
    console.error('Error al generar reporte de ventas:', error);
    res.status(500).json({
      error: 'Error al generar reporte de ventas',
      details: error.message
    });
  }
};

// ============================================
// REPORTE DE PRODUCTOS MÁS VENDIDOS
// ============================================
const getTopProductsReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10, categoryId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Se requieren fechas de inicio y fin' });
    }

    let query = `
      SELECT
        p.id,
        p.name,
        c.name as category,
        p.price,
        COALESCE(SUM(oi.quantity), 0) as total_quantity,
        COALESCE(SUM(oi.subtotal), 0) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered'
        AND o.created_at BETWEEN $1 AND $2
    `;

    const params = [startDate, endDate];
    let paramCount = 3;

    if (categoryId) {
      query += ` AND p.category_id = $${paramCount}`;
      params.push(categoryId);
      paramCount++;
    }

    query += `
      GROUP BY p.id, p.name, c.name, p.price
      ORDER BY total_quantity DESC
      LIMIT $${paramCount}
    `;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    // Calcular porcentajes
    const totalRevenue = result.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0);
    const totalQuantity = result.rows.reduce((sum, row) => sum + parseInt(row.total_quantity), 0);

    const dataWithPercentages = result.rows.map(row => ({
      ...row,
      revenue_percentage: totalRevenue > 0 ? ((parseFloat(row.total_revenue) / totalRevenue) * 100).toFixed(2) : 0,
      quantity_percentage: totalQuantity > 0 ? ((parseInt(row.total_quantity) / totalQuantity) * 100).toFixed(2) : 0
    }));

    res.json({
      success: true,
      data: dataWithPercentages,
      totals: {
        totalProducts: result.rows.length,
        totalQuantitySold: totalQuantity,
        totalRevenue: totalRevenue
      },
      filters: { startDate, endDate, limit, categoryId }
    });

  } catch (error) {
    console.error('Error al generar reporte de productos:', error);
    res.status(500).json({
      error: 'Error al generar reporte de productos',
      details: error.message
    });
  }
};

// ============================================
// REPORTE DE CLIENTES
// ============================================
const getCustomersReport = async (req, res) => {
  try {
    const { startDate, endDate, type = 'all' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Se requieren fechas de inicio y fin' });
    }

    let query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.is_active,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_spent,
        COALESCE(AVG(o.total), 0) as average_order,
        MAX(o.created_at) as last_order
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'delivered'
        AND o.created_at BETWEEN $1 AND $2
      WHERE u.role = 'customer'
    `;

    const params = [startDate, endDate];

    // Aplicar filtros según el tipo
    switch (type) {
      case 'frequent':
        query += ` GROUP BY u.id, u.name, u.email, u.phone, u.is_active
                   HAVING COUNT(o.id) >= 3`;
        break;
      case 'new':
        query += ` AND u.created_at BETWEEN $1 AND $2
                   GROUP BY u.id, u.name, u.email, u.phone, u.is_active`;
        break;
      case 'inactive':
        query += ` GROUP BY u.id, u.name, u.email, u.phone, u.is_active
                   HAVING COUNT(o.id) = 0`;
        break;
      default: // 'all'
        query += ` GROUP BY u.id, u.name, u.email, u.phone, u.is_active`;
    }

    query += ` ORDER BY total_spent DESC NULLS LAST`;

    const result = await pool.query(query, params);

    // Calcular totales
    const totals = {
      totalCustomers: result.rows.length,
      totalRevenue: result.rows.reduce((sum, row) => sum + (parseFloat(row.total_spent) || 0), 0),
      totalOrders: result.rows.reduce((sum, row) => sum + parseInt(row.total_orders || 0), 0)
    };

    res.json({
      success: true,
      data: result.rows,
      totals,
      filters: { startDate, endDate, type }
    });

  } catch (error) {
    console.error('Error al generar reporte de clientes:', error);
    res.status(500).json({
      error: 'Error al generar reporte de clientes',
      details: error.message
    });
  }
};

// ============================================
// REPORTE FINANCIERO
// ============================================
const getFinancialReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Se requieren mes y año' });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    // Obtener datos financieros
    const query = `
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as gross_revenue,
        COALESCE(SUM(delivery_fee), 0) as shipping_revenue,
        COALESCE(SUM(tax), 0) as tax_collected,
        payment_method,
        COUNT(*) as payment_count
      FROM orders
      WHERE status = 'delivered'
        AND created_at BETWEEN $1 AND $2
      GROUP BY payment_method
    `;

    const result = await pool.query(query, [startDate, endDate]);

    // Calcular totales generales
    let grossRevenue = 0;
    let shippingRevenue = 0;
    let taxCollected = 0;
    let totalOrders = 0;
    const paymentMethods = {};

    result.rows.forEach(row => {
      grossRevenue += parseFloat(row.gross_revenue) || 0;
      shippingRevenue += parseFloat(row.shipping_revenue) || 0;
      taxCollected += parseFloat(row.tax_collected) || 0;
      totalOrders += parseInt(row.total_orders) || 0;

      paymentMethods[row.payment_method] = {
        count: parseInt(row.payment_count),
        revenue: parseFloat(row.gross_revenue)
      };
    });

    // Calcular ingresos netos (asumiendo que el IVA está incluido en el total)
    const netRevenue = grossRevenue;

    res.json({
      success: true,
      data: {
        grossRevenue,
        shippingRevenue,
        taxCollected,
        netRevenue,
        totalOrders,
        paymentMethods
      },
      filters: { month, year }
    });

  } catch (error) {
    console.error('Error al generar reporte financiero:', error);
    res.status(500).json({
      error: 'Error al generar reporte financiero',
      details: error.message
    });
  }
};

// ============================================
// REPORTE DE PEDIDOS POR ESTADO
// ============================================
const getOrdersByStatusReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Se requieren fechas de inicio y fin' });
    }

    // Obtener conteo por estado
    const countQuery = `
      SELECT
        status,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY status
      ORDER BY count DESC
    `;

    const countResult = await pool.query(countQuery, [startDate, endDate]);

    // Calcular tiempo promedio de entrega
    const avgTimeQuery = `
      SELECT
        COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600), 0) as avg_delivery_hours
      FROM orders
      WHERE status = 'delivered'
        AND created_at BETWEEN $1 AND $2
    `;

    const avgTimeResult = await pool.query(avgTimeQuery, [startDate, endDate]);

    // Calcular totales
    const totalOrders = countResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const totalRevenue = countResult.rows.reduce((sum, row) => sum + (parseFloat(row.revenue) || 0), 0);

    // Calcular porcentajes
    const dataWithPercentages = countResult.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      revenue: parseFloat(row.revenue) || 0,
      percentage: totalOrders > 0 ? ((parseInt(row.count) / totalOrders) * 100).toFixed(2) : 0
    }));

    res.json({
      success: true,
      data: dataWithPercentages,
      totals: {
        totalOrders,
        totalRevenue,
        avgDeliveryHours: parseFloat(avgTimeResult.rows[0]?.avg_delivery_hours || 0).toFixed(2)
      },
      filters: { startDate, endDate }
    });

  } catch (error) {
    console.error('Error al generar reporte de pedidos por estado:', error);
    res.status(500).json({
      error: 'Error al generar reporte de pedidos por estado',
      details: error.message
    });
  }
};

// ============================================
// OBTENER CATEGORÍAS (para filtros)
// ============================================
const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM categories ORDER BY name ASC');
    res.json({ success: true, categories: result.rows });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

module.exports = {
  getSalesReport,
  getTopProductsReport,
  getCustomersReport,
  getFinancialReport,
  getOrdersByStatusReport,
  getCategories
};
