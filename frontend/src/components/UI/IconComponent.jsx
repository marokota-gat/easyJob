import React from 'react';

// Componente che carica un'icona SVG come componente React
const IconComponent = ({ iconName, color, size = 20 }) => {
  // Rende l'icona utilizzando un'immagine standard (fallback più semplice)
  return (
    <img
      src={`/${iconName}.svg`}
      alt={`${iconName} icon`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        filter: color
          ? `invert(${color === 'white' ? 1 : 0})`
          : 'none',
      }}
    />
  );
};

export default IconComponent;
