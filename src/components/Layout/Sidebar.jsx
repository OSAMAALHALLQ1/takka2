// src/components/Layout/Sidebar.jsx
import React from 'react';

/**
 * Sidebar – responsive navigation drawer.
 * Used by AdminDashboard on desktop (always visible) and on mobile as a drawer.
 * Props:
 *   sidebarOpen   – boolean, whether the drawer is open (mobile)
 *   setSidebarOpen – function to toggle drawer state
 *   activeTab      – current active tab id
 *   setActiveTab   – function to change active tab
 */
export default function Sidebar({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, user, onLogout }) {
  // Close drawer when clicking outside on mobile
  const handleOverlayClick = () => setSidebarOpen(false);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 md:hidden z-30"
          onClick={handleOverlayClick}
        />
      )}
      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-40 transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 md:w-60`}
      >
        {/* Close button visible on mobile */}
        <button
          className="md:hidden absolute top-4 right-4 text-xl"
          onClick={() => setSidebarOpen(false)}
          aria-label="إغلاق القائمة"
        >
          ✕
        </button>
        {/* User avatar */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white">{user.name?.charAt(0) || 'م'}</div>
          <div>
            <div className="font-bold">{user.name}</div>
            <div className="text-sm text-gray-500">{user.role === 'manager' ? 'ADMIN' : user.role}</div>
          </div>
        </div>
        {/* Navigation items – reuse same array as AdminDashboard tabs */}
        <nav className="p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'لوحة التحكم', icon: '📊' },
            { id: 'departments', label: 'الأقسام', icon: '🏢' },
            { id: 'menu', label: 'المنيو', icon: '🍽️' },
            { id: 'tables', label: 'الطاولات', icon: '🪑' },
            { id: 'staff', label: 'الموظفون', icon: '👥' },
            { id: 'codes', label: 'أكواد الدعوة', icon: '🔑' },
            { id: 'permissions', label: 'الصلاحيات', icon: '🔐' },
            { id: 'reports', label: 'التقارير', icon: '📈' },
            { id: 'bills', label: 'الفواتير', icon: '🧾' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`flex items-center w-full px-3 py-2 rounded ${activeTab === tab.id ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
            >
              <span className="mr-2 text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <button
          className="w-full flex items-center justify-center py-2 mt-4 bg-red-500 text-white rounded"
          onClick={() => { setSidebarOpen(false); onLogout && onLogout(); }}
        >
          🚪 خروج
        </button>
      </aside>
    </>
  );
}
