import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { sendOrderConfirmation } from '../services/emailService';
import addressService from '../services/addressService';
import cardService from '../services/cardService';
import couponService from '../services/couponService';
import CreditCardForm from '../components/checkout/CreditCardForm';
import TransferForm from '../components/checkout/TransferForm';
import './Checkout.css';

function Checkout() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Debug: Log del usuario al cargar el componente
  useEffect(() => {
    console.log('🛒 Checkout - Componente cargado');
    console.log('👤 Usuario en Checkout:', user);
    if (user) {
      console.log('📧 Email del usuario:', user.email);
      console.log('👤 Nombre del usuario:', user.name);
      console.log('🆔 ID del usuario:', user.id);
      console.log('🎭 Role del usuario:', user.role);
    } else {
      console.warn('⚠️ No hay usuario en el contexto');
    }
  }, [user]);

  // Cargar direcciones guardadas
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const response = await addressService.getAddresses();
        setSavedAddresses(response.addresses || []);

        // Si hay una dirección predeterminada, seleccionarla automáticamente
        const defaultAddress = response.addresses?.find(addr => addr.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setFormData(prev => ({
            ...prev,
            street: defaultAddress.street,
            city: defaultAddress.city,
            postal_code: defaultAddress.postal_code || '',
            reference: defaultAddress.reference || ''
          }));
        } else if (response.addresses && response.addresses.length === 0) {
          // Si no hay direcciones guardadas, mostrar el formulario de nueva dirección
          setUseNewAddress(true);
        }
      } catch (err) {
        console.error('Error al cargar direcciones:', err);
        // Si hay error, permitir ingresar dirección manualmente
        setUseNewAddress(true);
      } finally {
        setLoadingAddresses(false);
      }
    };

    loadAddresses();
  }, []);

  // Cargar tarjetas guardadas
  useEffect(() => {
    const loadCards = async () => {
      try {
        console.log('💳 Cargando tarjetas guardadas...');
        const data = await cardService.getCards();
        setSavedCards(data.cards || []);
        console.log('💳 Tarjetas cargadas:', data.cards?.length || 0);

        // Auto-seleccionar tarjeta predeterminada si hay tarjetas
        const defaultCard = data.cards?.find(card => card.is_default);
        if (defaultCard) {
          setSelectedCardId(defaultCard.id);
          setUseNewCard(false);
          console.log('💳 Tarjeta predeterminada seleccionada:', defaultCard.id);
        } else if (data.cards && data.cards.length > 0) {
          // Si hay tarjetas pero ninguna es predeterminada, no seleccionar ninguna
          setUseNewCard(false);
        } else {
          // Si no hay tarjetas guardadas, mostrar formulario de nueva tarjeta
          setUseNewCard(true);
        }
      } catch (error) {
        console.error('Error cargando tarjetas:', error);
        // Si hay error, permitir ingresar tarjeta manualmente
        setUseNewCard(true);
      }
    };

    loadCards();
  }, []);

  const [formData, setFormData] = useState({
    street: '',
    city: '',
    postal_code: '',
    reference: '',
    payment_method: 'cash',
    special_instructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [confirmationUrl, setConfirmationUrl] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Estados para direcciones guardadas
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Estados para tarjetas guardadas
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);
  const [cvv, setCvv] = useState('');

  // Estados para cupones
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Manejar selección de dirección guardada
  const handleSelectAddress = (addressId) => {
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      setSelectedAddressId(addressId);
      setFormData(prev => ({
        ...prev,
        street: address.street,
        city: address.city,
        postal_code: address.postal_code || '',
        reference: address.reference || ''
      }));
      setUseNewAddress(false);
    }
  };

  // Helper para detectar tipo de tarjeta
  const getCardType = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, '');

    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    if (number.startsWith('6')) return 'discover';

    return 'visa'; // Default
  };

  const calculateTotals = () => {
    const subtotal = getCartTotal();
    const delivery_fee = 2.50;
    const tax = (subtotal - discountAmount) * 0.12; // Impuesto sobre subtotal con descuento
    const total = subtotal - discountAmount + delivery_fee + tax;
    return { subtotal, delivery_fee, tax, total, discount: discountAmount };
  };

  // Función para aplicar cupón
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Ingresa un código de cupón');
      return;
    }

    try {
      setValidatingCoupon(true);
      setCouponError('');

      console.log('🎟️ Validando cupón:', couponCode);

      // Calcular subtotal
      const subtotal = getCartTotal();

      // Validar cupón
      const response = await couponService.validateCoupon(couponCode, subtotal, cartItems);

      if (response.valid) {
        setAppliedCoupon(response.coupon);
        setDiscountAmount(response.discountAmount);
        console.log('✅ Cupón aplicado:', response);
      }

    } catch (error) {
      console.error('❌ Error validando cupón:', error);
      setCouponError(error.response?.data?.error || 'Cupón no válido');
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Función para remover cupón
  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError('');
  };

  const handleSubmit = async () => {
    console.log('🎯 handleSubmit LLAMADO');
    console.log('📋 formData:', formData);
    console.log('🛒 cartItems:', cartItems);

    setError('');

    // Validar campos requeridos
    if (!formData.street || !formData.city) {
      setError('Por favor completa la dirección de entrega (Calle y Ciudad son requeridos)');
      alert('❌ Por favor completa la dirección de entrega');
      return;
    }

    if (!formData.payment_method) {
      setError('Por favor selecciona un método de pago');
      alert('❌ Por favor selecciona un método de pago');
      return;
    }

    console.log('✅ Validación pasada, continuando...');

    // Si es tarjeta o transferencia, mostrar el formulario de pago
    if (formData.payment_method === 'card' || formData.payment_method === 'transfer') {
      // Preparar datos para después
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        extras: item.extras?.map(e => e.id) || []
      }));

      const pendingData = {
        items: orderItems,
        delivery_address: {
          street: formData.street,
          city: formData.city,
          postal_code: formData.postal_code,
          reference: formData.reference
        },
        payment_method: formData.payment_method,
        special_instructions: formData.special_instructions
      };

      // Si hay cupón aplicado, agregarlo
      if (appliedCoupon) {
        pendingData.couponId = appliedCoupon.id;
        pendingData.discountAmount = discountAmount;
      }

      setPendingOrderData(pendingData);

      setShowPaymentForm(true);
      return;
    }

    // Para efectivo, procesar directamente
    setLoading(true);

    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        extras: item.extras?.map(e => e.id) || []
      }));

      const orderData = {
        items: orderItems,
        delivery_address: {
          street: formData.street,
          city: formData.city,
          postal_code: formData.postal_code,
          reference: formData.reference
        },
        payment_method: formData.payment_method,
        special_instructions: formData.special_instructions
      };

      // Si hay cupón aplicado, agregarlo
      if (appliedCoupon) {
        orderData.couponId = appliedCoupon.id;
        orderData.discountAmount = discountAmount;
        console.log('🎟️ Cupón incluido en la orden:', appliedCoupon.code);
      }

      console.log('Enviando orden:', orderData);

      const orderResponse = await orderService.createOrder(orderData);
      console.log('✅ Orden creada:', orderResponse);

      const paymentData = {
        order_id: orderResponse.order.id,
        payment_method: formData.payment_method
      };

      await paymentService.processPayment(paymentData);

      // Debug: Verificar datos del usuario
      console.log('🔍 Usuario actual:', user);
      console.log('🔍 Email del usuario:', user?.email);
      console.log('🔍 Nombre del usuario:', user?.name);

      // Enviar email de confirmación (no bloqueante)
      sendOrderConfirmation({
        orderId: orderResponse.order.id,
        customerName: user?.name || 'Cliente',
        customerEmail: user?.email,
        items: cartItems,
        total: totals.total,
        paymentMethod: formData.payment_method,
        deliveryAddress: `${formData.street}, ${formData.city}${formData.postal_code ? ', ' + formData.postal_code : ''}`,
        createdAt: new Date()
      }).catch(err => console.error('Error al enviar email (no crítico):', err));

      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error('Error al procesar pedido:', err);
      console.error('Response:', err.response);
      setError(err.response?.data?.error || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async (paymentInfo) => {
    console.log('🎯🎯🎯 handleCardPayment INICIADO 🎯🎯🎯');
    console.log('💳 Datos de pago recibidos:', paymentInfo);
    console.log('📦 Datos de orden pendiente:', pendingOrderData);
    console.log('🛒 Items en carrito:', cartItems);
    console.log('📊 Cantidad de items:', cartItems?.length || 0);

    setLoading(true);

    try {

      // Validar que tengamos datos de orden
      if (!pendingOrderData) {
        throw new Error('No hay datos de orden pendiente');
      }

      if (!pendingOrderData.items || pendingOrderData.items.length === 0) {
        throw new Error('No hay items en la orden');
      }

      // PASO 1: Crear la orden en la base de datos
      console.log('📤 Enviando orden a la base de datos...');
      const orderResponse = await orderService.createOrder(pendingOrderData);
      console.log('✅ Orden creada exitosamente:', orderResponse);

      // Verificar que la orden se creó correctamente
      if (!orderResponse.order || !orderResponse.order.id) {
        throw new Error('La orden no se creó correctamente');
      }

      // PASO 2: Procesar el pago
      console.log('💳 Procesando pago para orden:', orderResponse.order.id);
      const paymentData = {
        order_id: orderResponse.order.id,
        payment_method: 'card',
        transaction_id: paymentInfo.transactionId,
        card_type: paymentInfo.cardType,
        last_four: paymentInfo.lastFour
      };

      await paymentService.processPayment(paymentData);
      console.log('✅ Pago procesado exitosamente');

      // PASO 3: Enviar email de confirmación (no bloqueante)
      // Debug: Verificar datos del usuario
      console.log('🔍 Usuario actual (tarjeta):', user);
      console.log('🔍 Email del usuario (tarjeta):', user?.email);

      sendOrderConfirmation({
        orderId: orderResponse.order.id,
        customerName: user?.name || 'Cliente',
        customerEmail: user?.email,
        items: cartItems,
        total: totals.total,
        paymentMethod: 'card',
        deliveryAddress: `${pendingOrderData.delivery_address.street}, ${pendingOrderData.delivery_address.city}${pendingOrderData.delivery_address.postal_code ? ', ' + pendingOrderData.delivery_address.postal_code : ''}`,
        createdAt: new Date()
      }).catch(err => console.error('Error al enviar email (no crítico):', err));

      // PASO 3.5: Guardar tarjeta si el usuario lo solicitó y usó una nueva tarjeta
      console.log('🔍 [Checkout] Verificando si guardar tarjeta:', {
        saveCardForFuture,
        useNewCard,
        hasCardholderName: !!paymentInfo.cardholderName,
        paymentInfo
      });

      if (saveCardForFuture && useNewCard && paymentInfo.cardholderName) {
        try {
          const cardDataToSave = {
            card_type: paymentInfo.cardType || getCardType(paymentInfo.cardNumber || ''),
            last_four_digits: paymentInfo.lastFour,
            cardholder_name: paymentInfo.cardholderName,
            expiry_month: parseInt(paymentInfo.expiryMonth),
            expiry_year: parseInt(paymentInfo.expiryYear),
            is_default: savedCards.length === 0 // Primera tarjeta como predeterminada
          };

          console.log('💾 [Checkout] Guardando tarjeta para usos futuros...');
          console.log('💾 [Checkout] Datos a guardar:', cardDataToSave);

          await cardService.saveCard(cardDataToSave);

          console.log('✅ [Checkout] Tarjeta guardada exitosamente');
        } catch (cardError) {
          console.error('⚠️ [Checkout] Error guardando tarjeta (no crítico):', cardError);
          console.error('⚠️ [Checkout] Detalles del error:', cardError.response?.data || cardError.message);
          // No fallar el checkout si falla guardar la tarjeta
        }
      } else {
        console.log('ℹ️ [Checkout] No se guardará la tarjeta:', {
          saveCardForFuture: saveCardForFuture ? 'SÍ marcado' : 'NO marcado',
          useNewCard: useNewCard ? 'Usando nueva tarjeta' : 'Usando tarjeta guardada',
          hasCardholderName: paymentInfo.cardholderName ? 'SÍ tiene nombre' : 'NO tiene nombre'
        });
      }

      // PASO 4: SOLO AHORA limpiar el carrito (después de que todo fue exitoso)
      console.log('🧹 Limpiando carrito...');
      clearCart();

      // PASO 5: Redirigir a órdenes
      console.log('🎉 Redirigiendo a /orders');
      navigate('/orders');

    } catch (err) {
      console.error('❌ Error al procesar pago con tarjeta:', err);
      console.error('Detalles del error:', err.response || err);

      const errorMessage = err.response?.data?.error || err.message || 'Error al procesar el pago';
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);

      // NO limpiar el carrito si hubo error
      setShowPaymentForm(false);
    } finally {
      setLoading(false);
    }
  };

  // Función para crear la orden de transferencia (llamada automáticamente al mostrar el formulario)
  const createTransferOrder = async () => {
    // Prevenir doble ejecución
    if (creatingOrder) {
      console.log('⚠️ Ya se está creando una orden, ignorando...');
      return;
    }

    // Si ya hay confirmationUrl, no crear otra orden
    if (confirmationUrl) {
      console.log('⚠️ Ya existe URL de confirmación, no crear orden duplicada');
      return;
    }

    setCreatingOrder(true);
    setLoading(true);

    try {
      console.log('🏦 createTransferOrder INICIADO');
      console.log('📦 Datos de orden pendiente:', pendingOrderData);

      // Validar que tengamos datos de orden
      if (!pendingOrderData) {
        throw new Error('No hay datos de orden pendiente');
      }

      if (!pendingOrderData.items || pendingOrderData.items.length === 0) {
        throw new Error('No hay items en la orden');
      }

      console.log('📤 Creando orden en la base de datos...');
      const orderResponse = await orderService.createOrder(pendingOrderData);
      console.log('✅ Orden creada:', orderResponse);

      // Verificar que la orden se creó correctamente
      if (!orderResponse.order || !orderResponse.order.id) {
        throw new Error('La orden no se creó correctamente');
      }

      // Guardar la URL de confirmación y el ID de la orden
      setCurrentOrderId(orderResponse.order.id);

      if (orderResponse.confirmationUrl) {
        setConfirmationUrl(orderResponse.confirmationUrl);
        console.log('📱 URL de confirmación generada:', orderResponse.confirmationUrl);
      }

      // Enviar email de confirmación (no bloqueante)
      // Debug: Verificar datos del usuario
      console.log('🔍 Usuario actual (transferencia):', user);
      console.log('🔍 Email del usuario (transferencia):', user?.email);

      sendOrderConfirmation({
        orderId: orderResponse.order.id,
        customerName: user?.name || 'Cliente',
        customerEmail: user?.email,
        items: cartItems,
        total: totals.total,
        paymentMethod: 'transfer',
        deliveryAddress: `${pendingOrderData.delivery_address.street}, ${pendingOrderData.delivery_address.city}${pendingOrderData.delivery_address.postal_code ? ', ' + pendingOrderData.delivery_address.postal_code : ''}`,
        createdAt: new Date()
      }).catch(err => console.error('Error al enviar email (no crítico):', err));

      console.log('✅ Orden de transferencia lista');

    } catch (err) {
      console.error('❌ Error al crear orden de transferencia:', err);
      console.error('Detalles del error:', err.response || err);

      const errorMessage = err.response?.data?.error || err.message || 'Error al crear la orden';
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);

      setShowPaymentForm(false);
    } finally {
      setLoading(false);
      setCreatingOrder(false);
    }
  };

  // Efecto para crear la orden automáticamente cuando se muestra el formulario de transferencia
  useEffect(() => {
    if (showPaymentForm && formData.payment_method === 'transfer' && pendingOrderData && !confirmationUrl && !creatingOrder) {
      console.log('🔔 Se detectó formulario de transferencia, creando orden automáticamente...');
      createTransferOrder();
    }
  }, [showPaymentForm, formData.payment_method]);

  const totals = calculateTotals();

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <div className="empty-state animate-scale-in">
          <div className="empty-icon">🛒</div>
          <h2 className="heading-2">No hay productos en el carrito</h2>
          <p className="text-lg text-muted mb-6">
            Agrega productos desde el menú para continuar
          </p>
          <button
            onClick={() => navigate('/menu')}
            className="btn btn-primary btn-lg hover-lift"
          >
            🍕 Ir al Menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container container-7xl">
        {/* Header */}
        <div className="checkout-header animate-fade-in-up">
          <h1 className="heading-1">🛍️ Finalizar Pedido</h1>
          <p className="text-lg text-muted">Completa tu información para recibir tu pedido</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error animate-shake">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Main Layout */}
        <div className="checkout-layout">
          {/* Form Section */}
          <div className="checkout-form-section">
            <div className="checkout-form animate-fade-in-up animate-delay-1">
              {/* Address Section */}
              <div className="form-section card">
                <h2 className="form-section-title heading-4">
                  <span className="section-icon">📍</span>
                  Dirección de Entrega
                </h2>

                {/* Direcciones guardadas */}
                {!loadingAddresses && savedAddresses.length > 0 && !useNewAddress && (
                  <div className="saved-addresses-section">
                    <label className="label">Selecciona una dirección guardada:</label>
                    <div className="saved-addresses-grid">
                      {savedAddresses.map((address) => (
                        <div
                          key={address.id}
                          onClick={() => handleSelectAddress(address.id)}
                          className={`saved-address-option ${selectedAddressId === address.id ? 'selected' : ''}`}
                        >
                          {address.is_default && (
                            <span className="default-badge-small">⭐ Predeterminada</span>
                          )}
                          <div className="address-details-compact">
                            <p className="address-street-compact">{address.street}</p>
                            <p className="address-city-compact">
                              {address.city}
                              {address.postal_code && `, ${address.postal_code}`}
                            </p>
                            {address.reference && (
                              <p className="address-reference-compact">{address.reference}</p>
                            )}
                          </div>
                          {selectedAddressId === address.id && (
                            <div className="selected-indicator">✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUseNewAddress(true);
                        setSelectedAddressId(null);
                        setFormData(prev => ({
                          ...prev,
                          street: '',
                          city: '',
                          postal_code: '',
                          reference: ''
                        }));
                      }}
                      className="btn btn-outline-secondary btn-sm mt-3"
                    >
                      + Usar nueva dirección
                    </button>
                  </div>
                )}

                {/* Formulario de nueva dirección */}
                {(useNewAddress || savedAddresses.length === 0) && (
                  <>
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setUseNewAddress(false);
                          // Seleccionar la dirección predeterminada si existe
                          const defaultAddress = savedAddresses.find(addr => addr.is_default);
                          if (defaultAddress) {
                            handleSelectAddress(defaultAddress.id);
                          }
                        }}
                        className="btn btn-ghost btn-sm mb-3"
                      >
                        ← Volver a direcciones guardadas
                      </button>
                    )}

                    <div className="form-group">
                      <label className="label">Calle / Dirección *</label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        required
                        className="input input-lg"
                        placeholder="Ej: Av. Principal 123"
                      />
                    </div>
                  </>
                )}

                {(useNewAddress || savedAddresses.length === 0) && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="label">Ciudad *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          className="input input-lg"
                          placeholder="Ej: Guayaquil"
                        />
                      </div>

                      <div className="form-group">
                        <label className="label">Código Postal</label>
                        <input
                          type="text"
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleChange}
                          className="input input-lg"
                          placeholder="Opcional"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="label">Referencia</label>
                      <input
                        type="text"
                        name="reference"
                        value={formData.reference}
                        onChange={handleChange}
                        className="input input-lg"
                        placeholder="Ej: Casa azul, junto al parque"
                      />
                      <p className="helper-text">
                        Ayúdanos a encontrar tu ubicación más fácil
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Section */}
              <div className="form-section card">
                <h2 className="form-section-title heading-4">
                  <span className="section-icon">💳</span>
                  Método de Pago
                </h2>

                <div className="payment-methods">
                  <label className={`payment-option ${formData.payment_method === 'cash' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="cash"
                      checked={formData.payment_method === 'cash'}
                      onChange={handleChange}
                      className="radio"
                    />
                    <div className="payment-info">
                      <span className="payment-icon">💵</span>
                      <div className="payment-details">
                        <span className="payment-name">Efectivo</span>
                        <span className="payment-desc">Pago contra entrega</span>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-option ${formData.payment_method === 'card' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={formData.payment_method === 'card'}
                      onChange={handleChange}
                      className="radio"
                    />
                    <div className="payment-info">
                      <span className="payment-icon">💳</span>
                      <div className="payment-details">
                        <span className="payment-name">Tarjeta</span>
                        <span className="payment-desc">Crédito / Débito</span>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-option ${formData.payment_method === 'transfer' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="transfer"
                      checked={formData.payment_method === 'transfer'}
                      onChange={handleChange}
                      className="radio"
                    />
                    <div className="payment-info">
                      <span className="payment-icon">📱</span>
                      <div className="payment-details">
                        <span className="payment-name">Transferencia</span>
                        <span className="payment-desc">Bancaria / QR</span>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Mostrar formularios de pago según el método seleccionado */}
                {showPaymentForm && formData.payment_method === 'card' && (
                  <div className="payment-form-container">
                    {/* Selector de tarjetas guardadas */}
                    {savedCards.length > 0 && (
                      <div className="saved-cards-section">
                        <div className="payment-method-toggle">
                          <button
                            type="button"
                            className={!useNewCard ? 'active' : ''}
                            onClick={() => {
                              setUseNewCard(false);
                              const defaultCard = savedCards.find(c => c.is_default);
                              if (defaultCard) setSelectedCardId(defaultCard.id);
                              setCvv('');
                            }}
                          >
                            📋 Usar Tarjeta Guardada
                          </button>
                          <button
                            type="button"
                            className={useNewCard ? 'active' : ''}
                            onClick={() => {
                              setUseNewCard(true);
                              setSelectedCardId(null);
                              setCvv('');
                            }}
                          >
                            ➕ Nueva Tarjeta
                          </button>
                        </div>

                        {!useNewCard && (
                          <div className="saved-cards-list">
                            {savedCards.map(card => (
                              <div
                                key={card.id}
                                className={`saved-card-option ${selectedCardId === card.id ? 'selected' : ''}`}
                                onClick={() => setSelectedCardId(card.id)}
                              >
                                <div className="card-radio">
                                  <input
                                    type="radio"
                                    name="saved-card"
                                    checked={selectedCardId === card.id}
                                    onChange={() => setSelectedCardId(card.id)}
                                  />
                                </div>
                                <div className="card-details">
                                  <div className="card-header">
                                    <span className="card-type">
                                      💳 {card.card_type.toUpperCase()}
                                    </span>
                                    {card.is_default && (
                                      <span className="default-badge-small">⭐ Predeterminada</span>
                                    )}
                                  </div>
                                  <div className="card-number">•••• •••• •••• {card.last_four_digits}</div>
                                  <div className="card-info-row">
                                    <span>{card.cardholder_name}</span>
                                    <span>Exp: {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}</span>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* CVV requerido incluso con tarjeta guardada */}
                            <div className="cvv-required">
                              <label>Código de Seguridad (CVV) *</label>
                              <input
                                type="text"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="123"
                                maxLength="4"
                                required
                              />
                              <small>Por seguridad, ingresa el CVV de tu tarjeta</small>
                            </div>

                            {/* Botón de pago con tarjeta guardada */}
                            <button
                              type="button"
                              className="pay-button"
                              disabled={!selectedCardId || !cvv}
                              onClick={async () => {
                                if (!selectedCardId || !cvv) {
                                  alert('Por favor selecciona una tarjeta e ingresa el CVV');
                                  return;
                                }

                                // Simular pago con tarjeta guardada
                                const selectedCard = savedCards.find(c => c.id === selectedCardId);
                                const paymentInfo = {
                                  method: 'card',
                                  transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
                                  cardType: selectedCard.card_type,
                                  lastFour: selectedCard.last_four_digits,
                                  cardholderName: selectedCard.cardholder_name,
                                  expiryMonth: String(selectedCard.expiry_month).padStart(2, '0'),
                                  expiryYear: String(selectedCard.expiry_year)
                                };

                                await handleCardPayment(paymentInfo);
                              }}
                            >
                              Pagar ${totals.total.toFixed(2)}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Formulario de nueva tarjeta */}
                    {(useNewCard || savedCards.length === 0) && (
                      <div className="new-card-form">
                        <CreditCardForm
                          amount={totals.total}
                          onPaymentSuccess={handleCardPayment}
                        />

                        {/* Checkbox para guardar tarjeta */}
                        <div className="save-card-checkbox">
                          <input
                            type="checkbox"
                            id="saveCard"
                            checked={saveCardForFuture}
                            onChange={(e) => setSaveCardForFuture(e.target.checked)}
                          />
                          <label htmlFor="saveCard">
                            💾 Guardar esta tarjeta para futuros pedidos
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {showPaymentForm && formData.payment_method === 'transfer' && (
                  <div className="payment-form-container">
                    <TransferForm
                      amount={totals.total}
                      orderId={currentOrderId}
                      confirmationUrl={confirmationUrl}
                      onClose={() => {
                        clearCart();
                        navigate('/orders');
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Special Instructions */}
              <div className="form-section card">
                <h2 className="form-section-title heading-4">
                  <span className="section-icon">📝</span>
                  Instrucciones Especiales
                </h2>

                <div className="form-group">
                  <textarea
                    name="special_instructions"
                    value={formData.special_instructions}
                    onChange={handleChange}
                    className="input textarea"
                    placeholder="Ej: Sin cebolla, sin picante, etc."
                  />
                  <p className="helper-text">
                    Opcional - Indica si tienes alguna preferencia
                  </p>
                </div>
              </div>

              {/* Submit Button - Solo mostrar si no hay formulario de pago activo */}
              {!showPaymentForm && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn btn-success btn-xl btn-block hover-lift"
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Procesando pedido...
                    </>
                  ) : (
                    <>✓ {formData.payment_method === 'cash' ? 'Confirmar Pedido' : 'Continuar al Pago'}</>
                  )}
                </button>
              )}

              {/* Botón para volver si está en el formulario de pago */}
              {showPaymentForm && (
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="btn btn-ghost btn-block"
                >
                  ← Volver a la información de entrega
                </button>
              )}
            </div>
          </div>

          {/* Summary Section */}
          <div className="checkout-summary-section">
            <div className="summary-sticky animate-fade-in-up animate-delay-2">
              <div className="summary-card card card-elevated">
                <h3 className="summary-title heading-4">Resumen del Pedido</h3>

                {/* Items List */}
                <div className="summary-items">
                  {cartItems.map((item) => (
                    <div key={item.cartItemId} className="summary-item">
                      <div className="item-header">
                        <span className="item-quantity">{item.quantity}x</span>
                        <span className="item-name">{item.name}</span>
                        <span className="item-price">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      {item.extras && item.extras.length > 0 && (
                        <div className="item-extras">
                          {item.extras.map((extra, i) => (
                            <span key={extra.id} className="extra-tag">
                              + {extra.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="summary-divider"></div>

                {/* Sección de Cupones */}
                <div className="coupon-section">
                  <h4>🎟️ ¿Tienes un cupón?</h4>

                  {!appliedCoupon ? (
                    <div className="coupon-input-group">
                      <input
                        type="text"
                        placeholder="Ingresa tu código"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={validatingCoupon}
                        className="coupon-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="apply-coupon-btn"
                      >
                        {validatingCoupon ? 'Validando...' : 'Aplicar'}
                      </button>
                    </div>
                  ) : (
                    <div className="applied-coupon">
                      <div className="coupon-info">
                        <span className="coupon-badge">✅ {appliedCoupon.code}</span>
                        <span className="coupon-savings">-${discountAmount.toFixed(2)}</span>
                      </div>
                      <button onClick={handleRemoveCoupon} className="remove-coupon-btn">
                        ✕ Quitar
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <div className="coupon-error">
                      ⚠️ {couponError}
                    </div>
                  )}
                </div>

                <div className="summary-divider"></div>

                {/* Totals */}
                <div className="summary-totals">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="summary-row discount-row">
                      <span>Descuento ({appliedCoupon.code}):</span>
                      <span className="discount-amount">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="summary-row">
                    <span>Envío:</span>
                    <span className="font-semibold">${totals.delivery_fee.toFixed(2)}</span>
                  </div>

                  <div className="summary-row">
                    <span>IVA (12%):</span>
                    <span className="font-semibold">${totals.tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-total">
                  <span className="total-label">Total a Pagar:</span>
                  <span className="total-value text-gradient">
                    ${totals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
