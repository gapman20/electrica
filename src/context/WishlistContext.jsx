import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { wishlistApi } from '../services/api';
import { useUser } from './UserContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isLoggedIn } = useUser();
  const isLoggedInRef = useRef(isLoggedIn);
  
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  const fetchWishlist = useCallback(async () => {
    if (!isLoggedInRef.current) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await wishlistApi.get();
      setItems(data.map(item => ({
        cardId: item.cardId,
        productId: item.productId,
        name: item.card?.name || item.product?.name,
        price: item.card?.price || item.product?.price,
        imageUrl: item.card?.imageUrl || item.product?.imageUrl,
        stock: item.card?.stock || item.product?.stock,
        game: item.card?.game?.name || item.card?.game || item.product?.game?.name || item.product?.game,
        rarity: item.card?.rarity,
        set: item.card?.set || item.product?.set,
        type: item.cardId ? 'card' : 'product',
        addedAt: item.createdAt
      })));
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist, isLoggedIn]);

  const addItem = useCallback(async (item) => {
    if (!isLoggedInRef.current) {
      setError('Must be logged in to add to wishlist');
      return false;
    }

    const itemId = item.id;
    const isProduct = item.type === 'product' || item.setCode === undefined;

    try {
      await wishlistApi.add(isProduct ? { productId: itemId } : { cardId: itemId });
      
      const isCard = !isProduct;
      setItems(prev => {
        const exists = isCard 
          ? prev.some(i => i.cardId === itemId)
          : prev.some(i => i.productId === itemId);
        if (exists) return prev;
        
        return [...prev, {
          cardId: isCard ? itemId : null,
          productId: isProduct ? itemId : null,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl || item.image,
          stock: item.stock,
          game: item.game,
          rarity: item.rarity,
          set: item.set,
          type: isCard ? 'card' : 'product',
          addedAt: new Date().toISOString()
        }];
      });
      return true;
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      setError(err.message);
      return false;
    }
  }, []);

  const removeItem = useCallback(async (item) => {
    if (!isLoggedInRef.current) return;

    const itemId = item.cardId || item.productId;
    const isCard = !!item.cardId;

    try {
      await wishlistApi.remove(isCard ? { cardId: itemId } : { productId: itemId });
      setItems(prev => prev.filter(i => 
        isCard ? i.cardId !== itemId : i.productId !== itemId
      ));
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setError(err.message);
    }
  }, []);

  const isInWishlist = useCallback((id, type = 'card') => {
    if (type === 'product') {
      return items.some(item => item.productId === id);
    }
    return items.some(item => item.cardId === id);
  }, [items]);

  const getWishlist = useCallback(() => items, [items]);

  const clearWishlist = useCallback(() => setItems([]), []);

  const toggleItem = useCallback(async (item) => {
    if (!isLoggedInRef.current) {
      setError('Must be logged in to modify wishlist');
      return false;
    }

    const isProduct = item.type === 'product';
    const id = item.id;
    const type = isProduct ? 'product' : 'card';

    if (isInWishlist(id, type)) {
      const existingItem = items.find(i => 
        (isProduct ? i.productId : i.cardId) === id
      );
      if (existingItem) {
        await removeItem(existingItem);
      }
      return false;
    } else {
      await addItem(item);
      return true;
    }
  }, [isInWishlist, removeItem, addItem, items]);

  return (
    <WishlistContext.Provider value={{
      items,
      itemCount: items.length,
      loading,
      error,
      addItem,
      removeItem,
      isInWishlist,
      getWishlist,
      clearWishlist,
      toggleItem,
      refreshWishlist: fetchWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
};
