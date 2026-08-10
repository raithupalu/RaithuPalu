import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import {
  FiMenu,
  FiX,
  FiHome,
  FiInfo,
  FiBox,
  FiMail,
  FiLogIn,
  FiCheckCircle
} from 'react-icons/fi';
import './MobileLandingFAB.css';

const MobileLandingFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const navItems = [
    { label: 'Get Started', icon: FiCheckCircle, href: '/register', isCTA: true },
    { label: 'Login', icon: FiLogIn, href: '/login', isLogin: true },
    { label: 'Contact', icon: FiMail, href: '#contact' },
    { label: 'Products', icon: FiBox, href: '#products' },
    { label: 'About', icon: FiInfo, href: '#about' },
    { label: 'Home', icon: FiHome, href: '/' }
  ];

  const handleNavClick = (e, item) => {
    e.preventDefault();
    setIsOpen(false);
    
    if (item.href === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (item.href.startsWith('#')) {
      const element = document.querySelector(item.href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate(item.href);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`mobile-landing-fab-wrapper ${isDark ? 'dark' : ''}`}>
      {/* ────────────────── OVERLAY BACKDROP ────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ────────────────── EXPANDED MENUS LIST ────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fab-menu-items"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05,
                }
              }
            }}
          >
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              
              return (
                <motion.button
                  key={idx}
                  type="button"
                  className={`fab-menu-btn ${item.isCTA ? 'fab-cta' : ''} ${item.isLogin ? 'fab-login' : ''}`}
                  onClick={(e) => handleNavClick(e, item)}
                  variants={{
                    hidden: { opacity: 0, y: 15, scale: 0.9 },
                    visible: { opacity: 1, y: 0, scale: 1 }
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="fab-menu-text">{item.label}</span>
                  <div className="fab-menu-icon-circle">
                    <Icon size={16} />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────────────── MAIN CIRCULAR FLOATING TRIGGER ────────────────── */}
      <motion.button
        type="button"
        className="fab-main-trigger"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isOpen}
        whileTap={{ scale: 0.94 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </motion.button>
    </div>
  );
};

export default MobileLandingFAB;