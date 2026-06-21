// src/components/Layout/TopBar.jsx
import React from 'react';
import NotificationBell from '../NotificationBell';
import UserProfile from '../UserProfile'; // Assume a

/**
 * TopBar – Clean header used across the app.
 * Shows hamburger (mobile only), logo, notification bell, and user profile.
 */
export default function TopBar({ onMenuClick }) {
  return (
    <header className="bg-white dark:bg-primary shadow-sm">
      <div className="flex justify-between items-center px-4 py-3">
        {/* Left side: Hamburger (mobile) + Logo */}
        <div className="flex items-center gap-4">
          {/* Hamburger visible on small screens */}
          <button
            onClick={onMenuClick}
            className="md:hidden text-xl"
            aria-label="فتح القائمة"
          >
            ☰
          </button>
          <h1 className="text-xl font-bold text-primary">تكة</h1>
        </div>
        {/* Right side: Notification Bell and User Profile */}
        <div className="flex items-center gap-4">
          <NotificationBell />
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
