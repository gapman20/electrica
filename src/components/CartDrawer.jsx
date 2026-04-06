import React from 'react';
import { Link } from 'react-router-dom';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getGameValue } from '../services/api';

const CartDrawer = () => {
  const { items, subtotal, itemCount, isCartOpen, closeCart, updateQuantity, removeItem, isLoading } = useCart();

  const formatPrice = (price) => `$${Number(price).toLocaleString('es-MX')}`;

  if (!isCartOpen) return null;

  return (
    <>
      <div className="cart-drawer-overlay" onClick={closeCart}></div>
      <div className="cart-drawer">
        <div className="cart-drawer-header">
          <h2>Tu Carrito ({itemCount})</h2>
          <button className="cart-drawer-close" onClick={closeCart} aria-label="Cerrar carrito">
            <X size={24} />
          </button>
        </div>
        
        <div className="cart-drawer-items">
          {isLoading ? (
            <div className="cart-drawer-empty">
              <p>Cargando carrito...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="cart-drawer-empty">
              <p>Tu carrito está vacío</p>
              <Link to="/catalogo" className="btn-primary" onClick={closeCart}>
                Ver Catálogo
              </Link>
            </div>
          ) : (
            items.map(item => (
              <div key={item.cartId} className="cart-drawer-item">
                <div className="cart-drawer-item-image">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} />
                  ) : (
                    <div className="cart-drawer-item-placeholder">{item.name?.charAt(0)}</div>
                  )}
                </div>
                <div className="cart-drawer-item-details">
                  <h4 className="cart-drawer-item-name">{item.name}</h4>
                  <p className="cart-drawer-item-game">{getGameValue(item.game)}</p>
                  <p className="cart-drawer-item-price">{formatPrice(item.price)}</p>
                </div>
                <div className="cart-drawer-item-actions">
                  <div className="cart-drawer-quantity">
                    <button 
                      onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                      aria-label="Disminuir cantidad"
                      disabled={item.quantity <= 1}
                      style={{ opacity: item.quantity <= 1 ? 0.4 : 1 }}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="quantity-number">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                      aria-label="Aumentar cantidad"
                      disabled={item.quantity >= item.stock}
                      style={{ opacity: item.quantity >= item.stock ? 0.4 : 1 }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button 
                    className="cart-drawer-remove"
                    onClick={() => removeItem(item.cartId)}
                    aria-label="Eliminar item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-subtotal">
              <span>Subtotal</span>
              <span className="cart-drawer-subtotal-amount">{formatPrice(subtotal)}</span>
            </div>
            <Link to="/checkout" className="btn-primary cart-drawer-checkout" onClick={closeCart}>
              Proceder al Pago
            </Link>
            <Link to="/carrito" className="btn-outline cart-drawer-view-cart" onClick={closeCart}>
              Ver Carrito Completo
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
