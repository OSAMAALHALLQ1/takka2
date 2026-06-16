// src/components/Layout/BottomNavigation.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const items = [
  { icon: '🏠', label: 'الرئيسية', path: '/admin' },
  { icon: '📋', label: 'الأقسام', path: '/departments' },
  { icon: '📝', label: 'القائمة', path: '/menu' },
  { icon: '💰', label: 'الفواتير', path: '/invoices' },
  { icon: '⚙️', label: 'الإعدادات', path: '/settings' },
];

export default function BottomNavigation() {
  const navigate = useNavigate();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around">
        {items.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex-1 py-3 text-center flex flex-col items-center gap-1 hover:bg-gray-100 transition"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
