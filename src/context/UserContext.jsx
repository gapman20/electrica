import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const USER_KEY = 'tcg_user';
const TOKEN_KEY = 'token';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginCallbacks, setLoginCallbacks] = useState([]);
  const [logoutCallbacks, setLogoutCallbacks] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    const savedToken = localStorage.getItem(TOKEN_KEY);
    
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const result = await authApi.login(email, password);
      if (result.success) {
        setUser(result.user);
        loginCallbacks.forEach(cb => cb(result.user));
        return result;
      }
      return result;
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, error: e.message };
    }
  };

  const logout = () => {
    logoutCallbacks.forEach(cb => cb());
    authApi.logout();
    setUser(null);
  };

  const updateUser = (updates) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const onLogin = (callback) => {
    setLoginCallbacks(prev => [...prev, callback]);
  };

  const onLogout = (callback) => {
    setLogoutCallbacks(prev => [...prev, callback]);
  };

  const value = {
    user,
    setUser,
    loading,
    isLoggedIn: !!user,
    login,
    logout,
    updateUser,
    onLogin,
    onLogout
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used inside UserProvider');
  }
  return ctx;
};

export default UserContext;
