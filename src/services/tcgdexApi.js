const TCGDEX_BASE_URL = 'https://api.tcgdex.net/v2';

export default {
  searchCards: async (query, options = {}) => {
    const lang = options.lang || 'en';
    const limit = options.limit || 20;
    const page = options.page || 1;
    
    // First get the list of cards
    const response = await fetch(
      `${TCGDEX_BASE_URL}/${lang}/cards?name=${encodeURIComponent(query)}&pagination:page=${page}&pagination:itemsPerPage=${limit}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    return response.json();
  },

  // Get full card details by ID
  getCardById: async (id, options = {}) => {
    const lang = options.lang || 'en';
    const response = await fetch(`${TCGDEX_BASE_URL}/${lang}/cards/${id}`);
    
    if (!response.ok) {
      throw new Error(`TCGdex API Error: ${response.status}`);
    }
    
    return response.json();
  },

  getSets: async (options = {}) => {
    const lang = options.lang || 'en';
    const response = await fetch(`${TCGDEX_BASE_URL}/${lang}/sets`);
    
    if (!response.ok) {
      throw new Error(`TCGdex API Error: ${response.status}`);
    }
    
    return response.json();
  },
};