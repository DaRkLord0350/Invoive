import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from './store';

// Layouts
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import InventoryPage from './pages/InventoryPage';
import BillingPage from './pages/BillingPage';
import InvoiceHistoryPage from './pages/InvoiceHistoryPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
// Styles
import './styles/globals.css';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" />;
};


function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, [isDark]);

  return (
    <Router>
      <div className={isDark ? 'dark' : ''}>
        {token && <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}
        
        <div className="flex">
          {token && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
          
          <main className="flex-1 w-full">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/*"
                element={
                  <ProtectedRoute>
                    <ProductsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing/*"
                element={
                  <ProtectedRoute>
                    <BillingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute>
                    <InvoiceHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers/*"
                element={
                  <ProtectedRoute>
                    <CustomersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/*"
                element={
                  <ProtectedRoute>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />

              {/* Redirect */}
              <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
