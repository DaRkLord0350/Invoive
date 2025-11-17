import React, { useState, useEffect } from 'react';
import { Download, Eye, Trash2, Search, Check } from 'lucide-react';
import { invoicesAPI } from '../api';

export const InvoiceHistoryPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading invoices...');
      const response = await invoicesAPI.list();
      console.log('Invoices response:', response);
      setInvoices(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setError('Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      const pdfResponse = await invoicesAPI.downloadPDF(invoiceId);
      const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to download PDF');
    }
  };

  const handleDelete = async (invoice) => {
    if (!invoice) return;
    setIsDeleting(true);
    try {
      console.log('Deleting invoice:', invoice.id);
      await invoicesAPI.delete(invoice.id);
      setInvoices(invoices.filter(inv => inv.id !== invoice.id));
      setDeleteInvoice(null);
      alert('Invoice deleted successfully');
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      alert('Failed to delete invoice');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsPaid = async (invoiceId) => {
    setIsMarkingPaid(invoiceId);
    try {
      console.log('Marking invoice as paid:', invoiceId);
      const updatedInvoice = await invoicesAPI.update(invoiceId, { payment_status: 'paid' });
      console.log('Updated invoice:', updatedInvoice);
      
      // Update with the response from backend
      setInvoices(invoices.map(inv => 
        inv.id === invoiceId ? updatedInvoice : inv
      ));
      alert('Invoice marked as paid');
    } catch (err) {
      console.error('Failed to mark invoice as paid:', err);
      alert('Failed to update payment status');
    } finally {
      setIsMarkingPaid(null);
    }
  };

  // Get customer info from invoice.customer or parse from notes
  const getCustomerInfo = (invoice) => {
    // If customer is linked in database
    if (invoice.customer && invoice.customer.id) {
      return {
        name: invoice.customer.customer_name,
        phone: invoice.customer.phone || '',
        address: invoice.customer.address || '',
        isWalkin: false
      };
    }
    
    // Parse from notes for walk-in customers
    if (!invoice.notes) {
      return { name: 'Walk-in Customer', phone: '', address: '', isWalkin: true };
    }
    
    const nameMatch = invoice.notes.match(/Customer:\s*([^,]+)/);
    const phoneMatch = invoice.notes.match(/Phone:\s*([^,]+)/);
    const addressMatch = invoice.notes.match(/Address:\s*([^,]*)/);
    
    return {
      name: nameMatch ? nameMatch[1].trim() : 'Walk-in Customer',
      phone: phoneMatch ? phoneMatch[1].trim() : '',
      address: addressMatch ? addressMatch[1].trim() : '',
      isWalkin: true
    };
  };

  const filteredInvoices = invoices.filter(invoice => {
    const customerInfo = getCustomerInfo(invoice);
    return (
      customerInfo.name.toLowerCase().includes(search.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getStatusColor = (status) => {
    if (!status) return 'text-gray-600 bg-gray-100';
    const statusLower = status.toString().toLowerCase();
    switch (statusLower) {
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary dark:text-light">Invoice History</h1>
        <p className="text-gray-500">View and manage all generated invoices ({invoices.length} total)</p>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name or invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none flex-1"
          />
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Loading invoices...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-danger">{error}</p>
          <button onClick={loadInvoices} className="btn btn-secondary mt-4">
            Retry
          </button>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {invoices.length === 0 ? 'No invoices created yet.' : 'No invoices match your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map(invoice => {
            const customerInfo = getCustomerInfo(invoice);
            const createdDate = new Date(invoice.created_at).toLocaleDateString('en-IN');
            
            return (
              <div key={invoice.id} className="card hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header with Customer Name */}
                  <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-secondary dark:text-light">
                          {customerInfo.name}
                        </h3>
                        {customerInfo.isWalkin && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                            Walk-in
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Invoice: {invoice.invoice_number}</p>
                      <p className="text-sm text-gray-500">Date: {createdDate}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(invoice.payment_status)}`}>
                      {invoice.payment_status?.toUpperCase() || 'N/A'}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Phone</p>
                      <p className="text-sm font-semibold">{customerInfo.phone || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 uppercase">Address</p>
                      <p className="text-sm font-semibold">{customerInfo.address || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Items</p>
                    <div className="space-y-2">
                      {invoice.items && invoice.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                          <span className="font-semibold">
                            {item.product?.product_name || `Product ${item.product_id}`} x {item.quantity}
                          </span>
                          <span className="font-semibold">₹{item.total_amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Subtotal</p>
                      <p className="font-semibold">₹{invoice.subtotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Tax</p>
                      <p className="font-semibold">₹{invoice.tax_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Discount</p>
                      <p className="font-semibold">₹{invoice.discount_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Total</p>
                      <p className="font-bold text-primary text-lg">₹{invoice.grand_total.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Payment Method</p>
                      <p className="font-semibold">{invoice.payment_method?.toUpperCase() || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button
                      onClick={() => handleDownloadPDF(invoice.id, invoice.invoice_number)}
                      className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    {invoice.payment_status && invoice.payment_status.toLowerCase() !== 'paid' && (
                      <button
                        onClick={() => handleMarkAsPaid(invoice.id)}
                        disabled={isMarkingPaid === invoice.id}
                        className="btn btn-success flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        {isMarkingPaid === invoice.id ? 'Updating...' : 'Mark Paid'}
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteInvoice(invoice)}
                      className="btn btn-danger px-4 py-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-danger">Delete Invoice</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete invoice <strong>{deleteInvoice.invoice_number}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setDeleteInvoice(null)}
                disabled={isDeleting}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteInvoice)}
                disabled={isDeleting}
                className="btn btn-danger flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistoryPage;
