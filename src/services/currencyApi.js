// Currency conversion using Frankfurter API (free, no API key needed)
// Data from European Central Bank

const FRANKFURTER_API = 'https://api.frankfurter.app';

// Cache the exchange rate to avoid excessive API calls
let cachedRate = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getExchangeRate() {
  const now = Date.now();
  
  // Return cached rate if valid
  if (cachedRate && (now - cacheTime) < CACHE_DURATION) {
    return cachedRate;
  }
  
  try {
    const response = await fetch(`${FRANKFURTER_API}/latest?from=USD&to=MXN`);
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }
    
    const data = await response.json();
    cachedRate = data.rates.MXN;
    cacheTime = now;
    
    console.log(`[Currency] USD to MXN: ${cachedRate}`);
    return cachedRate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Fallback to a default rate if API fails
    return cachedRate || 20.0;
  }
}

// Convert USD price to MXN
export async function convertUsdToMxn(usdPrice) {
  if (!usdPrice || usdPrice === 0) return 0;
  
  const rate = await getExchangeRate();
  return usdPrice * rate;
}

// Format price in MXN with locale
export function formatMxPrice(mxnPrice) {
  return `$${Number(mxnPrice).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MXN`;
}

// Format price in USD
export function formatUsdPrice(usdPrice) {
  return `$${Number(usdPrice).toFixed(2)} USD`;
}

// Get both USD and MXN price display
export async function getPriceDisplay(usdPrice) {
  if (!usdPrice || usdPrice === 0) return 'Sin precio';
  
  const mxnPrice = await convertUsdToMxn(usdPrice);
  
  return {
    usd: formatUsdPrice(usdPrice),
    mxn: formatMxPrice(mxnPrice),
    rawMxn: mxnPrice
  };
}

export default {
  getExchangeRate,
  convertUsdToMxn,
  formatMxPrice,
  formatUsdPrice,
  getPriceDisplay
};