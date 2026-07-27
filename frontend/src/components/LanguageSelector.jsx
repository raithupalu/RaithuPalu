import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FiGlobe } from 'react-icons/fi';

const LanguageSelector = () => {
  const { language, changeLanguage } = useLanguage();

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  return (
    <div className="language-selector" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: 'rgba(76, 175, 80, 0.05)', border: '1px solid rgba(76, 175, 80, 0.15)' }}>
      <FiGlobe size={18} style={{ color: 'var(--ds-text-muted)', flexShrink: 0 }} />
      <select
        value={language}
        onChange={handleLanguageChange}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--ds-text)',
          fontSize: '0.88rem',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          width: '100%',
          fontFamily: "'Inter', sans-serif"
        }}
      >
        <option value="en" style={{ background: 'var(--ds-surface-strong)', color: 'var(--ds-text)' }}>🇺🇸 English</option>
        <option value="hi" style={{ background: 'var(--ds-surface-strong)', color: 'var(--ds-text)' }}>🇮🇳 हिंदी (Hindi)</option>
        <option value="te" style={{ background: 'var(--ds-surface-strong)', color: 'var(--ds-text)' }}>🇮🇳 తెలుగు (Telugu)</option>
      </select>
    </div>
  );
};

export default LanguageSelector;