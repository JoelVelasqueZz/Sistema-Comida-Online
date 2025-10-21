import api from './api';

// ============================================
// REPORTE DE VENTAS
// ============================================
export const getSalesReport = async (startDate, endDate, groupBy = 'daily') => {
  try {
    const response = await api.get('/reports/sales', {
      params: { startDate, endDate, groupBy }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener reporte de ventas:', error);
    throw error.response?.data || error;
  }
};

// ============================================
// REPORTE DE PRODUCTOS MÁS VENDIDOS
// ============================================
export const getTopProductsReport = async (startDate, endDate, limit = 10, categoryId = null) => {
  try {
    const params = { startDate, endDate, limit };
    if (categoryId) params.categoryId = categoryId;

    const response = await api.get('/reports/top-products', {
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener reporte de productos:', error);
    throw error.response?.data || error;
  }
};

// ============================================
// REPORTE DE CLIENTES
// ============================================
export const getCustomersReport = async (startDate, endDate, type = 'all') => {
  try {
    const response = await api.get('/reports/customers', {
      params: { startDate, endDate, type }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener reporte de clientes:', error);
    throw error.response?.data || error;
  }
};

// ============================================
// REPORTE FINANCIERO
// ============================================
export const getFinancialReport = async (month, year) => {
  try {
    const response = await api.get('/reports/financial', {
      params: { month, year }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener reporte financiero:', error);
    throw error.response?.data || error;
  }
};

// ============================================
// REPORTE DE PEDIDOS POR ESTADO
// ============================================
export const getOrdersByStatusReport = async (startDate, endDate) => {
  try {
    const response = await api.get('/reports/orders-by-status', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener reporte de pedidos por estado:', error);
    throw error.response?.data || error;
  }
};

// ============================================
// OBTENER CATEGORÍAS (para filtros)
// ============================================
export const getCategories = async () => {
  try {
    const response = await api.get('/reports/categories');
    return response.data;
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    throw error.response?.data || error;
  }
};

export const reportService = {
  getSalesReport,
  getTopProductsReport,
  getCustomersReport,
  getFinancialReport,
  getOrdersByStatusReport,
  getCategories
};
