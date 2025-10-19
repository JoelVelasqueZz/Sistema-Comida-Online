import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { menuService } from '../../services/menuService';
import './MenuManagement.css';

function MenuManagement() {
  // Estados generales
  const [activeTab, setActiveTab] = useState('products'); // 'categories' | 'products'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de categorías
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: true
  });

  // Estados de productos
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    preparation_time: 15,
    calories: '',
    is_available: true
  });
  const [productFilters, setProductFilters] = useState({
    category_id: '',
    search: ''
  });

  // Estados de extras
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [selectedProductForExtras, setSelectedProductForExtras] = useState(null);
  const [extras, setExtras] = useState([]);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [editingExtra, setEditingExtra] = useState(null);
  const [extraForm, setExtraForm] = useState({
    name: '',
    price: '',
    is_available: true
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  // Recargar productos cuando cambian los filtros
  useEffect(() => {
    loadProducts();
  }, [productFilters]);

  // ============================================
  // FUNCIONES DE CATEGORÍAS
  // ============================================
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await menuService.getAllCategoriesAdmin();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      setError('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setCategoryForm({
      name: '',
      description: '',
      image_url: '',
      display_order: 0,
      is_active: true
    });
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      display_order: category.display_order || 0,
      is_active: category.is_active
    });
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      if (editingCategory) {
        await menuService.updateCategory(editingCategory.id, categoryForm);
        setSuccess('Categoría actualizada exitosamente');
      } else {
        await menuService.createCategory(categoryForm);
        setSuccess('Categoría creada exitosamente');
      }

      setShowCategoryModal(false);
      loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      return;
    }

    try {
      setLoading(true);
      await menuService.deleteCategory(id);
      setSuccess('Categoría eliminada exitosamente');
      loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar categoría');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNCIONES DE PRODUCTOS
  // ============================================
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await menuService.getAllProductsAdmin(productFilters);
      setProducts(data.products || []);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category_id: '',
      image_url: '',
      preparation_time: 15,
      calories: '',
      is_available: true
    });
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category_id: product.category_id,
      image_url: product.image_url || '',
      preparation_time: product.preparation_time || 15,
      calories: product.calories || '',
      is_available: product.is_available
    });
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      if (editingProduct) {
        await menuService.updateProduct(editingProduct.id, productForm);
        setSuccess('Producto actualizado exitosamente');
      } else {
        await menuService.createProduct(productForm);
        setSuccess('Producto creado exitosamente');
      }

      setShowProductModal(false);
      loadProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar producto');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto? Esto también eliminará sus extras.')) {
      return;
    }

    try {
      setLoading(true);
      await menuService.deleteProduct(id);
      setSuccess('Producto eliminado exitosamente');
      loadProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar producto');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await menuService.toggleProductAvailability(id);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar disponibilidad');
    }
  };

  // ============================================
  // FUNCIONES DE EXTRAS
  // ============================================
  const handleManageExtras = async (product) => {
    setSelectedProductForExtras(product);
    setShowExtrasModal(true);
    try {
      const data = await menuService.getProductExtras(product.id);
      setExtras(data.extras || []);
    } catch (err) {
      setError('Error al cargar extras');
    }
  };

  const handleCreateExtra = () => {
    setExtraForm({
      name: '',
      price: '',
      is_available: true
    });
    setEditingExtra(null);
    setShowExtraForm(true);
  };

  const handleEditExtra = (extra) => {
    setExtraForm({
      name: extra.name,
      price: extra.price,
      is_available: extra.is_available
    });
    setEditingExtra(extra);
    setShowExtraForm(true);
  };

  const handleSaveExtra = async (e) => {
    e.preventDefault();
    try {
      setError('');

      if (editingExtra) {
        await menuService.updateExtra(editingExtra.id, extraForm);
        setSuccess('Extra actualizado exitosamente');
      } else {
        await menuService.createExtra(selectedProductForExtras.id, extraForm);
        setSuccess('Extra creado exitosamente');
      }

      setShowExtraForm(false);
      const data = await menuService.getProductExtras(selectedProductForExtras.id);
      setExtras(data.extras || []);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar extra');
    }
  };

  const handleDeleteExtra = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este extra?')) {
      return;
    }

    try {
      await menuService.deleteExtra(id);
      setSuccess('Extra eliminado exitosamente');
      const data = await menuService.getProductExtras(selectedProductForExtras.id);
      setExtras(data.extras || []);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar extra');
    }
  };

  return (
    <div className="menu-management">
      <div className="container container-7xl">
        {/* Header */}
        <div className="admin-header animate-fade-in-up">
          <div>
            <h1 className="heading-1">🍽️ Gestión de Menú</h1>
            <p className="text-lg text-muted">
              Administra categorías, productos y extras del menú
            </p>
          </div>
          <Link to="/admin/dashboard" className="btn btn-secondary">
            ← Volver al Dashboard
          </Link>
        </div>

        {/* Success/Error Alerts */}
        {success && (
          <div className="alert alert-success animate-fade-in">
            <span>✅</span>
            <p>{success}</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error animate-shake">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs animate-fade-in-up animate-delay-1">
          <button
            onClick={() => setActiveTab('categories')}
            className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
          >
            📁 Categorías
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          >
            🍕 Productos
          </button>
        </div>

        {/* Categories Section */}
        {activeTab === 'categories' && (
          <div className="section animate-fade-in-up animate-delay-2">
            <div className="section-header">
              <h2 className="section-title">Categorías</h2>
              <button onClick={handleCreateCategory} className="btn btn-primary">
                ➕ Nueva Categoría
              </button>
            </div>

            <div className="table-container card card-elevated">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Orden</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(category => (
                    <tr key={category.id}>
                      <td>{category.id.substring(0, 8)}</td>
                      <td><strong>{category.name}</strong></td>
                      <td>{category.description || 'N/A'}</td>
                      <td>{category.display_order}</td>
                      <td>
                        <span className={`badge ${category.is_active ? 'badge-success' : 'badge-error'}`}>
                          {category.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="btn-icon btn-icon-sm"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="btn-icon btn-icon-sm"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products Section */}
        {activeTab === 'products' && (
          <div className="section animate-fade-in-up animate-delay-2">
            <div className="section-header">
              <h2 className="section-title">Productos</h2>
              <button onClick={handleCreateProduct} className="btn btn-primary">
                ➕ Nuevo Producto
              </button>
            </div>

            {/* Filters */}
            <div className="filters-card card">
              <div className="filters-grid">
                <div className="filter-group">
                  <label className="filter-label">Categoría</label>
                  <select
                    value={productFilters.category_id}
                    onChange={(e) => setProductFilters({ ...productFilters, category_id: e.target.value })}
                    className="filter-select"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.filter(c => c.is_active).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Buscar</label>
                  <input
                    type="text"
                    value={productFilters.search}
                    onChange={(e) => setProductFilters({ ...productFilters, search: e.target.value })}
                    placeholder="Nombre del producto..."
                    className="filter-input"
                  />
                </div>
              </div>
            </div>

            <div className="table-container card card-elevated">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Tiempo Prep.</th>
                    <th>Disponible</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="product-thumbnail" />
                        ) : (
                          <div className="product-thumbnail-placeholder">📷</div>
                        )}
                      </td>
                      <td><strong>{product.name}</strong></td>
                      <td>{product.category_name || 'Sin categoría'}</td>
                      <td>${parseFloat(product.price).toFixed(2)}</td>
                      <td>{product.preparation_time} min</td>
                      <td>
                        <button
                          onClick={() => handleToggleAvailability(product.id)}
                          className={`badge ${product.is_available ? 'badge-success' : 'badge-error'} badge-clickable`}
                        >
                          {product.is_available ? '✅ Sí' : '❌ No'}
                        </button>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="btn-icon btn-icon-sm"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleManageExtras(product)}
                            className="btn-icon btn-icon-sm"
                            title="Gestionar Extras"
                          >
                            ➕
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="btn-icon btn-icon-sm"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>
                <button className="modal-close" onClick={() => setShowCategoryModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveCategory}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="form-textarea"
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">URL de Imagen</label>
                    <input
                      type="text"
                      value={categoryForm.image_url}
                      onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })}
                      className="form-input"
                      placeholder="/assets/category.png o https://..."
                    />
                    {categoryForm.image_url && (
                      <div className="image-preview">
                        <img
                          src={categoryForm.image_url}
                          alt="Vista previa"
                          onError={(e) => { e.target.style.display = 'none'; }}
                          onLoad={(e) => { e.target.style.display = 'block'; }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Orden de Visualización</label>
                      <input
                        type="number"
                        value={categoryForm.display_order}
                        onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) || 0 })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Estado</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={categoryForm.is_active}
                          onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">{categoryForm.is_active ? 'Activa' : 'Inactiva'}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Product Modal */}
        {showProductModal && (
          <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button className="modal-close" onClick={() => setShowProductModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveProduct}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="form-textarea"
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Categoría *</label>
                      <select
                        value={productForm.category_id}
                        onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                        className="form-select"
                        required
                      >
                        <option value="">Seleccionar categoría</option>
                        {categories.filter(c => c.is_active).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Precio ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">URL de Imagen</label>
                    <input
                      type="text"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      className="form-input"
                      placeholder="/assets/burger.png o https://..."
                    />
                    {productForm.image_url && (
                      <div className="image-preview">
                        <img
                          src={productForm.image_url}
                          alt="Vista previa"
                          onError={(e) => { e.target.style.display = 'none'; }}
                          onLoad={(e) => { e.target.style.display = 'block'; }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Tiempo de Preparación (min)</label>
                      <input
                        type="number"
                        value={productForm.preparation_time}
                        onChange={(e) => setProductForm({ ...productForm, preparation_time: parseInt(e.target.value) || 15 })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Calorías (opcional)</label>
                      <input
                        type="number"
                        value={productForm.calories}
                        onChange={(e) => setProductForm({ ...productForm, calories: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Disponible</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={productForm.is_available}
                          onChange={(e) => setProductForm({ ...productForm, is_available: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">{productForm.is_available ? 'Sí' : 'No'}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Extras Modal */}
        {showExtrasModal && selectedProductForExtras && (
          <div className="modal-overlay" onClick={() => setShowExtrasModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Extras de {selectedProductForExtras.name}</h2>
                <button className="modal-close" onClick={() => setShowExtrasModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                <button onClick={handleCreateExtra} className="btn btn-primary btn-sm mb-3">
                  ➕ Agregar Extra
                </button>

                {showExtraForm && (
                  <form onSubmit={handleSaveExtra} className="extra-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Nombre *</label>
                        <input
                          type="text"
                          value={extraForm.name}
                          onChange={(e) => setExtraForm({ ...extraForm, name: e.target.value })}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Precio ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={extraForm.price}
                          onChange={(e) => setExtraForm({ ...extraForm, price: e.target.value })}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Disponible</label>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={extraForm.is_available}
                            onChange={(e) => setExtraForm({ ...extraForm, is_available: e.target.checked })}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="button" onClick={() => setShowExtraForm(false)} className="btn btn-secondary btn-sm">
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm">
                        Guardar
                      </button>
                    </div>
                  </form>
                )}

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Precio</th>
                      <th>Disponible</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extras.map(extra => (
                      <tr key={extra.id}>
                        <td><strong>{extra.name}</strong></td>
                        <td>${parseFloat(extra.price).toFixed(2)}</td>
                        <td>
                          <span className={`badge ${extra.is_available ? 'badge-success' : 'badge-error'}`}>
                            {extra.is_available ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEditExtra(extra)}
                              className="btn-icon btn-icon-sm"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteExtra(extra.id)}
                              className="btn-icon btn-icon-sm"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {extras.length === 0 && !showExtraForm && (
                  <p className="text-muted text-center py-4">No hay extras configurados</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MenuManagement;
