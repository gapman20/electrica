import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { CheckCircle, Package, CreditCard, MapPin, Phone } from 'lucide-react';

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

  const getPaymentMethodLabel = (method) => {
    const labels = {
      paypal: 'PayPal',
      transfer: 'Transferencia Bancaria',
      oxxo: 'Depósito en OXXO',
      mercadopago: 'MercadoPago',
      cash: 'Efectivo',
    };
    return labels[method] || method;
  };

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
          <CheckCircle size={40} color="#fff" />
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
              <span>{order.customerEmail || order.email}</span>
            </div>
            {order.customerPhone && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Teléfono</span>
                <span>{order.customerPhone}</span>
              </div>
            )}
            {order.address && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Dirección</span>
                <span style={{ textAlign: 'right' }}>{order.address}, {order.city}, {order.state}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Envío</span>
              <span>{order.shipping === 0 ? 'Gratis' : formatPrice(order.shipping)}</span>
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
                <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>Pendiente de Pago</span>
              )}
            </div>
          </div>
        </div>

        {order.paymentMethod && order.paymentMethod !== 'paypal' && (
          <div className="glass-card" style={{ textAlign: 'left', marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={20} color="var(--accent-gold)" />
              Información de Pago
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <strong>Método:</strong> {getPaymentMethodLabel(order.paymentMethod)}
            </p>
            {(order.paymentMethod === 'transfer' || order.paymentMethod === 'oxxo') && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Por favor envía tu comprobante de pago por WhatsApp para confirmar tu pedido.
              </p>
            )}
            {order.notes && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                <strong>Notas:</strong> {order.notes}
              </p>
            )}
          </div>
        )}

        {order.items && order.items.length > 0 && (
          <div className="glass-card" style={{ textAlign: 'left', marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={20} color="var(--accent-gold)" />
              Productos ({order.items.length})
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px' }} />}
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>{item.name}</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cantidad: {item.quantity}</p>
                    </div>
                  </div>
                  <span style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/catalogo" className="btn-primary">Seguir Comprando</Link>
          <Link to="/mis-pedidos" className="btn-outline">Ver Mis Pedidos</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
