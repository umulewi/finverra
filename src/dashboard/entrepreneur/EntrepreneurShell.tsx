import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuthSession } from '../authStorage'
import EntrepreneurHeader from './header'
import EntrepreneurSidebar from './sidebar'

type EntrepreneurShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  showHero?: boolean
}

export default function EntrepreneurShell({ title, subtitle, children, showHero = true }: EntrepreneurShellProps) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 960) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/dashboard/entrepreneur/login', { replace: true })
  }

  return (
    <main style={styles.root}>
      <div
        style={{
          ...styles.sidebarWrapper,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <EntrepreneurSidebar onLogout={handleLogout} />
      </div>

      {sidebarOpen && (
        <button type="button" style={styles.overlay} aria-label="Close menu" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        style={{
          ...styles.main,
          marginLeft: sidebarOpen ? '280px' : '0',
        }}
      >
        <EntrepreneurHeader onToggleSidebar={() => setSidebarOpen((open) => !open)} />

        {showHero ? (
          <section style={styles.heroBanner}>
            <div>
              <span style={styles.heroKicker}>Entrepreneur workspace</span>
              <h2 style={styles.pageTitle}>{title}</h2>
              <p style={styles.heroCopy}>{subtitle}</p>
            </div>
          </section>
        ) : null}

        <section style={styles.contentWrap}>{children}</section>
      </div>
    </main>
  )
}

const styles: Record<string, CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f3f6fb 0%, #eef3fa 100%)',
  },
  sidebarWrapper: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    transition: 'transform 0.25s ease',
    zIndex: 100,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.28)',
    border: 'none',
    zIndex: 80,
  },
  main: {
    minHeight: '100vh',
    padding: 24,
    transition: 'margin-left 0.25s ease',
  },
  heroBanner: {
    marginTop: 18,
    borderRadius: 24,
    padding: '30px 28px',
    background: 'linear-gradient(140deg, rgba(15,45,92,0.96), rgba(26,64,128,0.92))',
    color: '#ffffff',
    boxShadow: '0 24px 54px rgba(15, 45, 92, 0.2)',
  },
  heroKicker: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: 700,
    color: '#ffd166',
  },
  pageTitle: {
    margin: '8px 0 0',
    fontSize: 'clamp(1.25rem, 2.6vw, 1.9rem)',
    lineHeight: 1.2,
  },
  heroCopy: {
    margin: '10px 0 0',
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 1.65,
    maxWidth: 720,
  },
  contentWrap: {
    marginTop: 18,
  },
}
