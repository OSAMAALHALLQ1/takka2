// src/components/Layout/BottomNavigation.jsx
import React from 'react';

const items = [
  { label: 'الرئيسية', tab: 'dashboard' },
  { label: 'الأقسام', tab: 'departments' },
  { label: 'المنيو', tab: 'menu' },
  { label: 'التقارير', tab: 'reports' },
  { label: 'المزيد', tab: 'more' },
];

const getIcon = (tab) => {
  switch (tab) {
    case 'dashboard':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>;
    case 'departments':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polygon points="2 17 12 22 22 17" /><polygon points="2 12 12 17 22 12" /></svg>;
    case 'menu':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v9M21 15V2v0a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3M12 11v11M18 17v5" /></svg>;
    case 'reports':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
    case 'more':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>;
    default:
      return null;
  }
};

export default function BottomNavigation({ activeTab, setActiveTab }) {
  const secondaryTabs = ['tables', 'bills', 'staff', 'codes', 'permissions'];
  
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 md:hidden z-50" 
      style={{ 
        background: 'rgba(9, 9, 11, 0.95)', 
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-light)',
        boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="flex justify-around py-1" style={{ direction: 'rtl' }}>
        {items.map(item => {
          const isMore = item.tab === 'more';
          const isActive = isMore 
            ? secondaryTabs.includes(activeTab) || activeTab === 'more'
            : activeTab === item.tab;
            
          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className="flex-1 py-2 text-center flex flex-col items-center gap-1 transition-all"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--color-role-accent)' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '500',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="flex items-center justify-center" style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}>{getIcon(item.tab)}</span>
              <span style={{ fontSize: '0.72rem', letterSpacing: '0.3px' }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}


