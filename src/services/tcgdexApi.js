// Use Vite proxy to avoid CORS issues
export default {
  searchCards: async (query, options = {}) => {
    const limit = options.limit || 20;
    
    const response = await fetch(
      `/api/tcgdex/cards?name=${encodeURIComponent(query)}&pagination:itemsPerPage=${limit}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    return response.json();
  },

  getCardById: async (id) => {
    const response = await fetch(`/api/tcgdex/cards/${id}`);
    
    if (!response.ok) {
      throw new Error(`TCGdex API Error: ${response.status}`);
    }
    
    return response.json();
  },
};