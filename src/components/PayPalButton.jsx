import React, { useEffect, useRef, useState } from 'react';
import { loadPayPalScript, isPayPalConfigured } from '../services/paypalService';

const PayPalButton = ({ 
  cartItems, 
  subtotal, 
  onSuccess, 
  onError, 
  onCancel,
  disabled = false,
  style = {}
}) => {
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [isConfigured, setIsConfigured] = useState(null);
  
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onCancelRef.current = onCancel;
  }, [onSuccess, onError, onCancel]);

  useEffect(() => {
    setIsConfigured(isPayPalConfigured());
  }, []);

  useEffect(() => {
    if (isConfigured === null || !isConfigured) return;
    
    let mounted = true;
    
    const initPayPal = async () => {
      const loaded = await loadPayPalScript();
      if (!mounted) return;
      
      if (!loaded) {
        setError('Error al cargar el SDK de PayPal');
        return;
      }

      setSdkReady(true);
    };

    const timeoutId = setTimeout(initPayPal, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [isConfigured]);

  useEffect(() => {
    if (isConfigured === null || !isConfigured || !sdkReady || !containerRef.current || !window.paypal) return;

    let mounted = true;
    let buttonsInstance = null;
    
    containerRef.current.innerHTML = '';
    
    const container = containerRef.current;
    
    if (!container.isConnected) return;
    
    buttonsInstance = window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'pay',
        ...style
      },
      
      disabled: disabled,

      onClick: async (data, actions) => {
        if (cartItems.length === 0) {
          return actions.reject();
        }
        return actions.resolve();
      },

      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [
            {
              description: 'TCG Card Purchase',
              amount: {
                currency_code: 'USD',
                value: (subtotal / 100).toFixed(2),
                breakdown: {
                  item_total: {
                    currency_code: 'USD',
                    value: (subtotal / 100).toFixed(2),
                  },
                },
              },
              items: cartItems.map(item => ({
                name: item.name.substring(0, 127),
                unit_amount: {
                  currency_code: 'USD',
                  value: (item.price / 100).toFixed(2),
                },
                quantity: String(item.quantity),
                category: 'PHYSICAL_GOODS',
              })),
            },
          ],
        });
      },

      onApprove: async (data, actions) => {
        try {
          const details = await actions.order.capture();
          if (onSuccessRef.current) {
            onSuccessRef.current({
              paypalOrderId: data.orderID,
              paypalDetails: details,
              status: details.status,
            });
          }
        } catch (err) {
          if (onErrorRef.current) onErrorRef.current(err);
        }
      },

      onCancel: (data) => {
        if (onCancelRef.current) onCancelRef.current(data);
      },

      onError: (err) => {
        console.warn('PayPal error:', err);
        if (err?.message?.includes('container') || err?.message?.includes('DOM')) {
          return;
        }
        if (onErrorRef.current) onErrorRef.current(err);
      },
    });

    if (mounted && container.isConnected) {
      buttonsInstance.render(container).catch(err => {
        console.warn('PayPal render error:', err);
      });
    }

    setIsReady(true);

    return () => {
      mounted = false;
      try {
        if (buttonsInstance) {
          buttonsInstance.close();
        }
      } catch (e) {}
    };
  }, [isConfigured, sdkReady, cartItems, subtotal, disabled, style]);

  if (isConfigured === null) {
    return null;
  }

  if (!isConfigured) {
    return null;
  }

  if (error) {
    return (
      <div style={{ 
        padding: '1rem', 
        background: 'rgba(239, 68, 68, 0.1)', 
        borderRadius: '8px',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        textAlign: 'center',
        color: '#ef4444',
        fontSize: '0.875rem',
        marginTop: '1rem'
      }}>
        {error}
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div style={{ 
        padding: '1rem', 
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '0.875rem',
        marginTop: '1rem'
      }}>
        Cargando PayPal...
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      style={{ 
        marginTop: '1rem',
        minHeight: '44px',
        opacity: isReady ? 1 : 0.5,
        transition: 'opacity 0.2s ease'
      }} 
    />
  );
};

export default PayPalButton;
