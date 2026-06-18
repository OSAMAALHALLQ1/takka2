// src/components/Layout/BottomNavigation.jsx
import React from 'react';
import {
  LayoutGrid, ClipboardList, User,
  Receipt, CheckCircle2, TrendingUp,
  LayoutDashboard, Users, Settings, MoreHorizontal
} from 'lucide-react';

const ROLE_NAV = {
  waiter: [
    { label: 'الطاولات', tab: 'tables', icon: LayoutGrid },
    { label: 'الطلبات', tab: 'orders', icon: ClipboardList },
    { label: 'الملف', tab: 'profile', icon: User },
  ],
  cashier: [
    { label: 'الفواتير', tab: 'active', icon: Receipt },
    { label: 'المكتملة', tab: 'bills', icon: CheckCircle2 },
    { label: 'التقارير', tab: 'reports', icon: TrendingUp },
  ],
  manager: [
    { label: 'الرئيسية', tab: 'dashboard', icon: LayoutDashboard },
    { label: 'الأقسام', tab: 'departments', icon: ClipboardList },
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
        background: 'rgba(9, 9, 11, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-light)',
        boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingTop: '4px',
      }}
    >
      <div className="flex justify-around items-stretch" style={{ direction: 'rtl' }}>
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
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-150"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--color-role-accent)' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '500',
                minHeight: '56px',
                padding: '4px 0',
                position: 'relative',
              }}
            >
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '25%',
                    right: '25%',
                    height: '2px',
                    background: 'var(--color-role-accent)',
                    borderRadius: '0 0 2px 2px',
                  }}
                />
              )}
              <span
                className="flex items-center justify-center"
                style={{
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <IconComponent size={22} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span style={{ fontSize: '0.65rem', lineHeight: 1.2, marginTop: '2px' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}


