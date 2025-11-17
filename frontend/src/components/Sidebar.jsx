import React, { useState } from 'react';
import {
  Home,
  Package,
  Users,
  FileText,
  Settings,
  BarChart3,
  ShoppingCart,
  X,
  ChevronDown,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Package, label: 'Products', path: '/products', submenu: [
    { label: 'Product List', path: '/products' },
    { label: 'Add Product', path: '/products/create' },
    { label: 'Inventory', path: '/inventory' },
  ]},
  { icon: ShoppingCart, label: 'Billing', path: '/billing', submenu: [
    { label: 'Create Bill', path: '/billing/create' },
    { label: 'Invoice History', path: '/invoices' },
  ]},
  { icon: Users, label: 'Customers', path: '/customers', submenu: [
    { label: 'Customer List', path: '/customers' },
    { label: 'Add Customer', path: '/customers/create' },
  ]},
  { icon: BarChart3, label: 'Reports', path: '/reports' },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleSubmenu = (index) => {
    setExpandedMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg transform md:transform-none transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Close Button for Mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Menu Items */}
        <nav className="p-4 pt-16 md:pt-4 space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenus[index];

            return (
              <div key={index}>
                {/* Main Menu Item */}
                <div
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => hasSubmenu && toggleSubmenu(index)}
                >
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 flex-1 ${
                        isActive ? 'text-primary font-semibold' : 'text-secondary dark:text-light'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                  {hasSubmenu && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  )}
                </div>

                {/* Submenu */}
                {hasSubmenu && isExpanded && (
                  <div className="ml-8 space-y-1 mt-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                    {item.submenu.map((subitem, subindex) => (
                      <NavLink
                        key={subindex}
                        to={subitem.path}
                        className={({ isActive }) =>
                          `block p-2 text-sm rounded transition-colors ${
                            isActive
                              ? 'text-primary font-semibold bg-blue-50 dark:bg-blue-900'
                              : 'text-secondary dark:text-light hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`
                        }
                        onClick={onClose}
                      >
                        {subitem.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
