import { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export default function NotificationsToast({ notifications, onClose }) {
  // Setup auto-close timers for each notification
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        onClose(notifications[notifications.length - 1].id);
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [notifications, onClose]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="status-empty" style={{ color: '#10b981' }} />;
      case 'warning':
        return <AlertTriangle size={20} className="status-ordering" style={{ color: '#f59e0b' }} />;
      case 'danger':
        return <XCircle size={20} className="status-bill-requested" style={{ color: '#f43f5e' }} />;
      default:
        return <Info size={20} className="status-eating" style={{ color: '#3b82f6' }} />;
    }
  };

  const getToastClass = (type) => {
    switch (type) {
      case 'success':
        return 'toast-success';
      case 'warning':
        return 'toast-warning';
      case 'danger':
        return 'toast-danger';
      default:
        return 'toast-info';
    }
  };

  return (
    <div className="toast-container">
      {notifications.map((n) => (
        <div key={n.id} className={`toast glass-card ${getToastClass(n.type)}`}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {getIcon(n.type)}
              <span className="toast-title">{n.title}</span>
            </div>
            <button
              onClick={() => onClose(n.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
          <span className="toast-msg">{n.message}</span>
          <span className="toast-time num-font">{n.time}</span>
        </div>
      ))}
    </div>
  );
}
