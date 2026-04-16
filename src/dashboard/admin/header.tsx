import type { CSSProperties } from 'react'

type AdminHeaderProps = {
  onToggleSidebar: () => void
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  return (
    <header style={styles.topbar}>
      <div style={styles.leftWrap}>
        <button type="button" style={styles.hamburger} onClick={onToggleSidebar} aria-label="Toggle menu">
          <svg width="18" height="18" fill="none" stroke="#023341" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div>
          <span style={styles.kicker}>Finverra Admin</span>
          <h1 style={styles.title}>Platform Content Dashboard</h1>
        </div>
      </div>

      <div style={styles.avatarWrap}>
        <div style={styles.avatar}>AD</div>
        <div style={styles.avatarMeta}>
          <span style={styles.avatarRole}>Administrator</span>
          <strong style={styles.avatarName}>Finverra</strong>
        </div>
      </div>
    </header>
  )
}

const styles: Record<string, CSSProperties> = {
  topbar: {
    position: 'sticky',
    top: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    background: 'rgba(255,255,255,0.78)',
    backdropFilter: 'blur(18px)',
    border: '1px solid rgba(2, 51, 65, 0.1)',
    borderRadius: 24,
    boxShadow: '0 18px 40px rgba(2, 51, 65, 0.08)',
    zIndex: 50,
  },
  leftWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  hamburger: {
    background: 'linear-gradient(135deg, #fffde6, #ffffff)',
    border: '1px solid rgba(255, 236, 0, 0.35)',
    cursor: 'pointer',
    padding: 10,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
  },
  kicker: {
    display: 'block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: '#d8c500',
    fontWeight: 700,
  },
  title: {
    margin: '2px 0 0',
    fontSize: 18,
    color: '#023341',
    fontWeight: 700,
  },
  avatarWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 8px 6px 6px',
    borderRadius: 18,
    background: '#ffffff',
    border: '1px solid rgba(2, 51, 65, 0.1)',
    boxShadow: '0 10px 24px rgba(2, 51, 65, 0.06)',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #023341, #03475a)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 600,
  },
  avatarMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  avatarRole: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#8a96a8',
    fontWeight: 700,
  },
  avatarName: {
    fontSize: 13,
    color: '#023341',
  },
}
