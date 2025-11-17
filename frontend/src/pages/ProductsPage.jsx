import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, ChevronDown, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store';
import { productsAPI } from '../api';

const AddProductModal = ({ isOpen, onClose, onAdd, editingProduct }) => {
  const [formData, setFormData] = useState({
    product_name: '',
    sku: '',
    category: '',
    unit: '',
    buying_price: '',
    selling_price: '',
    min_stock_level: '10',
    current_stock: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        product_name: editingProduct.product_name,
        sku: editingProduct.sku,
        category: editingProduct.category || '',
        unit: editingProduct.unit || '',
        buying_price: editingProduct.buying_price.toString(),
        selling_price: editingProduct.selling_price.toString(),
        min_stock_level: editingProduct.min_stock_level?.toString() || '10',
        current_stock: editingProduct.current_stock?.toString() || '0',
      });
    } else {
      setFormData({
        product_name: '',
        sku: '',
        category: '',
        unit: '',
        buying_price: '',
        selling_price: '',
        min_stock_level: '10',
        current_stock: '',
      });
    }
  }, [editingProduct, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.product_name || !formData.sku || !formData.buying_price || !formData.selling_price) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        buying_price: parseFloat(formData.buying_price),
        selling_price: parseFloat(formData.selling_price),
        min_stock_level: parseInt(formData.min_stock_level) || 10,
        current_stock: parseInt(formData.current_stock) || 0,
      };
      
      if (editingProduct) {
        console.log('Updating product:', editingProduct.id, payload);
        await productsAPI.update(editingProduct.id, payload);
        console.log('Product updated successfully');
      } else {
        console.log('Creating product:', payload);
        await productsAPI.create(payload);
        console.log('Product created successfully');
      }
      
      setFormData({
        product_name: '',
        sku: '',
        category: '',
        unit: '',
        buying_price: '',
        selling_price: '',
        min_stock_level: '10',
        current_stock: '',
      });
      onClose();
      onAdd();
    } catch (err) {
      console.error('Error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to save product';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-secondary dark:text-light">
            {editingProduct ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-100 text-danger p-3 rounded">{error}</div>}
          
          <input
            type="text"
            placeholder="Product Name *"
            value={formData.product_name}
            onChange={(e) => setFormData({...formData, product_name: e.target.value})}
            className="input"
            required
          />
          <input
            type="text"
            placeholder="SKU *"
            value={formData.sku}
            onChange={(e) => setFormData({...formData, sku: e.target.value})}
            className="input"
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="input"
          />
          <input
            type="text"
            placeholder="Unit (kg, pcs, etc)"
            value={formData.unit}
            onChange={(e) => setFormData({...formData, unit: e.target.value})}
            className="input"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Buying Price *"
            value={formData.buying_price}
            onChange={(e) => setFormData({...formData, buying_price: e.target.value})}
            className="input"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Selling Price *"
            value={formData.selling_price}
            onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
            className="input"
            required
          />
          <input
            type="number"
            placeholder="Initial Stock"
            value={formData.current_stock}
            onChange={(e) => setFormData({...formData, current_stock: e.target.value})}
            className="input"
            required
          />
          <input
            type="number"
            placeholder="Min Stock Level"
            value={formData.min_stock_level}
            onChange={(e) => setFormData({...formData, min_stock_level: e.target.value})}
            className="input"
          />

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddStockModal = ({ isOpen, onClose, product, onAdd }) => {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!quantity || parseInt(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Adding stock to product:', product.id, 'quantity:', quantity);
      await productsAPI.addStock(product.id, parseInt(quantity), 'purchase', '');
      console.log('Stock added successfully');
      setQuantity('');
      onClose();
      onAdd();
    } catch (err) {
      console.error('Error adding stock:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to add stock';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-secondary dark:text-light">Add Stock</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-100 text-danger p-3 rounded">{error}</div>}
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Product</p>
            <p className="font-semibold text-secondary dark:text-light">{product.product_name}</p>
            <p className="text-sm text-gray-500">Current Stock: {product.current_stock} {product.unit}</p>
          </div>
          
          <input
            type="number"
            placeholder="Quantity to add *"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input"
            required
            min="1"
          />

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Adding...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProductsPage = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [stockQuantity, setStockQuantity] = useState('');
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProducts = useCallback(async (searchTerm = '', filterValue = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching products with search:', searchTerm, 'filter:', filterValue);
      const response = await productsAPI.list({
        search: searchTerm || undefined,
        low_stock: filterValue === 'low' ? true : undefined,
        limit: 50,
      });
      console.log('Products fetched - response type:', typeof response, 'is array:', Array.isArray(response), 'count:', response?.length);
      console.log('Raw response:', response);
      
      // Handle both direct array response and nested data response
      const productList = Array.isArray(response) ? response : response?.data || [];
      setProducts(productList || []);
      console.log('Set products state to:', productList);
    } catch (err) {
      console.error('Failed to load products:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load products on mount and when search/filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(search, filter);
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [search, filter, loadProducts]);

  // Load products on component mount
  useEffect(() => {
    loadProducts('', 'all');
  }, []);

  const handleDelete = async (product) => {
    if (!product) return;
    setIsDeleting(true);
    try {
      await productsAPI.delete(product.id);
      setProducts(products.filter(p => p.id !== product.id));
      setDeleteProduct(null);
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary dark:text-light">Products</h1>
          <p className="text-gray-500">Manage your inventory ({products.length} total)</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5 inline-block mr-2" />
          Add Product
        </button>
      </div>

      <AddProductModal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
        onAdd={() => loadProducts(search, filter)}
        editingProduct={editingProduct}
      />

      <AddStockModal
        isOpen={showAddStockModal}
        onClose={() => {
          setShowAddStockModal(false);
          setEditingProduct(null);
          setStockQuantity('');
        }}
        product={editingProduct}
        onAdd={() => loadProducts(search, filter)}
      />

      {/* Search and Filter */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Products</option>
            <option value="low">Low Stock</option>
            <option value="high">In Stock</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-danger p-4 rounded flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="card h-48 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          ))}
        </div>
      )}

      {/* Products Grid/List */}
      {!loading && products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-secondary dark:text-light">
                    {product.product_name}
                  </h3>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingProduct(product);
                      setShowModal(true);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDeleteProduct(product)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Buying Price:</span>
                  <span className="font-semibold">₹{product.buying_price?.toFixed(2) || '0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Selling Price:</span>
                  <span className="font-semibold">₹{product.selling_price?.toFixed(2) || '0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Stock:</span>
                  <span className={`font-semibold ${product.current_stock > product.min_stock_level ? 'text-success' : 'text-danger'}`}>
                    {product.current_stock || 0} {product.unit}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingProduct(product);
                    setShowAddStockModal(true);
                  }}
                  className="btn btn-secondary flex-1 text-sm"
                >
                  Add Stock
                </button>
                <button 
                  onClick={() => {
                    setEditingProduct(product);
                    setShowModal(true);
                  }}
                  className="btn btn-primary flex-1 text-sm"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No products found. {search ? 'Try a different search.' : 'Create your first product.'}</p>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
