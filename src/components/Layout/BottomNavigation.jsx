// src/components/Layout/BottomNavigation.jsx
import React from 'react';
import {
  LayoutGrid, ClipboardList, User,
  Receipt, CheckCircle2, TrendingUp,
  LayoutDashboard, Users, MoreHorizontal
} from 'lucide-react';

const ROLE_NAV = {
  waiter: [
    { label: 'الرئيسية', tab: 'dashboard', icon: LayoutGrid },
    { label: 'الطلبات', tab: 'orders', icon: ClipboardList },
    { label: 'الملف', tab: 'profile', icon: User },
  ],
  cashier: [
    { label: 'الرئيسية', tab: 'dashboard', icon: LayoutGrid },
    { label: 'الطلبات', tab: 'orders', icon: ClipboardList },
    { label: 'المزيد', tab: 'more', icon: MoreHorizontal },
  ],
  manager: [
    { label: 'الرئيسية', tab: 'dashboard', icon: LayoutDashboard },
    { label: 'الطلبات', tab: 'orders', icon: ClipboardList },
    { label: 'الموظفون', tab: 'staff', icon: Users },
    { label: 'المزيد', tab: 'more', icon: MoreHorizontal },
  ],
};

const secondaryTabs = ['tables', 'bills', 'staff', 'codes', 'permissions', 'settings'];

export default function BottomNavigation({ activeTab, setActiveTab, role = 'manager' }) {
  const items = ROLE_NAV[role] || ROLE_NAV.manager;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden z-50"
      style={{
        background: 'rgba(9, 9, 11, 0.98)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: '88px',
        borderRadius: '24px 24px 0 0',
        direction: 'rtl',
      }}
    >
      <div
        className="flex justify-around items-stretch px-3"
        style={{ direction: 'rtl' }}
      >
        {items.map(item => {
          const IconComponent = item.icon;
          const isMore = item.tab === 'more';
          const isActive = isMore
            ? secondaryTabs.includes(activeTab)
            : activeTab === item.tab;

          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '500',
                minHeight: '72px',
                padding: '12px 0',
                position: 'relative',
              }}
            >
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '6px',
                    left: '35%',
                    right: '35%',
                    height: '4px',
                    background: 'var(--color-primary)',
                    borderRadius: '4px',
                    opacity: isActive ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                  }}
                />
              )}
              <span
                className="flex items-center justify-center"
                style={{
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <IconComponent size={28} strokeWidth={isActive ? 3 : 2.5} />
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  lineHeight: 1.2,
                  marginTop: '4px',
                  fontFamily: 'var(--font-arabic)',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}


