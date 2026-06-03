import React, { useState, useEffect } from 'react';
import { getTables, saveTables, getEmployees, getNotifications, saveNotifications, getManagerCredentials } from './utils/storage';
import Login from './components/Login';
import WaiterView from './components/WaiterView';
import CashierView from './components/CashierView';
import ManagerView from './components/ManagerView';
import NotificationsToast from './components/NotificationsToast';
import { Coffee, LogOut, ShieldAlert, Award } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [tables, setTables] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // 1. Initial State Loading & Direct Link Code Check
  useEffect(() => {
    // Load initial storage states
    const initTables = getTables();
    const initEmployees = getEmployees();
    const initNotifications = getNotifications();

    setTables(initTables);
    setEmployeeList(initEmployees);
    setNotifications(initNotifications.slice(0, 5)); // show only top 5 alerts initially

    // Check if code exists in URL params (?code=W-1234)
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');

    if (codeParam) {
      const matched = initEmployees.find(
        (emp) => emp.code.trim().toUpperCase() === codeParam.trim().toUpperCase()
      );
      if (matched) {
        setUser({
          role: matched.role,
          name: matched.name,
          code: matched.code
        });
      } else if (codeParam.trim().toUpperCase() === 'ADMIN') {
        const storedManager = getManagerCredentials();
        setUser({
          role: 'manager',
          name: storedManager ? storedManager.name : 'المدير العام',
          code: 'ADMIN'
        });
      }
      
      // Clear URL parameter so it stays clean
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  // 2. Real-Time Multi-Window/Tab Synchronization
  useEffect(() => {
    const handleSync = () => {
      setTables(getTables());
      setEmployeeList(getEmployees());
      setNotifications(getNotifications().slice(0, 5));
    };

    // Listen to storage sync events
    window.addEventListener('storage', handleSync);
    window.addEventListener('takah_sync', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('takah_sync', handleSync);
    };
  }, []);

  // 3. Login success callback
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  // 4. Logout handler
  const handleLogout = () => {
    setUser(null);
  };

  // 5. Save tables callback
  const handleSaveTables = (newTables) => {
    setTables(newTables);
    saveTables(newTables);
  };

  // 6. Dismiss toast notification
  const handleDismissNotification = (id) => {
    const activeNotifs = getNotifications();
    const updated = activeNotifs.filter((n) => n.id !== id);
    saveNotifications(updated);
    setNotifications(updated.slice(0, 5));
  };

  const getRoleBadgeText = (role) => {
    switch (role) {
      case 'manager':
        return 'المدير العام';
      case 'waiter':
        return 'نادل صالة';
      case 'cashier':
        return 'محاسب كاشير';
      default:
        return '';
    }
  };

  if (!user) {
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} />
        {notifications.length > 0 && (
          <NotificationsToast
            notifications={notifications}
            onClose={handleDismissNotification}
          />
        )}
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header Bar */}
      <header className="header-bar">
        <div className="brand">
          <span className="brand-logo">
            <Coffee style={{ marginLeft: '10px', color: 'var(--color-primary)' }} />
            تكة
          </span>
          <span className="brand-tag">لوحة {getRoleBadgeText(user.role)}</span>
        </div>

        <div className="user-profile">
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role num-font">
              {user.role === 'manager' ? 'ADMIN' : `كود: ${user.code}`}
            </div>
          </div>

          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </header>

      {/* Main Role Routing Router */}
      <main style={{ flex: 1 }}>
        {user.role === 'manager' && (
          <ManagerView
            tables={tables}
            employeeList={employeeList}
            onUpdateEmployees={setEmployeeList}
          />
        )}
        {user.role === 'waiter' && (
          <WaiterView
            tables={tables}
            onSaveTables={handleSaveTables}
            employee={user}
          />
        )}
        {user.role === 'cashier' && (
          <CashierView
            tables={tables}
            onSaveTables={handleSaveTables}
            employee={user}
          />
        )}
      </main>

      {/* Real-time Business Toast Alerts */}
      {notifications.length > 0 && (
        <NotificationsToast
          notifications={notifications}
          onClose={handleDismissNotification}
        />
      )}
    </div>
  );
}
