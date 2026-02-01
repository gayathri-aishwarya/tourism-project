// src/utils/discountUtils.js
/**
 * Calculate discount from phone number (sum of digits)
 * @param {string} phone - Egyptian phone number
 * @returns {number} Discount amount (capped at 100)
 */
const calculatePhoneDiscount = (phone) => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Sum all digits
  const sum = digitsOnly
    .split('')
    .map(Number)
    .reduce((acc, digit) => acc + digit, 0);
  
  // Cap at 100 EGP
  return Math.min(sum, 100);
};

/**
 * Generate unique discount code
 * Format: FAY-{phoneLast4}-{random4}
 * Example: FAY-8556-3A7B
 * @param {string} phone - Phone number
 * @returns {string} Discount code
 */
const generateDiscountCode = (phone) => {
  const lastFour = phone.slice(-4);
  const random = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();
  
  return `FAY-${lastFour}-${random}`;
};

/**
 * Validate Egyptian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
const isValidEgyptianPhone = (phone) => {
  const regex = /^01[0-2,5]{1}[0-9]{8}$/;
  return regex.test(phone);
};

module.exports = {
  calculatePhoneDiscount,
  generateDiscountCode,
  isValidEgyptianPhone
};