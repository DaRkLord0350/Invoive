import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, X, Check } from 'lucide-react';
import { customersAPI, invoicesAPI } from '../api';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [addingCustomer, setAddingCustomer] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [search, paymentFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      
      if (search) {
        params.search = search;
      }
      
      if (paymentFilter !== 'all') {
        params.payment_status = paymentFilter;
      }
      
      console.log('Loading customers with params:', params);
      const response = await customersAPI.list(params);
      console.log('Customers response:', response);
      setCustomers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setError('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'text-success bg-success/10';
      case 'unpaid':
        return 'text-danger bg-danger/10';
      case 'partial':
        return 'text-warning bg-warning/10';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleViewCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setLoadingInvoices(true);
    try {
      const response = await customersAPI.getInvoices(customer.id);
      console.log('Full customer invoices response:', response);
      
      // Handle both direct array and object with invoices property
      let invoices = [];
      if (Array.isArray(response)) {
        invoices = response;
      } else if (response.invoices && Array.isArray(response.invoices)) {
        invoices = response.invoices;
      }
      
      console.log('Parsed invoices:', invoices);
      console.log('Total invoices count:', invoices.length);
      setCustomerInvoices(invoices);
    } catch (err) {
      console.error('Failed to load customer invoices:', err);
      setCustomerInvoices([]);
    } finally {
      
      setLoadingInvoices(false);
    }
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      await invoicesAPI.update(invoiceId, { payment_status: 'paid' });
      // Reload customer invoices
      if (selectedCustomer) {
        handleViewCustomer(selectedCustomer);
      }
      // Reload customers list
      loadCustomers();
      alert('Payment status updated successfully');
    } catch (err) {
      console.error('Failed to update payment status:', err);
      alert('Failed to update payment status');
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.customer_name || !newCustomer.phone) {
      alert('Please fill in customer name and phone');
      return;
    }

    setAddingCustomer(true);
    try {
      const response = await customersAPI.create({
        customer_name: newCustomer.customer_name,
        phone: newCustomer.phone,
        email: newCustomer.email || null,
        address: newCustomer.address || null
      });
      console.log('Customer created:', response);
      
      // Reset form
      setNewCustomer({
        customer_name: '',
        phone: '',
        email: '',
        address: ''
      });
      setShowAddCustomerModal(false);
      
      // Reload customers list
      loadCustomers();
      alert('Customer added successfully');
    } catch (err) {
      console.error('Failed to add customer:', err);
      alert('Failed to add customer: ' + (err.response?.data?.detail || err.message));
    } finally {
      setAddingCustomer(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary dark:text-light">Customers</h1>
          <p className="text-gray-500">Manage customer information ({customers.length} total)</p>
        </div>
        <button 
          onClick={() => setShowAddCustomerModal(true)}
          className="btn btn-primary">
          <Plus className="w-5 h-5 inline-block mr-2" />
          Add Customer
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card space-y-4">
        <div className="flex gap-2 items-center">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-1"
          />
        </div>

        {/* Payment Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPaymentFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              paymentFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setPaymentFilter('paid')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              paymentFilter === 'paid'
                ? 'bg-success text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setPaymentFilter('unpaid')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              paymentFilter === 'unpaid'
                ? 'bg-danger text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Unpaid
          </button>
          <button
            onClick={() => setPaymentFilter('partial')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              paymentFilter === 'partial'
                ? 'bg-warning text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Partial
          </button>
        </div>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Loading customers...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-danger">{error}</p>
          <button onClick={loadCustomers} className="btn btn-secondary mt-4">
            Retry
          </button>
        </div>
      ) : customers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No customers found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left py-4 px-4 font-semibold">Name</th>
                <th className="text-left py-4 px-4 font-semibold">Phone</th>
                <th className="text-left py-4 px-4 font-semibold">Email</th>
                <th className="text-left py-4 px-4 font-semibold">Address</th>
                <th className="text-left py-4 px-4 font-semibold">Invoice Numbers</th>
                <th className="text-left py-4 px-4 font-semibold">Total Purchases</th>
                <th className="text-left py-4 px-4 font-semibold">Status</th>
                <th className="text-left py-4 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 font-semibold text-secondary dark:text-light">
                    {customer.customer_name}
                  </td>
                  <td className="py-3 px-4">{customer.phone || 'N/A'}</td>
                  <td className="py-3 px-4 text-xs">{customer.email || 'N/A'}</td>
                  <td className="py-3 px-4 text-xs max-w-xs truncate">{customer.address || 'N/A'}</td>
                  <td className="py-3 px-4 text-xs">
                    {customer.invoice_numbers && customer.invoice_numbers.length > 0 ? (
                      <div className="space-y-1">
                        {customer.invoice_numbers.slice(0, 3).map((inv, idx) => (
                          <div key={idx} className="font-semibold text-secondary dark:text-light">{inv}</div>
                        ))}
                        {customer.invoice_numbers.length > 3 && (
                          <div className="text-gray-500">+{customer.invoice_numbers.length - 3} more</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">No invoices</span>
                    )}
                  </td>
                  <td className="py-3 px-4">₹{customer.total_purchases?.toFixed(2) || '0.00'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(customer.payment_status)}`}>
                      {customer.payment_status?.toUpperCase() || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button 
                      onClick={() => handleViewCustomer(customer)}
                      className="btn btn-primary text-xs px-2 py-1"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-secondary dark:text-light">
                  {selectedCustomer.customer_name}
                </h2>
                <p className="text-sm text-gray-500">Customer Details & Purchase History</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Phone</p>
                <p className="font-semibold">{selectedCustomer.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Email</p>
                <p className="font-semibold">{selectedCustomer.email || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 uppercase">Address</p>
                <p className="font-semibold">{selectedCustomer.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Purchases</p>
                <p className="font-semibold text-lg">₹{selectedCustomer.total_purchases?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Payment Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedCustomer.payment_status)}`}>
                  {selectedCustomer.payment_status?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>

            {/* Purchase History */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-semibold text-secondary dark:text-light mb-3">Purchase History</h3>
              {loadingInvoices ? (
                <p className="text-center text-gray-500 py-4">Loading invoices...</p>
              ) : customerInvoices.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No purchases yet</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {customerInvoices.map(invoice => (
                    <div key={invoice.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      {/* Invoice Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{invoice.invoice_number}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(invoice.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.payment_status)}`}>
                          {invoice.payment_status?.toUpperCase()}
                        </span>
                      </div>

                      {/* Invoice Items */}
                      <div className="space-y-2 mb-3 text-sm">
                        {invoice.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.product?.product_name || `Product ${item.product_id}`} × {item.quantity}</span>
                            <span>₹{item.total_amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Invoice Totals */}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mb-3 text-sm">
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>₹{invoice.grand_total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Mark as Paid Button */}
                      {invoice.payment_status !== 'paid' && (
                        <button
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          className="btn btn-success w-full text-xs py-1"
                        >
                          <Check className="w-4 h-4 inline mr-1" />
                          Mark as Paid
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="btn btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
              <h2 className="text-2xl font-bold text-secondary dark:text-light">Add New Customer</h2>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddCustomer} className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-semibold text-secondary dark:text-light mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={newCustomer.customer_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, customer_name: e.target.value })}
                  placeholder="Enter customer name"
                  className="input w-full"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-secondary dark:text-light mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="input w-full"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-secondary dark:text-light mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="Enter email address"
                  className="input w-full"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-secondary dark:text-light mb-2">
                  Address
                </label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Enter customer address"
                  className="input w-full"
                  rows="3"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCustomer}
                  className="btn btn-primary flex-1"
                >
                  {addingCustomer ? 'Adding...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
