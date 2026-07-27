import React from 'react';

const EntryTypeBadge = ({ type }) => {
  const isOrder = String(type).toUpperCase() === 'ORDER';

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    background: isOrder ? '#dbeafe' : '#dcfce7',
    color: isOrder ? '#2563eb' : '#16a34a',
    border: `1px solid ${isOrder ? 'rgba(37, 99, 235, 0.15)' : 'rgba(22, 163, 74, 0.15)'}`,
    width: 'fit-content',
    whiteSpace: 'nowrap'
  };

  return (
    <span style={badgeStyle}>
      <span>{isOrder ? '📦' : '🥛'}</span>
      <span>{isOrder ? 'Ordered' : 'Normal'}</span>
    </span>
  );
};

export default EntryTypeBadge;