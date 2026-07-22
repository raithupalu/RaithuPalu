import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SearchModal = ({ isOpen, onClose, menuItems = [], userRole = 'admin' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) {
      const filtered = menuItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setSelectedIndex(0);
    } else {
      setResults(menuItems.slice(0, 6));
    }
  }, [query, menuItems]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (item) => {
    navigate(item.path);
    onClose();
    setQuery('');
  };

  const renderIcon = (icon) => {
    if (!icon) return null;
    if (typeof icon === 'string') return icon;
    const Icon = icon;
    return <Icon size={18} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 999
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed',
              top: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '560px',
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              zIndex: 1000,
              overflow: 'hidden'
            }}
          >
            {/* Search Input */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '1.25rem', opacity: 0.5 }}>🔍</span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search pages..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '1.1rem',
                  color: '#1f2937'
                }}
              />
              <kbd style={{
                padding: '4px 8px',
                background: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: '400px', overflow: 'auto', padding: '8px' }}>
              {results.length > 0 ? (
                results.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelect(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: index === selectedIndex ? '#f0fdf4' : 'transparent',
                      border: index === selectedIndex ? '1px solid #bbf7d0' : '1px solid transparent',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ fontSize: '1.25rem', display: 'flex' }}>{renderIcon(item.icon)}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        fontWeight: 600,
                        color: index === selectedIndex ? '#16a34a' : '#1f2937',
                        fontSize: '0.95rem'
                      }}>
                        {item.label}
                      </span>
                    </div>
                    {index === selectedIndex && (
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Enter to select</span>
                    )}
                  </motion.div>
                ))
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#9ca3af'
                }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🔎</span>
                  <p>No results found</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 20px',
              background: '#f9fafb',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              fontSize: '0.8rem',
              color: '#6b7280'
            }}>
              <span><kbd style={{ padding: '2px 6px', background: 'white', borderRadius: '4px', marginRight: '4px' }}>↑↓</kbd> Navigate</span>
              <span><kbd style={{ padding: '2px 6px', background: 'white', borderRadius: '4px', marginRight: '4px' }}>↵</kbd> Select</span>
              <span><kbd style={{ padding: '2px 6px', background: 'white', borderRadius: '4px', marginRight: '4px' }}>ESC</kbd> Close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;