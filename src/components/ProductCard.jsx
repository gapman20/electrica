import React, { useState, useMemo } from 'react';
import { ShoppingCart, Heart, Check, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSite } from '../context/SiteContext';
import { useToast } from './Toast';
import { getGameValue } from '../services/api';
import { formatPrice } from '../utils/format';

const ProductCard = ({ item, type = 'product' }) => {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const { getActiveCampaign, calculateDiscountedPrice } = useSite();
  const toast = useToast();
  
  const isLoggedIn = !!localStorage.getItem('tcg_user');
  const [addedToCart, setAddedToCart] = useState(false);
  
  const isProduct = type === 'product' || item.type === 'product' || item.setCode === undefined;
  const itemId = item.id;
  const isOutOfStock = item.stock <= 0;
  
  const activeCampaign = getActiveCampaign ? getActiveCampaign() : null;
  const hasCampaignDiscount = activeCampaign && !item.discountPercent;
  
  const finalPrice = hasCampaignDiscount 
    ? calculateDiscountedPrice(item.price, activeCampaign, item.id)
    : item.price;
  const hasDiscount = item.discountPercent > 0 || (activeCampaign && !item.discountPercent);
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    
    const itemToAdd = {
      ...item,
      type: isProduct ? 'product' : 'card'
    };
    
    addItem(itemToAdd);
    setAddedToCart(true);
    toast.success(`${item.name} agregado al carrito`);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const itemToWishlist = { 
      ...item, 
      type: isProduct ? 'product' : 'card',
      id: itemId
    };
    const wasAdded = toggleItem(itemToWishlist);
    if (wasAdded) {
      toast.success(`${item.name} añadido a favoritos`);
    } else {
      toast.info(`${item.name} eliminado de favoritos`);
    }
  };
  
  const gameName = isProduct 
    ? (item.game?.displayName || item.game || getGameValue(item.game))
    : (item.game?.displayName || item.game || getGameValue(item.game));
  
  const itemSet = item.set || item.set_name || '';
  const displayPrice = typeof finalPrice === 'number' ? formatPrice(finalPrice) : formatPrice(item.price);
  const originalPriceDisplay = item.originalPrice ? formatPrice(item.originalPrice) : (hasCampaignDiscount ? formatPrice(item.price) : null);
  const priceDisplay = item.priceDisplay || displayPrice;
  
  const wishlisted = isInWishlist(itemId, isProduct ? 'product' : 'card');
  const badgeClass = item.badge ? item.badge.toLowerCase().replace(/[^a-z]/g, '') : '';

  return (
    <div className="tcg-product-card">
      <div className="product-image-container">
        {item.imageUrl || item.image ? (
          <img src={item.imageUrl || item.image} alt={item.name} className="product-image" />
        ) : (
          <div className="product-placeholder">
            <Package size={48} color="var(--text-secondary)" />
          </div>
        )}
        
        {item.badge && (
          <span className={`product-badge badge-${badgeClass}`}>
            {item.badge}
          </span>
        )}
        
        {hasDiscount && item.discountPercent && (
          <span className="product-discount">
            -{item.discountPercent}%
          </span>
        )}
        
        {isLoggedIn && (
          <button
            className="product-wishlist-btn"
            onClick={handleToggleWishlist}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)'
            }}
          >
            <Heart size={16} fill={wishlisted ? '#ef4444' : 'none'} color={wishlisted ? '#ef4444' : '#fff'} />
          </button>
        )}
        
        {isOutOfStock && (
          <div className="product-soldout-overlay">
            <span>Agotado</span>
          </div>
        )}
        

      </div>
      
      <div className="product-info">
        <div className="product-tags">
          {gameName && <span className="product-tag">{gameName}</span>}
          {itemSet && <span className="product-tag">{itemSet}</span>}
        </div>
        <h3 className="product-name">{item.name}</h3>
        <div className="product-price">
          {originalPriceDisplay && (
            <span className="price-original">{originalPriceDisplay}</span>
          )}
          <span className="price-current">{priceDisplay}</span>
        </div>
        <button 
          className="add-to-cart-btn"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          style={{
            background: addedToCart ? '#10b981' : undefined,
            transition: 'all 0.3s ease'
          }}
        >
          {isOutOfStock ? 'Agotado' : addedToCart ? <><Check size={16} /> Agregado</> : 'Agregar al carrito'}
        </button>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);