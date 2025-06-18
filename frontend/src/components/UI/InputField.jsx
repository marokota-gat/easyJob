import React from 'react';
import './InputField.css';

function InputField({
  type = 'text',
  placeholder = '',
  required = false,
  value,
  onChange,
  name,
  width = '100%',
  height = '40px',
  borderRadius = '25px',
  border = '1px solid #ccc',
  fontSize = '16px',
  color = '#000',
  margin = '0px',
  icon,
  iconPosition = 'right',
  onIconClick,
  leftIconOffset = '15px',
  rightIconOffset = '15px',
  paddingLeft,
}) {
  const inputStyle = {
    boxSizing: 'border-box',
    width: '100%',
    height,
    borderRadius,
    border,
    fontSize,
    color,
    paddingLeft:
      paddingLeft ||
      (iconPosition === 'left'
        ? `${parseInt(leftIconOffset) + 25}px`
        : '15px'),
    paddingRight:
      iconPosition === 'right'
        ? `${parseInt(rightIconOffset) + 20}px`
        : '15px',
  };

  const containerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width,
    margin,
  };

  const iconStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    [iconPosition === 'left' ? 'left' : 'right']:
      iconPosition === 'left'
        ? leftIconOffset
        : rightIconOffset,
    width: '20px',
    height: '20px',
    cursor: onIconClick ? 'pointer' : 'default',
  };

  return (
    <div style={containerStyle} className="input-container">
      {icon && iconPosition === 'left' && (
        <div
          style={iconStyle}
          onClick={onIconClick}
          className="input-icon input-icon-left"
        >
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
        value={value}
        onChange={onChange}
        name={name}
        className="input-field"
      />
      {icon && iconPosition === 'right' && (
        <div
          style={iconStyle}
          onClick={onIconClick}
          className="input-icon input-icon-right"
        >
          {icon}
        </div>
      )}
    </div>
  );
}
export default InputField;
