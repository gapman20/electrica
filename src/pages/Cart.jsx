import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';
import { getGameValue } from '../services/api';
import SEO from '../components/SEO';

const Cart = () => {
  const { items, subtotal, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const [showSummary, setShowSummary] = useState(false);

  const formatPrice = (price) => `$${Number(price).toLocaleString('es-MX')}`;

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
      <h1 className="h2-premium">Tu Carrito ({itemCount} items)</h1>
      
      <div className="cart-page-layout">
        <div className="cart-items">
          {items.map(item => (
            <div key={item.cartId} className="cart-item-card glass-card">
              {item.imageUrl && (
                <div className="cart-item-image">
                  <img src={item.imageUrl} alt={item.name} />
                </div>
              )}
              <div className="cart-item-details">
                <h3>{item.name}</h3>
                <p className="cart-item-meta">
                  {getGameValue(item.game)} {item.rarity && `- ${item.rarity}`}
                </p>
                <p className="cart-item-price">{formatPrice(item.price)}</p>
              </div>
              <div className="cart-item-actions">
                <div className="quantity-controls-inline">
                  <button 
                    onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    style={{ opacity: item.quantity <= 1 ? 0.4 : 1 }}
                  >−</button>
                  <span className="quantity-number">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    style={{ opacity: item.quantity >= item.stock ? 0.4 : 1 }}
                  >+</button>
                </div>
                <button onClick={() => removeItem(item.cartId)} className="remove-btn">
                  Eliminar
                </button>
                <p className="cart-item-total">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
          <button onClick={clearCart} className="clear-cart-btn">
            Vaciar carrito
          </button>
        </div>
        
        <div className="cart-summary-desktop glass-card">
          <h3>Resumen del pedido</h3>
          <div className="summary-row">
            <span>Subtotal ({itemCount} items)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Envío</span>
            <span className="summary-note">Calculado al checkout</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Link to="/checkout" className="btn-primary checkout-btn">
            Proceder al Pago
          </Link>
        </div>
      </div>

      {/* Mobile Summary */}
      <div className="cart-summary-sticky">
        <div className="checkout-summary-collapsed" onClick={() => setShowSummary(!showSummary)}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Total ({itemCount} items)</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{formatPrice(subtotal)}</p>
          </div>
          <Link to="/checkout" className="btn-primary" style={{ padding: '12px 24px' }}>
            Pagar
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default Cart;
