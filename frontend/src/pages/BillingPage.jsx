import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, AlertCircle } from 'lucide-react';
import { useBusinessStore, useCartStore, useAuthStore } from '../store';
import { productsAPI, invoicesAPI, customersAPI } from '../api';

export const BillingPage = () => {
  const { currentBusiness } = useBusinessStore();
  const { user } = useAuthStore();
  const { items, addItem, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [paymentMethodForInvoice, setPaymentMethodForInvoice] = useState('cash');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading products for billing...');
      const response = await productsAPI.list();
      console.log('Products response:', response);
      setProducts(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = () => {
    if (items.length === 0) {
      alert('Cart is empty. Please add products to generate an invoice.');
      return;
    }
    setShowCustomerModal(true);
  };

  const handleCreateInvoice = async () => {
    if (!customerForm.customer_name.trim()) {
      alert('Please enter customer name');
      return;
    }

    setIsGenerating(true);
    try {
      const { subtotal, tax, discount, grand_total } = getTotal();
      
      // First, search for existing customer with same name, phone, and email
      let customerId = null;
      try {
        const customerData = {
          customer_name: customerForm.customer_name.trim(),
          phone: (customerForm.phone || '').trim(),
          email: (customerForm.email || '').trim(),
          address: (customerForm.address || '').trim(),
        };
        
        // Try to find existing customer
        console.log('Searching for existing customer:', customerData);
        const allCustomers = await customersAPI.list({ limit: 1000 });
        
        // Normalize for comparison
        const normalize = (str) => (str || '').toLowerCase().trim();
        const existingCustomer = (Array.isArray(allCustomers) ? allCustomers : []).find(c => 
          normalize(c.customer_name) === normalize(customerData.customer_name) &&
          normalize(c.phone) === normalize(customerData.phone) &&
          normalize(c.email) === normalize(customerData.email)
        );
        
        if (existingCustomer) {
          console.log('Found existing customer:', existingCustomer);
          customerId = existingCustomer.id;
          alert(`Using existing customer: ${existingCustomer.customer_name}`);
        } else {
          // Create new customer only if not found
          console.log('Creating new customer:', customerData);
          const customerResponse = await customersAPI.create(customerData);
          console.log('Customer created:', customerResponse);
          customerId = customerResponse.id || customerResponse.data?.id;
        }
      } catch (err) {
        console.error('Failed to manage customer:', err);
        // Continue without customer link if it fails
      }
      
      const invoiceData = {
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_percentage: item.tax_percentage,
        })),
        customer_id: customerId,
        payment_method: paymentMethodForInvoice,
        payment_status: paymentStatus,
        discount_amount: discount,
        notes: customerId ? '' : `Customer: ${customerForm.customer_name}, Phone: ${customerForm.phone}, Address: ${customerForm.address}`
      };

      console.log('Creating invoice:', invoiceData);
      const response = await invoicesAPI.create(invoiceData);
      console.log('Invoice created:', response);
      
      // Download PDF
      setTimeout(async () => {
        try {
          const pdfResponse = await invoicesAPI.downloadPDF(response.id);
          const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Invoice_${response.invoice_number}.pdf`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Failed to download PDF:', err);
        }
      }, 500);
      
      alert(`Invoice generated successfully! Status: ${paymentStatus.toUpperCase()}`);
      clearCart();
      setShowCustomerModal(false);
      setCustomerForm({ customer_name: '', phone: '', email: '', address: '' });
      setPaymentStatus('unpaid');
      setPaymentMethodForInvoice('cash');
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const { subtotal, tax, discount, grand_total } = getTotal();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-secondary dark:text-light">Create Bill</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary dark:text-light mb-4">
              Select Products
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading products...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-danger">{error}</p>
                <button onClick={loadProducts} className="btn btn-secondary mt-2">
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No products available. Create products first.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-secondary dark:text-light">
                        {product.product_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        ₹{product.selling_price} | Stock: {product.current_stock} {product.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => addItem(product, 1)}
                      className="btn btn-primary text-sm px-3 py-1"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary dark:text-light mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Cart ({items.length})
            </h2>

            {/* Cart Items */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {items.length > 0 ? (
                items.map(item => (
                  <div
                    key={item.product_id}
                    className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">{item.product_name}</p>
                        <p className="text-xs text-gray-500">₹{item.unit_price}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-danger hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity - 1)
                        }
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.product_id, parseInt(e.target.value) || 1)
                        }
                        className="input w-12 text-center py-1"
                      />
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity + 1)
                        }
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-6">Cart is empty</p>
              )}
            </div>

            {/* Totals */}
            {items.length > 0 && (
              <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (GST):</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>₹{discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span>Total:</span>
                  <span className="text-primary">₹{grand_total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-4 space-y-2">
              <button 
                onClick={handleGenerateInvoice}
                disabled={isGenerating || items.length === 0}
                className="btn btn-primary w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Invoice'}
              </button>
              <button
                onClick={clearCart}
                className="btn btn-secondary w-full"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full p-6 space-y-6 max-h-96 overflow-y-auto">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-secondary dark:text-light">Invoice Details</h2>
            </div>

            {/* Customer Information Section */}
            <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="font-semibold text-secondary dark:text-light">Customer Information</h3>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Customer Name *</label>
                <input
                  type="text"
                  value={customerForm.customer_name}
                  onChange={(e) => setCustomerForm({ ...customerForm, customer_name: e.target.value })}
                  placeholder="Enter customer name"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  placeholder="Enter email address"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Address</label>
                <textarea
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  placeholder="Enter complete address"
                  className="input w-full"
                  rows="3"
                />
              </div>
            </div>

            {/* Payment Information Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-secondary dark:text-light">Payment Information</h3>
              
              <div className="space-y-3">
                <label className="block text-sm font-semibold">Payment Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="paid"
                      checked={paymentStatus === 'paid'}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>Paid</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="unpaid"
                      checked={paymentStatus === 'unpaid'}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>Unpaid</span>
                  </label>
                </div>
              </div>

              {/* Show payment method only if paid */}
              {paymentStatus === 'paid' && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold">Payment Method</label>
                  <select
                    value={paymentMethodForInvoice}
                    onChange={(e) => setPaymentMethodForInvoice(e.target.value)}
                    className="input w-full"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setCustomerForm({ customer_name: '', phone: '', email: '', address: '' });
                  setPaymentStatus('unpaid');
                  setPaymentMethodForInvoice('cash');
                }}
                disabled={isGenerating}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={isGenerating}
                className="btn btn-primary flex-1"
              >
                {isGenerating ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
