import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store';
import { productsAPI } from '../api';

export const InventoryPage = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockQuantity, setStockQuantity] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading inventory...');
      const response = await productsAPI.list({ limit: 100 });
      console.log('Inventory loaded:', response);
      setProducts(response || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setError('Failed to load inventory');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddStock = async (e) => {
    e.preventDefault();

    if (!stockQuantity || parseInt(stockQuantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      console.log('Adding stock to product:', selectedProduct.id, 'quantity:', stockQuantity);
      await productsAPI.addStock(selectedProduct.id, parseInt(stockQuantity), 'purchase', '');
      console.log('Stock added successfully');
      setStockQuantity('');
      setShowAddStockModal(false);
      loadProducts();
    } catch (err) {
      console.error('Error adding stock:', err);
      alert('Failed to add stock');
    }
  };

  const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock_level);
  const inStockProducts = products.filter(p => p.current_stock > p.min_stock_level);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary dark:text-light">Inventory</h1>
          <p className="text-gray-500">Monitor your stock levels</p>
        </div>
        <button 
          onClick={loadProducts}
          className="btn btn-primary flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
          <div className="text-blue-600 dark:text-blue-300 text-sm font-semibold">Total Products</div>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{products.length}</div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
          <div className="text-green-600 dark:text-green-300 text-sm font-semibold">In Stock</div>
          <div className="text-3xl font-bold text-green-900 dark:text-green-100">{inStockProducts.length}</div>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800">
          <div className="text-red-600 dark:text-red-300 text-sm font-semibold">Low Stock</div>
          <div className="text-3xl font-bold text-red-900 dark:text-red-100">{lowStockProducts.length}</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-danger p-4 rounded flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Low Stock Section */}
          {lowStockProducts.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-danger mb-4">⚠️ Low Stock Alert ({lowStockProducts.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Product</th>
                      <th className="px-4 py-3 text-left font-semibold">SKU</th>
                      <th className="px-4 py-3 text-right font-semibold">Current</th>
                      <th className="px-4 py-3 text-right font-semibold">Min Level</th>
                      <th className="px-4 py-3 text-left font-semibold">Unit</th>
                      <th className="px-4 py-3 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {lowStockProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-secondary dark:text-light">{product.product_name}</div>
                          <div className="text-xs text-gray-500">₹{product.selling_price?.toFixed(2)}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.sku}</td>
                        <td className="px-4 py-3 text-right font-semibold text-danger">{product.current_stock}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{product.min_stock_level}</td>
                        <td className="px-4 py-3">{product.unit}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowAddStockModal(true);
                            }}
                            className="btn btn-sm btn-primary text-xs"
                          >
                            <Plus className="w-3 h-3 inline mr-1" />
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* In Stock Section */}
          {inStockProducts.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-success mb-4">✓ In Stock ({inStockProducts.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Product</th>
                      <th className="px-4 py-3 text-left font-semibold">SKU</th>
                      <th className="px-4 py-3 text-right font-semibold">Stock</th>
                      <th className="px-4 py-3 text-left font-semibold">Unit</th>
                      <th className="px-4 py-3 text-right font-semibold">Buying Price</th>
                      <th className="px-4 py-3 text-right font-semibold">Selling Price</th>
                      <th className="px-4 py-3 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {inStockProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 font-semibold text-secondary dark:text-light">{product.product_name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.sku}</td>
                        <td className="px-4 py-3 text-right font-semibold text-success">{product.current_stock}</td>
                        <td className="px-4 py-3">{product.unit}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">₹{product.buying_price?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">₹{product.selling_price?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowAddStockModal(true);
                            }}
                            className="btn btn-sm btn-secondary text-xs"
                          >
                            <Plus className="w-3 h-3 inline mr-1" />
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {products.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-500">No products found. Create your first product to track inventory.</p>
            </div>
          )}
        </>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-secondary dark:text-light">Add Stock</h2>
              <button 
                onClick={() => {
                  setShowAddStockModal(false);
                  setSelectedProduct(null);
                  setStockQuantity('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddStock} className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Product</p>
                <p className="font-semibold text-secondary dark:text-light">{selectedProduct.product_name}</p>
                <p className="text-sm text-gray-500">Current Stock: {selectedProduct.current_stock} {selectedProduct.unit}</p>
              </div>
              
              <input
                type="number"
                placeholder="Quantity to add *"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="input"
                required
                min="1"
              />

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddStockModal(false);
                    setSelectedProduct(null);
                    setStockQuantity('');
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
