import React from 'react';

export const renderItemImage = (image, name, isCard = false, placeholderType = 'money') => {
  const isUrl = image && (image.startsWith('http') || image.startsWith('data:image/'));
  
  if (isUrl) {
    return (
      <img 
        src={image} 
        alt={name} 
        style={isCard ? { 
          width: '100%', 
          height: '90px', 
          objectFit: 'cover', 
          borderRadius: '6px', 
          marginBottom: '6px', 
          display: 'block' 
        } : { 
          width: '40px', 
          height: '40px', 
          objectFit: 'cover', 
          borderRadius: '6px', 
          display: 'block',
          flexShrink: 0
        }} 
      />
    );
  }

  if (image && image.length <= 4) {
    return (
      <div 
        style={isCard ? {
          width: '100%',
          height: '90px',
          borderRadius: '6px',
          marginBottom: '6px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.02) 100%)',
          border: '1px dashed rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem'
        } : {
          width: '40px',
          height: '40px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.02) 100%)',
          border: '1px dashed rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
          flexShrink: 0
        }}
      >
        {image}
      </div>
    );
  }

  return (
    <div 
      style={isCard ? {
        width: '100%',
        height: '90px',
        borderRadius: '6px',
        marginBottom: '6px',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.02) 100%)',
        border: '1px dashed rgba(212, 175, 55, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-primary)'
      } : {
        width: '40px',
        height: '40px',
        borderRadius: '6px',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.02) 100%)',
        border: '1px dashed rgba(212, 175, 55, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-primary)',
        flexShrink: 0
      }}
    >
      {placeholderType === 'dept' ? (
        <svg width={isCard ? 24 : 16} height={isCard ? 24 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="9" y1="22" x2="9" y2="16" />
          <line x1="15" y1="22" x2="15" y2="16" />
          <line x1="9" y1="16" x2="15" y2="16" />
        </svg>
      ) : (
        <svg width={isCard ? 24 : 16} height={isCard ? 24 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )}
    </div>
  );
};
