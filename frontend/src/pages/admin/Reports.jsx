import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import {
  generateSalesReportPDF,
  generateProductsReportPDF,
  generateCustomersReportPDF,
  generateFinancialReportPDF,
  generateOrdersByStatusReportPDF
} from '../../utils/reportGenerator';
import {
  generateSalesReportExcel,
  generateProductsReportExcel,
  generateCustomersReportExcel,
  generateFinancialReportExcel,
  generateOrdersByStatusExcel,
  exportToCSV
} from '../../utils/excelGenerator';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './Reports.css';

const Reports = () => {
  // Estados
  const [selectedReport, setSelectedReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [categories, setCategories] = useState([]);

  // Filtros para cada tipo de reporte
  const [salesFilters, setSalesFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    groupBy: 'daily'
  });

  const [productsFilters, setProductsFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    limit: 10,
    categoryId: ''
  });

  const [customersFilters, setCustomersFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'all'
  });

  const [financialFilters, setFinancialFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [statusFilters, setStatusFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await reportService.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  // ========================================
  // GENERACIÓN RÁPIDA DE REPORTES
  // ========================================
  const generateQuickReport = async (type) => {
    const today = new Date().toISOString().split('T')[0];
    let startDate;

    switch (type) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        return;
    }

    setLoading(true);
    try {
      const response = await reportService.getSalesReport(startDate, today, 'daily');
      setReportData(response);
      setSelectedReport('sales');
      setSalesFilters({ startDate, endDate: today, groupBy: 'daily' });
    } catch (error) {
      console.error('Error al generar reporte rápido:', error);
      alert('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const generateTopProducts = async () => {
    const today = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setLoading(true);
    try {
      const response = await reportService.getTopProductsReport(startDate, today, 10);
      setReportData(response);
      setSelectedReport('products');
      setProductsFilters({ startDate, endDate: today, limit: 10, categoryId: '' });
    } catch (error) {
      console.error('Error al generar reporte de productos:', error);
      alert('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // GENERACIÓN PERSONALIZADA
  // ========================================
  const generateCustomReport = async () => {
    if (!selectedReport) {
      alert('Por favor selecciona un tipo de reporte');
      return;
    }

    setLoading(true);
    try {
      let response;
      switch (selectedReport) {
        case 'sales':
          response = await reportService.getSalesReport(
            salesFilters.startDate,
            salesFilters.endDate,
            salesFilters.groupBy
          );
          break;
        case 'products':
          response = await reportService.getTopProductsReport(
            productsFilters.startDate,
            productsFilters.endDate,
            productsFilters.limit,
            productsFilters.categoryId || null
          );
          break;
        case 'customers':
          response = await reportService.getCustomersReport(
            customersFilters.startDate,
            customersFilters.endDate,
            customersFilters.type
          );
          break;
        case 'financial':
          response = await reportService.getFinancialReport(
            financialFilters.month,
            financialFilters.year
          );
          break;
        case 'status':
          response = await reportService.getOrdersByStatusReport(
            statusFilters.startDate,
            statusFilters.endDate
          );
          break;
        default:
          alert('Tipo de reporte no válido');
          return;
      }
      setReportData(response);
    } catch (error) {
      console.error('Error al generar reporte:', error);
      alert(error.error || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // EXPORTACIÓN
  // ========================================
  const handleExportPDF = () => {
    if (!reportData) {
      alert('Primero genera un reporte');
      return;
    }

    try {
      switch (selectedReport) {
        case 'sales':
          generateSalesReportPDF(reportData.data, reportData.totals, reportData.filters);
          break;
        case 'products':
          generateProductsReportPDF(reportData.data, reportData.totals, reportData.filters);
          break;
        case 'customers':
          generateCustomersReportPDF(reportData.data, reportData.totals, reportData.filters);
          break;
        case 'financial':
          generateFinancialReportPDF(reportData.data, reportData.filters);
          break;
        case 'status':
          generateOrdersByStatusReportPDF(reportData.data, reportData.totals, reportData.filters);
          break;
        default:
          alert('Tipo de reporte no válido');
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF');
    }
  };

  const handleExportExcel = () => {
    if (!reportData) {
      alert('Primero genera un reporte');
      return;
    }

    try {
      switch (selectedReport) {
        case 'sales':
          generateSalesReportExcel(reportData.data, reportData.totals, reportData.filters);
          break;
        case 'products':
          generateProductsReportExcel(reportData.data, reportData.totals, reportData.filters);
          break;
        case 'customers':
          generateCustomersReportExcel(reportData.data, reportData.totals, reportData.filters);
          break;
        case 'financial':
          generateFinancialReportExcel(reportData.data, reportData.filters);
          break;
        case 'orders-by-status':
          generateOrdersByStatusExcel(reportData.data, reportData.totals, reportData.filters);
          break;
        default:
          alert('Exportación a Excel no disponible para este tipo de reporte');
      }
    } catch (error) {
      console.error('Error al generar Excel:', error);
      alert('Error al generar el archivo Excel');
    }
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.data) {
      alert('Primero genera un reporte');
      return;
    }

    try {
      const fileName = `reporte-${selectedReport}-${new Date().toISOString().split('T')[0]}`;
      exportToCSV(reportData.data, fileName);
    } catch (error) {
      console.error('Error al generar CSV:', error);
      alert('Error al generar el archivo CSV');
    }
  };

  // ========================================
  // RENDERIZADO DE FILTROS DINÁMICOS
  // ========================================
  const renderFilters = () => {
    switch (selectedReport) {
      case 'sales':
        return (
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Fecha Inicio</label>
              <input
                type="date"
                className="filter-input"
                value={salesFilters.startDate}
                onChange={(e) => setSalesFilters({ ...salesFilters, startDate: e.target.value })}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Fecha Fin</label>
              <input
                type="date"
                className="filter-input"
                value={salesFilters.endDate}
                onChange={(e) => setSalesFilters({ ...salesFilters, endDate: e.target.value })}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Agrupación</label>
              <select
                className="filter-select"
                value={salesFilters.groupBy}
                onChange={(e) => setSalesFilters({ ...salesFilters, groupBy: e.target.value })}
              >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Fecha Inicio</label>
              <input
                type="date"
                className="filter-input"
                value={productsFilters.startDate}
                onChange={(e) => setProductsFilters({ ...productsFilters, startDate: e.target.value })}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Fecha Fin</label>
              <input
                type="date"
                className="filter-input"
                value={productsFilters.endDate}
                onChange={(e) => setProductsFilters({ ...productsFilters, endDate: e.target.value })}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Límite</label>
              <select
                className="filter-select"
                value={productsFilters.limit}
                onChange={(e) => setProductsFilters({ ...productsFilters, limit: e.target.value })}
              >
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
                <option value="50">Top 50</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Categoría (Opcional)</label>
              <select
                className="filter-select"
                value={productsFilters.categoryId}
                onChange={(e) => setProductsFilters({ ...productsFilters, categoryId: e.target.value })}
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'customers':
        return (
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Fecha Inicio</label>
              <input
                type="date"
                className="filter-input"
                value={customersFilters.startDate}
                onChange={(e) => setCustomersFilters({ ...customersFilters, startDate: e.target.value })}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Fecha Fin</label>
              <input
                type="date"
                className="filter-input"
                value={customersFilters.endDate}
                onChange={(e) => setCustomersFilters({ ...customersFilters, endDate: e.target.value })}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Tipo de Cliente</label>
              <select
                className="filter-select"
                value={customersFilters.type}
                onChange={(e) => setCustomersFilters({ ...customersFilters, type: e.target.value })}
              >
                <option value="all">Todos</option>
                <option value="frequent">Frecuentes (3+ pedidos)</option>
                <option value="new">Nuevos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Mes</label>
              <select
                className="filter-select"
                value={financialFilters.month}
                onChange={(e) => setFinancialFilters({ ...financialFilters, month: e.target.value })}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i, 1).toLocaleDateString('es-ES', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Año</label>
              <select
                className="filter-select"
                value={financialFilters.year}
                onChange={(e) => setFinancialFilters({ ...financialFilters, year: e.target.value })}
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>
        );

      case 'status':
        return (
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Fecha Inicio</label>
              <input
                type="date"
                className="filter-input"
                value={statusFilters.startDate}
                onChange={(e) => setStatusFilters({ ...statusFilters, startDate: e.target.value })}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Fecha Fin</label>
              <input
                type="date"
                className="filter-input"
                value={statusFilters.endDate}
                onChange={(e) => setStatusFilters({ ...statusFilters, endDate: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return <p className="text-muted">Selecciona un tipo de reporte</p>;
    }
  };

  // ========================================
  // RENDERIZADO DE VISTA PREVIA
  // ========================================
  const renderPreview = () => {
    if (!reportData) {
      return (
        <div className="empty-state">
          <p>Genera un reporte para ver los resultados aquí</p>
        </div>
      );
    }

    switch (selectedReport) {
      case 'sales':
        return renderSalesPreview();
      case 'products':
        return renderProductsPreview();
      case 'customers':
        return renderCustomersPreview();
      case 'financial':
        return renderFinancialPreview();
      case 'status':
        return renderStatusPreview();
      default:
        return null;
    }
  };

  const renderSalesPreview = () => (
    <div className="preview-content">
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total Pedidos</span>
          <span className="summary-value">{reportData.totals.totalOrders}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Ingresos Totales</span>
          <span className="summary-value">${parseFloat(reportData.totals.totalRevenue || 0).toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Ticket Promedio</span>
          <span className="summary-value">${parseFloat(reportData.totals.averageOrderValue || 0).toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Entregados</span>
          <span className="summary-value">{reportData.totals.deliveredOrders}</span>
        </div>
      </div>

      <div className="chart-container">
        <h3>Ingresos por Período</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={reportData.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total_revenue" stroke="#667eea" name="Ingresos" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Pedidos</th>
              <th>Ingresos</th>
              <th>Ticket Prom.</th>
              <th>Entregados</th>
              <th>Cancelados</th>
            </tr>
          </thead>
          <tbody>
            {reportData.data.map((row, index) => (
              <tr key={index}>
                <td>{row.period}</td>
                <td>{row.total_orders}</td>
                <td>${parseFloat(row.total_revenue).toFixed(2)}</td>
                <td>${parseFloat(row.average_order_value || 0).toFixed(2)}</td>
                <td>{row.delivered_orders}</td>
                <td>{row.cancelled_orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProductsPreview = () => (
    <div className="preview-content">
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Productos</span>
          <span className="summary-value">{reportData.totals.totalProducts}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Unidades Vendidas</span>
          <span className="summary-value">{reportData.totals.totalQuantitySold}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Ingresos</span>
          <span className="summary-value">${parseFloat(reportData.totals.totalRevenue || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="chart-container">
        <h3>Productos Más Vendidos</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reportData.data.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_quantity" fill="#667eea" name="Cantidad Vendida" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Cantidad</th>
              <th>Ingresos</th>
              <th>% Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {reportData.data.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{row.name}</td>
                <td>{row.category}</td>
                <td>{row.total_quantity}</td>
                <td>${parseFloat(row.total_revenue).toFixed(2)}</td>
                <td>{row.revenue_percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCustomersPreview = () => (
    <div className="preview-content">
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total Clientes</span>
          <span className="summary-value">{reportData.totals.totalCustomers}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Pedidos Totales</span>
          <span className="summary-value">{reportData.totals.totalOrders}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Ingresos Totales</span>
          <span className="summary-value">${parseFloat(reportData.totals.totalRevenue || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th>Pedidos</th>
              <th>Total Gastado</th>
              <th>Promedio</th>
              <th>Último Pedido</th>
            </tr>
          </thead>
          <tbody>
            {reportData.data.map((row, index) => (
              <tr key={index}>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td>{row.total_orders || 0}</td>
                <td>${parseFloat(row.total_spent || 0).toFixed(2)}</td>
                <td>${parseFloat(row.average_order || 0).toFixed(2)}</td>
                <td>{row.last_order ? new Date(row.last_order).toLocaleDateString('es-ES') : 'Nunca'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFinancialPreview = () => {
    const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];
    const paymentData = Object.entries(reportData.data.paymentMethods || {}).map(([method, info]) => ({
      name: method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : 'Transferencia',
      value: info.revenue
    }));

    return (
      <div className="preview-content">
        <div className="summary-cards">
          <div className="summary-card">
            <span className="summary-label">Ingresos Brutos</span>
            <span className="summary-value">${parseFloat(reportData.data.grossRevenue || 0).toFixed(2)}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Ingresos Netos</span>
            <span className="summary-value">${parseFloat(reportData.data.netRevenue || 0).toFixed(2)}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Total Pedidos</span>
            <span className="summary-value">{reportData.data.totalOrders}</span>
          </div>
        </div>

        {paymentData.length > 0 && (
          <div className="chart-container">
            <h3>Ingresos por Método de Pago</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: $${parseFloat(entry.value || 0).toFixed(2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="financial-details">
          <h3>Detalle Financiero</h3>
          <div className="detail-row">
            <span>Costos de Envío Recaudados:</span>
            <span>${parseFloat(reportData.data.shippingRevenue || 0).toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <span>IVA Recaudado (estimado):</span>
            <span>${parseFloat(reportData.data.taxCollected || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderStatusPreview = () => {
    const COLORS = ['#fbbf24', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#6b7280'];
    const pieData = reportData.data.map(row => ({
      name: row.status === 'pending' ? 'Pendiente' :
            row.status === 'confirmed' ? 'Confirmado' :
            row.status === 'preparing' ? 'Preparando' :
            row.status === 'delivering' ? 'En Camino' :
            row.status === 'delivered' ? 'Entregado' : 'Cancelado',
      value: parseInt(row.count)
    }));

    return (
      <div className="preview-content">
        <div className="summary-cards">
          <div className="summary-card">
            <span className="summary-label">Total Pedidos</span>
            <span className="summary-value">{reportData.totals.totalOrders}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Ingresos</span>
            <span className="summary-value">${parseFloat(reportData.totals.totalRevenue || 0).toFixed(2)}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Tiempo Promedio</span>
            <span className="summary-value">{reportData.totals.avgDeliveryHours} hrs</span>
          </div>
        </div>

        <div className="chart-container">
          <h3>Distribución por Estado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Cantidad</th>
                <th>Ingresos</th>
                <th>% del Total</th>
              </tr>
            </thead>
            <tbody>
              {reportData.data.map((row, index) => (
                <tr key={index}>
                  <td>{pieData[index].name}</td>
                  <td>{row.count}</td>
                  <td>${parseFloat(row.revenue).toFixed(2)}</td>
                  <td>{row.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ========================================
  // RENDERIZADO PRINCIPAL
  // ========================================
  return (
    <div className="reports-page">
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <h1 className="section-title">Reportes y Analíticas</h1>
          <Link to="/admin/dashboard" className="btn btn-secondary">
            ← Volver al Dashboard
          </Link>
        </div>

        {/* Botones de generación rápida */}
        <div className="quick-reports">
          <h2 className="section-subtitle">Generación Rápida</h2>
          <div className="quick-reports-grid">
            <button
              className="quick-report-card"
              onClick={() => generateQuickReport('today')}
              disabled={loading}
            >
              <span className="quick-icon">📅</span>
              <span className="quick-label">Ventas de Hoy</span>
            </button>
            <button
              className="quick-report-card"
              onClick={() => generateQuickReport('week')}
              disabled={loading}
            >
              <span className="quick-icon">📊</span>
              <span className="quick-label">Ventas de la Semana</span>
            </button>
            <button
              className="quick-report-card"
              onClick={() => generateQuickReport('month')}
              disabled={loading}
            >
              <span className="quick-icon">📈</span>
              <span className="quick-label">Ventas del Mes</span>
            </button>
            <button
              className="quick-report-card"
              onClick={generateTopProducts}
              disabled={loading}
            >
              <span className="quick-icon">🏆</span>
              <span className="quick-label">Top 10 Productos</span>
            </button>
          </div>
        </div>

        {/* Formulario de reportes personalizados */}
        <div className="custom-reports">
          <h2 className="section-subtitle">Reportes Personalizados</h2>
          <div className="custom-reports-form">
            <div className="form-section">
              <label className="form-label">Tipo de Reporte</label>
              <select
                className="form-select"
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="sales">Reporte de Ventas</option>
                <option value="products">Productos Más Vendidos</option>
                <option value="customers">Reporte de Clientes</option>
                <option value="financial">Reporte Financiero</option>
                <option value="status">Pedidos por Estado</option>
              </select>
            </div>

            {/* Filtros dinámicos */}
            <div className="form-section">
              <label className="form-label">Filtros</label>
              <div className="filters-container">
                {renderFilters()}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={generateCustomReport}
                disabled={loading || !selectedReport}
              >
                {loading ? 'Generando...' : 'Generar Vista Previa'}
              </button>

              {reportData && (
                <>
                  <button className="btn btn-export" onClick={handleExportPDF}>
                    📄 PDF
                  </button>
                  <button className="btn btn-export" onClick={handleExportExcel}>
                    📊 Excel
                  </button>
                  <button className="btn btn-export" onClick={handleExportCSV}>
                    📋 CSV
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Vista previa del reporte */}
        <div className="report-preview">
          <h2 className="section-subtitle">Vista Previa</h2>
          <div className="preview-card">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Generando reporte...</p>
              </div>
            ) : (
              renderPreview()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
