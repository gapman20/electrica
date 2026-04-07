// API Service - Solo usa API real (Supabase backend)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log(`🔌 API: ${API_BASE_URL}`);

// Helper for making API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const errorMsg = data.error || `API Error: ${response.status}`;
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

// Normalize game field from object to string
export const normalizeGame = (item) => {
  if (!item) return item;
  const normalized = { ...item };
  if (item.game && typeof item.game === 'object') {
    normalized.game = item.game.name;
    normalized.gameDisplayName = item.game.displayName;
  }
  return normalized;
};

// Helper to get game as string (handles both object and string formats)
export const getGameValue = (game) => {
  if (!game) return '';
  if (typeof game === 'string') return game;
  if (typeof game === 'object') return game.name || '';
  return String(game);
};

// ─── Card API ────────────────────────────────────────────────────────────────
export const cardApi = {
  getAll: async () => {
    const data = await apiRequest('/cards');
    return (data.cards || []).map(normalizeGame);
  },

  getById: async (id) => {
    const card = await apiRequest(`/cards/${id}`);
    return normalizeGame(card);
  },

  create: async (card) => {
    return await apiRequest('/cards', { method: 'POST', body: JSON.stringify(card) });
  },

  update: async (id, updates) => {
    return await apiRequest(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  },

  delete: async (id) => {
    return await apiRequest(`/cards/${id}`, { method: 'DELETE' });
  },
};

// ─── Product API (Sellados) ────────────────────────────────────────────────────────
export const productApi = {
  getAll: async () => {
    const data = await apiRequest('/products');
    return (data.products || []).map(normalizeGame);
  },

  getById: async (id) => {
    const product = await apiRequest(`/products/${id}`);
    return normalizeGame(product);
  },

  create: async (product) => {
    return await apiRequest('/products', { method: 'POST', body: JSON.stringify(product) });
  },

  update: async (id, updates) => {
    return await apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  },

  delete: async (id) => {
    return await apiRequest(`/products/${id}`, { method: 'DELETE' });
  },
};

// ─── Cart API ────────────────────────────────────────────────────────────────
export const cartApi = {
  get: async () => {
    const data = await apiRequest('/cart');
    return data || [];
  },

  add: async (item) => {
    const { cardId, productId, quantity = 1 } = item;
    const data = await apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify({ cardId, productId, quantity })
    });
    return data;
  },

  update: async (id, quantity) => {
    const data = await apiRequest(`/cart/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
    return data;
  },

  remove: async (id) => {
    await apiRequest(`/cart/${id}`, { method: 'DELETE' });
    return true;
  },

  clear: async () => {
    await apiRequest('/cart', { method: 'DELETE' });
    return true;
  },

  merge: async (items) => {
    const data = await apiRequest('/cart/merge', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
    return data || [];
  },
};

// ─── Order API ───────────────────────────────────────────────────────────────
export const orderApi = {
  getAll: async () => {
    const data = await apiRequest('/orders');
    return data.orders || [];
  },

  getMyOrders: async () => {
    const data = await apiRequest('/orders/my-orders');
    return data || [];
  },

  getById: async (id) => {
    return await apiRequest(`/orders/${id}`);
  },

  create: async (orderData) => {
    return await apiRequest('/orders', { method: 'POST', body: JSON.stringify(orderData) });
  },

  updateStatus: async (id, status, trackingNumber) => {
    return await apiRequest(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, trackingNumber }) });
  },

  lookup: async (orderId, email) => {
    const order = await apiRequest(`/orders/${orderId}`);
    if (order.customerEmail?.toLowerCase() === email.toLowerCase()) {
      return order;
    }
    return null;
  },
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email, password) => {
    try {
      const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('is_authenticated', 'true');
        localStorage.setItem('tcg_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  },

  adminLogin: async (email, password) => {
    try {
      const data = await apiRequest('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('is_authenticated', 'true');
        localStorage.setItem('tcg_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  },

  register: async (email, password, name) => {
    try {
      const data = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
      if (data.user && data.token) {
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  },

  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tcg_user');
    return true;
  },

  changePassword: async (oldPass, newPass) => {
    const data = await apiRequest('/users/password', { method: 'PUT', body: JSON.stringify({ currentPassword: oldPass, newPassword: newPass }) });
    return data.message === 'Password updated successfully';
  },

  isAuthenticated: () => {
    return localStorage.getItem('is_authenticated') === 'true';
  },

  getUser: () => {
    const user = localStorage.getItem('tcg_user');
    return user ? JSON.parse(user) : null;
  },
};

// ─── Wishlist API ──────────────────────────────────────────────────────────────
export const wishlistApi = {
  get: async () => {
    const data = await apiRequest('/wishlist');
    return data || [];
  },

  add: async (item) => {
    const { cardId, productId } = item;
    const data = await apiRequest('/wishlist', { 
      method: 'POST', 
      body: JSON.stringify({ cardId, productId }) 
    });
    return data;
  },

  remove: async (item) => {
    const { cardId, productId } = item;
    const type = cardId ? 'card' : 'product';
    const id = cardId || productId;
    await apiRequest(`/wishlist/${type}/${id}`, { method: 'DELETE' });
    return true;
  },
};

// ─── Game API ─────────────────────────────────────────────────────────────────
export const gameApi = {
  getAll: async () => {
    return await apiRequest('/games');
  },
};

// ─── Site Content API ────────────────────────────────────────────────────────
export const siteApi = {
  getContent: async () => {
    return await apiRequest('/site/config');
  },

  saveContent: async (content) => {
    return await apiRequest('/site/config', { method: 'PUT', body: JSON.stringify(content) });
  },
};

// ─── Image Upload API ─────────────────────────────────────────────────────────
export const imageApi = {
  upload: async (file, folder = 'misc') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return await apiRequest('/upload', { method: 'POST', body: formData, headers: {} });
  },
};

export default {
  cards: cardApi,
  products: productApi,
  cart: cartApi,
  orders: orderApi,
  auth: authApi,
  wishlist: wishlistApi,
  games: gameApi,
  site: siteApi,
  images: imageApi,
};

// ─── Contact API ──────────────────────────────────────────────────────────────
export const contactApi = {
  send: async (data) => {
    return await apiRequest('/contact', { method: 'POST', body: JSON.stringify(data) });
  },
  getAll: async () => {
    return await apiRequest('/contact');
  },
  markRead: async (id) => {
    return await apiRequest(`/contact/${id}/read`, { method: 'PUT' });
  },
  delete: async (id) => {
    return await apiRequest(`/contact/${id}`, { method: 'DELETE' });
  },
};
