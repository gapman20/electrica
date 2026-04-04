import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Heart, Search, SlidersHorizontal, X, Grid, List } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../components/Toast';
import SEO from '../components/SEO';
import { productApi } from '../services/api';

const GAMES = [
  { id: 'all', name: 'Todos', icon: '🎯', color: '#6366f1' },
  { id: 'pokemon', name: 'Pokémon TCG', icon: '🔴', color: '#ef4444' },
  { id: 'yugioh', name: 'Yu-Gi-Oh!', icon: '💛', color: '#f59e0b' },
  { id: 'magic', name: 'Magic: The Gathering', icon: '🔵', color: '#3b82f6' },
  { id: 'digimon', name: 'Digimon', icon: '🟣', color: '#8b5cf6' },
  { id: 'dragonball', name: 'Dragon Ball', icon: '🟠', color: '#f97316' },
  { id: 'onepiece', name: 'One Piece', icon: '🏴‍☠️', color: '#dc2626' },
  { id: 'lorcana', name: 'Lorcana', icon: '✨', color: '#ec4899' },
];

const SORT_OPTIONS = [
  { id: 'name-asc', name: 'Nombre A-Z' },
  { id: 'name-desc', name: 'Nombre Z-A' },
  { id: 'price-asc', name: 'Precio: Menor a Mayor' },
  { id: 'price-desc', name: 'Precio: Mayor a Menor' },
  { id: 'discount', name: 'Mayor Descuento' }
];

const PRODUCT_TYPES = [
  { id: 'all', name: 'Todos' },
  { id: 'booster-box', name: 'Booster Box' },
  { id: 'elite-trainer', name: 'Elite Trainer Box' },
  { id: 'deck', name: 'Deck' },
  { id: 'bundle', name: 'Bundle' },
  { id: 'starter', name: 'Starter Deck' },
  { id: 'blister', name: 'Blister' },
  { id: 'premium', name: 'Premium' }
];

const formatPrice = (price) => {
  if (typeof price === 'number') {
    return `$${price.toLocaleString('es-MX')}`;
  }
  return price || '';
};

const normalizeSealedProduct = (product) => ({
  ...product,
  price: product.price || 0,
  priceDisplay: product.priceDisplay || formatPrice(product.price),
  game: product.game || 'pokemon',
  set: product.set || '',
  type: product.type || 'booster-box',
  stock: product.stock ?? 1,
  discountPercent: product.discountPercent || 0
});

const SealedProductCard = ({ product, onAddToCart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isInWishlist, toggleItem } = useWishlist();
  const toast = useToast();
  const isLoggedIn = !!localStorage.getItem('tcg_user');
  
  const hasDiscount = product.discountPercent > 0;
  const badgeClass = product.badge ? product.badge.toLowerCase().replace(/[^a-z]/g, '') : '';
  const wishlisted = isInWishlist(product.id, 'product');
  
  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const wasAdded = toggleItem({ ...product, type: 'product' });
    if (wasAdded) {
      toast.success(`${product.name} añadido a favoritos`);
    } else {
      toast.info(`${product.name} eliminado de favoritos`);
    }
  };
  
  return (
    <div 
      className="tcg-product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-image-container">
        {product.image ? (
          <img src={product.image} alt={product.name} className="product-image" />
        ) : (
          <div className="product-placeholder">
            <Package size={48} color="var(--text-secondary)" />
          </div>
        )}
        
        {product.badge && (
          <span className={`product-badge badge-${badgeClass}`}>
            {product.badge}
          </span>
        )}
        
        {hasDiscount && (
          <span className="product-badge badge-oferta">
            -{product.discountPercent}% OFF
          </span>
        )}
        
        <div className={`product-actions ${isHovered || window.innerWidth < 768 ? 'visible' : ''}`}>
          {isLoggedIn && (
            <button 
              className="action-btn wishlist-btn"
              onClick={handleToggleWishlist}
            >
              <Heart size={20} fill={wishlisted ? 'var(--accent-gold)' : 'none'} color={wishlisted ? 'var(--accent-gold)' : 'currentColor'} />
            </button>
          )}
          <button className="action-btn cart-btn" onClick={() => onAddToCart(product)}>
            <ShoppingCart size={20} />
          </button>
        </div>
        
        {product.stock === 0 && (
          <div className="product-soldout-overlay">
            <span>Agotado</span>
          </div>
        )}
      </div>
      
      <div className="product-info">
        <div className="product-tags">
          {product.game && <span className="product-tag">{product.game}</span>}
          {product.set && <span className="product-tag">{product.type.replace(/-/g, ' ')}</span>}
        </div>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price">
          <span className="price-current">{product.priceDisplay}</span>
        </div>
        <button 
          className="add-to-cart-btn"
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
        </button>
      </div>
    </div>
  );
};

const Products = () => {
  const { addItem, itemCount } = useCart();
  
  const [productsData, setProductsData] = useState([]);
  const [selectedGame, setSelectedGame] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(false);
      try {
        const products = await productApi.getAll();
        setProductsData(products.map(product => ({
          ...product,
          image: product.imageUrl,
          game: typeof product.game === 'object' ? product.game.name : product.game,
          priceDisplay: formatPrice(product.price)
        })));
      } catch (e) {
        console.error('Error loading products from API:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const products = useMemo(() => {
    let filtered = [...productsData];
    
    if (selectedGame !== 'all') {
      filtered = filtered.filter(p => p.game === selectedGame);
    }
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType);
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
      case 'discount':
        filtered.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
        break;
      default:
        break;
    }
    
    return filtered;
  }, [productsData, selectedGame, selectedType, sortBy]);

  const handleAddToCart = (product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      game: product.game,
      stock: product.stock
    });
  };
  
  const clearFilters = () => {
    setSelectedGame('all');
    setSelectedType('all');
    setSortBy('name-asc');
  };

  const activeFiltersCount = [
    selectedGame !== 'all',
    selectedType !== 'all'
  ].filter(Boolean).length;

  const discountedCount = productsData.filter(p => p.originalPrice && p.originalPrice > p.price).length;

  return (
    <div className="catalog-page">
      <SEO 
        title="Productos Sellados" 
        description="Booster Boxes, Elite Trainer Box, Decks y más productos sellados TCG."
      />
      
      {/* Header */}
      <div className="catalog-header">
        <div className="catalog-header-content">
          <h1>Productos Sellados</h1>
          <p>Booster Boxes, ETBs, Decks, Bundles y más</p>
        </div>
      </div>
      
      <div className="catalog-container">
        {/* Game Categories Tabs - Horizontal Scroll */}
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
        
        {/* Controls Bar */}
        <div className="catalog-controls">
          <div className="catalog-actions">
            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(true)}
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
        
        {/* Results Info */}
        <div className="catalog-results-info">
          <span>Mostrando {products.length} producto{products.length !== 1 ? 's' : ''}</span>
          {selectedGame !== 'all' && (
            <span className="active-filter">
              {GAMES.find(g => g.id === selectedGame)?.name}
            </span>
          )}
          {discountedCount > 0 && (
            <span className="discount-indicator">
              🔥 {discountedCount} en oferta
            </span>
          )}
        </div>
        
        {/* Products Grid */}
        {loading ? (
          <div className="catalog-empty">
            <span className="empty-icon">⏳</span>
            <h3>Cargando productos...</h3>
          </div>
        ) : error ? (
          <div className="catalog-empty">
            <span className="empty-icon">⚠️</span>
            <h3>No se pudo cargar los productos</h3>
            <p>Revisa tu conexión e intenta de nuevo</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        ) : products.length > 0 ? (
          <div className={`catalog-products ${viewMode}`}>
            {products.map(product => (
              <SealedProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart} 
              />
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <span className="empty-icon">📦</span>
            <h3>No hay productos disponibles</h3>
            <p>Revisa el backend y la base de datos</p>
          </div>
        )}
      </div>

      {/* Mobile Cart FAB */}
      {itemCount > 0 && (
        <Link to="/carrito" className="mobile-cart-fab">
          <ShoppingCart size={24} />
          <span className="mobile-cart-badge">{itemCount}</span>
          <span className="mobile-cart-text">Ver Carrito</span>
        </Link>
      )}

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="filters-modal-overlay" onClick={() => setShowFilters(false)}>
          <div className="filters-modal" onClick={e => e.stopPropagation()}>
            <div className="filters-modal-header">
              <h3>Filtros</h3>
              <button className="filters-modal-close" onClick={() => setShowFilters(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="filters-modal-content">
              <div className="filter-section">
                <h4>Juego</h4>
                <div className="filter-chips">
                  {GAMES.map(game => (
                    <button
                      key={game.id}
                      className={`filter-chip ${selectedGame === game.id ? 'active' : ''}`}
                      onClick={() => setSelectedGame(game.id)}
                      style={game.id !== 'all' ? { borderColor: game.color, color: game.color } : {}}
                    >
                      {game.icon} {game.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="filter-section">
                <h4>Tipo de Producto</h4>
                <div className="filter-chips">
                  {PRODUCT_TYPES.map(type => (
                    <button
                      key={type.id}
                      className={`filter-chip ${selectedType === type.id ? 'active' : ''}`}
                      onClick={() => setSelectedType(type.id)}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="filters-modal-footer">
              <button className="btn-outline" onClick={clearFilters}>
                Limpiar filtros
              </button>
              <button className="btn-primary" onClick={() => setShowFilters(false)}>
                Aplicar ({products.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
