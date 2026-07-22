import React, { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 1000,
      maxWidth: '360px'
    }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const Toast = ({ toast, onClose }) => {
  const config = {
    success: {
      bg: 'linear-gradient(135deg, rgba(45, 143, 74, 0.96), rgba(35, 110, 59, 0.96))',
      icon: '✓'
    },
    error: {
      bg: 'linear-gradient(135deg, rgba(220, 38, 38, 0.96), rgba(153, 27, 27, 0.96))',
      icon: '✕'
    },
    warning: {
      bg: 'linear-gradient(135deg, rgba(215, 154, 47, 0.96), rgba(180, 83, 9, 0.96))',
      icon: '⚠'
    },
    info: {
      bg: 'linear-gradient(135deg, rgba(45, 143, 74, 0.92), rgba(59, 130, 246, 0.92))',
      icon: 'ℹ'
    }
  };

  const { bg, icon } = config[toast.type] || config.success;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        background: bg,
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 16px 36px rgba(15, 23, 42, 0.2)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <span style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8rem',
        fontWeight: 700
      }}>
        {icon}
      </span>
      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
        {toast.message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.7)',
          cursor: 'pointer',
          padding: '4px',
          fontSize: '1.1rem'
        }}
      >
        ×
      </button>
    </motion.div>
  );
};

export default ToastProvider;