import api from './client';

// Auth APIs
export const authAPI = {
  signup: (data) => api.post('api/auth/signup', data),
  login: (email, password) => api.post('api/auth/login', new URLSearchParams({ username: email, password }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

// Products APIs
export const productsAPI = {
  list: (params = {}) => api.get(`api/products/`, { params }).then(res => res.data),
  get: (id) => api.get(`api/products/${id}`).then(res => res.data),
  create: (data) => {
    console.log('Creating product:', data);
    return api.post(`api/products/`, data).then(res => {
      console.log('Product created:', res.data);
      return res.data;
    }).catch(err => {
      console.error('Error creating product:', err.response?.data || err.message);
      throw err;
    });
  },
  update: (id, data) => api.put(`api/products/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`api/products/${id}`).then(res => res.data),
  addStock: (id, quantity, reason = 'purchase', notes = '') => 
    api.post(`api/products/${id}api/add-stock`, null, { params: { quantity, reason, notes } }).then(res => res.data),
  getStockHistory: (id, params = {}) => api.get(`api/products/${id}api/stock-history`, { params }).then(res => res.data),
  getLowStock: (limit = 5) => api.get(`api/products/`, { params: { low_stock: true, limit } }).then(res => res.data),
};

// Customers APIs
export const customersAPI = {
  list: (params = {}) => api.get(`api/customers/`, { params }).then(res => res.data),
  get: (id) => api.get(`api/customers/${id}`).then(res => res.data),
  create: (data) => api.post(`api/customers/`, data).then(res => res.data),
  update: (id, data) => api.put(`api/customers/${id}`, data).then(res => res.data),
  block: (id) => api.post(`api/customers/${id}/block`).then(res => res.data),
  unblock: (id) => api.post(`api/customers/${id}/unblock`).then(res => res.data),
  getInvoices: (id) => api.get(`api/customers/${id}/invoices`).then(res => res.data),
};

// Invoices APIs
export const invoicesAPI = {
  list: (params = {}) => api.get(`api/invoices/`, { params }).then(res => res.data),
  get: (id) => api.get(`api/invoices/${id}`).then(res => res.data),
  create: (data) => api.post(`api/invoices/`, data).then(res => res.data),
  update: (id, data) => api.put(`api/invoices/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`api/invoices/${id}`).then(res => res.data),
  addPayment: (id, payment) => api.post(`api/invoices/${id}/payment`, payment).then(res => res.data),
  getPayments: (id) => api.get(`api/invoices/${id}/payments`).then(res => res.data),
  downloadPDF: (id) => api.get(`api/invoices/${id}/pdf`, { responseType: 'blob' }),
};

// Reports APIs
export const reportsAPI = {
  salesSummary: (businessId, period = 'daily') => 
    api.get(`api/reports/sales/summary`, { params: { business_id: businessId, period } }).then(res => res.data),
  inventoryValue: (businessId) => 
    api.get(`api/reports/inventory/value`, { params: { business_id: businessId } }).then(res => res.data),
  bestsellers: (businessId, period = 'monthly', limit = 10) =>
    api.get(`api/reports/products/bestsellers`, { params: { business_id: businessId, period, limit } }).then(res => res.data),
  topCustomers: (businessId, limit = 10) =>
    api.get(`api/reports/customers/top`, { params: { business_id: businessId, limit } }).then(res => res.data),
  outstandingPayments: (businessId) =>
    api.get(`api/reports/payments/outstanding`, { params: { business_id: businessId } }).then(res => res.data),
  taxSummary: (businessId, startDate, endDate) =>
    api.get(`api/reports/tax/summary`, { params: { business_id: businessId, start_date: startDate, end_date: endDate } }).then(res => res.data),
};

// Business APIs
export const businessAPI = {
  list: () => api.get(`/businesses/`).then(res => res.data),
  get: (id) => api.get(`/businesses/${id}`).then(res => res.data),
  create: (data) => api.post(`/businesses/`, data).then(res => res.data),
  update: (id, data) => api.put(`/businesses/${id}`, data).then(res => res.data),
};
