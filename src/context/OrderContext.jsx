import React, { createContext, useContext, useState, useCallback } from 'react';
import { orderApi } from '../services/api';

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [lookupResult, setLookupResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const order = await orderApi.create(orderData);
      setCurrentOrder(order);
      return order;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const lookupOrder = useCallback(async (orderId, email) => {
    setLoading(true);
    setError(null);
    setLookupResult(null);
    try {
      const order = await orderApi.lookup(orderId, email);
      if (order) {
        setLookupResult(order);
      }
      return order;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrderById = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const order = await orderApi.getById(orderId);
      return order;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrderHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orders = await orderApi.getMyOrders();
      setOrderHistory(orders);
      return orders;
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId, status, trackingNumber) => {
    setLoading(true);
    try {
      const order = await orderApi.updateStatus(orderId, status, trackingNumber);
      if (currentOrder?.id === orderId) {
        setCurrentOrder(order);
      }
      return order;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [currentOrder]);

  const clearCurrentOrder = useCallback(() => setCurrentOrder(null), []);
  const clearLookupResult = useCallback(() => setLookupResult(null), []);
  const clearError = useCallback(() => setError(null), []);

  return (
    <OrderContext.Provider value={{
      currentOrder,
      orderHistory,
      lookupResult,
      loading,
      error,
      createOrder,
      lookupOrder,
      fetchOrderById,
      fetchOrderHistory,
      updateOrderStatus,
      clearCurrentOrder,
      clearLookupResult,
      clearError,
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used inside OrderProvider');
  return ctx;
};
