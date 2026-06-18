import React, { useState, useEffect } from 'react';
import { getCodes, createCode, revokeCode, deleteCode } from '../../utils/auth-store';
import { addNotification } from '../../utils/storage';
import { ROLE_LABELS, ROLE_COLORS } from './constants';
import { KeyRound, CheckCircle, Copy, Ban, Trash2, Check } from 'lucide-react';

export default function CodesTab({ codes, setCodes }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  const [newRole, setNewRole] = useState('waiter');
  const [newLabel, setNewLabel] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [expireDays, setExpireDays] = useState(null);

  const handleGenerate = () => {
    if (!newLabel.trim()) { alert('أدخل اسم للموظف'); return; }
    const expiresAt = expireDays ? (Date.now() + expireDays * 24 * 60 * 60 * 1000) : null;
    const code = createCode({ label: newLabel.trim(), allowedRoles: [newRole], expiresAt });
    setCodes(getCodes());
    setGeneratedCode(code);
    addNotification('كود دعوة', `تم إنشاء كود لـ ${newLabel} (${ROLE_LABELS[newRole]})`, 'success');
    setNewLabel('');
  };

  const handleRevoke = (codeId) => {
    revokeCode(codeId);
    setCodes(getCodes());
    addNotification('كود دعوة', 'تم إلغاء الكود', 'warning');
  };

  const handleDelete = (codeId) => {
    if (!window.confirm('حذف الكود نهائياً؟')) return;
    deleteCode(codeId);
    setCodes(getCodes());
  };

  const copyCode = (codeStr) => {
    navigator.clipboard.writeText(codeStr).then(() => {
      setCopySuccess(codeStr);
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const isExpired = (code) => code.expiresAt && code.expiresAt < now;
  const daysLeft = (code) => {
    if (!code.expiresAt) return '∞';
    const ms = code.expiresAt - now;
    if (ms <= 0) return 'منتهي';
    return `${Math.ceil(ms / 86400000)} يوم`;
  };

  return (
    <div>
      <h2 className="tab-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <KeyRound size={24} style={{ color: 'var(--color-primary)' }} />
        أكواد الدعوة للموظفين
      </h2>

      {/* Generate form */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h3 className="card-title">إنشاء كود دعوة جديد</h3>
        <div className="responsive-cols-3-auto" style={{ alignItems: 'end', marginTop: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">اسم الموظف</label>
            <input className="form-input" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="محمد جرسون" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">الدور</label>
            <select className="form-input" value={newRole} onChange={e => setNewRole(e.target.value)}>
              <option value="waiter">جرسون</option>
              <option value="cashier">محاسب</option>
              <option value="kitchen">مطبخ</option>
              <option value="bar">بار</option>
              <option value="shisha">شيشة</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">الصلاحية</label>
            <select className="form-input" value={expireDays || ''} onChange={e => setExpireDays(e.target.value ? parseInt(e.target.value) : null)}>
              <option value="">دائم (لا تنتهي)</option>
              <option value={1}>يوم واحد</option>
              <option value={3}>3 أيام</option>
              <option value={7}>7 أيام</option>
              <option value={30}>30 يوم</option>
            </select>
          </div>
          <button className="btn-primary-gold" onClick={handleGenerate} style={{ height: '44px' }}>+ إنشاء كود</button>
        </div>

        {generatedCode && (
          <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: '12px' }}>
            <div style={{ color: '#27ae60', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={18} />
              <span>تم إنشاء الكود بنجاح!</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <code style={{ fontSize: '1.4rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '3px', color: 'var(--color-primary)', background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: '8px', direction: 'ltr' }}>{generatedCode.code}</code>
              <button className="btn-primary-gold" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => copyCode(generatedCode.code)}>
                {copySuccess === generatedCode.code ? (
                  <><Check size={14} /> تم النسخ</>
                ) : (
                  <><Copy size={14} /> نسخ</>
                )}
              </button>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              للموظف: <strong>{generatedCode.label}</strong> | الدور: <strong>{ROLE_LABELS[generatedCode.allowedRoles?.[0]]}</strong> | الصلاحية: <strong>{daysLeft(generatedCode)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Codes list */}
      <div className="admin-card">
        <h3 className="card-title">الأكواد المنشأة ({codes.length})</h3>
        {codes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>لم يتم إنشاء أكواد بعد</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
            {codes.map(code => (
              <div key={code.id} className="admin-card" style={{ padding: '16px', borderRight: `3px solid ${code.revoked || isExpired(code) ? '#e74c3c' : '#27ae60'}`, opacity: code.revoked || isExpired(code) ? 0.65 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>{code.label}</div>
                    <code style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', letterSpacing: '2px', color: 'var(--color-primary)', direction: 'ltr', display: 'block' }}>{code.code}</code>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      الدور: <span style={{ color: ROLE_COLORS[code.allowedRoles?.[0]] }}>{ROLE_LABELS[code.allowedRoles?.[0]] || code.allowedRoles?.[0]}</span>
                      {' | '}صلاحية: <strong>{daysLeft(code)}</strong>
                      {code.revoked && <span style={{ color: '#e74c3c' }}> | ملغى</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!code.revoked && !isExpired(code) && (
                      <button className="icon-btn" onClick={() => copyCode(code.code)} title="نسخ الكود">
                        {copySuccess === code.code ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    )}
                    {!code.revoked && !isExpired(code) && (
                      <button className="icon-btn" onClick={() => handleRevoke(code.id)} title="إلغاء الكود">
                        <Ban size={14} />
                      </button>
                    )}
                    <button className="icon-btn danger" onClick={() => handleDelete(code.id)} title="حذف">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
