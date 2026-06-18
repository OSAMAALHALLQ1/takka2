import React, { useEffect } from 'react';
import { X } from 'lucide-react';

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
      <div className="w-full max-w-md mx-4 mb-4 bg-white/5 backdrop-filter backdrop-blur-lg rounded-xl p-4 animate-slide-up relative">
        <button 
          className="absolute top-4 right-4 text-xl text-white/70 hover:text-white transition-colors" 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
