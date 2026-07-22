import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  isLoading = false,
  icon = null,
  type = 'button',
  as,
  className = '',
  style,
  ...props
}) => {
  const isDisabled = disabled || isLoading;
  const cls = `button button--${variant} button--${size} ${className}`.trim();

  const content = (
    <>
      {isLoading && (
        <motion.span
          className="button__spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          ⚙️
        </motion.span>
      )}
      {!isLoading && icon && <span className="button__icon">{icon}</span>}
      <span className={`button__text ${isLoading ? 'button__text--hidden' : ''}`}>
        {children}
      </span>
    </>
  );

  const motionProps = {
    whileHover: isDisabled ? undefined : { y: -2, boxShadow: 'var(--ds-shadow-btn-hover)' },
    whileTap: isDisabled ? undefined : { y: 0, boxShadow: 'var(--ds-shadow-sm)' },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  };

  // Allow rendering as a link (or other element) while keeping the look.
  if (as) {
    const Comp = motion(as);
    const { type: _omit, ...rest } = props;
    return (
      <Comp className={cls} style={style} {...motionProps} {...rest}>
        {content}
      </Comp>
    );
  }

  return (
    <motion.button type={type} className={cls} style={style} onClick={onClick} disabled={isDisabled} {...motionProps} {...props}>
      {content}
    </motion.button>
  );
};

export default Button;
