import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, Package, Users } from 'lucide-react';
import { useBusinessStore } from '../store';
import { reportsAPI } from '../api';

export const ReportsPage = () => {
  const { currentBusiness } = useBusinessStore();
  const [activeTab, setActiveTab] = useState('sales');
  const [period, setPeriod] = useState('daily');
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [bestsellersData, setBestsellersData] = useState(null);
  const [topCustomersData, setTopCustomersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReports();
  }, [currentBusiness, period, activeTab]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const businessId = currentBusiness?.id || 1;

      if (activeTab === 'sales') {
        const data = await reportsAPI.salesSummary(businessId, period);
        setSalesData(data?.data || data);
      } else if (activeTab === 'inventory') {
        const data = await reportsAPI.inventoryValue(businessId);
        setInventoryData(data?.data || data);
      } else if (activeTab === 'customers') {
        try {
          const bestsellers = await reportsAPI.bestsellers(businessId, 10, 'monthly');
          console.log('Bestsellers response:', bestsellers);
          setBestsellersData(bestsellers?.data?.bestsellers || bestsellers?.bestsellers || []);
        } catch (err) {
          console.error('Bestsellers error:', err);
          setBestsellersData([]);
        }
        
        try {
          const topCustomers = await reportsAPI.topCustomers(businessId, 10);
          console.log('Top customers response:', topCustomers);
          setTopCustomersData(topCustomers?.data?.top_customers || topCustomers?.top_customers || []);
        } catch (err) {
          console.error('Top customers error:', err);
          setTopCustomersData([]);
        }
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      setError(`Failed to load reports: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderSalesReport = () => (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                period === p
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-secondary dark:text-light hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <h3 className="text-gray-500 text-sm mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-primary">
            ₹{salesData?.total_revenue?.toFixed(2) || '0'}
          </p>
        </div>
        <div className="card">
          <h3 className="text-gray-500 text-sm mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-success">
            {salesData?.total_orders || '0'}
          </p>
        </div>
        <div className="card">
          <h3 className="text-gray-500 text-sm mb-2">Total Profit</h3>
          <p className="text-3xl font-bold text-warning">
            ₹{salesData?.total_profit?.toFixed(2) || '0'}
          </p>
        </div>
        <div className="card">
          <h3 className="text-gray-500 text-sm mb-2">Avg Order Value</h3>
          <p className="text-3xl font-bold text-primary">
            ₹{salesData?.average_order_value?.toFixed(2) || '0'}
          </p>
        </div>
      </div>

      {/* Simple Chart Visualization */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary dark:text-light mb-4">Revenue Breakdown</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Revenue</span>
              <span className="text-sm font-semibold">₹{salesData?.total_revenue?.toFixed(2) || '0'}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div className="bg-primary h-3 rounded-full" style={{width: '100%'}}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Profit</span>
              <span className="text-sm font-semibold">₹{salesData?.total_profit?.toFixed(2) || '0'}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div className="bg-success h-3 rounded-full" style={{width: `${(salesData?.total_profit || 0) / (salesData?.total_revenue || 1) * 100}%`}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventoryReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-gray-500 text-sm mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-primary">
            {inventoryData?.total_items || '0'}
          </p>
        </div>
        <div className="card">
          <h3 className="text-gray-500 text-sm mb-2">Total Stock Units</h3>
          <p className="text-3xl font-bold text-success">
            {inventoryData?.total_stock || '0'}
          </p>
        </div>
        <div className="card">
          <h3 className="text-gray-500 text-sm mb-2">Inventory Value</h3>
          <p className="text-3xl font-bold text-warning">
            ₹{inventoryData?.total_capital_value?.toFixed(2) || '0'}
          </p>
        </div>
      </div>

      {/* Inventory Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary dark:text-light mb-4">Inventory Status</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Stock Units</span>
              <span className="text-sm font-semibold">{inventoryData?.total_stock || '0'} units</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div className="bg-primary h-3 rounded-full" style={{width: '75%'}}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Inventory Value</span>
              <span className="text-sm font-semibold">₹{inventoryData?.total_capital_value?.toFixed(2) || '0'}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div className="bg-success h-3 rounded-full" style={{width: '85%'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomerReport = () => (
    <div className="space-y-6">
      {/* Bestsellers */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary dark:text-light mb-4">Top Selling Products</h3>
        {bestsellersData && bestsellersData.length > 0 ? (
          <div className="space-y-3">
            {bestsellersData.slice(0, 5).map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <p className="font-semibold text-secondary dark:text-light">{product.product_name}</p>
                  <p className="text-sm text-gray-500">{product.quantity_sold} units sold</p>
                </div>
                <p className="font-semibold text-primary">₹{product.total_sales?.toFixed(2) || '0'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No bestsellers yet</p>
        )}
      </div>

      {/* Top Customers */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary dark:text-light mb-4">Top Customers</h3>
        {topCustomersData && topCustomersData.length > 0 ? (
          <div className="space-y-3">
            {topCustomersData.slice(0, 5).map((customer, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <p className="font-semibold text-secondary dark:text-light">{customer.customer_name}</p>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                </div>
                <p className="font-semibold text-success">₹{customer.total_purchases?.toFixed(2) || '0'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No customer data yet</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary dark:text-light">Reports</h1>
          <p className="text-gray-500">View sales, inventory and customer analytics</p>
        </div>
        <button className="btn btn-primary">
          <Download className="w-5 h-5 inline-block mr-2" />
          Export
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-all ${
              activeTab === 'sales'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-secondary'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Sales Report
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-all ${
              activeTab === 'inventory'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-secondary'
            }`}
          >
            <Package className="w-5 h-5" />
            Inventory Report
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-all ${
              activeTab === 'customers'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-secondary'
            }`}
          >
            <Users className="w-5 h-5" />
            Customer Report
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">Loading reports...</div>
      ) : error ? (
        <div className="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-danger">{error}</p>
          <button onClick={loadReports} className="btn btn-primary mt-4">
            Retry
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'sales' && renderSalesReport()}
          {activeTab === 'inventory' && renderInventoryReport()}
          {activeTab === 'customers' && renderCustomerReport()}
        </>
      )}
    </div>
  );
};

export default ReportsPage;
