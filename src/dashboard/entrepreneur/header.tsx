import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'

type EntrepreneurHeaderProps = {
  onToggleSidebar: () => void
  onLogout: () => void
}

export default function EntrepreneurHeader({ onToggleSidebar, onLogout }: EntrepreneurHeaderProps) {
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

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
          <span style={styles.kicker}>Finverra Entrepreneur</span>
          <h1 style={styles.title}>Venture Growth Dashboard</h1>
        </div>
      </div>

      <div style={styles.profileWrap} ref={menuRef}>
        <button
          type="button"
          style={styles.avatarWrap}
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Open entrepreneur menu"
        >
          <div style={styles.avatar}>EN</div>
          <div style={styles.avatarMeta}>
            <span style={styles.avatarRole}>Entrepreneur</span>
            <strong style={styles.avatarName}>Finverra</strong>
          </div>
          <span style={styles.menuChevron}>▾</span>
        </button>

        {menuOpen ? (
          <div style={styles.dropdown} role="menu" aria-label="Entrepreneur account menu">
            <button
              type="button"
              style={styles.dropdownItem}
              onClick={() => {
                setMenuOpen(false)
                navigate('/dashboard/entrepreneur/change-password')
              }}
            >
              Change Password
            </button>
            <button
              type="button"
              style={{ ...styles.dropdownItem, ...styles.dropdownItemDanger }}
              onClick={() => {
                setMenuOpen(false)
                onLogout()
              }}
            >
              Logout
            </button>
          </div>
        ) : null}
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
    color: '#023341',
    fontWeight: 700,
  },
  profileWrap: {
    position: 'relative',
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
    cursor: 'pointer',
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
  menuChevron: {
    fontSize: 12,
    color: '#66808b',
    marginLeft: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: 180,
    borderRadius: 12,
    border: '1px solid rgba(15, 30, 53, 0.12)',
    background: '#ffffff',
    boxShadow: '0 18px 32px rgba(15,45,92,0.14)',
    overflow: 'hidden',
    zIndex: 100,
  },
  dropdownItem: {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid rgba(15, 30, 53, 0.08)',
    background: '#ffffff',
    color: '#0f1e35',
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  dropdownItemDanger: {
    borderBottom: 'none',
    color: '#a61d24',
    background: 'rgba(220,38,38,0.05)',
  },
}
