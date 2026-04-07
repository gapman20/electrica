import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { useUser } from '../context/UserContext';
import { orderApi } from '../services/api';
import { Package, Search } from 'lucide-react';

const OrderTracking = () => {
  const { orderId } = useParams();
  const { lookupOrder, lookupResult, loading, error } = useOrder();
  const { user, isLoggedIn } = useUser();
  const [formData, setFormData] = useState({ orderId: orderId || '', email: user?.email || '' });
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    if (orderId) {
      handleLookup();
    }
  }, [orderId]);

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  useEffect(() => {
    const loadUserOrders = async () => {
      if (isLoggedIn && user?.email) {
        try {
          const orders = await orderApi.getMyOrders();
          setUserOrders(orders);
        } catch (err) {
          console.error('Error loading orders:', err);
          setUserOrders([]);
        }
      }
    };
    loadUserOrders();
  }, [isLoggedIn, user]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    if (!formData.orderId.trim() || !formData.email.trim()) return;
    setSearchAttempted(true);
    await lookupOrder(formData.orderId.trim(), formData.email.trim());
  };

  const formatPrice = (price) => `$${Number(price).toLocaleString('es-MX')} MXN`;
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const statusLabels = {
    pending: 'Pendiente',
    paid: 'Pagado',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  const statusColors = {
    pending: '#f59e0b',
    paid: '#3b82f6',
    processing: '#8b5cf6',
    shipped: '#06b6d4',
    delivered: '#10b981',
    cancelled: '#ef4444',
  };

  const statusOrder = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
  
  const getStatusStep = (status) => {
    if (status === 'cancelled') return -1;
    return statusOrder.indexOf(status);
  };

  const getStepClass = (stepIndex, currentStatus) => {
    const currentIndex = getStatusStep(currentStatus);
    if (currentIndex === -1) return '';
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getProgressWidth = (currentStatus) => {
    const currentIndex = getStatusStep(currentStatus);
    if (currentIndex === -1) return '0%';
    return `${(currentIndex / (statusOrder.length - 1)) * 100}%`;
  };

  return (
    <div className="page orders-page">
      <h1 className="h2-premium">Mis Pedidos</h1>

      {isLoggedIn && userOrders.length > 0 && !orderId && !searchAttempted && (
        <div className="user-orders-section">
          <div className="section-header">
            <div>
              <h2>Bienvenido, {user.name}</h2>
              <p>Tienes {userOrders.length} pedido{userOrders.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <div className="orders-list">
            {userOrders.map(order => (
              <div key={order.id} className="order-card glass-card">
                <div className="order-card-header">
                  <div>
                    <h3>Pedido #{order.id}</h3>
                    <p className="order-date">{formatDate(order.createdAt)}</p>
                  </div>
                  <span 
                    className="order-status-badge"
                    style={{ background: `${statusColors[order.status]}20`, color: statusColors[order.status] }}
                  >
                    {statusLabels[order.status]}
                  </span>
                </div>
                
                <div className="order-items-preview">
                  {order.items?.slice(0, 2).map((item, idx) => (
                    <span key={idx} className="order-item-preview">
                      {item.name} x{item.quantity}
                    </span>
                  ))}
                  {order.items?.length > 2 && (
                    <span className="order-more-items">+{order.items.length - 2} más</span>
                  )}
                </div>
                
                <div className="order-card-footer">
                  <span className="order-total">{formatPrice(order.total || order.subtotal)}</span>
                  <Link to={`/mis-pedidos/${order.id}`} className="btn-outline view-order-btn">
                    Ver Detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card order-search">
        <h3><Search size={20} /> Buscar Pedido</h3>
        <form onSubmit={handleLookup} className="search-form">
          <div className="form-group">
            <label>ID del Pedido</label>
            <input 
              type="text" 
              name="orderId" 
              value={formData.orderId} 
              onChange={handleChange} 
              placeholder="ORD-1234567890-abcd" 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="tu@email.com" 
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar Pedido'}
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      {searchAttempted && !lookupResult && !loading && (
        <div className="glass-card no-results">
          <Package size={48} />
          <h3>No se encontró el pedido</h3>
          <p>Verifica el ID y el email, o <Link to="/identificarse">inicia sesión</Link> para ver tus pedidos.</p>
        </div>
      )}

      {lookupResult && (
        <div className="order-detail glass-card">
          <div className="order-detail-header">
            <div>
              <h3>Pedido #{lookupResult.id}</h3>
              <p>Fecha: {formatDate(lookupResult.createdAt)}</p>
            </div>
            <span 
              className="order-status-badge"
              style={{ background: `${statusColors[lookupResult.status]}20`, color: statusColors[lookupResult.status] }}
            >
              {statusLabels[lookupResult.status]}
            </span>
          </div>

          {lookupResult.status !== 'cancelled' && (
            <div className="order-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: getProgressWidth(lookupResult.status) }} />
              </div>
              <div className="progress-steps">
                {statusOrder.map((status, idx) => (
                  <div key={status} className={`progress-step ${getStepClass(idx, lookupResult.status)}`}>
                    <div className="step-dot" />
                    <span>{statusLabels[status]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lookupResult.trackingNumber && (
            <div className="tracking-info" style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: 'rgba(6, 182, 212, 0.1)', 
              border: '1px solid rgba(6, 182, 212, 0.3)', 
              borderRadius: '8px' 
            }}>
              <h4 style={{ color: '#06b6d4', marginBottom: '0.5rem' }}>Número de Rastreo</h4>
              <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold' }}>
                {lookupResult.trackingNumber}
              </p>
            </div>
          )}

          {(lookupResult.shippingAddress || lookupResult.address) && (
            <div className="shipping-info">
              <h4>Dirección de Envío</h4>
              <p>
                {lookupResult.shippingAddress.name}<br />
                {lookupResult.shippingAddress.street}<br />
                {lookupResult.shippingAddress.city}, {lookupResult.shippingAddress.state} {lookupResult.shippingAddress.zip}<br />
                {lookupResult.shippingAddress.country}
              </p>
            </div>
          )}

          <div className="order-items">
            <h4>Artículos</h4>
            {lookupResult.items?.map((item, idx) => (
              <div key={idx} className="order-item">
                <div>
                  <p className="item-name">{item.name}</p>
                  <p className="item-qty">Cantidad: {item.quantity}</p>
                </div>
                <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>{formatPrice(lookupResult.subtotal)}</span>
            </div>
            <div className="total-row final">
              <span>Total</span>
              <span>{formatPrice(lookupResult.total || lookupResult.subtotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
