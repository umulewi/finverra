import { useState } from 'react'
import { useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getAuthSession } from '../authStorage'
import { isSuperUserSession } from './superUser'

type AdminSidebarProps = {
  onLogout: () => void
}

type MenuItem = {
  label: string
  path: string
  icon: ReactNode
  groupKey: SidebarGroup['key']
}

type SidebarGroup = {
  key: 'entrepreneurs' | 'investors' | 'website' | 'administration'
  label: string
  items: MenuItem[]
}

const dashboardMenu: MenuItem[] = [
  {
    label: 'Dashboard Statistics',
    path: '/dashboard/admin/statistics',
    groupKey: 'entrepreneurs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H4" />
        <polyline points="22 12 18 16 22 20" />
      </svg>
    ),
  },
]

const entrepreneurMenu: MenuItem[] = [
  {
    label: 'Entrepreneurs',
    path: '/dashboard/admin/entrepreneurs',
    groupKey: 'entrepreneurs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Entreprenur Business info',
    path: '/dashboard/admin/entreprenur-business-info',
    groupKey: 'entrepreneurs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h18" />
        <path d="M5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 12h6" />
      </svg>
    ),
  },
  {
    label: 'Entrepreneur applications',
    path: '/dashboard/admin/entrepreneur-applications',
    groupKey: 'entrepreneurs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h6" />
      </svg>
    ),
  },
]

const investorMenu: MenuItem[] = [
  {
    label: 'Investors',
    path: '/dashboard/admin/investors',
    groupKey: 'investors',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1v22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: 'Investor applications',
    path: '/dashboard/admin/investor-applications',
    groupKey: 'investors',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    ),
  },
]

const websiteMenu: MenuItem[] = [
  {
    label: 'Services',
    path: '/dashboard/admin/services',
    groupKey: 'website',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.82-.33 1.7 1.7 0 0 0-1.02 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.02-1.55 1.7 1.7 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .33-1.82 1.7 1.7 0 0 0-1.55-1.02H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.02 1.7 1.7 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.82.33H9a1.7 1.7 0 0 0 1.02-1.55V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.04 4h.04a1.7 1.7 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.33 1.82V8a1.7 1.7 0 0 0 1.55 1.02H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z" />
      </svg>
    ),
  },
  {
    label: 'Partners',
    path: '/dashboard/admin/partners',
    groupKey: 'website',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 1 7.54 0l2.46 2.46a2 2 0 1 1-2.83 2.83L14.7 15.8" />
        <path d="M14 11a5 5 0 0 0-7.54 0L4 13.46a2 2 0 1 0 2.83 2.83L9.3 13.8" />
      </svg>
    ),
  },
  {
    label: 'Events',
    path: '/dashboard/admin/events',
    groupKey: 'website',
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
    groupKey: 'website',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Testimonials',
    path: '/dashboard/admin/testimonials',
    groupKey: 'website',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        <path d="M8 10h8" />
        <path d="M8 14h5" />
      </svg>
    ),
  },
]

const administrationMenu: MenuItem[] = [
  {
    label: 'Admin Users',
    path: '/dashboard/admin/users',
    groupKey: 'administration',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="17" y1="11" x2="23" y2="11" />
      </svg>
    ),
  },
]

const sidebarGroups: SidebarGroup[] = [
  { key: 'entrepreneurs', label: 'Entrepreneurs', items: entrepreneurMenu },
  { key: 'investors', label: 'Investors', items: investorMenu },
  { key: 'website', label: 'Website Pages', items: websiteMenu },
  { key: 'administration', label: 'Administration', items: administrationMenu },
]

const sidebarOpenGroupsStorageKey = 'finverra-admin-sidebar-open-groups'

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const session = getAuthSession()
  const isSuperUser = isSuperUserSession(session)
  const [openGroups, setOpenGroups] = useState<Record<SidebarGroup['key'], boolean>>({
    entrepreneurs: false,
    investors: false,
    website: false,
    administration: false,
  })

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(sidebarOpenGroupsStorageKey)
      if (!storedValue) return

      const parsed = JSON.parse(storedValue) as Partial<Record<SidebarGroup['key'], boolean>>
      setOpenGroups({
        entrepreneurs: Boolean(parsed.entrepreneurs),
        investors: Boolean(parsed.investors),
        website: Boolean(parsed.website),
        administration: Boolean(parsed.administration),
      })
    } catch {
      // Ignore invalid persisted state and keep the default closed state.
    }
  }, [])

  function persistOpenGroups(nextState: Record<SidebarGroup['key'], boolean>) {
    setOpenGroups(nextState)

    try {
      window.localStorage.setItem(sidebarOpenGroupsStorageKey, JSON.stringify(nextState))
    } catch {
      // Ignore storage write failures.
    }
  }

  function toggleGroup(key: SidebarGroup['key']) {
    const nextState = {
      entrepreneurs: key === 'entrepreneurs' ? !openGroups.entrepreneurs : false,
      investors: key === 'investors' ? !openGroups.investors : false,
      website: key === 'website' ? !openGroups.website : false,
      administration: key === 'administration' ? !openGroups.administration : false,
    }

    persistOpenGroups(nextState)
  }

  function openGroupAndNavigate(groupKey: SidebarGroup['key'], path: string) {
    persistOpenGroups({
      entrepreneurs: groupKey === 'entrepreneurs',
      investors: groupKey === 'investors',
      website: groupKey === 'website',
      administration: groupKey === 'administration',
    })
    navigate(path)
  }

  const visibleGroups = sidebarGroups
    .map((group) => {
      if (group.key !== 'administration') {
        return group
      }

      return {
        ...group,
        items: isSuperUser ? group.items : [],
      }
    })
    .filter((group) => group.items.length > 0)

  function isGroupActive(group: SidebarGroup) {
    return group.items.some((item) => pathname === item.path || (item.path === '/dashboard/admin/services' && pathname === '/dashboard/admin'))
  }

  return (
    <aside style={styles.sidebar}>
      <div style={styles.sidebarBrand}>
        <button
          type="button"
          style={styles.brandButton}
          onClick={() => navigate('/dashboard/admin/statistics')}
          aria-label="Go to dashboard statistics"
        >
          <div style={styles.brandLogo}>
            <img src="/logo-finverra-white.png" alt="Finverra" style={styles.brandImage} />
          </div>
        </button>
      </div>

      <nav style={styles.navScroll}>
        <div style={styles.navSection}>
          <span style={styles.navSectionTitle}>Quick Access</span>
          {dashboardMenu.map((item) => {
            const isActive = pathname === item.path

            return (
              <button
                key={item.label}
                type="button"
                style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}), marginBottom: 8 }}
                onClick={() => navigate(item.path)}
              >
                <span style={{ color: isActive ? '#ffec00' : 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.76)', fontWeight: isActive ? 700 : 500 }}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        <div style={styles.navSection}>
          <span style={styles.navSectionTitle}>Menu</span>
          {visibleGroups.map((group) => {
            const groupActive = isGroupActive(group)
            const groupOpen = openGroups[group.key]

            return (
              <div key={group.key} style={styles.groupBlock}>
                <button
                  type="button"
                  style={{ ...styles.groupHeader, ...(groupActive ? styles.groupHeaderActive : {}) }}
                  onClick={() => toggleGroup(group.key)}
                >
                  <span style={styles.groupHeaderLeft}>
                    <span style={{ ...styles.chevron, ...(groupOpen ? styles.chevronOpen : {}) }}>▾</span>
                    <span style={{ color: groupActive ? '#ffffff' : 'rgba(255,255,255,0.78)', fontWeight: 700 }}>
                      {group.label}
                    </span>
                  </span>
                </button>

                {groupOpen ? (
                  <div style={styles.groupItems}>
                    {group.items.map((item) => {
                      const isActive = pathname === item.path || (item.path === '/dashboard/admin/services' && pathname === '/dashboard/admin')

                      return (
                        <button
                          key={item.label}
                          type="button"
                          style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
                          onClick={() => openGroupAndNavigate(item.groupKey, item.path)}
                        >
                          <span style={{ color: isActive ? '#ffec00' : 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            {item.icon}
                          </span>
                          <span style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.76)', fontWeight: isActive ? 700 : 500 }}>
                            {item.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
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
    background: 'linear-gradient(180deg, #023341 0%, #03475a 52%, #023341 100%)',
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
  brandButton: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    padding: 0,
    textAlign: 'center',
    cursor: 'pointer',
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
  groupBlock: {
    marginBottom: 10,
  },
  groupHeader: {
    width: '100%',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#ffffff',
    borderRadius: 14,
    padding: '12px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    marginBottom: 8,
  },
  groupHeaderActive: {
    background: 'linear-gradient(135deg, rgba(255, 236, 0, 0.25), rgba(255, 236, 0, 0.12))',
    border: '1px solid rgba(255, 236, 0, 0.35)',
  },
  groupHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  chevron: {
    display: 'inline-block',
    transform: 'rotate(-90deg)',
    transition: 'transform 0.15s ease',
    fontSize: 12,
    opacity: 0.9,
  },
  chevronOpen: {
    transform: 'rotate(0deg)',
  },
  groupItems: {
    display: 'grid',
    gap: 8,
    paddingLeft: 10,
  },
  navItemActive: {
    background: 'linear-gradient(135deg, rgba(255, 236, 0, 0.25), rgba(255, 236, 0, 0.12))',
    border: '1px solid rgba(255, 236, 0, 0.35)',
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
