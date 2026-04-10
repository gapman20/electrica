import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { useUser } from '../context/UserContext';
import { orderApi } from '../services/api';
import { Package, Search, ArrowLeft } from 'lucide-react';
import { formatPrice } from '../utils/format';

const OrderTracking = () => {
  const { orderId } = useParams();
  const { lookupOrder, lookupResult, loading, error } = useOrder();
  const { user, isLoggedIn } = useUser();
  const [formData, setFormData] = useState({ orderId: orderId || '', email: user?.email || '' });
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [listLoading, setListLoading] = useState(false);

  const showOrderList = !selectedOrderId && !orderDetail;
  const order = orderDetail || lookupResult;

  useEffect(() => {
    if (orderId) {
      loadOrderDetail();
    }
  }, [orderId]);

  const loadOrderDetail = async () => {
    if (!orderId) return;
    setDetailLoading(true);
    try {
      const order = await orderApi.getById(orderId);
      setOrderDetail(order);
    } catch (err) {
      console.error('Error loading order:', err);
    }
    setDetailLoading(false);
  };

  const handleViewOrder = async (id) => {
    setSelectedOrderId(id);
    setDetailLoading(true);
    setListLoading(false);
    try {
      const order = await orderApi.getById(id);
      setOrderDetail(order);
    } catch (err) {
      console.error('Error loading order:', err);
    }
    setDetailLoading(false);
  };

  const handleBackToList = async () => {
    setSelectedOrderId(null);
    setOrderDetail(null);
    setSearchAttempted(false);
    setFormData({ orderId: '', email: user?.email || '' });
    
    // Recargar lista de pedidos
    setListLoading(true);
    if (isLoggedIn && user?.email) {
      try {
        const orders = await orderApi.getMyOrders();
        setUserOrders(orders);
      } catch (err) {
        console.error('Error reloading orders:', err);
      }
    }
    setListLoading(false);
  };

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

      {listLoading && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Cargando pedidos...</p>
        </div>
      )}

      {!listLoading && isLoggedIn && userOrders.length > 0 && showOrderList && (
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
                  <button onClick={() => handleViewOrder(order.id)} className="btn-outline view-order-btn">
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showOrderList && (
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
      )}

      {searchAttempted && !order && !loading && (
        <div className="glass-card no-results">
          <Package size={48} />
          <h3>No se encontró el pedido</h3>
          <p>Verifica el ID y el email, o <Link to="/identificarse">inicia sesión</Link> para ver tus pedidos.</p>
        </div>
      )}

      {detailLoading && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Cargando detalles del pedido...</p>
        </div>
      )}

      {order && !detailLoading && (
        <div className="order-detail glass-card">
          <button onClick={handleBackToList} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={16} /> Volver a mis pedidos
          </button>
          
          <div className="order-detail-header">
            <div>
              <h3>Pedido #{order.id}</h3>
              <p>Fecha: {formatDate(order.createdAt)}</p>
            </div>
            <span 
              className="order-status-badge"
              style={{ background: `${statusColors[order.status]}20`, color: statusColors[order.status] }}
            >
              {statusLabels[order.status]}
            </span>
          </div>

          {order.status !== 'cancelled' && (
            <div className="order-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: getProgressWidth(order.status) }} />
              </div>
              <div className="progress-steps">
                {statusOrder.map((status, idx) => (
                  <div key={status} className={`progress-step ${getStepClass(idx, order.status)}`}>
                    <div className="step-dot" />
                    <span>{statusLabels[status]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.trackingNumber && (
            <div className="tracking-info" style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: 'rgba(6, 182, 212, 0.1)', 
              border: '1px solid rgba(6, 182, 212, 0.3)', 
              borderRadius: '8px' 
            }}>
              <h4 style={{ color: '#06b6d4', marginBottom: '0.5rem' }}>Número de Rastreo</h4>
              <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold' }}>
                {order.trackingNumber}
              </p>
            </div>
          )}

          {(order.shippingAddress || order.address) && (
            <div className="shipping-info">
              <h4>Dirección de Envío</h4>
              <p>
                {order.customerName || order.shippingAddress?.name || 'Cliente'}<br />
                {order.address || order.shippingAddress?.street}<br />
                {order.city ? `${order.city}, ${order.state} ${order.zipCode}` : order.shippingAddress ? `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}` : ''}<br />
                {order.country || order.shippingAddress?.country}
              </p>
            </div>
          )}

          <div className="order-items">
            <h4>Artículos</h4>
            {order.items?.map((item, idx) => (
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
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="total-row final">
              <span>Total</span>
              <span>{formatPrice(order.total || order.subtotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
