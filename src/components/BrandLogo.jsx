import React from 'react';

export default function BrandLogo({ size = 28, style = {} }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* Leaf background in gradient emerald green */}
      <path 
        d="M20 180 C 20 90, 90 20, 180 20 C 180 110, 110 180, 20 180 Z" 
        fill="url(#leafGrad)" 
      />
      {/* Vein lines crossing to create the cross look */}
      <path 
        d="M20 180 C 75 125, 125 75, 180 20" 
        stroke="white" 
        strokeWidth="11" 
        strokeLinecap="round" 
      />
      <path 
        d="M40 70 C 85 105, 120 120, 160 160" 
        stroke="white" 
        strokeWidth="11" 
        strokeLinecap="round" 
      />
      <defs>
        <linearGradient id="leafGrad" x1="20" y1="180" x2="180" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="60%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
    </svg>
  );
}
