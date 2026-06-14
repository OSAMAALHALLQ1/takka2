import { useState } from 'react';
import { Coffee, LogIn, ShieldCheck, UserRound, KeyRound } from 'lucide-react';
import { authenticateByCode } from '../utils/storage';

export default function EmployeeLogin({ onSwitch, onLoginSuccess }) {
  const [codeInput, setCodeInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function handleLoginSubmit(e) {
    e.preventDefault();
    if (busy) return;
    if (!codeInput.trim()) {
      setError('يرجى إدخال كود الموظف');
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const session = authenticateByCode(codeInput);
      if (!session) {
        setError('الكود غير صحيح أو الحساب غير مفعل');
        return;
      }
      onLoginSuccess?.(session);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card glass-card" style={{ maxWidth: '400px' }}>
        <div className="login-header">
          <div className="brand" style={{ justifyContent: 'center', marginBottom: '20px' }}>
            <span className="brand-logo">
              <Coffee style={{ marginLeft: '10px', color: '#eab308' }} /> تكة | TAKA
            </span>
            <span className="brand-tag">تسجيل دخول الموظفين</span>
          </div>
          <div className="login-icon-box" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
            <UserRound size={32} />
          </div>
          <h2 className="login-title">دخول الموظفين بالكود</h2>
          <p className="login-desc">
            أدخل الكود الخاص بك للدخول إلى النظام (بدون كلمة مرور).
          </p>
        </div>

        {error && <div className="login-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}

        <form onSubmit={handleLoginSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>كود الموظف</label>
            <div className="input-with-icon">
              <KeyRound size={18} />
              <input
                type="text"
                className="form-input"
                placeholder="أدخل كودك السري..."
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                autoComplete="off"
                autoFocus
                required
                style={{ fontSize: '1.2rem', padding: '14px 14px 14px 40px', letterSpacing: '1px', textAlign: 'center' }}
              />
            </div>
          </div>

          <button type="submit" disabled={busy} className="btn btn-primary" style={{ width: '100%', padding: '14px', background: '#3b82f6', borderColor: '#3b82f6', fontSize: '1.1rem' }}>
            <LogIn size={20} /> {busy ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onSwitch}
            style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
          >
            <ShieldCheck size={18} /> مدير النظام؟ الدخول من هنا
          </button>
        </div>
      </div>
    </div>
  );
}

