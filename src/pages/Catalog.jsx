import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Grid, List, Filter, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../components/Toast';
import SEO from '../components/SEO';
import { cardApi, gameApi } from '../services/api';

const CARDS_KEY = 'tcg_cards';

const formatPrice = (price) => {
  if (typeof price === 'number') {
    return `$${price.toLocaleString('es-MX')}`;
  }
  return price || '';
};

const normalizeCard = (card) => ({
  ...card,
  price: card.price || 0,
  priceDisplay: card.priceDisplay || formatPrice(card.price),
  game: card.game || 'pokemon',
  set: card.set || '',
  rarity: card.rarity || 'common',
  stock: card.stock ?? 1
});

const GAMES = [
  { id: 'all', name: 'Todos', icon: '🎴', color: '#6366f1' },
  { id: 'pokemon', name: 'Pokémon TCG', icon: '🔴', color: '#ef4444' },
  { id: 'yugioh', name: 'Yu-Gi-Oh!', icon: '💛', color: '#f59e0b' },
  { id: 'magic', name: 'Magic: The Gathering', icon: '🔵', color: '#3b82f6' },
  { id: 'digimon', name: 'Digimon', icon: '🟣', color: '#8b5cf6' },
  { id: 'dragonball', name: 'Dragon Ball', icon: '🟠', color: '#f97316' },
  { id: 'onepiece', name: 'One Piece', icon: '🏴‍☠️', color: '#dc2626' },
  { id: 'lorcana', name: 'Lorcana', icon: '✨', color: '#ec4899' },
];

const RARITIES = [
  { id: 'all', name: 'Todas' },
  { id: 'common', name: 'Común' },
  { id: 'uncommon', name: 'Poco Común' },
  { id: 'rare', name: 'Rara' },
  { id: 'holo', name: 'Holoview' },
  { id: 'ultra', name: 'Ultra Rare' },
  { id: 'secret', name: 'Secret Rare' },
  { id: 'full-art', name: 'Full Art' },
  { id: 'alternate-art', name: 'Alternate Art' }
];

const SORT_OPTIONS = [
  { id: 'name-asc', name: 'Nombre A-Z' },
  { id: 'name-desc', name: 'Nombre Z-A' },
  { id: 'price-asc', name: 'Precio: Menor a Mayor' },
  { id: 'price-desc', name: 'Precio: Mayor a Menor' }
];

const sampleSingles = [
  { id: 'c1', name: 'Charizard ex', price: 2500, priceDisplay: '$2,500', game: 'pokemon', set: 'Phantasmal Flames', rarity: 'ultra', image: null, stock: 3 },
  { id: 'c2', name: 'Mewtwo ex', price: 800, priceDisplay: '$800', game: 'pokemon', set: 'Destined Rivals', rarity: 'rare', image: null, stock: 5 },
  { id: 'c3', name: 'Garchomp ex SIR', price: 5100, priceDisplay: '$5,100', game: 'pokemon', set: 'Destined Rivals', rarity: 'secret', badge: 'Popular', image: null, stock: 1 },
  { id: 'c4', name: 'Blue-Eyes White Dragon', price: 1200, priceDisplay: '$1,200', game: 'yugioh', set: 'Structure Deck', rarity: 'rare', image: null, stock: 4 },
  { id: 'c5', name: 'Dark Magician', price: 600, priceDisplay: '$600', game: 'yugioh', set: 'Structure Deck', rarity: 'rare', image: null, stock: 6 },
  { id: 'c6', name: 'Omnipotence Alpha', price: 450, priceDisplay: '$450', game: 'magic', set: 'Marvel Super Heroes', rarity: 'full-art', image: null, stock: 2 },
  { id: 'c7', name: 'Omnitrix', price: 380, priceDisplay: '$380', game: 'magic', set: 'Marvel Super Heroes', rarity: 'alternate-art', image: null, stock: 3 },
  { id: 'c8', name: 'MetalGarurumon', price: 850, priceDisplay: '$850', game: 'digimon', set: 'BT-15', rarity: 'rare', image: null, stock: 4 },
  { id: 'c9', name: 'Lucemon', price: 1200, priceDisplay: '$1,200', game: 'digimon', set: 'BT-15', rarity: 'ultra', image: null, stock: 2 },
  { id: 'c10', name: 'Luffy Leader', price: 650, priceDisplay: '$650', game: 'onepiece', set: 'OP-10', rarity: 'rare', image: null, stock: 5 },
  { id: 'c11', name: 'Goku Ultra Instinct', price: 1800, priceDisplay: '$1,800', game: 'dragonball', set: 'Series 2', rarity: 'ultra', badge: 'Nuevo', image: null, stock: 2 },
  { id: 'c12', name: 'Skyla Full Art Promo', price: 7500, priceDisplay: '$7,500', game: 'pokemon', set: 'Promo', rarity: 'full-art', badge: 'Rara', image: null, stock: 1 },
  { id: 'c13', name: 'Pikachu ex', price: 350, priceDisplay: '$350', game: 'pokemon', set: 'Scarlet & Violet', rarity: 'rare', image: null, stock: 10 },
  { id: 'c14', name: 'Venusaur ex', price: 1200, priceDisplay: '$1,200', game: 'pokemon', set: 'Paldea Evolved', rarity: 'ultra', image: null, stock: 3 },
  { id: 'c15', name: 'Dark Magician Girl', price: 400, priceDisplay: '$400', game: 'yugioh', set: 'Structure Deck', rarity: 'holo', image: null, stock: 7 },
  { id: 'c16', name: 'Spider-Man Collector', price: 2800, priceDisplay: '$2,800', game: 'magic', set: 'Marvel Spider-Man', rarity: 'alternate-art', image: null, stock: 1 }
];

const RARITY_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  holo: '#8b5cf6',
  ultra: '#f59e0b',
  secret: '#ef4444',
  'full-art': '#ec4899',
  'alternate-art': '#06b6d4'
};

const SingleCard = ({ card, onAddToCart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isInWishlist, toggleItem } = useWishlist();
  const toast = useToast();
  
  const rarityColor = RARITY_COLORS[card.rarity] || '#9ca3af';
  const wishlisted = isInWishlist(card.id);
  
  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const wasAdded = toggleItem(card);
    if (wasAdded) {
      toast.success(`${card.name} añadido a favoritos`);
    } else {
      toast.info(`${card.name} eliminado de favoritos`);
    }
  };
  
  return (
    <div 
      className="tcg-product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-image-container">
        {card.image ? (
          <img src={card.image} alt={card.name} className="product-image" />
        ) : (
          <div className="product-placeholder">
            <span>{GAMES.find(g => g.id === card.game)?.icon || '🎴'}</span>
          </div>
        )}
        
        <div className="single-card-rarity" style={{ background: rarityColor }}>
          {card.rarity?.replace(/-/g, ' ')}
        </div>
        
        {card.badge && (
          <span className="product-badge badge-nuevo">{card.badge}</span>
        )}
        
        <div className={`product-actions ${isHovered || window.innerWidth < 768 ? 'visible' : ''}`}>
          <button 
            className="action-btn wishlist-btn"
            onClick={handleToggleWishlist}
          >
            <Heart size={20} fill={wishlisted ? 'var(--accent-gold)' : 'none'} color={wishlisted ? 'var(--accent-gold)' : 'currentColor'} />
          </button>
          <button className="action-btn cart-btn" onClick={() => onAddToCart(card)}>
            <ShoppingCart size={20} />
          </button>
        </div>
        
        {card.stock === 0 && (
          <div className="product-soldout-overlay">
            <span>Agotado</span>
          </div>
        )}
      </div>
      
      <div className="product-info">
        <div className="product-tags">
          <span className="product-tag">{card.game}</span>
          <span className="product-tag">{card.set}</span>
        </div>
        <h3 className="product-name">{card.name}</h3>
        <div className="product-price">
          <span className="price-current">{card.priceDisplay}</span>
        </div>
        <button 
          className="add-to-cart-btn"
          onClick={() => onAddToCart(card)}
          disabled={card.stock === 0}
        >
          {card.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
        </button>
      </div>
    </div>
  );
};

const Catalog = () => {
  const { addItem } = useCart();
  
  const [cardsData, setCardsData] = useState([]);
  const [selectedGame, setSelectedGame] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      setError(false);
      try {
        const cards = await cardApi.getAll();
        setCardsData(cards.map(card => ({
          ...card,
          image: card.imageUrl,
          game: typeof card.game === 'object' ? card.game.name : card.game,
          priceDisplay: formatPrice(card.price)
        })));
      } catch (e) {
        console.error('Error loading cards from API:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, []);

  const cards = useMemo(() => {
    let filtered = [...cardsData];
    
    if (selectedGame !== 'all') {
      filtered = filtered.filter(c => c.game === selectedGame);
    }
    
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(c => c.rarity === selectedRarity);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.set.toLowerCase().includes(query)
      );
    }
    
    switch (sortBy) {
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }
    
    return filtered;
  }, [cardsData, selectedGame, selectedRarity, sortBy, searchQuery]);

  const handleAddToCart = (card) => {
    addItem({
      id: card.id,
      name: card.name,
      price: card.price,
      image: card.image,
      game: card.game
    });
  };
  
  const clearFilters = () => {
    setSelectedGame('all');
    setSelectedRarity('all');
    setSearchQuery('');
    setSortBy('name-asc');
  };

  const activeFiltersCount = [
    selectedGame !== 'all',
    selectedRarity !== 'all',
    searchQuery !== ''
  ].filter(Boolean).length;

  return (
    <div className="catalog-page">
      <SEO 
        title="Cartas Sueltas" 
        description="Encuentra las mejores cartas sueltas de Pokémon, Yu-Gi-Oh!, Magic, Digimon y más."
      />
      
      {/* Header */}
      <div className="catalog-header">
        <div className="catalog-header-content">
          <h1>Cartas Sueltas</h1>
          <p>Raras, Ultra Rares, Full Arts y más</p>
        </div>
      </div>
      
      <div className="catalog-container">
        {/* Game Categories Tabs */}
        <div className="catalog-game-tabs">
          {GAMES.map(game => (
            <button
              key={game.id}
              className={`game-tab ${selectedGame === game.id ? 'active' : ''}`}
              onClick={() => setSelectedGame(game.id)}
              style={{ '--tab-color': game.color }}
            >
              <span className="game-tab-icon">{game.icon}</span>
              <span className="game-tab-name">{game.name}</span>
            </button>
          ))}
        </div>
        
        {/* Search and Controls Bar */}
        <div className="catalog-controls">
          <div className="catalog-search">
            <Search size={20} />
            <input
              type="text"
              placeholder="Buscar carta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                <X size={18} />
              </button>
            )}
          </div>
          
          <div className="catalog-actions">
            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={20} />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="filter-count">{activeFiltersCount}</span>
              )}
            </button>
            
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
            
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={20} />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filter-section">
              <h4>Rareza</h4>
              <div className="filter-chips">
                {RARITIES.map(rarity => (
                  <button
                    key={rarity.id}
                    className={`filter-chip ${selectedRarity === rarity.id ? 'active' : ''}`}
                    onClick={() => setSelectedRarity(rarity.id)}
                    style={rarity.id !== 'all' ? { borderColor: RARITY_COLORS[rarity.id], color: RARITY_COLORS[rarity.id] } : {}}
                  >
                    {rarity.name}
                  </button>
                ))}
              </div>
            </div>
            
            {activeFiltersCount > 0 && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                <X size={16} /> Limpiar filtros
              </button>
            )}
          </div>
        )}
        
        {/* Results Info */}
        <div className="catalog-results-info">
          <span>Mostrando {cards.length} carta{cards.length !== 1 ? 's' : ''}</span>
          {selectedGame !== 'all' && (
            <span className="active-filter">
              {GAMES.find(g => g.id === selectedGame)?.name}
            </span>
          )}
        </div>
        
        {/* Cards Grid */}
        {loading ? (
          <div className="catalog-empty">
            <span className="empty-icon">⏳</span>
            <h3>Cargando cartas...</h3>
          </div>
        ) : error ? (
          <div className="catalog-empty">
            <span className="empty-icon">⚠️</span>
            <h3>No se pudo cargar las cartas</h3>
            <p>Revisa tu conexión e intenta de nuevo</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        ) : cards.length > 0 ? (
          <div className={`single-cards-grid ${viewMode}`}>
            {cards.map(card => (
              <SingleCard 
                key={card.id} 
                card={card} 
                onAddToCart={handleAddToCart} 
              />
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <span className="empty-icon">🎴</span>
            <h3>No hay cartas disponibles</h3>
            <p>Revisa el backend y la base de datos</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;
