import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Copy, Hash, KeyRound, LogOut, Plus, Trash2 } from 'lucide-react';
import { createCode, revokeCode, deleteCode, getCodes, changeManagerPassword, logout } from '../utils/auth-store';

const ROLE_LABELS = {
  waiter: 'Waiter',
  cashier: 'Cashier',
  kitchen: 'Kitchen',
  bar: 'Bar',
  shisha: 'Shisha',
};

const DEPT_LABELS = {
  kitchen: 'Kitchen',
  bar: 'Bar',
  shisha: 'Shisha',
};

const ALL_ROLES = ['waiter', 'cashier', 'kitchen', 'bar', 'shisha'];

export default function ManagerCodes({ onLogout }) {
  const [codes, setCodes] = useState(getCodes);
  const [showCreate, setShowCreate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [label, setLabel] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(['waiter']);
  const [allDepts, setAllDepts] = useState(true);
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [generated, setGenerated] = useState(null);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const labelRef = useRef(null);
  const createdRef = useRef(null);

  useEffect(() => {
    const handler = () => setCodes(getCodes());
    window.addEventListener('takka:codes-update', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('takka:codes-update', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  useEffect(() => {
    if (showCreate) labelRef.current?.focus();
  }, [showCreate]);

  function toggleRole(r) {
    setSelectedRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  }

  function handleCreate() {
    const departments = allDepts ? null : selectedDepts;
    const roles = selectedRoles.length ? selectedRoles : ['waiter'];
    const code = createCode({
      label: label.trim() || 'Employee',
      allowedRoles: roles,
      departments,
    });
    setGenerated(code);
    setCodes(getCodes());
    setLabel('');
    setSelectedRoles(['waiter']);
    setSelectedDepts([]);
    setAllDepts(true);
    requestAnimationFrame(() =>
      createdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    );
  }

  function handleCopy(codeStr, id) {
    navigator.clipboard.writeText(codeStr).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (pwBusy) return;
    setPwError('');
    if (newPw.length < 4) {
      setPwError('New password must be at least 4 characters');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('Passwords do not match');
      return;
    }
    setPwBusy(true);
    try {
      const ok = await changeManagerPassword(oldPw, newPw);
      if (!ok) {
        setPwError('Old password is incorrect');
        return;
      }
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
      setShowPassword(false);
      alert('Password changed successfully');
    } finally {
      setPwBusy(false);
    }
  }

  function handleLogout() {
    logout();
    onLogout?.();
  }

  const activeCodes = codes.filter((c) => !c.revoked);
  const revokedCodes = codes.filter((c) => c.revoked);

  return (
    <div className="manager-codes-shell">
      <div className="manager-codes-header">
        <div>
          <h2 className="section-title">Code Management</h2>
          <p className="section-description">Create and manage employee login codes</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={() => setShowCreate(!showCreate)}
        style={{ width: '100%', marginBottom: '24px', padding: '14px' }}
      >
        <Plus size={18} /> {showCreate ? 'Cancel' : 'Create New Code'}
      </button>

      {showCreate && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div className="form-group">
            <label>Name (optional)</label>
            <input
              ref={labelRef}
              type="text"
              className="form-input"
              placeholder="Example: Waiter Ahmed"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Available Roles</label>
            <div className="role-chips">
              {ALL_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`role-chip ${selectedRoles.includes(r) ? 'active' : ''}`}
                  onClick={() => toggleRole(r)}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
            {selectedRoles.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                The "Waiter" role will be used as default.
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Departments</label>
            <label className="dept-checkbox">
              <input
                type="checkbox"
                checked={allDepts}
                onChange={() => setAllDepts(!allDepts)}
              />
              All Departments
            </label>
            {!allDepts && (
              <div className="role-chips">
                {['kitchen', 'bar', 'shisha'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`role-chip ${selectedDepts.includes(d) ? 'active' : ''}`}
                    onClick={() =>
                      setSelectedDepts((prev) =>
                        prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
                      )
                    }
                  >
                    {DEPT_LABELS[d]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary" onClick={handleCreate} style={{ width: '100%' }}>
            <KeyRound size={18} /> Create Code
          </button>

          {generated && (
            <div ref={createdRef} className="code-generated-box">
              <div className="code-generated-success">
                <Check size={16} /> Code created successfully
              </div>
              <div className="code-generated-value">
                <code>{generated.code}</code>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => handleCopy(generated.code, 'new')}
                  title="Copy"
                >
                  {copiedId === 'new' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <div className="code-generated-meta">
                Employee: {generated.label} | Roles: {generated.allowedRoles.map((r) => ROLE_LABELS[r]).join(', ')} | Departments: {generated.departments ? generated.departments.map((d) => DEPT_LABELS[d]).join(', ') : 'All Departments'}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="codes-section">
        <h3 style={{ marginBottom: '16px' }}>
          Active Codes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({activeCodes.length})</span>
        </h3>
        {activeCodes.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No codes have been created yet.
          </div>
        ) : (
          <div className="codes-grid">
            {activeCodes.map((code) => (
              <div key={code.id} className="code-card glass-card">
                <div className="code-card-header">
                  <span className="code-card-label">{code.label}</span>
                  <span className="badge badge-empty">Active</span>
                </div>
                <code className="code-card-value">{code.code}</code>
                <div className="code-card-info">
                  Roles: {code.allowedRoles.map((r) => ROLE_LABELS[r]).join(', ')} | Departments: {code.departments ? code.departments.map((d) => DEPT_LABELS[d]).join(', ') : 'All'}
                </div>
                <div className="code-card-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => handleCopy(code.code, code.id)}
                  >
                    {copiedId === code.id ? <Check size={14} /> : <Copy size={14} />} Copy
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    onClick={() => { revokeCode(code.id); setCodes(getCodes()); }}
                  >
                    <AlertCircle size={14} /> Revoke
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => { deleteCode(code.id); setCodes(getCodes()); }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {revokedCodes.length > 0 && (
        <div className="codes-section" style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
            Revoked Codes <span style={{ fontWeight: 400 }}>({revokedCodes.length})</span>
          </h3>
          <div className="codes-grid">
            {revokedCodes.map((code) => (
              <div key={code.id} className="code-card glass-card" style={{ opacity: 0.5 }}>
                <div className="code-card-header">
                  <span className="code-card-label">{code.label}</span>
                  <span className="badge badge-bill-requested">Revoked</span>
                </div>
                <code className="code-card-value">{code.code}</code>
                <div className="code-card-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => { deleteCode(code.id); setCodes(getCodes()); }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: '20px', marginTop: '32px' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setShowPassword(!showPassword)}
          style={{ width: '100%' }}
        >
          <Hash size={18} /> {showPassword ? 'Cancel' : 'Change Manager Password'}
        </button>
        {showPassword && (
          <form onSubmit={handleChangePassword} style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                className="form-input"
                value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                className="form-input"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
              />
            </div>
            {pwError && <div className="login-error">{pwError}</div>}
            <button type="submit" disabled={pwBusy} className="btn btn-primary" style={{ width: '100%' }}>
              {pwBusy ? 'Saving…' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
