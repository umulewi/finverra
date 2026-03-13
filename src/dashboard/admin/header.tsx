import type { CSSProperties } from 'react'

type AdminHeaderProps = {
  onToggleSidebar: () => void
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  return (
    <header style={styles.topbar}>
      <div style={styles.leftWrap}>
        <button type="button" style={styles.hamburger} onClick={onToggleSidebar} aria-label="Toggle menu">
          <svg width="18" height="18" fill="none" stroke="#0f1e35" strokeWidth="2" viewBox="0 0 24 24">
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
    border: '1px solid rgba(15, 30, 53, 0.08)',
    borderRadius: 24,
    boxShadow: '0 18px 40px rgba(15, 45, 92, 0.08)',
    zIndex: 50,
  },
  leftWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  hamburger: {
    background: 'linear-gradient(135deg, #fff8e6, #ffffff)',
    border: '1px solid rgba(230, 168, 23, 0.22)',
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
    color: '#c8910e',
    fontWeight: 700,
  },
  title: {
    margin: '2px 0 0',
    fontSize: 18,
    color: '#0f1e35',
    fontWeight: 700,
  },
  avatarWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 8px 6px 6px',
    borderRadius: 18,
    background: '#ffffff',
    border: '1px solid rgba(15, 30, 53, 0.08)',
    boxShadow: '0 10px 24px rgba(15, 45, 92, 0.06)',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0f2d5c, #1a4080)',
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
    color: '#0f1e35',
  },
}
