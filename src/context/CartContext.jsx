import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../services/api';
import { useUser } from './UserContext';

const CartContext = createContext(null);

const normalizeCartItem = (dbItem) => {
  const item = dbItem.item || dbItem.card || dbItem.product || dbItem;
  return {
    cartId: dbItem.id,
    cardId: dbItem.cardId,
    productId: dbItem.productId,
    name: item.name || 'Sin nombre',
    price: parseFloat(item.price || 0),
    quantity: dbItem.quantity || 1,
    imageUrl: item.imageUrl,
    stock: item.stock,
    game: item.game?.name || item.game,
    rarity: item.rarity,
  };
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useUser();

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const dbItems = await cartApi.get();
      setItems(Array.isArray(dbItems) ? dbItems.map(normalizeCartItem) : []);
    } catch (error) {
      console.error('Error loading cart:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setItems([]);
      setIsLoading(false);
    }
  }, [user, loadCart]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback(async (item) => {
    if (!user) return;

    const stock = item.stock || 999;
    if (stock === 0) return;

    try {
      const dbItem = await cartApi.add({ 
        cardId: item.rarity ? item.id : null, 
        productId: !item.rarity ? item.id : null 
      });
      const normalized = normalizeCartItem(dbItem);
      setItems(prev => {
        const exists = prev.some(i => 
          (normalized.cardId && i.cardId === normalized.cardId) ||
          (normalized.productId && i.productId === normalized.productId)
        );
        if (exists) return prev;
        return [...prev, normalized];
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  }, [user]);

  const removeItem = useCallback(async (cartId) => {
    if (!user) return;

    try {
      await cartApi.remove(cartId);
      setItems(prev => prev.filter(item => item.cartId !== cartId));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  }, [user]);

  const updateQuantity = useCallback(async (cartId, quantity) => {
    if (!user) return;

    if (quantity < 1) {
      removeItem(cartId);
      return;
    }

    try {
      await cartApi.update(cartId, quantity);
      setItems(prev => prev.map(item =>
        item.cartId === cartId ? { ...item, quantity } : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  }, [user, removeItem]);

  const clearCart = useCallback(async () => {
    if (!user) return;

    try {
      await cartApi.clear();
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }, [user]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(prev => !prev);

  return (
    <CartContext.Provider value={{
      items,
      subtotal,
      itemCount,
      isCartOpen,
      isLoading,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      loadCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
