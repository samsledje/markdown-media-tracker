import React from 'react';

/**
 * Reusable button component
 */
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  className = '',
  style = {},
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg transition font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800';
  
  const sizeClasses = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--mt-highlight)',
      color: 'white'
    },
    secondary: {
      backgroundColor: 'rgba(255,255,255,0.04)',
      color: 'white'
    },
    danger: {
      backgroundColor: 'rgba(255,0,0,0.16)',
      color: 'white'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'white'
    }
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90';

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;