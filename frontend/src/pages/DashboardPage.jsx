import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, Users, FileText, AlertCircle, DollarSign } from 'lucide-react';
import { useBusinessStore } from '../store';
import { reportsAPI, productsAPI, customersAPI, invoicesAPI } from '../api';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, trend, color, loading }) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
        {loading ? (
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20 mt-1 animate-pulse"></div>
        ) : (
          <>
            <p className="text-2xl font-bold text-secondary dark:text-light mt-1">
              {value || '₹0'}
            </p>
            {trend && (
              <p className={`text-sm mt-1 ${trend > 0 ? 'text-success' : 'text-danger'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
              </p>
            )}
          </>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentBusiness } = useBusinessStore();
  const [stats, setStats] = useState({
    sales: { total_revenue: 0, total_orders: 0 },
    inventory: { total_capital_value: 0, total_items: 0, total_stock: 0 },
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [currentBusiness]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get business ID - if no currentBusiness, use 1 (default) or null to let backend handle it
      const businessId = currentBusiness?.id;
      
      console.log('Loading dashboard for business:', businessId);

      const [salesData, inventoryData, lowStockData, customersData, invoicesData] = await Promise.all([
        reportsAPI.salesSummary(businessId, 'daily')
          .then(data => {
            console.log('Sales data:', data);
            return data;
          })
          .catch(e => {
            console.error('Sales error:', e);
            return { total_revenue: 0, total_orders: 0 };
          }),
        reportsAPI.inventoryValue(businessId)
          .then(data => {
            console.log('Inventory data:', data);
            return data;
          })
          .catch(e => {
            console.error('Inventory error:', e);
            return { total_capital_value: 0, total_items: 0, total_stock: 0 };
          }),
        productsAPI.getLowStock(5)
          .then(data => {
            console.log('Low stock data:', data);
            return data;
          })
          .catch(e => {
            console.error('Low stock error:', e);
            return [];
          }),
        customersAPI.list({ limit: 1000 })
          .then(data => {
            console.log('Customers data:', data);
            return data;
          })
          .catch(e => {
            console.error('Customers error:', e);
            return [];
          }),
        invoicesAPI.list({ limit: 10 })
          .then(data => {
            console.log('Invoices data:', data);
            return data;
          })
          .catch(e => {
            console.error('Invoices error:', e);
            return [];
          }),
      ]);

      console.log('Setting stats:', { salesData, inventoryData });

      setStats({
        sales: salesData || { total_revenue: 0, total_orders: 0 },
        inventory: inventoryData || { total_capital_value: 0, total_items: 0, total_stock: 0 },
      });
      
      setLowStockItems(Array.isArray(lowStockData) ? lowStockData.slice(0, 5) : []);
      setTotalCustomers(Array.isArray(customersData) ? customersData.length : 0);
      setRecentTransactions(Array.isArray(invoicesData) ? invoicesData.slice(0, 5) : []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-danger mb-4">{error}</p>
        <button onClick={loadDashboardData} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary dark:text-light">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Today's Sales"
          value={`₹${(stats?.sales?.total_revenue || 0).toFixed(2)}`}
          trend={5.2}
          color="bg-primary"
          loading={loading}
        />
        <StatCard
          icon={FileText}
          label="Total Orders"
          value={stats?.sales?.total_orders || 0}
          trend={2.1}
          color="bg-success"
          loading={loading}
        />
        <StatCard
          icon={Package}
          label="Inventory Value"
          value={`₹${(stats?.inventory?.total_capital_value || 0).toFixed(2)}`}
          color="bg-warning"
          loading={loading}
        />
        <StatCard
          icon={Users}
          label="Active Customers"
          value={totalCustomers}
          color="bg-danger"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary dark:text-light mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Low Stock Alerts
          </h2>
          {lowStockItems.length > 0 ? (
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                  <div>
                    <p className="font-semibold text-secondary dark:text-light">{item.product_name}</p>
                    <p className="text-sm text-gray-500">Stock: {item.current_stock} {item.unit}</p>
                  </div>
                  <button 
                    onClick={() => navigate('/products')}
                    className="btn btn-primary text-sm px-3 py-1"
                  >
                    Reorder
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">✓ All items are well stocked</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary dark:text-light mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/billing/create')}
              className="btn btn-primary"
            >
              Create Bill
            </button>
            <button 
              onClick={() => navigate('/products/create')}
              className="btn btn-secondary"
            >
              Add Product
            </button>
            <button 
              onClick={() => navigate('/customers/create')}
              className="btn btn-secondary"
            >
              Add Customer
            </button>
            <button 
              onClick={() => navigate('/reports')}
              className="btn btn-secondary"
            >
              View Reports
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-secondary dark:text-light mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-2">Invoice</th>
                <th className="text-left py-2">Customer</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentTransactions.length > 0 ? (
                recentTransactions.map(invoice => (
                  <tr key={invoice.id}>
                    <td className="py-3 font-mono text-xs">{invoice.invoice_number}</td>
                    <td>{invoice.customer?.customer_name || 'Unknown'}</td>
                    <td>₹{invoice.grand_total?.toFixed(2) || '0'}</td>
                    <td>
                      <span className={`badge ${
                        (invoice.payment_status || '').toUpperCase() === 'PAID' 
                          ? 'badge-success' 
                          : (invoice.payment_status || '').toUpperCase() === 'PARTIAL' 
                          ? 'badge-warning' 
                          : 'badge-danger'
                      }`}>
                        {(invoice.payment_status || 'UNPAID').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-500">
                    No transactions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
