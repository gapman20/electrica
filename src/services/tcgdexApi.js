// Use backend proxy to avoid CORS issues
const API_URL = import.meta.env.VITE_API_URL || '/api';

export default {
  searchCards: async (query, options = {}) => {
    const limit = options.limit || 20;
    
    const response = await fetch(
      `${API_URL}/tcgdex/pokemon/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    return response.json();
  },

  // Get full card details by ID
  getCardById: async (id) => {
    const response = await fetch(`${API_URL}/tcgdex/pokemon/card/${id}`);
    
    if (!response.ok) {
      throw new Error(`TCGdex API Error: ${response.status}`);
    }
    
    return response.json();
  },
};