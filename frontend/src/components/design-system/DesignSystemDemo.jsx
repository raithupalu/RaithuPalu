import React from 'react';
import './DesignSystem.css';

const DesignSystemDemo = () => (
  <div style={{ display: 'grid', gap: 20, padding: 24 }}>
    <section className="ds-surface ds-surface--elevated" style={{ padding: 24 }}>
      <div className="ds-panel-header">
        <div>
          <div className="ds-panel-header__eyebrow">Premium Dairy SaaS</div>
          <h3 className="ds-panel-header__title">Design system foundations</h3>
          <p className="ds-panel-header__subtitle">Color, spacing, surfaces, and premium patterns are now shared.</p>
        </div>
      </div>
    </section>
    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
      <div className="ds-stat-card">
        <span className="ds-stat-card__label">Milk collected</span>
        <span className="ds-stat-card__value">4,320 L</span>
        <span className="ds-stat-card__detail">+12.4% this week</span>
      </div>
      <div className="ds-stat-card">
        <span className="ds-stat-card__label">Net earnings</span>
        <span className="ds-stat-card__value">₹98,540</span>
        <span className="ds-stat-card__detail">Stable payout trend</span>
      </div>
    </div>
    <div className="ds-chart-card">
      <h4 className="ds-chart-card__title">Weekly trend</h4>
      <div style={{ height: 140, borderRadius: 16, background: 'linear-gradient(135deg, rgba(45,143,74,0.12), rgba(215,154,47,0.12))', display: 'flex', alignItems: 'flex-end', padding: 16, gap: 12 }}>
        {[56, 72, 64, 81, 69, 88, 94].map((height, index) => (
          <div key={index} style={{ flex: 1, height: `${height}%`, borderRadius: 999, background: 'linear-gradient(180deg, #2d8f4a, #d79a2f)' }} />
        ))}
      </div>
    </div>
  </div>
);

export default DesignSystemDemo;
