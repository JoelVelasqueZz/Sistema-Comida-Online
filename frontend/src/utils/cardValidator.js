// Validador de tarjetas de crédito con Algoritmo de Luhn
// frontend/src/utils/cardValidator.js

/**
 * Valida número de tarjeta usando el Algoritmo de Luhn
 * @param {string} number - Número de tarjeta
 * @returns {boolean} - True si es válido
 */
export const validateCardNumber = (number) => {
  // Eliminar espacios y guiones
  const cleanNumber = number.replace(/[\s-]/g, '');

  if (!/^\d+$/.test(cleanNumber)) return false;
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;

  // Algoritmo de Luhn
  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Detecta el tipo de tarjeta basado en el BIN
 * @param {string} number - Número de tarjeta
 * @returns {string} - Tipo de tarjeta
 */
export const getCardType = (number) => {
  const cleanNumber = number.replace(/[\s-]/g, '');

  // Visa: empieza con 4
  if (/^4/.test(cleanNumber)) return 'visa';

  // Mastercard: 51-55 o 2221-2720
  if (/^5[1-5]/.test(cleanNumber) || /^222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720/.test(cleanNumber)) {
    return 'mastercard';
  }

  // American Express: 34 o 37
  if (/^3[47]/.test(cleanNumber)) return 'amex';

  // Discover: 6011, 622126-622925, 644-649, 65
  if (/^6011|^64[4-9]|^65|^622(1(2[6-9]|[3-9]\d)|[2-8]\d{2}|9([01]\d|2[0-5]))/.test(cleanNumber)) {
    return 'discover';
  }

  return 'unknown';
};

/**
 * Valida fecha de expiración
 * @param {string} month - Mes (01-12)
 * @param {string} year - Año (2 dígitos)
 * @returns {boolean}
 */
export const validateExpiry = (month, year) => {
  const now = new Date();
  const currentYear = now.getFullYear() % 100; // Últimos 2 dígitos
  const currentMonth = now.getMonth() + 1;

  const expMonth = parseInt(month);
  const expYear = parseInt(year);

  if (isNaN(expMonth) || isNaN(expYear)) return false;
  if (expMonth < 1 || expMonth > 12) return false;
  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;

  return true;
};

/**
 * Valida CVV según tipo de tarjeta
 * @param {string} cvv - Código CVV
 * @param {string} cardType - Tipo de tarjeta
 * @returns {boolean}
 */
export const validateCVV = (cvv, cardType) => {
  const requiredLength = cardType === 'amex' ? 4 : 3;
  return /^\d+$/.test(cvv) && cvv.length === requiredLength;
};

/**
 * Formatea el número de tarjeta con espacios
 * @param {string} number - Número de tarjeta
 * @returns {string} - Número formateado
 */
export const formatCardNumber = (number) => {
  const cleanNumber = number.replace(/[\s-]/g, '');
  const cardType = getCardType(cleanNumber);

  // Amex: XXXX XXXXXX XXXXX
  if (cardType === 'amex') {
    return cleanNumber.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').trim();
  }

  // Otros: XXXX XXXX XXXX XXXX
  return cleanNumber.replace(/(\d{4})/g, '$1 ').trim();
};

/**
 * Enmascara el número de tarjeta mostrando solo los últimos 4 dígitos
 * @param {string} number - Número de tarjeta
 * @returns {string} - Número enmascarado
 */
export const maskCardNumber = (number) => {
  const cleanNumber = number.replace(/[\s-]/g, '');
  if (cleanNumber.length < 4) return '****';

  const lastFour = cleanNumber.slice(-4);
  const masked = '**** **** **** ' + lastFour;
  return masked;
};

/**
 * Obtiene la longitud esperada según el tipo de tarjeta
 * @param {string} cardType - Tipo de tarjeta
 * @returns {number} - Longitud esperada
 */
export const getExpectedLength = (cardType) => {
  return cardType === 'amex' ? 15 : 16;
};
