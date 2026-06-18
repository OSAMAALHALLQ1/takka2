import React from 'react';
import { ROLE_COLORS, ROLE_LABELS, PERMISSIONS } from './constants';
import { ShieldCheck, Check, X } from 'lucide-react';

export default function PermissionsTab() {
  const roles = ['manager', 'waiter', 'cashier', 'kitchen', 'bar', 'shisha'];
  return (
    <div>
      <h2 className="tab-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldCheck size={24} style={{ color: 'var(--color-primary)' }} />
        جدول الصلاحيات
      </h2>
      <div className="admin-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table permissions-table">
            <thead>
              <tr>
                <th>الصلاحية</th>
                {roles.map(r => (
                  <th key={r}>
                    <span className="role-badge" style={{ background: `${ROLE_COLORS[r]}22`, color: ROLE_COLORS[r], border: `1px solid ${ROLE_COLORS[r]}44` }}>{ROLE_LABELS[r]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map(perm => (
                <tr key={perm.key}>
                  <td style={{ fontWeight: 600 }}>{perm.label}</td>
                  {roles.map(r => (
                    <td key={r} style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {perm[r] ? <Check size={16} style={{ color: '#16a34a' }} /> : <X size={16} style={{ color: '#dc2626' }} />}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
