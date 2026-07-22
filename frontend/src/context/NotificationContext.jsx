import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

function buildMockNotifications() {
  const types = [
    { type: 'order', icon: '📦', title: 'newOrder', message: 'New order placed by customer' },
    { type: 'payment', icon: '💰', title: 'paymentReceived', message: 'Payment of ₹500 received' },
    { type: 'order', icon: '✅', title: 'orderAccepted', message: 'Your order has been accepted' },
    { type: 'milk', icon: '🥛', title: 'milkAdded', message: 'New milk entry added' },
  ];

  return types.map((item, index) => ({
    id: `notif-${Date.now()}-${index}`,
    ...item,
    timestamp: new Date(Date.now() - index * 3600000).toISOString(),
    read: index > 1,
  }));
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    const mockNotifications = buildMockNotifications();
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter((n) => !n.read).length);
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    fetchNotifications();
    const pollInterval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(pollInterval);
  }, [user, fetchNotifications]);

  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      ...notification,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const value = {
    notifications,
    unreadCount,
    isLoading: false,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    refresh: fetchNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export default NotificationProvider;
