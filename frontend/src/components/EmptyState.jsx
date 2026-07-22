import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const emptyStateConfigs = {
  orders: {
    icon: '📦',
    title: 'No Orders Yet',
    message: 'Start by placing your first order for fresh milk delivery.',
    actionLabel: 'Place Order'
  },
  payments: {
    icon: '💳',
    title: 'No Payment History',
    message: 'Your payment records will appear here once you make transactions.',
    actionLabel: null
  },
  milk: {
    icon: '🥛',
    title: 'No Milk Records',
    message: 'Your milk delivery history will be displayed here.',
    actionLabel: null
  },
  customers: {
    icon: '👥',
    title: 'No Customers Found',
    message: 'Customer records will appear here once they register.',
    actionLabel: null
  },
  expenses: {
    icon: '📋',
    title: 'No Expenses',
    message: 'Add your first expense to start tracking.',
    actionLabel: 'Add Expense'
  },
  default: {
    icon: '📭',
    title: 'Nothing Here Yet',
    message: 'Content will appear here soon.',
    actionLabel: null
  }
};

const EmptyState = ({ 
  type = 'default', 
  onAction, 
  actionLabel,
  // New flexible props
  icon,
  title,
  description,
  action
}) => {
  // Use flexible props if provided, otherwise fall back to type-based config
  const hasFlexibleProps = icon !== undefined || title !== undefined || description !== undefined || action !== undefined;
  
  const config = hasFlexibleProps 
    ? {
        icon: icon || '📭',
        title: title || 'Nothing Here Yet',
        message: description || 'Content will appear here soon.',
        actionLabel: action?.label || null,
      }
    : (emptyStateConfigs[type] || emptyStateConfigs.default);
  
  return (
    <motion.div 
      className="empty-state-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center'
      }}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: 'spring', 
          stiffness: 200, 
          damping: 15,
          delay: 0.1 
        }}
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          border: '2px solid rgba(76, 175, 80, 0.15)'
        }}
      >
        <span style={{ fontSize: '3rem' }}>{config.icon}</span>
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#2d5f3f',
          marginBottom: '8px',
          fontFamily: "'Space Grotesk', sans-serif"
        }}
      >
        {config.title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          fontSize: '0.95rem',
          color: '#666',
          maxWidth: '300px',
          lineHeight: 1.6,
          marginBottom: (config.actionLabel || actionLabel || action) ? '24px' : '0'
        }}
      >
        {config.message}
      </motion.p>
      
      {/* Render action button based on which props are provided */}
      {(config.actionLabel || actionLabel || action) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {action?.to ? (
            // Link-based action for routing
            <Link
              to={action.to}
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #4caf50, #2d5f3f)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
              }}
            >
              {action.label}
            </Link>
          ) : (action?.onClick || onAction) ? (
            // Callback-based action (only render if handler exists)
            <button
              type="button"
              onClick={action?.onClick || onAction}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #4caf50, #2d5f3f)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
              }}
            >
              {action?.label || actionLabel || config.actionLabel}
            </button>
          ) : (
            // Fallback when no handler (add console warning in dev)
            (() => {
              if (process.env.NODE_ENV === 'development') {
                console.warn('EmptyState: action.label or config.actionLabel provided but neither action.onClick nor onAction callback exists');
              }
              return null;
            })()
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;