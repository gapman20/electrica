import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi, campaignApi } from '../services/api';
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
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const [activeCampaign, setActiveCampaign] = useState(null);
  const { user, logout } = useUser();

  const GUEST_CART_KEY = 'guest_cart_v1';

  // Load active campaign on mount
  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const campaign = await campaignApi.getActive();
        setActiveCampaign(campaign);
      } catch (error) {
        console.error('Error loading campaign:', error);
      }
    };
    loadCampaign();
  }, []);

  // Load guest cart from localStorage on init
  const loadGuestCart = useCallback(() => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  const saveGuestCart = useCallback((cartItems) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  }, []);

  const normalizeLocalCartItem = (item) => ({
    ...item,
    cartId: item.cartId || `local_${Date.now()}_${Math.random()}`,
    price: parseFloat(item.price || 0),
    quantity: item.quantity || 1,
    stock: item.stock || 999,
  });

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
      // Load cart from backend for authenticated users
      loadCart();
    } else {
      // Load guest cart from localStorage
      const guestItems = loadGuestCart();
      setItems(guestItems.map(normalizeLocalCartItem));
      setIsLoading(false);
    }
  }, [user, loadCart, loadGuestCart]);

  // Merge guest cart with server cart on login
  useEffect(() => {
    if (user) {
      const guestItems = loadGuestCart();
      if (guestItems.length > 0) {
        // Add each guest cart item to the server cart
        guestItems.forEach(async (item) => {
          try {
            await cartApi.add({
              cardId: item.cardId,
              productId: item.productId,
              quantity: item.quantity || 1
            });
          } catch (error) {
            console.error('Error merging guest cart item:', error);
          }
        });
        // Clear guest cart after merging
        saveGuestCart([]);
        // Reload cart from server
        loadCart();
      }
    }
  }, [user, loadGuestCart, saveGuestCart, loadCart]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingCost = deliveryOption === 'delivery' ? 150 : 0;
  const discountPercent = activeCampaign?.discountPercent || 0;
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount + shippingCost;

  const addItem = useCallback(async (item) => {
    const stock = item.stock || 999;
    if (stock === 0) return;

    if (user) {
      // Authenticated user - use backend API
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
    } else {
      // Guest user - use localStorage
      setItems(prev => {
        const newItem = normalizeLocalCartItem({
          cardId: item.rarity ? item.id : null,
          productId: !item.rarity ? item.id : null,
          name: item.name,
          price: item.price,
          quantity: 1,
          imageUrl: item.imageUrl || item.image,
          stock: item.stock,
          game: item.game?.name || item.game,
          rarity: item.rarity,
        });

        const existingItemIndex = prev.findIndex(i =>
          (newItem.cardId && i.cardId === newItem.cardId) ||
          (newItem.productId && i.productId === newItem.productId)
        );

        let updated;
        if (existingItemIndex > -1) {
          updated = [...prev];
          const existingItem = updated[existingItemIndex];
          const newQuantity = Math.min(existingItem.quantity + 1, existingItem.stock || 999);
          updated[existingItemIndex] = { ...existingItem, quantity: newQuantity };
        } else {
          updated = [...prev, newItem];
        }

        saveGuestCart(updated);
        return updated;
      });
    }
  }, [user, saveGuestCart, loadGuestCart]);

  const removeItem = useCallback(async (itemId) => {
    if (user) {
      // Authenticated user - use backend API
      try {
        await cartApi.remove(itemId);
        setItems(prev => prev.filter(item => item.cartId !== itemId));
      } catch (error) {
        console.error('Error removing from cart:', error);
      }
    } else {
      // Guest user - use localStorage
      setItems(prev => {
        const updated = prev.filter(item =>
          item.cartId !== itemId && item.cardId !== itemId && item.productId !== itemId
        );
        saveGuestCart(updated);
        return updated;
      });
    }
  }, [user, saveGuestCart]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (quantity < 1) {
      removeItem(itemId);
      return;
    }

    if (user) {
      // Authenticated user - use backend API
      try {
        await cartApi.update(itemId, quantity);
        setItems(prev => prev.map(item =>
          item.cartId === itemId ? { ...item, quantity } : item
        ));
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    } else {
      // Guest user - use localStorage
      setItems(prev => {
        const updated = prev.map(item =>
          (item.cartId === itemId || item.cardId === itemId || item.productId === itemId)
            ? { ...item, quantity }
            : item
        );
        saveGuestCart(updated);
        return updated;
      });
    }
  }, [user, removeItem, saveGuestCart]);

  const clearCart = useCallback(async () => {
    if (user) {
      // Authenticated user - use backend API
      try {
        await cartApi.clear();
        setItems([]);
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    } else {
      // Guest user - use localStorage
      setItems([]);
      saveGuestCart([]);
    }
  }, [user, saveGuestCart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(prev => !prev);

  return (
    <CartContext.Provider value={{
      items,
      subtotal,
      shippingCost,
      discountPercent,
      discountAmount,
      total,
      itemCount,
      activeCampaign,
      deliveryOption,
      setDeliveryOption,
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
