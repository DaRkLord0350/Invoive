import React from 'react';
import { Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { useAuthStore, useThemeStore, useBusinessStore } from '../store';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { currentBusiness } = useBusinessStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <button onClick={onMenuClick} className="md:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-xl font-bold text-primary">
            📊 Invoice
          </div>
        </div>

        {/* Center - Business Name */}
        {currentBusiness && (
          <div className="hidden md:block text-sm font-semibold text-secondary dark:text-light">
            {currentBusiness.business_name}
          </div>
        )}

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold text-secondary dark:text-light">
                {user?.full_name}
              </div>
              <div className="text-xs text-gray-500">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-danger"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
