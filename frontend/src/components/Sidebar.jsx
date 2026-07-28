import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import icon from '../assets/images/logo/icon.png';
import {
  FiHome,
  FiBox,
  FiCreditCard,
  FiUsers,
  FiDroplet,
  FiDollarSign,
  FiActivity,
  FiLogOut,
  FiMessageSquare
} from 'react-icons/fi';

export const menuConfig = {
  admin: [
    { path: '/admin', icon: FiHome, label: 'Dashboard', labelKey: 'dashboard', exact: true },
    { path: '/admin/milk', icon: FiDroplet, label: 'Milk Entry', labelKey: 'milkEntry' },
    { path: '/admin/buffalo', icon: FiActivity, label: 'Buffalo', labelKey: 'buffalo' },
    { path: '/admin/expenses', icon: FiDollarSign, label: 'Expenses', labelKey: 'expenses' },
    { path: '/admin/orders', icon: FiBox, label: 'Orders', labelKey: 'orders' },
    { path: '/admin/payments', icon: FiCreditCard, label: 'Payments', labelKey: 'payments' },
    { path: '/admin/customers', icon: FiUsers, label: 'Customers', labelKey: 'customers' },
    { path: '/admin/broadcast', icon: FiMessageSquare, label: 'Broadcaster', labelKey: 'broadcaster' },
  ],
  customer: [
    { path: '/customer/dashboard', icon: FiHome, label: 'My Dashboard', labelKey: 'dashboard' },
    { path: '/customer/milk', icon: FiDroplet, label: 'My Milk Records', labelKey: 'milkEntry' },
    { path: '/customer/orders', icon: FiBox, label: 'Orders', labelKey: 'orders' },
    { path: '/customer/payments', icon: FiCreditCard, label: 'Payments', labelKey: 'payments' },
    { path: '/customer/chart', icon: FiBox, label: 'Analytics', labelKey: 'analytics' },
  ],
};

const menuTheme = {
  light: {
    textMuted: 'rgba(45, 95, 63, 0.65)',
    activeBg: 'rgba(76, 175, 80, 0.12)',
    activeBorder: 'rgba(76, 175, 80, 0.35)',
    hoverBg: 'rgba(76, 175, 80, 0.07)',
    accent: '#4caf50',
    activeColor: '#2d5f3f',
  },
  dark: {
    textMuted: 'rgba(255, 255, 255, 0.6)',
    activeBg: 'rgba(34, 197, 94, 0.18)',
    activeBorder: 'rgba(34, 197, 94, 0.4)',
    hoverBg: 'rgba(255, 255, 255, 0.06)',
    accent: '#22c55e',
    activeColor: '#e2e8f0',
  },
};

const MenuItem = ({ item, theme, isActive, hovered, onMouseEnter, onMouseLeave, collapsed, onClick }) => {
  const Icon = item.icon || FiHome;
  const themeConfig = menuTheme[theme] || menuTheme.light;
  const { t: translate } = useLanguage();

  return (
    <NavLink
      to={item.path}
      end={item.exact}
      onClick={onClick}
      className="sidebar__link"
      style={({ isActive: linkActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        height: '48px',
        padding: collapsed ? '0' : '0 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: '10px',
        color: linkActive ? themeConfig.activeColor : themeConfig.textMuted,
        background: linkActive ? themeConfig.activeBg : hovered ? themeConfig.hoverBg : 'transparent',
        textDecoration: 'none',
        fontWeight: linkActive ? 600 : 500,
        border: `1px solid ${linkActive ? themeConfig.activeBorder : 'transparent'}`,
        borderLeft: `3px solid ${linkActive ? themeConfig.accent : 'transparent'}`,
        fontFamily: "'Inter', sans-serif",
        fontSize: '0.95rem',
        transition: 'background 0.2s ease, color 0.2s ease',
        outline: 'none',
        position: 'relative',
      })}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="menuitem"
      title={collapsed ? item.label : undefined}
    >
      <motion.span
        whileHover={collapsed ? {} : { scale: 1.08 }}
        whileTap={collapsed ? {} : { scale: 0.96 }}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <Icon size={collapsed ? 22 : 20} />
      </motion.span>
      {!collapsed && <span className="menu-text">{translate(item.labelKey)}</span>}
    </NavLink>
  );
};

const Sidebar = ({ role = 'admin', theme = 'light', collapsed = false, isMobile = false, width = 260, onItemClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t: translate } = useLanguage();
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = menuConfig[role] || menuConfig.admin;
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onItemClick) onItemClick();
  };

  const sidebarBg = theme === 'dark'
    ? 'linear-gradient(180deg, #0f172a 0%, #111c30 100%)'
    : '#ffffff';
  const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(45, 95, 63, 0.12)';
  const textColor = theme === 'dark' ? '#e2e8f0' : '#2d5f3f';

  return (
    <aside
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${isMobile ? 'sidebar--mobile' : ''}`}
      style={{
        '--sidebar-width': `${width}px`,
        width: 'var(--sidebar-width)',
        background: sidebarBg,
        borderRight: `1px solid ${borderColor}`,
        color: textColor,
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="sidebar__logo">
        {collapsed ? (
          <img
            src={icon}
            alt="RaithuPalu"
            className="sidebar__logo-img sidebar__logo-img--collapsed"
          />
        ) : (
          <>
            <img
              src={icon}
              alt="RaithuPalu"
              className="sidebar__logo-img"
            />
            <span className="sidebar__logo-full">
              <span style={{ color: theme === 'dark' ? '#34d399' : '#2d5f3f' }}>Raithu</span>
              <span style={{ color: theme === 'dark' ? '#22c55e' : '#4caf50' }}>Palu</span>
            </span>
            <p className="sidebar__logo-sub">
              {role === 'admin' ? 'Admin Panel' : 'Customer Portal'}
            </p>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav" role="menu" aria-label="Navigation menu">
        {menuItems.map((item) => {
          const isActive = item.exact
            ? currentPath === item.path
            : currentPath.startsWith(item.path);
          return (
            <MenuItem
              key={item.path}
              item={item}
              theme={theme}
              isActive={isActive}
              hovered={hoveredItem === item.path}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
              collapsed={collapsed}
              onClick={onItemClick}
            />
          );
        })}
      </nav>

      {/* Theme & Language selector (persistent, both portals) */}
      {!collapsed && (
        <div className="sidebar__theme" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px' }}>
          <ThemeToggle />
          <LanguageSelector />
        </div>
      )}

      {/* Profile (always pinned to bottom) */}
      <div className="sidebar__profile" style={{ borderTop: `1px solid ${borderColor}` }}>
        {collapsed ? (
          <div className="sidebar__profile-collapsed">
            <div className="sidebar__avatar" title={user?.username}>
              {user?.username?.charAt(0)?.toUpperCase()}
            </div>
            <motion.button
              className="sidebar__logout-icon"
              onClick={handleLogout}
              whileTap={{ scale: 0.96 }}
              aria-label="Logout"
              title="Logout"
            >
              <FiLogOut size={18} />
            </motion.button>
          </div>
        ) : (
          <>
            <div className="sidebar__profile-info">
              <div className="sidebar__avatar">
                {user?.username?.charAt(0)?.toUpperCase()}
              </div>
              <div className="sidebar__profile-text">
                <p className="user-text sidebar__profile-name">{user?.username}</p>
                <p className="user-text sidebar__profile-role">
                  {role === 'admin' ? 'Administrator' : 'Customer'}
                </p>
              </div>
            </div>
            <motion.button
              className="sidebar__logout"
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Logout"
            >
              <FiLogOut size={18} />
              <span className="user-text">{translate('logout')}</span>
            </motion.button>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;