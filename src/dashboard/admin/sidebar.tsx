import type { CSSProperties } from 'react'

type AdminSidebarProps = {
  activeNav: string
  onNavigate: (label: string) => void
  onLogout: () => void
}

type MenuItem = {
  label: string
}

const menuItems: MenuItem[] = [
  { label: 'Services' },
  { label: 'Achievements' },
  { label: 'Events' },
  { label: 'Team' },

]

export default function AdminSidebar({ activeNav, onNavigate, onLogout }: AdminSidebarProps) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.sidebarBrand}>
        <div style={styles.brandLogo}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L26 8v12L14 26 2 20V8z" fill="#E6A817" opacity="0.15" stroke="#E6A817" strokeWidth="1.5" />
            <path d="M14 7l8 4.5V17L14 21.5 6 17v-5.5z" fill="#E6A817" opacity="0.4" />
            <path d="M14 12l4 2.5V17L14 19.5 10 17v-2.5z" fill="#0EA5A0" />
          </svg>
          <div>
            <span style={styles.brandName}>Finverra</span>
            <span style={styles.brandTag}>Admin Navigation</span>
          </div>
        </div>
      </div>

      <nav style={styles.navScroll}>
        <div style={styles.navSection}>
          <span style={styles.navSectionTitle}>Menu</span>
          {menuItems.map((item) => {
            const isActive = activeNav === item.label
            return (
              <button
                key={item.label}
                type="button"
                style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
                onClick={() => onNavigate(item.label)}
              >
                <span style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.76)', fontWeight: isActive ? 700 : 500 }}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      <div style={styles.sidebarFooter}>
        <button type="button" style={styles.logoutBtn} onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  )
}

const styles: Record<string, CSSProperties> = {
  sidebar: {
    width: 280,
    height: '100%',
    background: 'linear-gradient(180deg, #0d2345 0%, #11315f 52%, #0b2444 100%)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '28px 0 60px rgba(15, 30, 53, 0.18)',
  },
  sidebarBrand: {
    padding: '22px 20px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  brandLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandTag: {
    display: 'block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.56)',
    marginTop: 4,
  },
  navScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 0 10px',
  },
  navSection: {
    marginBottom: 10,
    padding: '0 12px',
  },
  navSectionTitle: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.42)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    padding: '10px 8px 6px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '12px 12px',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 14,
    cursor: 'pointer',
    fontSize: 14,
    textAlign: 'left',
    transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
  },
  navItemActive: {
    background: 'linear-gradient(135deg, rgba(230, 168, 23, 0.22), rgba(14, 165, 160, 0.18))',
    border: '1px solid rgba(255, 209, 102, 0.18)',
    transform: 'translateX(2px)',
  },
  sidebarFooter: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    padding: '14px 14px 16px',
  },
  logoutBtn: {
    width: '100%',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    fontWeight: 700,
    borderRadius: 12,
    padding: '11px 14px',
    cursor: 'pointer',
  },
}
