/**
 * Formats input value to ensure maximum 2 decimal places
 * @param {string} value - The input value
 * @returns {string} - Formatted value with max 2 decimal places
 */
export const formatCurrencyInput = (value) => {
  // Remove any non-numeric characters except decimal point
  let cleanValue = value.replace(/[^0-9.]/g, '');
  
  // Handle multiple decimal points - keep only the first one
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  return cleanValue;
};

/**
 * Handles currency input change events
 * @param {Event} e - The input change event
 * @param {Function} setValue - State setter function
 */
export const handleCurrencyInputChange = (e, setValue) => {
  const formattedValue = formatCurrencyInput(e.target.value);
  setValue(formattedValue);
};
