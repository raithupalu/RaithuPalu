import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { menuConfig } from './Sidebar';
import SearchModal from './SearchModal';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useResponsiveSidebar } from '../hooks/useMediaQuery';
import './AppLayout.css';

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const AppLayout = ({ role = 'admin' }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isMobile, sidebarWidth, collapsed } = useResponsiveSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer whenever the route changes.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close drawer if we grow past the mobile breakpoint.
  useEffect(() => {
    if (!isMobile) setIsOpen(false);
  }, [isMobile]);

  // Command/Ctrl + K opens search.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeDrawer = () => setIsOpen(false);

  return (
    <div className="layout">
      {/* Desktop / Tablet sidebar */}
      {!isMobile && (
        <Sidebar role={role} theme={theme} collapsed={collapsed} width={sidebarWidth} />
      )}

      {/* Mobile sticky top bar */}
      {isMobile && (
        <header className="topbar">
          <button
            className="topbar__toggle"
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <span className="topbar__title">RaithuPalu</span>
          <ThemeToggle />
          <button
            className="topbar__avatar"
            onClick={() => setIsOpen(true)}
            aria-label="Open profile"
          >
            {user?.username?.charAt(0)?.toUpperCase()}
          </button>
        </header>
      )}

      {/* Mobile drawer + overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <>
            <motion.div
              className="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeDrawer}
              aria-hidden="true"
            />
            <motion.div
              className="mobile-drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              role="dialog"
              aria-modal="true"
            >
              <Sidebar role={role} theme={theme} isMobile width={280} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="main">
        <div className="main__inner">
          <Outlet />
        </div>
      </main>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        menuItems={menuConfig[role]}
      />
    </div>
  );
};

export default AppLayout;
