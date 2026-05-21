import type { CSSProperties, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type EntrepreneurSidebarProps = {
  onLogout: () => void
}

type MenuItem = {
  label: string
  path: string
  icon: ReactNode
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard/entrepreneur',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13h4v8H3zM10 7h4v14h-4zM17 3h4v18h-4z" /></svg>,
  },
  {
    label: 'My Profile',
    path: '/dashboard/entrepreneur/profile',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  },
  {
    label: 'Business Info',
    path: '/dashboard/entrepreneur/BusinessInfo',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="7" width="20" height="13" rx="2" ry="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
  },
  {
    label: 'Application Form',
    path: '/dashboard/entrepreneur/ApplicationInfo',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h8" /></svg>,
  },
  {
    label: 'Application Status',
    path: '/dashboard/entrepreneur/application-status',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 11l2 2 4-4" /><path d="M16 4h-1.5a2 2 0 0 0-3.9 0H9a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" /></svg>,
  },
  {
    label: 'Book Appointment',
    path: '/dashboard/entrepreneur/book-appointment',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="17" rx="2" ry="2" /><path d="M16 2v4M8 2v4" /><path d="M3 10h18" /></svg>,
  },
  // Service Fees menu
  {
    label: 'Service Fees',
    path: '/dashboard/entrepreneur/service-fees',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="5" width="20" height="14" rx="2" ry="2" /><path d="M2 10h20" /></svg>,
  },
  // Payment menu LAST
  {
    label: 'Payment',
    path: '/dashboard/entrepreneur/payments',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="7" width="20" height="13" rx="2" ry="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
  },
]

export default function EntrepreneurSidebar({ onLogout }: EntrepreneurSidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <aside style={styles.sidebar}>
      <div style={styles.sidebarBrand}>
        <div style={styles.brandLogo}>
          <img src="/logo-finverra-white.png" alt="Finverra" style={styles.brandImage} />
        </div>
      </div>

      <nav style={styles.navScroll}>
        <div style={styles.navSection}>
          <span style={styles.navSectionTitle}>Menu</span>
          {menuItems.map((item) => {
            const isActive = pathname === item.path
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
    background: 'linear-gradient(180deg, #023341 0%, #023341 52%, #023341 100%)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '28px 0 60px rgba(15, 30, 53, 0.18)',
  },
  sidebarBrand: {
    padding: '12px 12px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  brandLogo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 64,
  },
  brandImage: {
    width: '92%',
    maxWidth: 240,
    height: 'auto',
    maxHeight: 72,
    objectFit: 'contain',
    flexShrink: 0,
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
