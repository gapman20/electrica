import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';
import { useUser } from '../context/UserContext';
import CheckoutForm from '../components/CheckoutForm';
import PayPalButton from '../components/PayPalButton';
import { User, LogOut, Mail, Lock } from 'lucide-react';

const inputSt = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px', color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)', fontSize: '0.95rem',
  outline: 'none', resize: 'vertical',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const focus = e => { e.target.style.borderColor = 'var(--accent-gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.15)'; };
const blur = e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; };

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { createOrder, loading } = useOrder();
  const { user, isLoggedIn, login: userLogin, logout: userLogout } = useUser();
  
  const [checkoutMode, setCheckoutMode] = useState('select');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'MX',
  });
  const [errors, setErrors] = useState({});
  const [paymentError, setPaymentError] = useState(null);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  React.useEffect(() => {
    if (isLoggedIn && user) {
      setCheckoutMode('form');
      setFormData(prev => ({
        ...prev,
        name: user.name || user.email?.split('@')[0] || '',
        email: user.email || '',
      }));
    }
  }, [isLoggedIn, user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const result = await userLogin(loginData.email, loginData.password);
    if (result.success) {
      setCheckoutMode('form');
    } else {
      setLoginError(result.error || 'Credenciales incorrectas');
    }
    setLoginLoading(false);
  };

  const handleGuestCheckout = () => {
    setCheckoutMode('form');
  };

  const handleLogout = () => {
    userLogout();
    setCheckoutMode('select');
    setFormData({ name: '', email: '', street: '', city: '', state: '', zip: '', country: 'MX' });
  };

  const formatPrice = (price) => `$${Number(price).toLocaleString('es-MX')} MXN`;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nombre requerido';
    if (!formData.email.trim()) newErrors.email = 'Email requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
    if (!formData.street.trim()) newErrors.street = 'Dirección requerida';
    if (!formData.city.trim()) newErrors.city = 'Ciudad requerida';
    if (!formData.state.trim()) newErrors.state = 'Estado requerido';
    if (!formData.zip.trim()) newErrors.zip = 'Código postal requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setPaymentError(null);
    setPaymentCancelled(false);
  };

  const handlePayPalSuccess = async (paymentData) => {
    if (!validateForm()) {
      setPaymentError('Por favor completa la información de envío');
      return;
    }

    try {
      const order = await createOrder({
        email: formData.email.toLowerCase(),
        items: items.map(item => ({
          cardId: item.itemType === 'CARD' ? item.itemId : null,
          productId: item.itemType === 'PRODUCT' ? item.itemId : null,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        })),
        subtotal,
        total: subtotal,
        paypalOrderId: paymentData.paypalOrderId,
        paypalDetails: paymentData.paypalDetails,
        shippingAddress: {
          name: formData.name,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        },
        status: paymentData.status,
      });
      clearCart();
      navigate(`/pedido/${order.id}/confirmacion`);
    } catch (error) {
      console.error('Error creating order:', error);
      setPaymentError('Error al procesar tu pedido. Por favor intenta de nuevo.');
    }
  };

  const handlePayPalError = (error) => {
    console.error('PayPal error:', error);
    setPaymentError('Hubo un problema con el pago. Por favor intenta de nuevo.');
    setPaymentCancelled(false);
  };

  const handlePayPalCancel = (data) => {
    console.log('PayPal cancelled:', data);
    setPaymentCancelled(true);
    setPaymentError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  };

  if (items.length === 0) {
    return (
      <div className="page">
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h1 className="h2-premium">Checkout</h1>
          <p className="subtitle">Tu carrito está vacío</p>
          <Link to="/catalogo" className="btn-primary" style={{ marginTop: '2rem', display: 'inline-flex' }}>
            Ver Catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page checkout-page" style={{ paddingBottom: '12rem' }}>
      <h1 className="h2-premium">Checkout</h1>
      
      {paymentCancelled && (
        <div className="alert alert-warning">
          Pago cancelado. Puedes intentar de nuevo cuando estés listo.
        </div>
      )}
      {paymentError && (
        <div className="alert alert-error">
          {paymentError}
        </div>
      )}
      
      <div className="checkout-layout">
        <div className="checkout-form-section">
          {checkoutMode === 'select' && !isLoggedIn && (
            <div className="checkout-auth-section">
              <div className="glass-card login-section" style={{ padding: '2.5rem', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, var(--accent-gold), #b8941f)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)' }}>
                    <User size={32} color="#1a1a1a" />
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.5rem' }}>¿Ya tienes cuenta?</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Inicia sesión para una experiencia más rápida</p>
                </div>
                
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                      Correo electrónico
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input 
                        type="email" 
                        placeholder="tu@email.com"
                        value={loginData.email}
                        onChange={(e) => { setLoginData(prev => ({ ...prev, email: e.target.value })); setLoginError(''); }}
                        style={{ ...inputSt, paddingLeft: '42px' }}
                        onFocus={focus}
                        onBlur={blur}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                      Contraseña
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => { setLoginData(prev => ({ ...prev, password: e.target.value })); setLoginError(''); }}
                        style={{ ...inputSt, paddingLeft: '42px' }}
                        onFocus={focus}
                        onBlur={blur}
                        required
                      />
                    </div>
                  </div>
                  {loginError && <span style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{loginError}</span>}
                  <button type="submit" disabled={loginLoading} className="btn-primary" style={{ marginTop: '0.5rem', padding: '14px', fontSize: '1rem', fontWeight: '700' }}>
                    {loginLoading ? 'Verificando...' : 'Iniciar Sesión'}
                  </button>
                </form>
              </div>

              <div style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>¿No tienes cuenta?</p>
                <button onClick={handleGuestCheckout} className="btn-secondary" style={{ padding: '12px 32px', fontSize: '1rem', fontWeight: '600' }}>
                  Comprar como invitado
                </button>
                <p style={{ color: 'var(--text-secondary)', opacity: 0.7, fontSize: '0.8rem', marginTop: '1rem' }}>
                  No necesitas registrarte para comprar
                </p>
              </div>
            </div>
          )}

          {checkoutMode === 'select' && isLoggedIn && (
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--accent-gold), #b8941f)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} color="#1a1a1a" />
                </div>
                <div>
                  <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{user?.name || user?.email}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sesión activa</p>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <LogOut size={18} />
                Cerrar sesión
              </button>
            </div>
          )}

          {checkoutMode === 'form' && (
            <CheckoutForm 
              formData={formData} 
              errors={errors} 
              onChange={handleChange} 
              onSubmit={handleSubmit} 
              loading={loading}
            />
          )}
        </div>
        
        <div className="checkout-summary-desktop glass-card">
          <h3>Resumen del pedido</h3>
          <div className="checkout-items">
            {items.map(item => (
              <div key={item.cartId} className="checkout-item">
                <div className="checkout-item-info">
                  <p className="checkout-item-name">{item.name}</p>
                  <p className="checkout-item-qty">Qty: {item.quantity}</p>
                </div>
                <span className="checkout-item-price">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="checkout-totals">
            <div className="checkout-total-row">
              <span>Total</span>
              <span className="checkout-total-value">{formatPrice(subtotal)}</span>
            </div>
          </div>
          <div className="checkout-payment-section">
            <p className="checkout-payment-note">Paga de forma segura con PayPal</p>
            <PayPalButton
              cartItems={items}
              subtotal={subtotal}
              onSuccess={handlePayPalSuccess}
              onError={handlePayPalError}
              onCancel={handlePayPalCancel}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Mobile Summary */}
      <div className="checkout-summary-mobile">
        <div className="checkout-summary-collapsed" onClick={() => setShowOrderSummary(!showOrderSummary)}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              {items.length} items
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{formatPrice(subtotal)}</p>
          </div>
          <button className="btn-primary checkout-pay-button" style={{ marginTop: 0, width: 'auto', padding: '12px 24px' }}>
            Pagar Ahora
          </button>
        </div>
        
        {showOrderSummary && (
          <div className="checkout-summary-expanded">
            <div className="checkout-items-mobile">
              {items.map(item => (
                <div key={item.cartId} className="checkout-item-mobile">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="checkout-total-mobile">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
