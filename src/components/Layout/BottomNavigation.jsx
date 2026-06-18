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
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingTop: '8px',
        height: '72px',
        borderRadius: '16px 16px 0 0',
      }}
    >
      <div
        className="flex justify-around items-stretch px-2"
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
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--color-role-accent)' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '500',
                minHeight: '56px',
                padding: '6px 0',
                position: 'relative',
              }}
            >
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '25%',
                    right: '25%',
                    height: '3px',
                    background: 'var(--color-role-accent)',
                    borderRadius: '2px',
                    opacity: isActive ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                  }}
                />
              )}
              <span
                className="flex items-center justify-center"
                style={{
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <IconComponent size={24} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  lineHeight: 1.2,
                  marginTop: '2px',
                  fontFamily: 'var(--font-arabic)',
                  fontWeight: 600,
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


