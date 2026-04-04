import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../services/api';

const CART_STORAGE_KEY = 'tcg_cart';

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
  const [isLoading, setIsLoading] = useState(false);

  const isLoggedIn = () => !!localStorage.getItem('auth_token');

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isLoggedIn()) {
        const dbItems = await cartApi.get();
        setItems(Array.isArray(dbItems) ? dbItems.map(normalizeCartItem) : []);
      } else {
        setItems(cartApi.getLocal());
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setItems(cartApi.getLocal());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    const handleStorage = () => {
      if (!isLoggedIn()) {
        setItems(cartApi.getLocal());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback(async (item) => {
    const cardId = item.id;
    const productId = item.id;
    const isProduct = !item.rarity;
    const stock = item.stock || 999;

    if (stock === 0) return;

    if (isLoggedIn()) {
      try {
        const dbItem = await cartApi.add({ cardId: isProduct ? null : cardId, productId: isProduct ? productId : null });
        const normalized = normalizeCartItem(dbItem);
        setItems(prev => {
          const existing = prev.find(i => 
            (normalized.cardId && i.cardId === normalized.cardId) ||
            (normalized.productId && i.productId === normalized.productId)
          );
          if (existing) {
            if (existing.quantity >= stock) return prev;
            return prev.map(i =>
              (normalized.cardId && i.cardId === normalized.cardId) ||
              (normalized.productId && i.productId === normalized.productId)
                ? { ...i, quantity: Math.min(i.quantity + 1, stock) }
                : i
            );
          }
          return [...prev, normalized];
        });
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    } else {
      setItems(prev => {
        const existing = prev.find(i => i.cardId === item.id || i.productId === item.id);
        let updated;
        if (existing) {
          if (existing.quantity >= stock) return prev;
          updated = prev.map(i =>
            (i.cardId === item.id || i.productId === item.id)
              ? { ...i, quantity: Math.min(i.quantity + 1, stock) }
              : i
          );
        } else {
          updated = [...prev, {
            cardId: isProduct ? null : item.id,
            productId: isProduct ? item.id : null,
            name: item.name,
            price: item.price,
            quantity: 1,
            imageUrl: item.imageUrl || item.image,
            stock: item.stock,
            game: item.game,
            rarity: item.rarity,
          }];
        }
        cartApi.saveLocal(updated);
        return updated;
      });
    }
  }, []);

  const removeItem = useCallback(async (cartId) => {
    if (isLoggedIn()) {
      try {
        await cartApi.remove(cartId);
        setItems(prev => prev.filter(item => item.cartId !== cartId));
      } catch (error) {
        console.error('Error removing from cart:', error);
      }
    } else {
      setItems(prev => {
        const updated = prev.filter(item => item.cartId !== cartId);
        cartApi.saveLocal(updated);
        return updated;
      });
    }
  }, []);

  const updateQuantity = useCallback(async (cartId, quantity) => {
    if (quantity < 1) {
      removeItem(cartId);
      return;
    }

    if (isLoggedIn()) {
      try {
        await cartApi.update(cartId, quantity);
        setItems(prev => prev.map(item =>
          item.cartId === cartId ? { ...item, quantity } : item
        ));
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    } else {
      setItems(prev => {
        const updated = prev.map(item =>
          item.cartId === cartId ? { ...item, quantity } : item
        );
        cartApi.saveLocal(updated);
        return updated;
      });
    }
  }, [removeItem]);

  const clearCart = useCallback(async () => {
    if (isLoggedIn()) {
      try {
        await cartApi.clear();
        setItems([]);
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    } else {
      setItems([]);
      cartApi.clearLocal();
    }
  }, []);

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
