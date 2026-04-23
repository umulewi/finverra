import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clearAuthSession, getAuthSession } from '../authStorage'
import InvestorHeader from './header'
import InvestorSidebar from './sidebar'

type InvestorLayoutProps = {
  children: ReactNode
}

const navPathByLabel: Record<string, string> = {
  Dashboard: '/dashboard/investor',
  'Edit Profile': '/dashboard/investor/edit-profile',
  'Application Form': '/dashboard/investor/application-form',
  'My Application': '/dashboard/investor/application-form',
  'Application Status': '/dashboard/investor/application-status',
  'Service Fees': '/dashboard/investor/service-fees',
  
}

const labelByPath: Record<string, string> = Object.fromEntries(
  Object.entries(navPathByLabel).map(([label, path]) => [path, label]),
)

export const investorCardStyle: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))',
  borderRadius: 24,
  border: '1px solid rgba(15, 30, 53, 0.08)',
  boxShadow: '0 20px 40px rgba(15,45,92,0.08)',
  padding: 24,
}

export default function InvestorLayout({ children }: InvestorLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const session = getAuthSession()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewportWidth, setViewportWidth] = useState<number>(window.innerWidth)
  const [searchVal, setSearchVal] = useState('')
  const [activeNav, setActiveNav] = useState('Dashboard')

  useEffect(() => {
    setActiveNav(labelByPath[location.pathname] ?? 'Dashboard')
  }, [location.pathname])

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth)
      if (window.innerWidth <= 960) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNavigate = (label: string) => {
    setActiveNav(label)
    const targetPath = navPathByLabel[label]

    if (targetPath) {
      navigate(targetPath)
    }

    if (window.innerWidth <= 960) {
      setSidebarOpen(false)
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    navigate('/dashboard/investor/login', { replace: true })
  }

  return (
    <main style={styles.root}>
      <div
        style={{
          ...styles.sidebarWrapper,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <InvestorSidebar
          email={session?.email}
          activeNav={activeNav}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      </div>

      {sidebarOpen ? (
        <button
          type="button"
          style={styles.overlay}
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div
        style={{
          ...styles.main,
          marginLeft: sidebarOpen && viewportWidth > 960 ? '280px' : '0',
        }}
      >
        <InvestorHeader
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          searchVal={searchVal}
          onSearchChange={setSearchVal}
          onLogout={handleLogout}
        />

        <div
          style={{
            ...styles.body,
            padding: viewportWidth <= 640 ? 12 : viewportWidth <= 960 ? 16 : 24,
          }}
        >
          {children}
        </div>
      </div>
    </main>
  )
}

const styles: Record<string, CSSProperties> = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: 'radial-gradient(circle at top left, rgba(230,168,23,0.14), transparent 26%), linear-gradient(180deg, #f7f9fc 0%, #edf2f8 100%)',
    fontFamily: "'DM Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    color: '#0f1e35',
    position: 'relative',
  },
  sidebarWrapper: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    zIndex: 100,
    transition: 'transform 0.24s ease',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(9, 23, 44, 0.4)',
    zIndex: 99,
    border: 'none',
    cursor: 'default',
  },
  main: {
    flex: 1,
    transition: 'margin-left 0.2s ease',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  body: {
    padding: 24,
    width: '100%',
    maxWidth: 1280,
  },
}