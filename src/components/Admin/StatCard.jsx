export default function StatCard({ icon, label, value, color }) {
  return (
    <div className="admin-card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color, fontFamily: 'Outfit, sans-serif' }}>{value}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
    </div>
  );
}
