const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

let paypalLoaded = false;
let paypalScriptLoaded = false;

export const loadPayPalScript = () => {
  if (paypalScriptLoaded) return Promise.resolve(true);
  
  return new Promise((resolve) => {
    if (document.getElementById('paypal-sdk')) {
      paypalScriptLoaded = true;
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
    script.async = true;
    script.setAttribute('data-namespace', 'paypal');
    
    script.onload = () => {
      paypalScriptLoaded = true;
      resolve(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load PayPal SDK');
      resolve(false);
    };

    document.head.appendChild(script);
  });
};

export const isPayPalConfigured = () => {
  return !!PAYPAL_CLIENT_ID;
};

export const createPayPalOrder = async (cartItems, subtotal) => {
  const orderData = {
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
  };

  return orderData;
};

export const capturePayPalOrder = async (orderID) => {
  return {
    orderID,
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
  };
};

export const getPayPalClientId = () => PAYPAL_CLIENT_ID;
