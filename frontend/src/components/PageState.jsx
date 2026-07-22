import React from 'react';
import Button from './Button';
import icon from '../assets/images/logo/icon.png';
import './PageState.css';

export function PageLoading({ label, title }) {
  const text = label ?? title ?? 'Loading…';
  return (
    <div className="page-state page-state--loading" role="status" aria-live="polite">
      <img src={icon} alt="RaithuPalu" className="page-state__logo" aria-hidden />
      <div className="loading-spinner" aria-hidden />
      <p className="page-state__label">{text}</p>
    </div>
  );
}

export function PageError({ title = 'Could not load data', message, onRetry }) {
  return (
    <div className="page-state page-state--error" role="alert">
      <span className="page-state__icon" aria-hidden>⚠</span>
      <h2 className="page-state__title">{title}</h2>
      {message && <p className="page-state__message">{message}</p>}
      {onRetry && (
        <Button type="button" variant="primary" className="page-state__retry" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function PageEmpty({ title = 'Nothing here yet', hint, icon = '📭' }) {
  return (
    <div className="page-state page-state--empty">
      <span className="page-state__icon" aria-hidden>{icon}</span>
      <h2 className="page-state__title">{title}</h2>
      {hint && <p className="page-state__message">{hint}</p>}
    </div>
  );
}
