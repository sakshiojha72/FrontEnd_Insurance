// StatusBadge.jsx
export default function StatusBadge({ status, daysUntilExpiry }) {
  const s = status?.toUpperCase()
  const styles = {
    ACTIVE:   { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' },
    INACTIVE: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' },
    EXPIRED:  { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' },
  }
  const style = styles[s] || styles.INACTIVE

  return (
    <span style={{
      ...style, display: 'inline-block', padding: '2px 10px',
      borderRadius: '999px', fontSize: '12px', fontWeight: 600,
    }}>
      {status}
      {daysUntilExpiry != null && s === 'ACTIVE' && daysUntilExpiry <= 30 &&
        ` · ${daysUntilExpiry}d left`}
    </span>
  )
}