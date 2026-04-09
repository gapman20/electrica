import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, User } from 'lucide-react';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#fff',
      fontFamily: 'var(--font-body)',
      fontSize: '16px',
      '::placeholder': {
        color: '#6b7280',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

const inputSt = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px', color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)', fontSize: '0.95rem',
  outline: 'none', resize: 'vertical',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const StripeCheckout = ({ amount, onSuccess, onError, disabled, showSaveCard = true, initialSaveCard = false }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardholderName, setCardholderName] = useState('');
  const [saveCard, setSaveCard] = useState(initialSaveCard);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    if (!cardholderName.trim()) {
      setError('Por favor ingresa el nombre del titular de la tarjeta');
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: cardholderName.trim(),
      },
    });

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      if (onError) onError(stripeError);
      return;
    }

    if (onSuccess) {
      onSuccess({
        paymentMethodId: paymentMethod.id,
        paymentMethod: paymentMethod,
        cardholderName: cardholderName.trim(),
        saveCard: saveCard,
      });
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
          Nombre del titular
        </label>
        <div style={{ position: 'relative' }}>
          <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text"
            placeholder="Nombre como aparece en la tarjeta"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            style={{ ...inputSt, paddingLeft: '42px' }}
            required
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
          Datos de la tarjeta
        </label>
        <div style={{ 
          background: 'rgba(255,255,255,0.04)', 
          border: '1px solid var(--glass-border)', 
          borderRadius: '8px', 
          padding: '14px',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}>
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>
      
      {error && (
        <div style={{ 
          color: '#ef4444', 
          fontSize: '0.875rem', 
          marginBottom: '1rem',
          padding: '0.75rem',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '6px'
        }}>
          {error}
        </div>
      )}
      
      {showSaveCard && (
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            id="saveCard" 
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="saveCard" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Guardar tarjeta para futuras compras
          </label>
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={!stripe || loading || disabled}
        className="btn-primary"
        style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '700' }}
      >
        {loading ? 'Procesando...' : `Pagar con tarjeta`}
      </button>
    </form>
  );
};

export default StripeCheckout;