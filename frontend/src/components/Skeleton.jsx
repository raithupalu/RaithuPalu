import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ className = '', style = {} }) => (
  <div className={`skeleton ${className}`} style={style} />
);

export const SkeletonText = ({ width = '100%', className = '' }) => (
  <div className={`skeleton skeleton-text ${className}`} style={{ width }} />
);

export const SkeletonTitle = ({ className = '' }) => (
  <div className={`skeleton skeleton-title ${className}`} />
);

export const DashboardSkeleton = () => (
  <div className="admin-page">
    <div style={{ marginBottom: '2rem' }}>
      <SkeletonTitle />
      <SkeletonText width="30%" />
    </div>
    
    <div className="skeleton-stats-grid">
      <Skeleton className="skeleton-stat-card" />
      <Skeleton className="skeleton-stat-card" />
      <Skeleton className="skeleton-stat-card" />
      <Skeleton className="skeleton-stat-card" />
      <Skeleton className="skeleton-stat-card" />
    </div>

    <Skeleton className="skeleton-table" />
  </div>
);
