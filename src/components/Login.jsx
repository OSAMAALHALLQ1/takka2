import React, { useState, useEffect } from 'react';
import { getEmployees, getManagerCredentials, saveManagerCredentials } from '../utils/storage';
import { Lock, KeyRound, Coffee, User } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('employee'); // 'employee' | 'manager'
  const [managerMode, setManagerMode] = useState('login'); // 'login' | 'register'
  const [managerName, setManagerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const hasManager = getManagerCredentials() !== null;
// manager login state from storage
const isManagerLoggedIn = getManagerLoginState();

  // Auto-switch manager to register mode if no account exists yet
  useEffect(() => {
  // If manager logged in, redirect automatically
  if (isManagerLoggedIn && activeTab === 'manager') {
    onLoginSuccess({ role: 'manager', name: getManagerCredentials().name, code: 'ADMIN' });
    return;
  }

    if (activeTab === 'manager') {
      if (!hasManager) {
        setManagerMode('register');
      } else {
        setManagerMode('login');
      }
    }
    setError('');
  }, [activeTab]);

  const handleManagerSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (managerMode === 'register') {
          // Register new manager
          if (!managerName.trim()) {
            setError('يرجى إدخال اسم المدير!');
            return;
          }
          if (password.length < 6) {
            setError('يجب أن تكون كلمة المرور 6 خانات أو أكثر!');
            return;
          }
          if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين!');
            return;
          }

          const newManager = {
            name: managerName,
            email: email,
            password: password
          };
          saveManagerCredentials(newManager);
          // After registration, show login link
          saveManagerLoginState(false);
          setManagerMode('login');
          setError('تم إنشاء حساب المدير. يرجى تسجيل الدخول.');
          return; // exit early
        } else {
      if (!managerName.trim()) {
        setError('يرجى إدخال اسم المدير!');
        return;
      }
      if (password.length < 6) {
        setError('يجب أن تكون كلمة المرور 6 خانات أو أكثر!');
        return;
      }
      if (password !== confirmPassword) {
        setError('كلمتا المرور غير متطابقتين!');
        return;
      }

      const newManager = {
        name: managerName,
        email: email,
        password: password
      };
      saveManagerCredentials(newManager);
      onLoginSuccess({
        role: 'manager',
        name: managerName,
        code: 'ADMIN'
      });
    } else {
      const storedManager = getManagerCredentials();
          if (email === storedManager.email && password === storedManager.password) {
            // Successful login
            saveManagerLoginState(true);
            onLoginSuccess({
              role: 'manager',
              name: storedManager.name,
              code: 'ADMIN'
            });
          } else {
            setError('البريد الإلكتروني أو كلمة المرور غير صحيحة!');
          }
          return; // end login flow
        }

      const actualEmail = storedManager ? storedManager.email : 'admin@takah.com';
      const actualPassword = storedManager ? storedManager.password : 'admin123';
      const actualName = storedManager ? storedManager.name : 'المدير العام';

      if (email === actualEmail && password === actualPassword) {
        onLoginSuccess({
          role: 'manager',
          name: actualName,
          code: 'ADMIN'
        });
      } else {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة!');
      }
    }
  };

  const handleEmployeeSubmit = (e) => {
    e.preventDefault();
    setError('');

    const employees = getEmployees();
    const matchedEmployee = employees.find(
      (emp) => emp.code.trim().toUpperCase() === code.trim().toUpperCase()
    );

    if (matchedEmployee) {
      onLoginSuccess({
        role: matchedEmployee.role,
        name: matchedEmployee.name,
        code: matchedEmployee.code
      });
    } else {
      setError('كود الموظف غير صحيح! يرجى التحقق من الكود أو طلب كود جديد من المدير.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="brand" style={{ justifyContent: 'center', marginBottom: '16px' }}>
            <span className="brand-logo"><Coffee style={{ marginRight: '8px', color: '#eab308' }} /> تكة</span>
            <span className="brand-tag">TAKAH</span>
          </div>
          <h2 className="login-title">نظام إدارة المطعم</h2>
          <p className="login-desc">أهلاً بك في نظام تكة لإدارة الطلبات والصالات</p>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${activeTab === 'employee' ? 'active' : ''}`}
            onClick={() => { setActiveTab('employee'); setError(''); }}
          >
            دخول الموظفين
          </button>
          <button
            type="button"
            className={`login-tab ${activeTab === 'manager' ? 'active' : ''}`}
            onClick={() => { setActiveTab('manager'); setError(''); }}
          >
            دخول الإدارة
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              color: '#f43f5e',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              marginBottom: '20px',
              textAlign: 'center'
            }}
          >
            {error}
          </div>
        )}

        {activeTab === 'manager' ? (
          <form onSubmit={handleManagerSubmit}>
            {managerMode === 'register' ? (
              <>
                <div
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.2)',
                    color: '#fef08a',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}
                >
                  {!hasManager 
                    ? '⚠️ لم يتم إعداد حساب المدير بعد. الرجاء إنشاء الحساب الأول للمطعم.'
                    : 'إنشاء حساب مدير إضافي/جديد وتغيير البيانات الحالية.'}
                </div>

                <div className="form-group">
                  <label>اسم المدير الكامل</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="أدخل اسمك"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>البريد الإلكتروني للمدير</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>كلمة المرور</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="•••••••• (6 خانات على الأقل)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px', padding: '12px' }}>
                  <Lock size={18} /> إنشاء حساب المدير والدخول
                </button>

                {hasManager && (
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => { setManagerMode('login'); setError(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                    >
                      تسجيل الدخول بالحساب الحالي
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>البريد الإلكتروني للمدير</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>كلمة المرور</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px', padding: '12px' }}>
                  <Lock size={18} /> تسجيل الدخول كمدير
                </button>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => { setManagerMode('register'); setError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                  >
                    إنشاء حساب مدير جديد / إعادة ضبط
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleEmployeeSubmit}>
            <div className="form-group">
              <label>كود الموظف السري</label>
              <input
                type="text"
                className="form-input num-font"
                placeholder="أدخل الكود (مثال: W-1234)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '1.2rem', fontWeight: '700' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px', padding: '12px' }}>
              <KeyRound size={18} /> دخول لوحة الصلاحيات
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
