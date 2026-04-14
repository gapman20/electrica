const SCRYDEX_BASE_URL = 'https://api.scrydex.com';

const getApiKey = () => import.meta.env.VITE_SCRYDEX_API_KEY;

async function apiRequest(game, endpoint) {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('Scrydex API key not configured. Add VITE_SCRYDEX_API_KEY to your .env file.');
  }

  const response = await fetch(`${SCRYDEX_BASE_URL}/${game}/v1${endpoint}`, {
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Scrydex API Error: ${response.status}`);
  }

  return response.json();
}

export const scrydexApi = {
  // Pokémon TCG
  pokemon: {
    searchCards: async (query, options = {}) => {
      const params = new URLSearchParams({
        q: query,
        pageSize: options.limit || 20,
        page: options.page || 1,
      });
      return apiRequest('pokemon', `/cards?${params}`);
    },

    getCardById: async (id) => {
      return apiRequest('pokemon', `/cards/${id}`);
    },

    getCardsBySet: async (setId) => {
      return apiRequest('pokemon', `/cards?q=set.id:${setId}`);
    },

    getSets: async () => {
      return apiRequest('pokemon', '/sets');
    },
  },

  // Magic: The Gathering (using 'tcg' based on docs)
  magic: {
    searchCards: async (query, options = {}) => {
      const params = new URLSearchParams({
        q: query,
        pageSize: options.limit || 20,
        page: options.page || 1,
      });
      return apiRequest('tcg', `/cards?${params}`);
    },

    getCardById: async (id) => {
      return apiRequest('tcg', `/cards/${id}`);
    },

    getSets: async () => {
      return apiRequest('tcg', '/sets');
    },
  },
};

export function formatScrydexCard(card, game) {
  const gameMap = {
    pokemon: 'pokemon',
    tcg: 'magic',
    magic: 'magic',
  };

  if (game === 'pokemon') {
    return {
      id: card.id,
      name: card.name,
      game: 'Pokemon',
      set: card.set?.name || card.setName,
      setCode: card.set?.ptcgoCode || card.setCode,
      rarity: card.rarity?.toLowerCase(),
      price: card.tcgprices?.normal?.average || card.cardmarket?.avgPrice || 0,
      priceFoil: card.tcgprices?.holofoil?.average || card.cardmarket?.foilAvgPrice || null,
      stock: 1,
      imageUrl: card.images?.large || card.images?.small,
      description: card.text || card.ability?.description,
      scryfallId: card.id,
    };
  }

  // For Magic/Tcg
  return {
    id: card.id,
    name: card.name,
    game: game === 'tcg' ? 'magic' : game,
    set: card.set?.name || card.set?.name,
    setCode: card.set?.ptcgoCode,
    rarity: card.rarity?.toLowerCase(),
    price: card.prices?.usd || 0,
    priceFoil: card.prices?.usd_foil,
    stock: 1,
    imageUrl: card.image_uris?.normal || card.image_uris?.small,
    description: card.oracle_text || card.text,
    scryfallId: card.id,
  };
}