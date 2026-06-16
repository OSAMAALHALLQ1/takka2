import React, { useEffect } from 'react';

export default function ResponsiveModal({ isOpen, onClose, children }) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 mb-4 bg-white/5 backdrop-filter backdrop-blur-lg rounded-xl p-4 animate-slide-up">
        <button className="absolute top-2 right-2 text-xl" onClick={onClose}>✖️</button>
        {children}
      </div>
    </div>
  );
}
