import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';
import { useUser } from '../context/UserContext';
import CheckoutForm from '../components/CheckoutForm';
import PayPalButton from '../components/PayPalButton';
import { User, LogOut, Mail, Lock, ShoppingCart, Truck, CreditCard, Check, Store, ArrowLeft } from 'lucide-react';
import { isPayPalConfigured } from '../services/paypalService';
import api from '../services/api';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, shippingCost, total, clearCart } = useCart();
  const { createOrder, loading } = useOrder();
  const { user, isLoggedIn, login: userLogin, logout: userLogout, updateUser } = useUser();
  
  const paypalIsConfigured = useMemo(() => isPayPalConfigured(), []);
  
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = login/select, 2 = shipping, 3 = payment
  const [deliveryOption, setDeliveryOption] = useState('pickup');
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

  React.useEffect(() => {
    if (isLoggedIn && user) {
      setCheckoutStep(2);
      setFormData(prev => ({
        ...prev,
        name: user.name || user.email?.split('@')[0] || '',
        email: user.email || '',
        street: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zip: user.zipCode || '',
      }));
    }
  }, [isLoggedIn, user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const result = await userLogin(loginData.email, loginData.password);
    if (result.success) {
      setCheckoutStep(2);
    } else {
      setLoginError(result.error || 'Credenciales incorrectas');
    }
    setLoginLoading(false);
  };

  const handleGuestCheckout = () => {
    setCheckoutStep(2);
  };

  const handleLogout = () => {
    userLogout();
    setCheckoutStep(1);
    setFormData({ name: '', email: '', street: '', city: '', state: '', zip: '', country: 'MX' });
  };

  const formatPrice = (price) => `$${Number(price).toLocaleString('es-MX')} MXN`;

  const validateForm = () => {
    const newErrors = {};
    const safeStr = (val) => (val != null ? String(val).trim() : '');
    
    if (!safeStr(formData.name)) newErrors.name = 'Nombre requerido';
    if (!safeStr(formData.email)) newErrors.email = 'Email requerido';
    else if (!/\S+@\S+\.\S+/.test(safeStr(formData.email))) newErrors.email = 'Email inválido';
    if (!safeStr(formData.street)) newErrors.street = 'Dirección requerida';
    if (!safeStr(formData.city)) newErrors.city = 'Ciudad requerida';
    if (!safeStr(formData.state)) newErrors.state = 'Estado requerido';
    if (!safeStr(formData.zip)) newErrors.zip = 'Código postal requerido';
    
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

  const handleProceedToPayment = async () => {
    const isFormValid = validateForm();
    
    if (!isFormValid) {
      alert('Tienes errores en el formulario, revisa los campos en la sección izquierda DENTRO de "Editar".');
      setCheckoutStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Avanzamos inmediatamente en la UI para que se sienta fluido
    setCheckoutStep(3);

    if (isLoggedIn) {
      try {
        await api.auth.updateProfile({
          name: formData.name,
          address: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zip
        });
        updateUser({
          ...user,
          name: formData.name,
          address: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zip
        });
      } catch (error) {
        console.error('Error saving address to backend:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    if (!validateForm()) {
      setCheckoutStep(2);
      return;
    }

    if (isLoggedIn) {
      try {
        await api.auth.updateProfile({
          name: formData.name,
          address: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zip
        });
        updateUser({
          ...user,
          name: formData.name,
          address: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zip
        });
      } catch (error) {
        console.error('Error saving address to backend:', error);
      }
    }

    // Si tiene paypal, esto solo es para avanzar de paso desde el form
    if (paypalIsConfigured) {
      setCheckoutStep(3);
      return;
    }

    // Si no tiene paypal, completar el pedido manualmente.
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
        total: subtotal + (deliveryOption === 'delivery' ? 150 : 0),
        shippingAddress: {
          name: formData.name,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        },
        status: 'PENDING',
        notes: `Método de entrega: ${deliveryOption === 'pickup' ? 'Recoger en tienda' : 'Envío a domicilio'}`,
      });
      clearCart();
      navigate(`/pedido/${order.id}/confirmacion`);
    } catch (error) {
      console.error('Error creating order:', error);
      setPaymentError('Error al procesar tu pedido. Por favor intenta de nuevo.');
    }
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
      <Link to="/carrito" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1rem', textDecoration: 'none' }}>
        <ArrowLeft size={18} />
        Volver al carrito
      </Link>
      
      <h1 className="h2-premium">Checkout</h1>
      
      {/* Progress Steps */}
      <div className="checkout-progress">
        <div className={`progress-step ${checkoutStep >= 1 ? 'active' : ''} ${checkoutStep > 1 ? 'completed' : ''}`}>
          <div className="progress-step-icon">
            {checkoutStep > 1 ? <Check size={16} /> : <User size={16} />}
          </div>
          <span className="progress-step-label">Cuenta</span>
        </div>
        <div className="progress-step-line"></div>
        <div className={`progress-step ${checkoutStep >= 2 ? 'active' : ''} ${checkoutStep > 2 ? 'completed' : ''}`}>
          <div className="progress-step-icon">
            {checkoutStep > 2 ? <Check size={16} /> : <Truck size={16} />}
          </div>
          <span className="progress-step-label">Envío</span>
        </div>
        <div className="progress-step-line"></div>
        <div className={`progress-step ${checkoutStep >= 3 ? 'active' : ''}`}>
          <div className="progress-step-icon">
            <CreditCard size={16} />
          </div>
          <span className="progress-step-label">Pago</span>
        </div>
      </div>
      
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
          {checkoutStep === 1 && !isLoggedIn && (
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
                        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none', resize: 'vertical', transition: 'border-color 0.2s, box-shadow 0.2s', paddingLeft: '42px' }}
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
                        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none', resize: 'vertical', transition: 'border-color 0.2s, box-shadow 0.2s', paddingLeft: '42px' }}
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

          {checkoutStep === 1 && isLoggedIn && (
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

          {checkoutStep >= 2 && (
            <div className="checkout-delivery-section">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} color="var(--accent-gold)" />
                Método de entrega
              </h3>
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
              
              <CheckoutForm 
                formData={formData} 
                errors={errors} 
                onChange={handleChange} 
                onSubmit={handleSubmit} 
                loading={loading}
                paypalIsConfigured={paypalIsConfigured}
                onProceedToPayment={() => setCheckoutStep(3)}
              />
            </div>
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
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="checkout-total-row">
              <span>Envío</span>
              <span>{deliveryOption === 'pickup' ? 'Gratis' : '$150 MXN'}</span>
            </div>
            <div className="checkout-total-row checkout-total-final">
              <span>Total</span>
              <span className="checkout-total-value">{formatPrice(subtotal + (deliveryOption === 'delivery' ? 150 : 0))}</span>
            </div>
          </div>
          <div className="checkout-payment-section">
            {checkoutStep < 3 ? (
              <>
                <p className="checkout-payment-note">Verifica tu información para proceder al pago</p>
                <button 
                  onClick={handleProceedToPayment} 
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '700' }}
                >
                  Proceder al Pago
                </button>
              </>
            ) : (
              <>
                <p className="checkout-payment-note">
                  {paypalIsConfigured ? 'Paga de forma segura con PayPal' : 'Completa tu compra'}
                </p>
                {paypalIsConfigured ? (
                  <PayPalButton
                    cartItems={items}
                    subtotal={subtotal}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                    onCancel={handlePayPalCancel}
                    disabled={loading}
                  />
                ) : (
                  <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '700' }}
                  >
                    {loading ? 'Procesando...' : `Pagar ${formatPrice(subtotal + (deliveryOption === 'delivery' ? 150 : 0))}`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
