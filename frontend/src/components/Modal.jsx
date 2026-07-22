import React, { useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const typeConfig = {
  danger: {
    confirmBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
    icon: '⚠️'
  },
  warning: {
    confirmBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    icon: '❓'
  },
  success: {
    confirmBg: 'linear-gradient(135deg, #22c55e, #16a34a)',
    icon: '✓'
  },
  info: {
    confirmBg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    icon: 'ℹ️'
  }
};

const Modal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger', children, size = 'md', confirmDisabled = false }) => {
  const config = typeConfig[type] || typeConfig.danger;
  const hasChildren = Boolean(children);
  const titleId = useId();
  const descId = useId();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const surface = isDark ? '#1E293B' : '#ffffff';
  const headerSurface = isDark ? '#1E293B' : '#ffffff';
  const borderColor = isDark ? 'rgba(148, 163, 184, 0.2)' : '#eee';
  const titleColor = isDark ? '#F8FAFC' : '#163f2a';
  const mutedColor = isDark ? '#CBD5E1' : '#6b7280';
  const closeColor = isDark ? '#94A3B8' : '#6b7280';
  const cancelBg = isDark ? '#334155' : 'white';
  const cancelBorder = isDark ? '#475569' : '#e5e7eb';
  const cancelColor = isDark ? '#E2E8F0' : '#374151';

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const renderFooter = () => (
    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClose}
        style={{
          flex: 1,
          padding: '12px 20px',
          background: cancelBg,
          border: `2px solid ${cancelBorder}`,
          borderRadius: '12px',
          color: cancelColor,
          fontSize: '0.95rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {cancelText}
      </motion.button>
      <motion.button
        type="button"
        whileHover={{ scale: confirmDisabled ? 1 : 1.02 }}
        whileTap={{ scale: confirmDisabled ? 1 : 0.98 }}
        onClick={onConfirm}
        disabled={confirmDisabled}
        style={{
          flex: 1,
          padding: '12px 20px',
          background: confirmDisabled ? '#9ca3af' : config.confirmBg,
          border: 'none',
          borderRadius: '12px',
          color: 'white',
          fontSize: '0.95rem',
          fontWeight: 600,
          cursor: confirmDisabled ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
          opacity: confirmDisabled ? 0.8 : 1,
        }}
      >
        {confirmText}
      </motion.button>
    </div>
  );

  if (hasChildren) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
            }}
          >
            <motion.div
              className="modal-content"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '90vw',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                borderRadius: '20px',
                background: surface,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                zIndex: 10000,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  background: headerSurface,
                  padding: '20px 24px 16px',
                  borderTopLeftRadius: '20px',
                  borderTopRightRadius: '20px',
                  borderBottom: `1px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  zIndex: 10,
                }}
              >
                <h3 id={titleId} style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: titleColor }}>{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: closeColor,
                    lineHeight: 1,
                    padding: '6px 8px',
                    borderRadius: '8px',
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: '24px' }}>
                {children}
                {renderFooter()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Fallback: confirmation dialog (no children)
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
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
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: surface,
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              zIndex: 1000,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '2rem'
                }}
              >
                {config.icon}
              </motion.div>
              <h3 id={titleId} style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: titleColor,
                marginBottom: '8px',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>
                {title}
              </h3>
              {message && (
                <p id={descId} style={{
                  fontSize: '0.95rem',
                  color: mutedColor,
                  lineHeight: 1.6
                }}>
                  {message}
                </p>
              )}
            </div>

            {renderFooter()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;