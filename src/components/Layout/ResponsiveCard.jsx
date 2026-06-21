import React from 'react';

export default function ResponsiveCard({ title, children, actions, color }) {
  return (
    <div className="card-bg card-hover p-4" style={{ borderTop: `4px solid ${color || '#e67e22'}` }}>
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>{title}</h2>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
