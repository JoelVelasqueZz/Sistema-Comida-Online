import * as XLSX from 'xlsx';

// ============================================
// UTILIDADES COMUNES
// ============================================
const formatCurrency = (value) => {
  return parseFloat(value).toFixed(2);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-ES');
};

// ============================================
// REPORTE DE VENTAS EXCEL
// ============================================
export const generateSalesReportExcel = (data, totals, filters) => {
  // Crear un nuevo libro de trabajo
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summaryData = [
    ['REPORTE DE VENTAS'],
    [''],
    ['Filtros Aplicados:'],
    ['Fecha Inicio:', filters.startDate],
    ['Fecha Fin:', filters.endDate],
    ['Agrupación:', filters.groupBy],
    [''],
    ['RESUMEN GENERAL'],
    ['Total de Pedidos', totals.totalOrders],
    ['Ingresos Totales', `$${formatCurrency(totals.totalRevenue)}`],
    ['Ticket Promedio', `$${formatCurrency(totals.averageOrderValue || 0)}`],
    ['Pedidos Entregados', totals.deliveredOrders],
    ['Pedidos Cancelados', totals.cancelledOrders]
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

  // Hoja 2: Detalle
  const detailData = data.map(row => ({
    'Período': row.period,
    'Total Pedidos': parseInt(row.total_orders),
    'Ingresos': parseFloat(row.total_revenue),
    'Ticket Promedio': parseFloat(row.average_order_value || 0),
    'Entregados': parseInt(row.delivered_orders),
    'Cancelados': parseInt(row.cancelled_orders)
  }));

  const ws2 = XLSX.utils.json_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Detalle por Período');

  // Aplicar formato a columnas de moneda
  const range = XLSX.utils.decode_range(ws2['!ref']);
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const ingresoCell = XLSX.utils.encode_cell({ r: R, c: 2 });
    const ticketCell = XLSX.utils.encode_cell({ r: R, c: 3 });
    if (ws2[ingresoCell]) ws2[ingresoCell].z = '"$"#,##0.00';
    if (ws2[ticketCell]) ws2[ticketCell].z = '"$"#,##0.00';
  }

  // Descargar
  const fileName = `reporte-ventas-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// ============================================
// REPORTE DE PRODUCTOS EXCEL
// ============================================
export const generateProductsReportExcel = (data, totals, filters) => {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summaryData = [
    ['REPORTE DE PRODUCTOS MÁS VENDIDOS'],
    [''],
    ['Filtros Aplicados:'],
    ['Fecha Inicio:', filters.startDate],
    ['Fecha Fin:', filters.endDate],
    ['Límite:', filters.limit],
    filters.categoryId ? ['Categoría ID:', filters.categoryId] : [],
    [''],
    ['RESUMEN GENERAL'],
    ['Total de Productos', totals.totalProducts],
    ['Unidades Vendidas', totals.totalQuantitySold],
    ['Ingresos Totales', `$${formatCurrency(totals.totalRevenue)}`]
  ].filter(row => row.length > 0);

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

  // Hoja 2: Detalle de Productos
  const detailData = data.map((row, index) => ({
    '#': index + 1,
    'Producto': row.name,
    'Categoría': row.category,
    'Precio Unitario': parseFloat(row.price),
    'Cantidad Vendida': parseInt(row.total_quantity),
    'Ingresos': parseFloat(row.total_revenue),
    '% de Ingresos': parseFloat(row.revenue_percentage),
    'Pedidos': parseInt(row.order_count)
  }));

  const ws2 = XLSX.utils.json_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Productos');

  // Aplicar formato
  const range = XLSX.utils.decode_range(ws2['!ref']);
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const precioCell = XLSX.utils.encode_cell({ r: R, c: 3 });
    const ingresoCell = XLSX.utils.encode_cell({ r: R, c: 5 });
    const pctCell = XLSX.utils.encode_cell({ r: R, c: 6 });
    if (ws2[precioCell]) ws2[precioCell].z = '"$"#,##0.00';
    if (ws2[ingresoCell]) ws2[ingresoCell].z = '"$"#,##0.00';
    if (ws2[pctCell]) ws2[pctCell].z = '0.00"%"';
  }

  // Descargar
  const fileName = `reporte-productos-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// ============================================
// REPORTE DE CLIENTES EXCEL
// ============================================
export const generateCustomersReportExcel = (data, totals, filters) => {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summaryData = [
    ['REPORTE DE CLIENTES'],
    [''],
    ['Filtros Aplicados:'],
    ['Fecha Inicio:', filters.startDate],
    ['Fecha Fin:', filters.endDate],
    ['Tipo:', filters.type],
    [''],
    ['RESUMEN GENERAL'],
    ['Total de Clientes', totals.totalCustomers],
    ['Pedidos Totales', totals.totalOrders],
    ['Ingresos Totales', `$${formatCurrency(totals.totalRevenue)}`]
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

  // Hoja 2: Detalle de Clientes
  const detailData = data.map(row => ({
    'Nombre': row.name,
    'Email': row.email,
    'Teléfono': row.phone || 'N/A',
    'Estado': row.is_active ? 'Activo' : 'Inactivo',
    'Total Pedidos': parseInt(row.total_orders || 0),
    'Total Gastado': parseFloat(row.total_spent || 0),
    'Pedido Promedio': parseFloat(row.average_order || 0),
    'Último Pedido': formatDate(row.last_order)
  }));

  const ws2 = XLSX.utils.json_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Clientes');

  // Aplicar formato
  const range = XLSX.utils.decode_range(ws2['!ref']);
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const gastadoCell = XLSX.utils.encode_cell({ r: R, c: 5 });
    const promedioCell = XLSX.utils.encode_cell({ r: R, c: 6 });
    if (ws2[gastadoCell]) ws2[gastadoCell].z = '"$"#,##0.00';
    if (ws2[promedioCell]) ws2[promedioCell].z = '"$"#,##0.00';
  }

  // Descargar
  const fileName = `reporte-clientes-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// ============================================
// REPORTE FINANCIERO EXCEL
// ============================================
export const generateFinancialReportExcel = (data, filters) => {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen Financiero
  const summaryData = [
    ['REPORTE FINANCIERO'],
    [''],
    ['Período:'],
    ['Mes:', filters.month],
    ['Año:', filters.year],
    [''],
    ['RESUMEN FINANCIERO'],
    ['Ingresos Brutos', parseFloat(data.grossRevenue)],
    ['Costos de Envío', parseFloat(data.shippingRevenue)],
    ['IVA Recaudado (est.)', parseFloat(data.taxCollected)],
    ['Ingresos Netos', parseFloat(data.netRevenue)],
    ['Total de Pedidos', data.totalOrders]
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);

  // Aplicar formato de moneda
  for (let i = 7; i <= 10; i++) {
    const cell = XLSX.utils.encode_cell({ r: i, c: 1 });
    if (ws1[cell] && typeof ws1[cell].v === 'number') {
      ws1[cell].z = '"$"#,##0.00';
    }
  }

  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen Financiero');

  // Hoja 2: Métodos de Pago
  if (data.paymentMethods && Object.keys(data.paymentMethods).length > 0) {
    const paymentData = Object.entries(data.paymentMethods).map(([method, info]) => ({
      'Método de Pago': method === 'cash' ? 'Efectivo' :
                        method === 'card' ? 'Tarjeta' :
                        method === 'transfer' ? 'Transferencia' : method,
      'Cantidad de Pedidos': info.count,
      'Ingresos': parseFloat(info.revenue),
      '% del Total': parseFloat(((info.revenue / data.grossRevenue) * 100).toFixed(2))
    }));

    const ws2 = XLSX.utils.json_to_sheet(paymentData);

    // Aplicar formato
    const range = XLSX.utils.decode_range(ws2['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const ingresoCell = XLSX.utils.encode_cell({ r: R, c: 2 });
      const pctCell = XLSX.utils.encode_cell({ r: R, c: 3 });
      if (ws2[ingresoCell]) ws2[ingresoCell].z = '"$"#,##0.00';
      if (ws2[pctCell]) ws2[pctCell].z = '0.00"%"';
    }

    XLSX.utils.book_append_sheet(wb, ws2, 'Métodos de Pago');
  }

  // Descargar
  const fileName = `reporte-financiero-${filters.year}-${String(filters.month).padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// ============================================
// REPORTE DE PEDIDOS POR ESTADO EXCEL
// ============================================
export const generateOrdersByStatusExcel = (data, totals, filters) => {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summaryData = [
    ['REPORTE DE PEDIDOS POR ESTADO'],
    [''],
    ['Filtros Aplicados:'],
    ['Fecha Inicio:', filters.startDate],
    ['Fecha Fin:', filters.endDate],
    [''],
    ['RESUMEN GENERAL'],
    ['Total de Pedidos', totals.totalOrders],
    ['Ingresos Totales', `$${formatCurrency(totals.totalRevenue)}`],
    ['Tiempo Promedio de Entrega', `${totals.avgDeliveryHours} hrs`]
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

  // Hoja 2: Detalle por Estado
  const statusLabels = {
    'pending': 'Pendiente',
    'confirmed': 'Confirmado',
    'preparing': 'En Preparación',
    'ready': 'Listo',
    'in_transit': 'En Camino',
    'delivered': 'Entregado',
    'cancelled': 'Cancelado'
  };

  const detailData = data.map(row => ({
    'Estado': statusLabels[row.status] || row.status,
    'Cantidad': parseInt(row.count),
    'Porcentaje': `${parseFloat(row.percentage)}%`,
    'Ingresos': parseFloat(row.revenue || 0)
  }));

  const ws2 = XLSX.utils.json_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Por Estado');

  // Aplicar formato
  const range = XLSX.utils.decode_range(ws2['!ref']);
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const ingresoCell = XLSX.utils.encode_cell({ r: R, c: 3 });
    if (ws2[ingresoCell]) ws2[ingresoCell].z = '"$"#,##0.00';
  }

  // Descargar
  const fileName = `reporte-pedidos-estado-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// ============================================
// EXPORTAR DATOS A CSV (genérico)
// ============================================
export const exportToCSV = (data, filename) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  XLSX.writeFile(wb, `${filename}.csv`, { bookType: 'csv' });
};
