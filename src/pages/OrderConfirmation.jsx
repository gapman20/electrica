import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const { fetchOrderById, currentOrder, loading } = useOrder();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (orderId) {
        const fetchedOrder = await fetchOrderById(orderId);
        setOrder(fetchedOrder);
      } else if (currentOrder) {
        setOrder(currentOrder);
      }
    };
    loadOrder();
  }, [orderId, currentOrder, fetchOrderById]);

  const formatPrice = (price) => `$${Number(price).toLocaleString('es-MX')} MXN`;

  if (loading || !order) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div className="spinner" style={{ margin: '0 auto 2rem' }}></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
          <svg width="40" height="40" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="h2-premium">¡Pedido Confirmado!</h1>
        <p className="subtitle">Gracias por tu compra. Hemos recibido tu pedido correctamente.</p>

        <div className="glass-card" style={{ textAlign: 'left', marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Detalles del Pedido</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ID del Pedido</span>
              <span style={{ fontWeight: 600 }}>{order.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Email</span>
              <span>{order.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{formatPrice(order.total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estado</span>
              {order.status === 'COMPLETED' || order.status === 'PAID' ? (
                <span className="order-status-badge paid">Pagado</span>
              ) : (
                <span className="order-status-badge pending" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>Pendiente de Pago</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/catalogo" className="btn-primary">Seguir Comprando</Link>
          <Link to="/mis-pedidos" className="btn-outline">Ver Mis Pedidos</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
