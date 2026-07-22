import React from 'react';
import { motion } from 'framer-motion';

const BuffaloCard = ({ buffalo }) => {
  if (!buffalo) {
    return null;
  }

  // Get status badge styling
  const getStatusStyles = (status) => {
    const styles = {
      active: { bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-300', label: 'Active' },
      pregnant: { bg: 'bg-rose-100 dark:bg-rose-900/50', text: 'text-rose-700 dark:text-rose-300', label: 'Pregnant' },
      dry: { bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-700 dark:text-amber-300', label: 'Dry' },
      sold: { bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-700 dark:text-slate-300', label: 'Sold' },
      deceased: { bg: 'bg-gray-100 dark:bg-gray-800/50', text: 'text-gray-700 dark:text-gray-300', label: 'Deceased' },
    };
    return styles[status] || styles.active;
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: '🐮',
      pregnant: '🤰',
      dry: '🚫',
      sold: '💰',
      deceased: '⚰️',
    };
    return icons[status] || '🐮';
  };

  const statusStyle = getStatusStyles(buffalo.status || 'active');
  const statusIcon = getStatusIcon(buffalo.status || 'active');

  return (
    <motion.div
      className="buffalo-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}
      transition={{ duration: 0.3 }}
      style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header with Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#1a1a1a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {buffalo.name || 'Unnamed Buffalo'}
          </h3>
          {buffalo.tagId && (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.85rem',
                color: '#666',
              }}
            >
              Tag: <strong>{buffalo.tagId}</strong>
            </p>
          )}
        </div>
        <div
          className={`${statusStyle.bg} ${statusStyle.text}`}
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {statusIcon} {statusStyle.label}
        </div>
      </div>

      {/* Info Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        {/* Breed */}
        {buffalo.breed && (
          <div style={{ background: '#f8f8f8', padding: '10px 12px', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>
              Breed
            </p>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#1a1a1a' }}>
              {buffalo.breed}
            </p>
          </div>
        )}

        {/* Age */}
        {buffalo.age !== undefined && (
          <div style={{ background: '#f8f8f8', padding: '10px 12px', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>
              Age
            </p>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#1a1a1a' }}>
              {buffalo.age} years
            </p>
          </div>
        )}

        {/* Milk Capacity */}
        {buffalo.milkCapacity !== undefined && buffalo.milkCapacity !== null && (
          <div style={{ background: '#f8f8f8', padding: '10px 12px', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>
              Milk Capacity
            </p>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#1a1a1a' }}>
              {buffalo.milkCapacity} L/day
            </p>
          </div>
        )}

        {/* Purchase Date */}
        {buffalo.purchaseDate && (
          <div style={{ background: '#f8f8f8', padding: '10px 12px', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>
              Purchased
            </p>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#1a1a1a' }}>
              {new Date(buffalo.purchaseDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      {buffalo.notes && (
        <div style={{ paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.85rem',
              color: '#666',
              lineHeight: 1.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {buffalo.notes}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default BuffaloCard;
