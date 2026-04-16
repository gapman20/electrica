/**
 * Format a number as Mexican pesos currency
 * @param {number} amount - The amount to format
 * @param {object} options - Formatting options
 * @param {boolean} options.includeCurrency - Whether to include "MXN" suffix (default: true)
 * @returns {string} Formatted price string
 */
export const formatPrice = (amount, options = {}) => {
  const { includeCurrency = true } = options;
  
  if (!amount) return '';
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return amount || '';
  
  const formatted = `$${num.toLocaleString('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
  
  return includeCurrency ? `${formatted} MXN` : formatted;
};
