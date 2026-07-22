import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiArrowLeft } from 'react-icons/fi';
import { Button } from './Button';

const PageHeader = ({
  title,
  subtitle,
  action,
  actionLabel,
  onAction,
  showBack = false,
  onBack,
  breadcrumbs,
}) => {
  const navigate = useNavigate();
  const handleBack = () => (onBack ? onBack() : navigate(-1));

  let actionEl = action;
  if (!actionEl && actionLabel && onAction) {
    actionEl = (
      <Button variant="pageAction" icon={<FiPlus size={18}/>} onClick={onAction} aria-label={actionLabel}>
        {actionLabel}
      </Button>
    );
  }

  return (
    <motion.header
      className={`page-header${actionEl ? ' page-header--with-action' : ''}`}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="page-header__text">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="page-header__back"
          >
            <FiArrowLeft />
          </button>
        )}
        {breadcrumbs && (
          <nav aria-label="Breadcrumb" className="page-header__breadcrumbs">
            {breadcrumbs}
          </nav>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actionEl && <div className="page-header__action-slot">{actionEl}</div>}
    </motion.header>
  );
};

export default PageHeader;
