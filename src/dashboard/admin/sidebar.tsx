import type { CSSProperties, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

type AdminSidebarProps = {
  onLogout: () => void
}

type MenuItem = {
  label: string
  path: string
  icon: ReactNode
}

const menuItems: MenuItem[] = [
  {
    label: 'Services',
    path: '/dashboard/admin/services',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="7" height="7" rx="1.5" />
        <rect x="15" y="3" width="7" height="7" rx="1.5" />
        <rect x="2" y="14" width="7" height="7" rx="1.5" />
        <rect x="15" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'Partners',
    path: '/dashboard/admin/partners',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6" />
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
      </svg>   
    ),
  },
  {
    label: 'Achievements',
    path: '/dashboard/admin/achievements',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6" />
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
      </svg>   
    ),
  },
  {
    label: 'Events',
    path: '/dashboard/admin/events',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Team',
    path: '/dashboard/admin/team',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
]

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

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
            const isActive = pathname === item.path || (item.path === '/dashboard/admin/services' && pathname === '/dashboard/admin')
            return (
              <button
                key={item.label}
                type="button"
                style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
                onClick={() => navigate(item.path)}
              >
                <span style={{ color: isActive ? '#E6A817' : 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
}
