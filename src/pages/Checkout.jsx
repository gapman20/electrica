import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';
import { useUser } from '../context/UserContext';
import CheckoutForm from '../components/CheckoutForm';
import PayPalButton from '../components/PayPalButton';
import { User, LogOut, Mail, Lock, ShoppingCart, Truck, CreditCard, Check, Store, ArrowLeft } from 'lucide-react';
import { isPayPalConfigured } from '../services/paypalService';
import { isStripeConfigured, getStripe } from '../services/stripeService';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckout from '../components/StripeCheckout';
import api from '../services/api';
import { formatPrice } from '../utils/format';
import Swal from 'sweetalert2';

const PAYMENT_CONFIG = {
  bankName: import.meta.env.VITE_BANK_NAME || 'BBVA',
  bankClabe: import.meta.env.VITE_BANK_CLABE || '',
  bankCard: import.meta.env.VITE_BANK_CARD || '',
  beneficiary: import.meta.env.VITE_BENEFICIARY || '',
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '',
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, shippingCost, total, clearCart } = useCart();
  const { createOrder, loading } = useOrder();
  const { user, isLoggedIn, login: userLogin, logout: userLogout, updateUser } = useUser();
  
  const paypalIsConfigured = useMemo(() => isPayPalConfigured(), []);
  const stripeIsConfigured = useMemo(() => isStripeConfigured(), []);
  
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const [useSavedCard, setUseSavedCard] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'MX',
  });
  const [errors, setErrors] = useState({});
  const [paymentError, setPaymentError] = useState(null);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  React.useEffect(() => {
    if (isLoggedIn && user && checkoutStep < 2) {
      setCheckoutStep(2);
      setFormData(prev => ({
        ...prev,
        name: user.name || user.email?.split('@')[0] || '',
        email: user.email || '',
        phone: user.phone || '',
        street: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zip: user.zipCode || '',
      }));
    }
  }, [isLoggedIn, user, checkoutStep]);

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
    setFormData({ name: '', email: '', phone: '', street: '', city: '', state: '', zip: '', country: 'MX' });
  };

  const validateForm = () => {
    const newErrors = {};
    const safeStr = (val) => (val != null ? String(val).trim() : '');
    
    if (!safeStr(formData.name)) newErrors.name = 'Nombre requerido';
    if (!safeStr(formData.email)) newErrors.email = 'Email requerido';
    else if (!/\S+@\S+\.\S+/.test(safeStr(formData.email))) newErrors.email = 'Email inválido';
    if (!safeStr(formData.phone)) newErrors.phone = 'Teléfono requerido';
    else if (safeStr(formData.phone).replace(/\D/g, '').length < 10) newErrors.phone = 'Teléfono inválido (mínimo 10 dígitos)';
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
        customerName: formData.name,
        customerEmail: formData.email.toLowerCase(),
        customerPhone: formData.phone,
        address: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zip,
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
        paymentMethod: 'paypal',
        paymentId: paymentData.paypalOrderId,
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
    setPaymentCancelled(true);
    setPaymentError(null);
  };

  const handleStripeSuccess = async (paymentData) => {
    if (!validateForm()) {
      setPaymentError('Por favor completa la información de envío');
      return;
    }

    try {
      setProcessingPayment(true);
      
      const orderData = {
        paymentMethodId: paymentData.paymentMethodId,
        cardholderName: paymentData.cardholderName,
        saveCard: paymentData.saveCard || false,
        items: items.map(item => ({
          cardId: item.cardId || null,
          productId: item.productId || null,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        })),
        customerName: formData.name,
        customerEmail: formData.email.toLowerCase(),
        customerPhone: formData.phone,
        address: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zip,
        deliveryOption,
      };

      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/stripe/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error processing payment');
      }

      const order = await response.json();
      clearCart();
      navigate(`/pedido/${order.id}/confirmacion`);
    } catch (error) {
      console.error('Error creating order:', error);
      setPaymentError(error.message || 'Error al procesar tu pago. Por favor intenta de nuevo.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleStripeError = (error) => {
    console.error('Stripe error:', error);
    setPaymentError('Hubo un problema con el pago. Por favor intenta de nuevo.');
  };

  const handlePayWithSavedCard = async () => {
    if (!validateForm()) {
      setPaymentError('Por favor completa la información de envío');
      return;
    }

    try {
      setProcessingPayment(true);
      
      const orderData = {
        useSavedCard: true,
        cardholderName: user.cardHolderName || user.name || '',
        items: items.map(item => ({
          cardId: item.cardId || null,
          productId: item.productId || null,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        })),
        customerName: formData.name,
        customerEmail: formData.email.toLowerCase(),
        customerPhone: formData.phone,
        address: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zip,
        deliveryOption,
      };

      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/stripe/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error processing payment');
      }

      const order = await response.json();
      clearCart();
      navigate(`/pedido/${order.id}/confirmacion`);
    } catch (error) {
      console.error('Error with saved card:', error);
      setPaymentError(error.message || 'Error al procesar tu pago. Por favor intenta de nuevo.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleProceedToPayment = async () => {
    const isFormValid = validateForm();
    
    if (!isFormValid) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos requeridos en la información de envío.',
        confirmButtonColor: '#d4af37',
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#fff',
      });
      setCheckoutStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

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

  const handleSelectPaymentMethod = (method) => {
    setPaymentMethod(method);
    setCheckoutStep(4);
  };

  const handleBackToPaymentMethods = () => {
    setCheckoutStep(3);
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

    // Si tiene paypal y selecciona paypal, esto solo es para avanzar de paso desde el form
    if (paymentMethod === 'paypal' && paypalIsConfigured) {
      setCheckoutStep(4);
      return;
    }

    // Para otros métodos de pago, mostrar instrucciones
    setShowPaymentInstructions(true);
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
        <div className={`progress-step ${checkoutStep >= 3 ? 'active' : ''} ${checkoutStep > 3 ? 'completed' : ''}`}>
          <div className="progress-step-icon">
            {checkoutStep > 3 ? <Check size={16} /> : <CreditCard size={16} />}
          </div>
          <span className="progress-step-label">Método</span>
        </div>
        <div className="progress-step-line"></div>
        <div className={`progress-step ${checkoutStep >= 4 ? 'active' : ''}`}>
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

          {checkoutStep === 2 && (
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
                onProceedToPayment={handleProceedToPayment}
              />
            </div>
          )}

          {checkoutStep >= 3 && (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} color="var(--accent-gold)" />
                Selecciona método de pago
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <button 
                  onClick={() => handleSelectPaymentMethod('paypal')}
                  className="payment-method-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ width: '40px', height: '40px', background: '#0070ba', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>PP</span>
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: '600', margin: 0 }}>PayPal</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Pago seguro con PayPal</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleSelectPaymentMethod('transfer')}
                  className="payment-method-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ width: '40px', height: '40px', background: '#2e7d32', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '1.2rem' }}>🏦</span>
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: '600', margin: 0 }}>Transferencia Bancaria</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Deposita a cuenta y envía comprobante</p>
                  </div>
                </button>
                
                {stripeIsConfigured && (
                  <button 
                    onClick={() => handleSelectPaymentMethod('stripe')}
                    className="payment-method-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div style={{ width: '40px', height: '40px', background: '#635bff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: '1.2rem' }}>💳</span>
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <p style={{ color: 'var(--text-primary)', fontWeight: '600', margin: 0 }}>Tarjeta de Crédito/Débito</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Visa, Mastercard, American Express</p>
                    </div>
                  </button>
                )}
                
                <button 
                  onClick={() => handleSelectPaymentMethod('oxxo')}
                  className="payment-method-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ width: '40px', height: '40px', background: '#d32f2f', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '1.2rem' }}>🏪</span>
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: '600', margin: 0 }}>Depósito en OXXO</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Paga en cualquier tienda OXXO</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleSelectPaymentMethod('mercadopago')}
                  className="payment-method-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ width: '40px', height: '40px', background: '#009ee3', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '1.2rem' }}>💳</span>
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: '600', margin: 0 }}>MercadoPago</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Tarjetas, SPEI o efectivo</p>
                  </div>
                </button>
              </div>
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
                  disabled={loading || processingPayment}
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '700' }}
                >
                  Proceder al Pago
                </button>
              </>
            ) : checkoutStep === 3 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--accent-gold)', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CreditCard size={20} color="var(--accent-gold)" />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {paymentMethod === 'paypal' ? 'PayPal' : 
                     paymentMethod === 'stripe' ? 'Tarjeta de Crédito/Débito' :
                     paymentMethod === 'transfer' ? 'Transferencia Bancaria' :
                     paymentMethod === 'oxxo' ? 'Depósito en OXXO' :
                     paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Selecciona un método'}
                  </span>
                </div>
                <button 
                  onClick={handleBackToPaymentMethods}
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '700' }}
                >
                  Cambiar método
                </button>
              </div>
            ) : (
              <>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CreditCard size={20} color="#10b981" />
                  <span style={{ color: '#10b981', fontWeight: 600 }}>
                    {paymentMethod === 'paypal' ? 'PayPal' : 
                     paymentMethod === 'stripe' ? 'Tarjeta de Crédito/Débito' :
                     paymentMethod === 'transfer' ? 'Transferencia Bancaria' :
                     paymentMethod === 'oxxo' ? 'Depósito en OXXO' :
                     paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Pago'}
                   </span>
                </div>
                  {paymentMethod === 'stripe' && stripeIsConfigured ? (
                   <div>
                     <Elements stripe={getStripe()}>
                        <StripeCheckout
                          amount={subtotal + (deliveryOption === 'delivery' ? 150 : 0)}
                          onSuccess={handleStripeSuccess}
                          onError={handleStripeError}
                          disabled={loading || processingPayment}
                          showSaveCard={false}
                          initialSaveCard={false}
                        />
                      </Elements>
                   </div>
                ) : paymentMethod === 'paypal' && paypalIsConfigured ? (
                  <PayPalButton
                    cartItems={items}
                    subtotal={subtotal}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                    onCancel={handlePayPalCancel}
                    disabled={loading || processingPayment}
                  />
                ) : (
                  <button 
                    onClick={handleSubmit} 
                    disabled={loading || processingPayment}
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '700' }}
                  >
                    {loading ? 'Procesando...' : `Confirmar Pedido - ${formatPrice(subtotal + (deliveryOption === 'delivery' ? 150 : 0))}`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {showPaymentInstructions && (
        <div className="glass-card" style={{ padding: '2rem', marginTop: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '1rem' }}>
            Instrucciones de pago
          </h3>
          
          {paymentMethod === 'transfer' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Realiza tu transferencia a la siguiente cuenta:
              </p>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ margin: '0.5rem 0' }}><strong>Banco:</strong> {PAYMENT_CONFIG.bankName}</p>
                {PAYMENT_CONFIG.bankClabe && <p style={{ margin: '0.5rem 0' }}><strong>CLABE:</strong> {PAYMENT_CONFIG.bankClabe}</p>}
                {PAYMENT_CONFIG.bankCard && <p style={{ margin: '0.5rem 0' }}><strong>Tarjeta:</strong> {PAYMENT_CONFIG.bankCard}</p>}
                {PAYMENT_CONFIG.beneficiary && <p style={{ margin: '0.5rem 0' }}><strong>Beneficiario:</strong> {PAYMENT_CONFIG.beneficiary}</p>}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Envía tu comprobante por WhatsApp al <strong>{PAYMENT_CONFIG.whatsappNumber || 'contacto'}</strong> una vez realizado el pago.
              </p>
            </div>
          )}
          
          {paymentMethod === 'oxxo' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Acude a cualquier tienda OXXO y realiza un depósito en efectivo:
              </p>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ margin: '0.5rem 0' }}><strong>Referencia:</strong> {formData.phone.slice(-10)}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Importe:</strong> {formatPrice(subtotal + (deliveryOption === 'delivery' ? 150 : 0))}</p>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Guarda tu ticket como comprobante. Envíanos foto por WhatsApp al <strong>{PAYMENT_CONFIG.whatsappNumber || 'contacto'}</strong>
              </p>
            </div>
          )}
          
          {paymentMethod === 'mercadopago' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Puedes pagar mediante:
              </p>
              <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li>Tarjeta de crédito o débito</li>
                <li>Transferencia SPEI</li>
                <li>Depósito en efectivo</li>
              </ul>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Después de confirmar, recibirás un enlace de pago por correo. Cualquier duda, escríbenos al <strong>{PAYMENT_CONFIG.whatsappNumber || 'contacto'}</strong>
              </p>
            </div>
          )}
          
          <button 
            onClick={async () => {
              setShowPaymentInstructions(false);
              try {
                const order = await createOrder({
                  customerName: formData.name,
                  customerEmail: formData.email.toLowerCase(),
                  customerPhone: formData.phone,
                  address: formData.street,
                  city: formData.city,
                  state: formData.state,
                  zipCode: formData.zip,
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
                  paymentMethod: paymentMethod,
                  notes: `Método de entrega: ${deliveryOption === 'pickup' ? 'Recoger en tienda' : 'Envío a domicilio'}. Pago: ${paymentMethod === 'transfer' ? 'Transferencia' : paymentMethod === 'oxxo' ? 'Depósito OXXO' : 'MercadoPago'}`,
                });
                clearCart();
                navigate(`/pedido/${order.id}/confirmacion`);
              } catch (error) {
                console.error('Error creating order:', error);
                setPaymentError('Error al procesar tu pedido. Por favor intenta de nuevo.');
              }
            }}
            disabled={loading || processingPayment}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '700', marginTop: '1rem' }}
          >
            {loading ? 'Procesando...' : 'Confirmar Pedido'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Checkout;
