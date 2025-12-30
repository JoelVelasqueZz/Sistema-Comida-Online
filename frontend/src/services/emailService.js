import emailjs from '@emailjs/browser';

// Inicializar EmailJS con la clave pública
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ORDER_CONFIRMATION = import.meta.env.VITE_EMAILJS_TEMPLATE_ORDER_CONFIRMATION;
const TEMPLATE_STATUS_UPDATE = import.meta.env.VITE_EMAILJS_TEMPLATE_STATUS_UPDATE;

// Inicializar EmailJS
emailjs.init(PUBLIC_KEY);

// Mapeo de métodos de pago
const PAYMENT_METHODS_ES = {
  'credit_card': 'Tarjeta de Crédito',
  'cash': 'Efectivo',
  'transfer': 'Transferencia Bancaria'
};

// Mapeo de estados
const STATUS_CONFIG = {
  confirmed: {
    emoji: '✅',
    text: 'Confirmado',
    message: 'Tu pedido ha sido confirmado y será preparado pronto.'
  },
  preparing: {
    emoji: '👨‍🍳',
    text: 'En Preparación',
    message: 'Nuestros chefs están preparando tu delicioso pedido.'
  },
  ready: {
    emoji: '📦',
    text: 'Listo para Entrega',
    message: 'Tu pedido está listo y será enviado en breve.'
  },
  delivering: {
    emoji: '🚚',
    text: 'En Camino',
    message: 'Tu pedido está en camino a tu dirección.'
  },
  delivered: {
    emoji: '🎉',
    text: 'Entregado',
    message: '¡Tu pedido ha sido entregado exitosamente! Esperamos que lo disfrutes.'
  }
};

/**
 * Formatea la fecha en español
 * @param {Date} date
 * @returns {string}
 */
const formatDateES = (date) => {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(date).toLocaleDateString('es-ES', options);
};

/**
 * Formatea los items del pedido para el email
 * @param {Array} items
 * @returns {string}
 */
const formatOrderItems = (items) => {
  if (!items || items.length === 0) return 'Sin productos';

  return items.map(item => {
    const name = item.name || item.product_name || 'Producto';
    const quantity = item.quantity || 1;
    const price = item.price || item.unit_price || 0;
    const total = quantity * price;

    return `• ${name} x${quantity} - $${total.toFixed(2)}`;
  }).join('\n');
};

/**
 * Genera URL para seguimiento de pedido
 * @param {string} orderId
 * @returns {string}
 */
const getOrderUrl = (orderId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/orders/${orderId}`;
};

/**
 * Envía email de confirmación de pedido
 * @param {Object} orderData - Datos del pedido
 * @param {string} orderData.orderId - ID del pedido
 * @param {string} orderData.customerName - Nombre del cliente
 * @param {string} orderData.customerEmail - Email del cliente
 * @param {Array} orderData.items - Items del pedido
 * @param {number} orderData.total - Total del pedido
 * @param {string} orderData.paymentMethod - Método de pago
 * @param {string} orderData.deliveryAddress - Dirección de entrega
 * @returns {Promise<boolean>}
 */
export const sendOrderConfirmation = async (orderData) => {
  try {
    console.log('📧 sendOrderConfirmation - Iniciando envío de email');
    console.log('📋 Datos recibidos:', {
      orderId: orderData.orderId,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      itemsCount: orderData.items?.length,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod
    });

    // Validar datos requeridos
    if (!orderData.customerEmail) {
      console.error('❌ ERROR CRÍTICO: customerEmail es undefined o null');
      console.error('📋 orderData completo:', JSON.stringify(orderData, null, 2));
      return false;
    }

    console.log('✅ Email del cliente válido:', orderData.customerEmail);

    // Preparar parámetros del template
    const templateParams = {
      order_id: (orderData.orderId || '').toString().substring(0, 8).toUpperCase(),
      customer_name: orderData.customerName || 'Cliente',
      customer_email: orderData.customerEmail,
      order_date: formatDateES(orderData.createdAt || new Date()),
      total: `$${(orderData.total || 0).toFixed(2)}`,
      order_items: formatOrderItems(orderData.items),
      payment_method: PAYMENT_METHODS_ES[orderData.paymentMethod] || orderData.paymentMethod || 'No especificado',
      delivery_address: orderData.deliveryAddress || 'No especificada',
      order_url: getOrderUrl(orderData.orderId)
    };

    console.log('📨 Parámetros del email:', templateParams);

    // Enviar email
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ORDER_CONFIRMATION,
      templateParams
    );

    console.log('✅ Email de confirmación enviado exitosamente:', response);
    return true;

  } catch (error) {
    console.error('❌ Error al enviar email de confirmación:', error);
    // No lanzar error, solo loguearlo - el email no debe bloquear la creación del pedido
    return false;
  }
};

/**
 * Envía email de actualización de estado
 * @param {Object} updateData - Datos de la actualización
 * @param {string} updateData.orderId - ID del pedido
 * @param {string} updateData.customerName - Nombre del cliente
 * @param {string} updateData.customerEmail - Email del cliente
 * @param {string} updateData.status - Nuevo estado del pedido
 * @param {string} updateData.deliveryPersonName - Nombre del repartidor (opcional)
 * @param {string} updateData.deliveryPersonPhone - Teléfono del repartidor (opcional)
 * @returns {Promise<boolean>}
 */
export const sendStatusUpdate = async (updateData) => {
  try {
    console.log('📧 Enviando email de actualización de estado...', updateData);

    // Validar datos requeridos
    if (!updateData.customerEmail) {
      console.warn('⚠️ No se puede enviar email: falta email del cliente');
      return false;
    }

    // Solo enviar emails para ciertos estados
    const validStatuses = ['confirmed', 'preparing', 'ready', 'delivering', 'delivered'];
    if (!validStatuses.includes(updateData.status)) {
      console.log('ℹ️ No se envía email para el estado:', updateData.status);
      return false;
    }

    const statusInfo = STATUS_CONFIG[updateData.status];
    if (!statusInfo) {
      console.warn('⚠️ Estado no configurado:', updateData.status);
      return false;
    }

    // Preparar parámetros del template
    const templateParams = {
      order_id: (updateData.orderId || '').toString().substring(0, 8).toUpperCase(),
      customer_name: updateData.customerName || 'Cliente',
      customer_email: updateData.customerEmail,
      status_emoji: statusInfo.emoji,
      status_text: statusInfo.text,
      status_message: statusInfo.message,
      order_url: getOrderUrl(updateData.orderId)
    };

    // Agregar información del repartidor si está disponible y el estado es "delivering"
    if (updateData.status === 'delivering') {
      if (updateData.deliveryPersonName) {
        templateParams.delivery_person_name = updateData.deliveryPersonName;
      }
      if (updateData.deliveryPersonPhone) {
        templateParams.delivery_person_phone = updateData.deliveryPersonPhone;
      }
    }

    console.log('📨 Parámetros del email:', templateParams);

    // Enviar email
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_STATUS_UPDATE,
      templateParams
    );

    console.log('✅ Email de actualización enviado exitosamente:', response);
    return true;

  } catch (error) {
    console.error('❌ Error al enviar email de actualización:', error);
    // No lanzar error, solo loguearlo
    return false;
  }
};

/**
 * Verifica la configuración de EmailJS
 * @returns {boolean}
 */
export const isEmailConfigured = () => {
  const isConfigured = !!(PUBLIC_KEY && SERVICE_ID && TEMPLATE_ORDER_CONFIRMATION && TEMPLATE_STATUS_UPDATE);

  if (!isConfigured) {
    console.warn('⚠️ EmailJS no está completamente configurado. Verifica las variables de entorno.');
  }

  return isConfigured;
};

/**
 * Envía email de recuperación de contraseña
 * @param {string} email - Email del usuario
 * @param {string} token - Token de recuperación
 * @param {string} name - Nombre del usuario
 * @returns {Promise<boolean>}
 */
export const sendPasswordResetEmail = async (email, token, name) => {
  try {
    console.log('📧 [Email Service] Enviando email de recuperación...');

    const templateParams = {
      customer_name: name,
      customer_email: email,
      order_id: token // Token en lugar de código (reutiliza campo del template)
    };

    await emailjs.send(
      'service_nkiq6fm',
      'template_g43uzzj',
      templateParams,
      'NVpawW2V7U5qmoWQH'
    );

    console.log('✅ [Email Service] Email de recuperación enviado exitosamente');
    return true;

  } catch (error) {
    console.error('❌ [Email Service] Error enviando email de recuperación:', error);
    throw error;
  }
};

// Log de inicialización
console.log('📧 EmailJS Service inicializado:', {
  configured: isEmailConfigured(),
  serviceId: SERVICE_ID ? '✅' : '❌',
  publicKey: PUBLIC_KEY ? '✅' : '❌',
  templateConfirmation: TEMPLATE_ORDER_CONFIRMATION ? '✅' : '❌',
  templateStatusUpdate: TEMPLATE_STATUS_UPDATE ? '✅' : '❌'
});
