// src/components/Layout/BottomNavigation.jsx
import React from 'react';

const items = [
  { icon: '📊', label: 'الرئيسية', tab: 'dashboard' },
  { icon: '🏢', label: 'الأقسام', tab: 'departments' },
  { icon: '🍽️', label: 'المنيو', tab: 'menu' },
  { icon: '🧾', label: 'الفواتير', tab: 'bills' },
  { icon: '👥', label: 'الموظفون', tab: 'staff' },
];

export default function BottomNavigation({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50" style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
      <div className="flex justify-around">
        {items.map(item => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className="flex-1 py-2 text-center flex flex-col items-center gap-1 transition"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 'bold' : 'normal'
              }}
            >
              <span className="text-xl">{item.icon}</span>
              <span style={{ fontSize: '0.7rem' }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
