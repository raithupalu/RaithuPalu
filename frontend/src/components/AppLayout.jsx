import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { menuConfig } from './Sidebar';
import SearchModal from './SearchModal';
import ThemeToggle from './ThemeToggle';
import MobileBottomNav from './MobileBottomNav';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useResponsiveSidebar } from '../hooks/useMediaQuery';
import './AppLayout.css';

const AppLayout = ({ role = 'admin' }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isMobile, sidebarWidth, collapsed } = useResponsiveSidebar();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  return (
    <div className="layout">
      {/* Desktop / Tablet sidebar */}
      {!isMobile && (
        <Sidebar role={role} theme={theme} collapsed={collapsed} width={sidebarWidth} />
      )}

      {/* Mobile sticky top bar (simplified, hamburger removed as bottom-bar is primary navigation) */}
      {isMobile && (
        <header className="topbar">
          <span className="topbar__title" style={{ textAlign: 'left', marginLeft: '8px' }}>RaithuPalu</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ThemeToggle />
            <div className="topbar__avatar" aria-hidden="true">
              {user?.username?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>
      )}

      {/* Main content scroll area */}
      <main className="main">
        <div className="main__inner">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Dock Navigation (max-width: 768px only) */}
      {isMobile && (
        <MobileBottomNav role={role} />
      )}

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        menuItems={menuConfig[role]}
      />
    </div>
  );
};

export default AppLayout;