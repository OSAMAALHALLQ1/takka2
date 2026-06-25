import React from 'react';

export default function BrandLogo({ size = 28, type = 'emblem', style = {} }) {
  const src = type === 'full'
    ? '/logo-full.svg'
    : '/logo-emblem.svg';

  return (
    <img
      src={src}
      alt="تكة"
      height={size}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        width: 'auto',
        ...style
      }}
    />
  );
}
