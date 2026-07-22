import React from 'react';

const Surface = ({ as: Component = 'div', children, className = '', elevated = false, ...props }) => {
  return (
    <Component
      className={`ds-surface${elevated ? ' ds-surface--elevated' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Surface;
