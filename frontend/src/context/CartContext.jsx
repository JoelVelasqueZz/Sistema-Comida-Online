import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Cargar carrito del localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Agregar producto al carrito
  const addToCart = (product, quantity = 1, extras = []) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => 
          item.id === product.id && 
          JSON.stringify(item.extras) === JSON.stringify(extras)
      );

      if (existingItemIndex > -1) {
        // Si el producto ya existe, aumentar cantidad
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        // Agregar nuevo producto
        return [...prevItems, { 
          ...product, 
          quantity, 
          extras,
          cartItemId: Date.now() // ID único para el item en el carrito
        }];
      }
    });
  };

  // Actualizar cantidad
  const updateQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Eliminar del carrito
  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.cartItemId !== cartItemId)
    );
  };

  // Limpiar carrito
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  // Calcular totales
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = parseFloat(item.price);
      const extrasPrice = item.extras?.reduce(
        (sum, extra) => sum + parseFloat(extra.price),
        0
      ) || 0;
      return total + (itemPrice + extrasPrice) * item.quantity;
    }, 0);
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getItemCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};