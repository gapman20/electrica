import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../components/Toast';
import SEO from '../components/SEO';
import { cardApi, productApi, getGameValue } from '../services/api';

const GAMES = {
  pokemon: { name: 'Pokémon TCG', icon: '🔴', color: '#ef4444' },
  yugioh: { name: 'Yu-Gi-Oh!', icon: '💛', color: '#f59e0b' },
  magic: { name: 'Magic: The Gathering', icon: '🔵', color: '#3b82f6' },
  digimon: { name: 'Digimon', icon: '🟣', color: '#8b5cf6' },
  onepiece: { name: 'One Piece', icon: '🏴‍☠️', color: '#dc2626' },
  dragonball: { name: 'Dragon Ball', icon: '🟠', color: '#f97316' },
  lorcana: { name: 'Disney Lorcana', icon: '✨', color: '#ec4899' }
};

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

const formatPrice = (price) => `$${Number(price).toLocaleString('es-MX')}`;

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        let found = null;
        let isSealed = false;

        try {
          const card = await cardApi.getById(id);
          if (card) {
            found = {
              ...card,
              image: card.imageUrl,
              game: typeof card.game === 'object' ? card.game.name : card.game
            };
            isSealed = false;
          }
        } catch (e) {
          // No es carta
        }

        if (!found) {
          try {
            const prod = await productApi.getById(id);
            if (prod) {
              found = {
                ...prod,
                image: prod.imageUrl,
                game: typeof prod.game === 'object' ? prod.game.name : prod.game
              };
              isSealed = true;
            }
          } catch (e) {
            // No es producto
          }
        }

        if (found) {
          setProduct({ ...found, isSealed });
          
          const allCards = await cardApi.getAll();
          const allProducts = await productApi.getAll();
          const allItems = [...allCards, ...allProducts].map(item => ({
            ...item,
            image: item.imageUrl,
            game: typeof item.game === 'object' ? item.game.name : item.game
          }));

          const related = allItems
            .filter(p => p.game === found.game && p.id !== found.id)
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (e) {
        console.error('Error loading product:', e);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
    setQuantity(1);
    setAddedToCart(false);
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.image || product.imageUrl,
        game: product.game,
        rarity: product.rarity,
        set: product.set,
        stock: product.stock
      });
    }
    
    setAddedToCart(true);
    toast.success(`${product.name} agregado al carrito`);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    const wasAdded = toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image || product.imageUrl,
      game: product.game,
      rarity: product.rarity,
      set: product.set,
      stock: product.stock,
      type: isSealed ? 'product' : 'card'
    });
    if (wasAdded) {
      toast.success(`${product.name} añadido a favoritos`);
    } else {
      toast.info(`${product.name} eliminado de favoritos`);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div className="spinner" style={{ margin: '0 auto 2rem' }}></div>
        <p>Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 className="h2-premium">Producto no encontrado</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
          Lo sentimos, este producto no está disponible.
        </p>
        <Link to="/catalogo" className="btn-primary" style={{ marginTop: '2rem', display: 'inline-flex' }}>
          Ver Catálogo
        </Link>
      </div>
    );
  }

  const gameKey = typeof product.game === 'object' ? product.game.name : product.game;
  const game = GAMES[gameKey] || { name: product.game, icon: '🎴', color: '#6366f1' };
  const hasDiscount = product.discountPercent > 0 || (product.originalPrice && product.originalPrice > product.price);
  const discountPercent = product.discountPercent || (product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0);
  const isSealed = product.isSealed;
  const rarityColor = product.rarity ? RARITY_COLORS[product.rarity] : null;

  return (
    <div className="page product-detail-page">
      <SEO 
        title={product.name} 
        description={`${product.name} - ${product.set} - ${game.name}`} 
      />
      
      <Link to={isSealed ? "/productos" : "/catalogo"} className="back-link">
        <ArrowLeft size={16} /> 
        {isSealed ? 'Volver a Productos' : 'Volver al Catálogo'}
      </Link>

      <div className="product-detail-grid">
        <div className="product-detail-image glass-card">
          {product.image || product.imageUrl ? (
            <img 
              src={product.image || product.imageUrl} 
              alt={product.name} 
              className="product-detail-img"
            />
          ) : (
            <div className="product-detail-placeholder">{game.icon}</div>
          )}
          
          {(hasDiscount || product.badge) && (
            <div className="product-detail-badges">
              {hasDiscount && (
                <span className="discount-badge">-{discountPercent}% OFF</span>
              )}
              {product.badge && !hasDiscount && (
                <span className="badge-default">{product.badge}</span>
              )}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <div className="product-tags-row">
            <span className="game-tag" style={{ background: `${game.color}20`, color: game.color }}>
              {game.icon} {game.name}
            </span>
            <span className="set-tag">{product.set}</span>
            {product.type && (
              <span className="type-tag">{product.type.replace(/-/g, ' ')}</span>
            )}
          </div>

          <h1 className="product-detail-title">{product.name}</h1>

          {product.rarity && (
            <div className="product-rarity">
              <span style={{ background: `${rarityColor}20`, color: rarityColor }}>
                {product.rarity.replace(/-/g, ' ')}
              </span>
            </div>
          )}

          <div className="product-detail-price">
            {hasDiscount && product.originalPrice && (
              <span className="price-original">{formatPrice(product.originalPrice)}</span>
            )}
            <span className="price-current" style={{ color: hasDiscount ? '#ef4444' : 'var(--accent-gold)' }}>
              {formatPrice(product.price)}
            </span>
          </div>

          <div className="product-stock">
            <p style={{ color: product.stock > 0 ? '#10b981' : '#ef4444' }}>
              {product.stock > 0 ? (
                <><Check size={18} /> En Stock ({product.stock} disponibles)</>
              ) : 'Agotado'}
            </p>
          </div>

          {product.condition && (
            <div className="product-condition">
              <p className="label">Condición</p>
              <p className="value">{product.condition}</p>
            </div>
          )}

          <div className="product-actions-mobile">
            <div className="quantity-controls">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
            </div>
            <button 
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addedToCart}
              className="btn-add-cart-mobile"
            >
              {addedToCart ? <><Check size={20} /> Agregado</> : <><ShoppingCart size={20} /> Agregar al Carrito</>}
            </button>
          </div>

          <div className="product-meta-cards">
            <div className="meta-item">
              <span>📦</span>
              <div>
                <p>Envío Seguro</p>
                <p className="meta-desc">Protectores y empaque premium</p>
              </div>
            </div>
            <div className="meta-item">
              <span>✅</span>
              <div>
                <p>Producto Verificado</p>
                <p className="meta-desc">100% original y auténtico</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="product-detail-bottom">
        <div className="product-quantity-section">
          <div className="quantity-selector">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addedToCart}
            className="btn-primary add-to-cart-btn"
          >
            {addedToCart ? <><Check size={20} /> Agregado</> : <><ShoppingCart size={20} /> Agregar al Carrito</>}
          </button>
          <button onClick={handleToggleWishlist} className="wishlist-btn">
            <Heart 
              size={22} 
              fill={isInWishlist(product.id, isSealed ? 'product' : 'card') ? '#ef4444' : 'none'}
              color={isInWishlist(product.id, isSealed ? 'product' : 'card') ? '#ef4444' : 'var(--text-secondary)'} 
            />
          </button>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="related-products">
          <h2>Productos Relacionados</h2>
          <div className="related-grid">
            {relatedProducts.map(related => (
              <Link key={related.id} to={`/producto/${related.id}`} className="related-card glass-card">
                <div className="related-image">
                  {related.image || related.imageUrl ? (
                    <img src={related.image || related.imageUrl} alt={related.name} />
                  ) : (
                    GAMES[getGameValue(related.game)]?.icon || '🎴'
                  )}
                </div>
                <p className="related-set">{related.set}</p>
                <h3 className="related-name">{related.name}</h3>
                <p className="related-price">{formatPrice(related.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
