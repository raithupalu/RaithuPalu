import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import api from '../services/api';
import { extractErrorMessage } from '../lib/apiNormalize';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password, email) => {
    const data = username ? { username, password } : { email, password };
    try {
      const response = await api.post('/api/auth/login', data);
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Login failed'));
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Registration failed'));
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Merge updated fields into the stored + in-memory user object after a
  // successful profile save, so the UI reflects changes without a relogin.
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...updates };
      try {
        localStorage.setItem('user', JSON.stringify(next));
      } catch {
        /* storage unavailable — in-memory state still updates */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout, updateUser, loading }),
    [user, login, register, logout, updateUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
