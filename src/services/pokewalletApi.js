const API_KEY = import.meta.env.VITE_POKEWALLET_API_KEY;
const BASE_URL = window.location.hostname === 'localhost' 
  ? '/api/pokewallet' 
  : 'https://api.pokewallet.io';

console.log('PokéWallet base:', BASE_URL);

async function apiRequest(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    mode: 'cors',
    headers: {
      'X-API-Key': API_KEY || '',
    },
  });

  if (!response.ok) {
    throw new Error(`PokéWallet API Error: ${response.status}`);
  }

  return response.json();
}

export default {
  searchCards: async (query, options = {}) => {
    const params = new URLSearchParams({
      q: query,
      page: options.page || 1,
      limit: options.limit || 20,
    });

    return apiRequest(`/search?${params}`);
  },

  getCardById: async (id) => {
    return apiRequest(`/cards/${id}`);
  },

  getSets: async () => {
    return apiRequest('/sets');
  },

  getImage: async (id, size = 'high') => {
    const response = await fetch(`${BASE_URL}/images/${id}?size=${size}`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    return response.blob();
  },
};

export function formatPokemonCard(card) {
  const info = card.card_info || {};
  const tcgPrice = card.tcgplayer?.prices?.[0];
  const cmPrice = card.cardmarket?.prices?.[0];

  const price = tcgPrice?.market_price || tcgPrice?.low_price || cmPrice?.avg || cmPrice?.trend || 0;
  const priceFoil = tcgPrice?.sub_type_name === 'Holofoil' ? tcgPrice?.market_price : null;

  return {
    id: card.id,
    name: info.name,
    game: 'Pokemon',
    set: info.set_name || 'Unknown Set',
    setCode: info.set_code || info.set_id,
    rarity: info.rarity?.toLowerCase() || 'rare',
    price: parseFloat(price).toFixed(2),
    priceFoil: priceFoil ? parseFloat(priceFoil).toFixed(2) : null,
    image: null,
    imageLarge: null,
    types: info.card_type,
    supertype: info.stage,
    stock: 1,
    active: true,
    description: info.card_text || '',
    condition: 'NM',
    pokemonId: card.id,
  };
}