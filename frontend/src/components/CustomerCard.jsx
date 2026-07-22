import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CustomerCard = ({ customer, onDelete, isDeleting }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/admin/customers/${customer._id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(customer._id);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      className="customer-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4caf50, #2d5f3f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: 'white',
            fontSize: '1.2rem',
            flexShrink: 0,
          }}
        >
          {customer.username?.charAt(0).toUpperCase() || '?'}
        </div>
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#1a1a1a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {customer.username || 'N/A'}
          </h3>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '0.85rem',
              color: '#666',
            }}
          >
            Joined: {formatDate(customer.createdAt)}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          fontSize: '0.85rem',
          color: '#555',
        }}
      >
        {customer.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>✉️</span>
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '120px',
              }}
            >
              {customer.email}
            </span>
          </div>
        )}
        {customer.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📱</span>
            <span>{customer.phone}</span>
          </div>
        )}
      </div>

      {onDelete && (
        <motion.button
          onClick={handleDelete}
          disabled={isDeleting}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            fontSize: '1.1rem',
            opacity: 0.6,
            transition: 'opacity 0.2s',
          }}
          title="Delete customer"
        >
          {isDeleting ? '⏳' : '🗑️'}
        </motion.button>
      )}
    </motion.div>
  );
};

export default CustomerCard;
