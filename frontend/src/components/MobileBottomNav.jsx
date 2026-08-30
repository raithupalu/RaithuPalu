import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  FiHome,
  FiDroplet,
  FiBox,
  FiCreditCard,
  FiGrid,
  FiUsers,
  FiActivity,
  FiDollarSign,
  FiMessageSquare,
  FiLogOut,
  FiUser
} from 'react-icons/fi';
import './MobileBottomNav.css';

const MobileBottomNav = ({ role = 'admin' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t: translate } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [showMore, setShowMore] = useState(false);
  const currentPath = location.pathname;

  // Close "More" menu whenever the path changes
  useEffect(() => {
    setShowMore(false);
  }, [currentPath]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 1. Definition of core tab configurations
  const tabs = role === 'admin' ? [
    { path: '/admin', icon: FiHome, labelKey: 'dashboard', exact: true },
    { path: '/admin/milk', icon: FiDroplet, labelKey: 'milkEntry' },
    { path: '/admin/orders', icon: FiBox, labelKey: 'orders' },
    { path: '/admin/payments', icon: FiCreditCard, labelKey: 'payments' },
  ] : [
    { path: '/customer/dashboard', icon: FiHome, labelKey: 'dashboard' },
    { path: '/customer/milk', icon: FiDroplet, labelKey: 'milkEntry' },
    { path: '/customer/orders', icon: FiBox, labelKey: 'orders' },
    { path: '/customer/payments', icon: FiCreditCard, labelKey: 'payments' },
  ];

  // 2. Definition of "More" sheet lists
  const moreItems = role === 'admin' ? [
    { path: '/admin/customers', icon: FiUsers, labelKey: 'customers' },
    { path: '/admin/buffalo', icon: FiActivity, labelKey: 'buffalo' },
    { path: '/admin/expenses', icon: FiDollarSign, labelKey: 'expenses' },
    { path: '/admin/broadcast', icon: FiMessageSquare, labelKey: 'broadcaster' },
  ] : [
    { path: '/customer/chart', icon: FiBox, labelKey: 'analytics' },
    { path: '/customer/profile', icon: FiUser, labelKey: 'profile' },
  ];

  const handleMoreClick = () => {
    setShowMore(prev => !prev);
  };

  return (
    <>
      {/* ────────────────── BOTTOM TAB DOCK ────────────────── */}
      <div className={`mobile-bottom-dock ${isDark ? 'dark' : ''}`}>
        {tabs.map((tab) => {
          const isActive = tab.exact 
            ? currentPath === tab.path 
            : currentPath.startsWith(tab.path) && currentPath !== '/admin/broadcast';
          
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`dock-item ${isActive ? 'active' : ''}`}
            >
              <div className="dock-icon-wrapper">
                <Icon size={20} />
              </div>
              <span className="dock-label">{translate(tab.labelKey)}</span>
            </NavLink>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={handleMoreClick}
          className={`dock-item ${showMore ? 'active' : ''}`}
          aria-expanded={showMore}
          aria-label="Open secondary navigation"
        >
          <div className="dock-icon-wrapper">
            {role === 'admin' ? <FiGrid size={20} /> : <FiUser size={20} />}
          </div>
          <span className="dock-label">{role === 'admin' ? translate('settings') : 'Profile'}</span>
        </button>
      </div>

      {/* ────────────────── MORE BOTTOM SHEET ────────────────── */}
      <AnimatePresence>
        {showMore && (
          <>
            {/* Backdrop */}
            <motion.div
              className="bottom-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
            />
            
            {/* Bottom Sheet Menu Container */}
            <motion.div
              className={`bottom-sheet-container ${isDark ? 'dark' : ''}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              role="dialog"
              aria-modal="true"
            >
              <div className="bottom-sheet-drag-handle" />
              <div className="bottom-sheet-header">
                <h3>{role === 'admin' ? translate('settings') : 'Profile & Settings'}</h3>
              </div>
              
              <div className="bottom-sheet-content">
                <div className="more-menu-grid">
                  {moreItems.map((item) => {
                    const isActive = currentPath.startsWith(item.path);
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={`more-menu-item ${isActive ? 'active' : ''}`}
                      >
                        <div className="more-item-icon">
                          <Icon size={20} />
                        </div>
                        <span className="more-item-text">{translate(item.labelKey)}</span>
                      </NavLink>
                    );
                  })}
                  
                  {/* Logout Action (always inside sheet) */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="more-menu-item logout-btn"
                    style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer' }}
                  >
                    <div className="more-item-icon logout-icon">
                      <FiLogOut size={20} />
                    </div>
                    <span className="more-item-text">{translate('logout')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;