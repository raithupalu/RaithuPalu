import React, { useEffect, useState } from 'react';
import './TopProgressBar.css';

/**
 * Persistent top progress bar (NProgress-style).
 * - Stays visible while `active` is true (navigation + async data fetching).
 * - On completion it fills to 100% and fades out, leaving the current page intact.
 * - Non-blocking: rendered as a thin fixed bar, so users remain on the page.
 */
const TopProgressBar = ({ active }) => {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'active' | 'complete'

  useEffect(() => {
    if (active) {
      setPhase('active');
      return undefined;
    }

    if (phase === 'active') {
      setPhase('complete');
      const timer = setTimeout(() => setPhase('idle'), 350);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [active, phase]);

  if (phase === 'idle') return null;

  return (
    <div
      className={`app-top-loader app-top-loader--${phase}`}
      role="progressbar"
      aria-label="Loading"
      aria-busy={phase === 'active'}
    >
      <div className="app-top-loader__bar" />
    </div>
  );
};

export default TopProgressBar;
