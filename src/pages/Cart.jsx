import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Store, Truck, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { getGameValue } from '../services/api';
import SEO from '../components/SEO';
import { formatPrice } from '../utils/format';

const Cart = () => {
  const { items, subtotal, shippingCost, total, itemCount, deliveryOption, setDeliveryOption, updateQuantity, removeItem, clearCart, isLoading } = useCart();

  if (isLoading) {
    return (
      <>
        <SEO title="Carrito" description="Tu carrito de compras" />
        <div className="page">
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p>Cargando carrito...</p>
          </div>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <SEO title="Carrito Vacío" description="Tu carrito de compras está vacío. Explora nuestro catálogo de cartas coleccionables." />
        <div className="page">
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🛒</div>
            <h1 className="h2-premium">Tu Carrito</h1>
            <p className="subtitle">Tu carrito está vacío</p>
            <Link to="/catalogo" className="btn-primary" style={{ marginTop: '2rem', display: 'inline-flex' }}>
              Ver Catálogo
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Carrito de Compras" description="Revisa los productos en tu carrito antes de proceder al pago." />
      <div className="page cart-page" style={{ paddingBottom: '12rem' }}>
      
      {/* Cart Header with Progress */}
      <div className="cart-header">
        <div className="cart-header-icon">
          <ShoppingBag size={24} />
        </div>
        <div className="cart-header-text">
          <h1 className="h2-premium">Tu Carrito</h1>
          <p className="cart-header-subtitle">{itemCount} {itemCount === 1 ? 'producto' : 'productos'} en tu carrito</p>
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="cart-progress">
        <div className="cart-progress-step active">
          <span className="cart-progress-number">1</span>
          <span className="cart-progress-label">Carrito</span>
        </div>
        <div className="cart-progress-line"></div>
        <div className="cart-progress-step">
          <span className="cart-progress-number">2</span>
          <span className="cart-progress-label">Checkout</span>
        </div>
        <div className="cart-progress-line"></div>
        <div className="cart-progress-step">
          <span className="cart-progress-number">3</span>
          <span className="cart-progress-label">Confirmación</span>
        </div>
      </div>
      
      <div className="cart-page-layout">
        <div className="cart-items">
          {items.map(item => (
            <div key={item.cartId} className="cart-item-card glass-card">
              <div className="cart-item-main">
                {item.imageUrl && (
                  <div className="cart-item-image">
                    <img src={item.imageUrl} alt={item.name} />
                  </div>
                )}
                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <div className="cart-item-badges">
                    <span className="cart-item-game">{getGameValue(item.game)}</span>
                    {item.rarity && <span className="cart-item-rarity">{item.rarity}</span>}
                  </div>
                  <p className="cart-item-price">{formatPrice(item.price)} c/u</p>
                </div>
              </div>
              
              <div className="cart-item-actions">
                <div className="quantity-controls">
                  <button 
                    onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="quantity-btn"
                  >−</button>
                  <span className="quantity-number">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="quantity-btn"
                  >+</button>
                </div>
                
                <button onClick={() => removeItem(item.cartId)} className="remove-btn">
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="cart-item-subtotal">
                <span className="cart-item-subtotal-label">Subtotal</span>
                <span className="cart-item-subtotal-value">{formatPrice(item.price * item.quantity)}</span>
              </div>
            </div>
          ))}
          <button onClick={clearCart} className="clear-cart-btn">
            <Trash2 size={18} />
            Vaciar carrito
          </button>
        </div>
        
        <div className="cart-summary-desktop glass-card">
          <h3>Resumen del pedido</h3>
          <div className="summary-row">
            <span>Subtotal ({itemCount} items)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="delivery-options">
            <label className={`delivery-option ${deliveryOption === 'pickup' ? 'selected' : ''}`} onClick={() => setDeliveryOption('pickup')}>
              <Store size={18} />
              <div className="delivery-option-content">
                <span className="delivery-option-title">Recoger en tienda</span>
                <span className="delivery-option-desc">Av. Insurgentes 123, Centro</span>
              </div>
              <span className="delivery-option-price">Gratis</span>
            </label>
            <label className={`delivery-option ${deliveryOption === 'delivery' ? 'selected' : ''}`} onClick={() => setDeliveryOption('delivery')}>
              <Truck size={18} />
              <div className="delivery-option-content">
                <span className="delivery-option-title">Envío a domicilio</span>
                <span className="delivery-option-desc">Entrega en 2-3 días hábiles</span>
              </div>
              <span className="delivery-option-price">$150 MXN</span>
            </label>
          </div>
          <div className="summary-row">
            <span>Envío</span>
            <span>{deliveryOption === 'pickup' ? 'Gratis' : formatPrice(150)}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span className="summary-total-value">{formatPrice(total)}</span>
          </div>
          <Link to="/checkout" className="btn-primary checkout-btn">
            Proceder al Pago
            <ArrowRight size={18} />
          </Link>
          <Link to="/catalogo" className="continue-shopping-link">
            ← Continuar comprando
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default Cart;
