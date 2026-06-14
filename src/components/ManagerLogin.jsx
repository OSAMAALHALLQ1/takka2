import { useState } from 'react';
import { Coffee, KeyRound, Eye, EyeOff, LogIn, ShieldCheck, UserRound, Building, Mail, Phone, CheckCircle } from 'lucide-react';
import { ensureDefaultPassword, verifyManagerPassword, loginManager, registerManager, getManagerAccount, activateManagerAccount, DEFAULT_MANAGER_PASSWORD } from '../utils/auth-store';

export default function ManagerLogin({ onSwitch, onLogin }) {
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState(() => {
    ensureDefaultPassword();
    const acc = getManagerAccount();
    return acc ? acc.email : '';
  });
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [restaurantName, setRestaurantName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showActivationModal, setShowActivationModal] = useState(false);

  async function handleLoginSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const ok = await verifyManagerPassword(loginPassword, loginEmail);
      if (!ok) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة، أو الحساب غير مفعل');
        return;
      }
      loginManager();
      onLogin?.();
    } finally {
      setBusy(false);
    }
  }

  function handleSignupSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!restaurantName || !managerName || !signupEmail || !signupPhone || !signupPassword) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (signupPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 خانات على الأقل');
      return;
    }
    
    registerManager({
      restaurantName: restaurantName.trim(),
      name: managerName.trim(),
      email: signupEmail.trim().toLowerCase(),
      phone: signupPhone.trim(),
      password: signupPassword
    });

    setShowActivationModal(true);
  }

  async function handleMockActivation() {
    setBusy(true);
    try {
      const success = await activateManagerAccount();
      if (success) {
        setShowActivationModal(false);
        setTab('login');
        const acc = getManagerAccount();
        if (acc) setLoginEmail(acc.email);
        setLoginPassword('');
        alert('🎉 تم تفعيل حساب المدير بنجاح! يمكنك الآن تسجيل الدخول.');
      } else {
        alert('حدث خطأ أثناء التفعيل.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card glass-card" style={{ maxWidth: '440px' }}>
        <div className="login-header">
          <div className="brand" style={{ justifyContent: 'center', marginBottom: '20px' }}>
            <span className="brand-logo">
              <Coffee style={{ marginLeft: '10px', color: '#eab308' }} /> تكة | TAKA
            </span>
            <span className="brand-tag">لوحة التحكم والعمليات</span>
          </div>
          <div className="login-icon-box" style={{ background: 'rgba(231,76,60,0.15)', color: '#e74c3c' }}>
            <ShieldCheck size={32} />
          </div>
          <h2 className="login-title">{tab === 'login' ? 'دخول المدير العام' : 'إنشاء حساب مدير جديد'}</h2>
          <p className="login-desc">
            {tab === 'login' 
              ? 'أدخل بيانات الحساب لإدارة الفروع، الموظفين، الصلاحيات والمنيو.' 
              : 'قم بتسجيل حساب المطعم والمدير لبدء إعداد النظام وتوليد أكواد الموظفين.'}
          </p>
        </div>

        {/* Tab triggers */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
          <button 
            type="button" 
            onClick={() => { setTab('login'); setError(null); }}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: tab === 'login' ? '#e74c3c' : 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            تسجيل الدخول
          </button>
          <button 
            type="button" 
            onClick={() => { setTab('signup'); setError(null); }}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: tab === 'signup' ? '#e74c3c' : 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            إنشاء حساب
          </button>
        </div>

        {error && <div className="login-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>البريد الإلكتروني للمدير</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="admin@taka.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>كلمة المرور</label>
              <div className="input-with-icon">
                <KeyRound size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'إخفاء' : 'إظهار'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn btn-primary" style={{ width: '100%', padding: '12px', background: '#e74c3c', borderColor: '#e74c3c' }}>
              <LogIn size={18} /> {busy ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>

          </form>
        ) : (
          <form onSubmit={handleSignupSubmit}>
            <div className="form-group">
              <label>اسم المطعم / المقهى *</label>
              <div className="input-with-icon">
                <Building size={18} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="مطعم تكة"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>اسم المدير الكامل *</label>
              <div className="input-with-icon">
                <UserRound size={18} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="انس المدهون"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>البريد الإلكتروني *</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="manager@gmail.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>رقم الهاتف *</label>
              <div className="input-with-icon">
                <Phone size={18} />
                <input
                  type="tel"
                  className="form-input"
                  placeholder="0591234567"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>كلمة المرور *</label>
              <div className="input-with-icon">
                <KeyRound size={18} />
                <input
                  type="password"
                  className="form-input"
                  placeholder="كلمة مرور قوية"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', background: '#e74c3c', borderColor: '#e74c3c' }}>
              📝 إنشاء حساب المدير
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onSwitch}
            style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
          >
            <UserRound size={18} /> تسجيل دخول الموظفين (عبر أكواد الدعوة)
          </button>
        </div>
      </div>

      {/* Activation simulation modal */}
      {showActivationModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '440px', padding: '24px', textAlign: 'center', border: '1px solid #27ae60' }}>
            <div style={{ fontSize: '3rem', color: '#27ae60', marginBottom: '14px' }}>✉️</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#27ae60', marginBottom: '10px' }}>تم إرسال طلب تفعيل إلى بريدك الإلكتروني</h3>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-light)', margin: '16px 0', textAlign: 'right', fontSize: '0.88rem' }}>
              <p style={{ marginBottom: '8px' }}>📬 <b>محاكاة صندوق الوارد:</b></p>
              <p style={{ color: 'var(--text-muted)' }}>مستلم: <span style={{ color: '#fff' }}>{signupEmail}</span></p>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>المرسل: <span style={{ color: '#d4af37' }}>تكة | TAKKA AUTH</span></p>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>الموضوع: <span style={{ color: '#fff' }}>رابط تفعيل حساب مدير مطعم تكة</span></p>
              <hr style={{ border: 'none', borderTop: '1px dashed var(--border-light)', margin: '10px 0' }} />
              <p style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>مرحباً {managerName}، تم إنشاء حسابك لـ ({restaurantName}). يرجى النقر على الرابط لتفعيله.</p>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              انقر على زر التفعيل أدناه لتنشيط الحساب والانتقال لشاشة تسجيل الدخول:
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn-primary-gold" 
                onClick={handleMockActivation}
                style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                <CheckCircle size={16} /> تفعيل الحساب الآن
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowActivationModal(false)}
                style={{ padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

