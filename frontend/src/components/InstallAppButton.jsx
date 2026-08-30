import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { FiDownload } from 'react-icons/fi';

const InstallAppButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Detect if already running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Listen for the native browser install prompt trigger
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Prevent automatic prompt
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Detect iOS Safari to show manual guidelines if needed
    const ua = window.navigator.userAgent.toLowerCase();
    const isIphone = ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod');
    const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium');
    if (isIphone && isSafari) {
      setIsIOS(true);
    }

    // 4. Listen for successful installation completion
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('RaithuPalu installed successfully. ✅');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt(); // Show native browser prompt

    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation decision: ${outcome}`);

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Hide button if already installed
  if (isInstalled) return null;

  return (
    <div className="pwa-install-container" style={{ display: 'inline-flex', alignItems: 'center', fontFamily: "'Inter', sans-serif" }}>
      <AnimatePresence>
        {isInstallable && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={handleInstallClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '0.88rem',
                border: '2px solid var(--ds-primary, #4caf50)',
                color: 'var(--ds-primary, #4caf50)',
                background: 'transparent',
                padding: '8px 16px',
                borderRadius: '999px',
                height: '38px'
              }}
            >
              <FiDownload size={15} />
              <span>Install App</span>
            </Button>
          </motion.div>
        )}

        {isIOS && !isInstallable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(76, 175, 80, 0.08)',
              color: 'var(--ds-primary-strong, #2d5f3f)',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '1px solid rgba(76, 175, 80, 0.2)',
              lineHeight: '1.4',
              textAlign: 'center'
            }}
          >
            To install: Tap Share 📤 → Add to Home Screen ➕
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstallAppButton;