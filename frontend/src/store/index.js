import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  setUser: (user) => {
    set({ user });
    localStorage.setItem('user', JSON.stringify(user));
  },

  setToken: (token) => {
    set({ token });
    localStorage.setItem('access_token', token);
  },

  login: (user, token) => {
    set({ user, token });
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('access_token', token);
  },

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
  },

  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export const useBusinessStore = create((set) => ({
  currentBusiness: JSON.parse(localStorage.getItem('currentBusiness') || 'null'),
  businesses: [],

  setCurrentBusiness: (business) => {
    set({ currentBusiness: business });
    localStorage.setItem('currentBusiness', JSON.stringify(business));
  },

  setBusinesses: (businesses) => set({ businesses }),
}));

export const useCartStore = create((set, get) => ({
  items: [],
  discount: 0,

  addItem: (product, quantity) => {
    const { items } = get();
    const existingItem = items.find(item => item.product_id === product.id);
    
    if (existingItem) {
      set({
        items: items.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      });
    } else {
      set({
        items: [...items, {
          product_id: product.id,
          product_name: product.product_name,
          unit: product.unit,
          unit_price: product.selling_price,
          quantity: quantity,
          tax_percentage: product.gst_percentage || 0,
        }]
      });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter(item => item.product_id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    set({
      items: get().items.map(item =>
        item.product_id === productId ? { ...item, quantity } : item
      )
    });
  },

  updatePrice: (productId, newPrice) => {
    set({
      items: get().items.map(item =>
        item.product_id === productId ? { ...item, unit_price: parseFloat(newPrice) || 0 } : item
      )
    });
  },
  setDiscount: (discount) => set({ discount }),

  clearCart: () => set({ items: [], discount: 0 }),

  getTotal: () => {
    const { items, discount } = get();
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const tax = items.reduce((sum, item) => sum + ((item.unit_price * item.quantity * item.tax_percentage) / 100), 0);
    const grand_total = subtotal + tax - discount;
    return { subtotal, tax, discount, grand_total };
  },
}));

export const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('theme') === 'dark',

  toggleTheme: () => {
    set((state) => {
      const newTheme = !state.isDark;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      if (newTheme) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDark: newTheme };
    });
  },
}));
