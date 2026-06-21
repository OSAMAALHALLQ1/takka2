import { useState, useEffect } from 'react';
import { isRealtimeConnected } from '../../utils/storage';

export const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(() => {
    try {
      return isRealtimeConnected();
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const handleStatus = (e) => {
      if (e?.detail && typeof e.detail.connected === 'boolean') {
        setIsConnected(e.detail.connected);
      }
    };
    window.addEventListener('taka_connection_status', handleStatus);
    return () => window.removeEventListener('taka_connection_status', handleStatus);
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      color: isConnected ? '#3B6D11' : '#A32D2D',
      padding: '4px 10px',
      background: isConnected ? '#EAF3DE' : '#FCEBEB',
      borderRadius: 20,
      width: 'fit-content',
      fontWeight: 600,
      border: `1px solid ${isConnected ? '#c9e2b3' : '#f5c6cb'}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease'
    }}>
      <span style={{
        width: 8, height: 8,
        borderRadius: '50%',
        background: isConnected ? '#639922' : '#E24B4A',
        display: 'inline-block'
      }} />
      {isConnected ? 'متصل' : 'جاري إعادة الاتصال...'}
    </div>
  );
};

export default ConnectionStatus;
