import React from 'react';
import './Button.css';

export default function Button({
  text = 'button',
  width = '100px',
  height = '50px',
  backgroundColor = 'none',
  textColor = 'white',
  padding = '0px',
  border = '0px',
  borderRadius = '8px',
  fontSize = '16px',
  fontWeight = '',
  onClick,
  onMouseEnter,
  onMouseLeave,
  classNameCSS = '',
  margin = '0px',
  type = '',
  textDecoration = '',
  icon,
  iconPosition = 'right',
  disabled = false,
  className = '',
}) {
  const buttonStyle = {
    width,
    height,
    backgroundColor: disabled ? '#cccccc' : backgroundColor,
    color: disabled ? '#666666' : textColor,
    border,
    borderRadius,
    fontSize,
    fontWeight,
    padding: padding || (icon ? '0 15px' : '0'),
    margin,
    textDecoration,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
  };

  const iconContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
  };

  return (
    <button
      style={buttonStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`button ${classNameCSS} ${className}`}
      type={type || 'button'}
      disabled={disabled}
    >
      <div className="button-content">
        {icon && iconPosition === 'left' && (
          <span
            style={iconContainerStyle}
            className="button-icon button-icon-left"
          >
            {icon}
          </span>
        )}

        <span className="button-text">{text}</span>

        {icon && iconPosition === 'right' && (
          <span
            style={iconContainerStyle}
            className="button-icon button-icon-right"
          >
            {icon}
          </span>
        )}
      </div>
    </button>
  );
}
