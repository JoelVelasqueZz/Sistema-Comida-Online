import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================
// UTILIDADES COMUNES
// ============================================
const addReportHeader = (doc, title, filters) => {
  // Título
  doc.setFontSize(20);
  doc.setTextColor(102, 126, 234); // Color primario
  doc.text(title, 14, 22);

  // Logo o nombre de la empresa (opcional)
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Food Delivery System', 14, 30);

  // Fecha de generación
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  const today = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generado: ${today}`, 14, 36);

  // Filtros aplicados
  if (filters && Object.keys(filters).length > 0) {
    let yPos = 42;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Filtros aplicados:', 14, yPos);
    yPos += 5;

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const label = key === 'startDate' ? 'Desde' :
                     key === 'endDate' ? 'Hasta' :
                     key === 'groupBy' ? 'Agrupación' :
                     key === 'limit' ? 'Límite' :
                     key === 'type' ? 'Tipo' :
                     key === 'month' ? 'Mes' :
                     key === 'year' ? 'Año' : key;
        doc.text(`${label}: ${value}`, 14, yPos);
        yPos += 4;
      }
    });
    return yPos + 5;
  }

  return 42;
};

const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
};

// ============================================
// REPORTE DE VENTAS PDF
// ============================================
export const generateSalesReportPDF = (data, totals, filters) => {
  const doc = new jsPDF();

  // Header
  const startY = addReportHeader(doc, 'Reporte de Ventas', filters);

  // Resumen
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text('Resumen General', 14, startY + 5);

  const summaryData = [
    ['Total de Pedidos', totals.totalOrders.toString()],
    ['Ingresos Totales', `$${parseFloat(totals.totalRevenue || 0).toFixed(2)}`],
    ['Ticket Promedio', `$${parseFloat(totals.averageOrderValue || 0).toFixed(2)}`],
    ['Pedidos Entregados', totals.deliveredOrders.toString()],
    ['Pedidos Cancelados', totals.cancelledOrders.toString()]
  ];

  autoTable(doc, {
    startY: startY + 10,
    head: [['Métrica', 'Valor']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [102, 126, 234], fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  // Tabla de datos por período
  doc.setFontSize(12);
  doc.text('Detalle por Período', 14, doc.lastAutoTable.finalY + 15);

  const tableData = data.map(row => [
    row.period,
    row.total_orders,
    `$${parseFloat(row.total_revenue || 0).toFixed(2)}`,
    `$${parseFloat(row.average_order_value || 0).toFixed(2)}`,
    row.delivered_orders,
    row.cancelled_orders
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Período', 'Pedidos', 'Ingresos', 'Ticket Prom.', 'Entregados', 'Cancelados']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [102, 126, 234], fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  // Footer
  addFooter(doc);

  // Descargar
  const fileName = `reporte-ventas-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// ============================================
// REPORTE DE PRODUCTOS PDF
// ============================================
export const generateProductsReportPDF = (data, totals, filters) => {
  const doc = new jsPDF();

  // Header
  const startY = addReportHeader(doc, 'Reporte de Productos Más Vendidos', filters);

  // Resumen
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text('Resumen General', 14, startY + 5);

  const summaryData = [
    ['Total de Productos', totals.totalProducts.toString()],
    ['Unidades Vendidas', totals.totalQuantitySold.toString()],
    ['Ingresos Totales', `$${parseFloat(totals.totalRevenue || 0).toFixed(2)}`]
  ];

  autoTable(doc, {
    startY: startY + 10,
    head: [['Métrica', 'Valor']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [102, 126, 234], fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  // Tabla de productos
  doc.setFontSize(12);
  doc.text('Detalle de Productos', 14, doc.lastAutoTable.finalY + 15);

  const tableData = data.map((row, index) => [
    (index + 1).toString(),
    row.name,
    row.category,
    row.total_quantity,
    `$${parseFloat(row.total_revenue || 0).toFixed(2)}`,
    `${row.revenue_percentage}%`
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [['#', 'Producto', 'Categoría', 'Cantidad', 'Ingresos', '%']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [102, 126, 234], fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10 },
      4: { halign: 'right' },
      5: { halign: 'right' }
    }
  });

  // Footer
  addFooter(doc);

  // Descargar
  const fileName = `reporte-productos-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// ============================================
// REPORTE DE CLIENTES PDF
// ============================================
export const generateCustomersReportPDF = (data, totals, filters) => {
  const doc = new jsPDF();

  // Header
  const startY = addReportHeader(doc, 'Reporte de Clientes', filters);

  // Resumen
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text('Resumen General', 14, startY + 5);

  const summaryData = [
    ['Total de Clientes', totals.totalCustomers.toString()],
    ['Pedidos Totales', totals.totalOrders.toString()],
    ['Ingresos Totales', `$${parseFloat(totals.totalRevenue || 0).toFixed(2)}`]
  ];

  autoTable(doc, {
    startY: startY + 10,
    head: [['Métrica', 'Valor']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [102, 126, 234], fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  // Tabla de clientes
  doc.setFontSize(12);
  doc.text('Detalle de Clientes', 14, doc.lastAutoTable.finalY + 15);

  const tableData = data.map(row => [
    row.name,
    row.email,
    row.total_orders || 0,
    `$${parseFloat(row.total_spent || 0).toFixed(2)}`,
    `$${parseFloat(row.average_order || 0).toFixed(2)}`,
    row.last_order ? new Date(row.last_order).toLocaleDateString('es-ES') : 'Nunca'
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Cliente', 'Email', 'Pedidos', 'Total Gastado', 'Promedio', 'Último Pedido']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [102, 126, 234], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' }
    }
  });

  // Footer
  addFooter(doc);

  // Descargar
  const fileName = `reporte-clientes-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// ============================================
// REPORTE FINANCIERO PDF
// ============================================
export const generateFinancialReportPDF = (data, filters) => {
  const doc = new jsPDF();

  // Header
  const startY = addReportHeader(doc, 'Reporte Financiero', filters);

  // Resumen Financiero
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text('Resumen Financiero', 14, startY + 5);

  const summaryData = [
    ['Ingresos Brutos', `$${parseFloat(data.grossRevenue || 0).toFixed(2)}`],
    ['Costos de Envío Recaudados', `$${parseFloat(data.shippingRevenue || 0).toFixed(2)}`],
    ['IVA Recaudado (estimado)', `$${parseFloat(data.taxCollected || 0).toFixed(2)}`],
    ['Ingresos Netos', `$${parseFloat(data.netRevenue || 0).toFixed(2)}`],
    ['Total de Pedidos', data.totalOrders.toString()]
  ];

  autoTable(doc, {
    startY: startY + 10,
    head: [['Concepto', 'Monto']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [102, 126, 234], fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // Desglose por método de pago
  if (data.paymentMethods && Object.keys(data.paymentMethods).length > 0) {
    doc.setFontSize(12);
    doc.text('Desglose por Método de Pago', 14, doc.lastAutoTable.finalY + 15);

    const paymentData = Object.entries(data.paymentMethods).map(([method, info]) => [
      method === 'cash' ? 'Efectivo' :
      method === 'card' ? 'Tarjeta' :
      method === 'transfer' ? 'Transferencia' : method,
      info.count.toString(),
      `$${parseFloat(info.revenue || 0).toFixed(2)}`,
      `${((parseFloat(info.revenue || 0) / parseFloat(data.grossRevenue || 1)) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Método de Pago', 'Cantidad', 'Ingresos', '% del Total']],
      body: paymentData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });
  }

  // Footer
  addFooter(doc);

  // Descargar
  const fileName = `reporte-financiero-${filters.year}-${filters.month}.pdf`;
  doc.save(fileName);
};

// ============================================
// REPORTE DE PEDIDOS POR ESTADO PDF
// ============================================
export const generateOrdersByStatusReportPDF = (data, totals, filters) => {
  const doc = new jsPDF();

  // Header
  const startY = addReportHeader(doc, 'Reporte de Pedidos por Estado', filters);

  // Resumen
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text('Resumen General', 14, startY + 5);

  const summaryData = [
    ['Total de Pedidos', totals.totalOrders.toString()],
    ['Ingresos Totales', `$${parseFloat(totals.totalRevenue || 0).toFixed(2)}`],
    ['Tiempo Promedio de Entrega', `${totals.avgDeliveryHours} horas`]
  ];

  autoTable(doc, {
    startY: startY + 10,
    head: [['Métrica', 'Valor']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [102, 126, 234], fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  // Tabla de estados
  doc.setFontSize(12);
  doc.text('Detalle por Estado', 14, doc.lastAutoTable.finalY + 15);

  const statusLabels = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    delivering: 'En Camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  };

  const tableData = data.map(row => [
    statusLabels[row.status] || row.status,
    row.count.toString(),
    `$${parseFloat(row.revenue || 0).toFixed(2)}`,
    `${row.percentage}%`
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Estado', 'Cantidad', 'Ingresos', '% del Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [102, 126, 234], fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  // Footer
  addFooter(doc);

  // Descargar
  const fileName = `reporte-estados-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
