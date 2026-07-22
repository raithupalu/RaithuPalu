import React from 'react';
import logo from '../assets/images/logo/logo.png';
import './PremiumLoading.css';

const PremiumLoading = () => (
  <div
    className="premium-loading"
    role="status"
    aria-live="polite"
    aria-label="Loading RaithuPalu"
  >
    <div className="premium-loading__content">
      <img src={logo} alt="RaithuPalu" className="premium-loading__logo" />
      <div className="premium-loading__text">
        <h1 className="premium-loading__title">RaithuPalu</h1>
        <p className="premium-loading__subtitle">Smart Milk Management System</p>
      </div>
      <p className="premium-loading__status">Loading…</p>
    </div>
  </div>
);

export default PremiumLoading;
