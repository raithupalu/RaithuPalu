import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import ThemeToggle from './ThemeToggle';
import './Navigation.css';

const Navigation = ({ isAuthenticated, onLogout }) => {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '#about' },
    { label: 'Products', href: '#products' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (e, item) => {
    e.preventDefault();
    if (item.href === '/') {
      navigate('/');
    } else if (item.href.startsWith('#')) {
      const element = document.querySelector(item.href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <motion.nav
      className="navigation"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      <div className="nav-container">
        {/* Logo */}
        <motion.div
          className="nav-logo"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          🥛 RaithuPalu
        </motion.div>

        {/* Desktop Menu */}
        <div className="nav-menu-desktop">
          <motion.div
            className="nav-links"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {navItems.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="nav-link"
                onClick={(e) => handleNavClick(e, item)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              >
                {item.label}
              </motion.a>
            ))}
          </motion.div>

          {/* Auth Buttons */}
          <motion.div
            className="nav-actions"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </Button>
              </>
            )}
          </motion.div>
        </div>

        {/* Mobile Header Right Panel (ThemeToggle is retained, hamburger is hidden) */}
        <div className="nav-actions-mobile-only">
          <ThemeToggle />
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;