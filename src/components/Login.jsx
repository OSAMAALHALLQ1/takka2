import { useMemo, useState } from 'react';
import { authenticateUser, getEmployees } from '../utils/storage';
import { Coffee, KeyRound, Lock, ShieldCheck, UserRound } from 'lucide-react';

const roleLabels = {
  manager: 'مدير',
  waiter: 'جرسون',
  cashier: 'محاسب',
  kitchen: 'مطبخ',
  bar: 'بار',
  shisha: 'شيشة'
};

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const demoAccounts = useMemo(
    () =>
      getEmployees()
        .filter((employee) => employee.active !== false)
        .map((employee) => ({
          id: employee.id,
          name: employee.name,
          role: employee.role,
          username: employee.username,
          password: employee.password
        })),
    []
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const session = authenticateUser(username, password);
    if (!session) {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة. تحقق من البيانات وحاول مرة ثانية.');
      return;
    }

    onLoginSuccess(session);
  };

  const fillAccount = (account) => {
    setUsername(account.username);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card glass-card pro-login-card">
        <div className="login-header">
          <div className="brand" style={{ justifyContent: 'center', marginBottom: '16px' }}>
            <span className="brand-logo">
              <Coffee style={{ marginRight: '8px', color: '#eab308' }} /> تكة
            </span>
            <span className="brand-tag">TAKA OPS</span>
          </div>
          <h2 className="login-title">نظام تشغيل المطعم</h2>
          <p className="login-desc">
            دخول موحد لكل الموظفين، مربوط بقاعدة بيانات داخلية تحفظ الطاولات والطلبات والفواتير.
          </p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>اسم المستخدم</label>
            <div className="input-with-icon">
              <UserRound size={18} />
              <input
                type="text"
                className="form-input"
                placeholder="admin / waiter1 / kitchen1"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>كلمة المرور</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px', padding: '12px' }}>
            <KeyRound size={18} /> تسجيل الدخول
          </button>
        </form>

        <div className="demo-account-panel">
          <div className="demo-account-title">
            <ShieldCheck size={16} />
            حسابات التجربة
          </div>
          <div className="demo-account-grid">
            {demoAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                className="demo-account"
                onClick={() => fillAccount(account)}
              >
                <span>{roleLabels[account.role] || account.role}</span>
                <strong>{account.username}</strong>
                <small>{account.password}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
