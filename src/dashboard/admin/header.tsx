import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuthSession } from '../authStorage'

type AdminHeaderProps = {
  onToggleSidebar: () => void
  onLogout: () => void
}

export default function AdminHeader({ onToggleSidebar, onLogout }: AdminHeaderProps) {
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isPhone, setIsPhone] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 640 : false)
  const session = getAuthSession()

  const adminEmail = session?.email || 'admin@finverra.co'
  const initials = useMemo(() => adminEmail.slice(0, 2).toUpperCase(), [adminEmail])

  useEffect(() => {
    const handleResize = () => {
      setIsPhone(window.innerWidth <= 640)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

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
    <header style={{ ...styles.topbar, ...(isPhone ? styles.topbarPhone : {}) }}>
      <div style={{ ...styles.leftWrap, ...(isPhone ? styles.leftWrapPhone : {}) }}>
        <button type="button" style={styles.hamburger} onClick={onToggleSidebar} aria-label="Toggle menu">
          <svg width="18" height="18" fill="none" stroke="#023341" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div style={styles.titleWrap}>
          {!isPhone ? <span style={styles.kicker}>Finverra Admin</span> : null}
          <h1 style={{ ...styles.title, ...(isPhone ? styles.titlePhone : {}) }}>Platform Content Dashboard</h1>
        </div>
      </div>

      <div style={{ ...styles.profileWrap, ...(isPhone ? styles.profileWrapPhone : {}) }} ref={menuRef}>
        <button
          type="button"
          style={{ ...styles.avatarWrap, ...(isPhone ? styles.avatarWrapPhone : {}) }}
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Open admin menu"
        >
          <div style={styles.avatar}>{initials}</div>
          <div style={{ ...styles.avatarMeta, ...(isPhone ? styles.avatarMetaPhone : {}) }}>
            {!isPhone ? <span style={styles.avatarRole}>Administrator</span> : null}
            <strong style={styles.avatarName}>{adminEmail}</strong>
          </div>
          {!isPhone ? <span style={styles.menuChevron}>▾</span> : null}
        </button>

        {menuOpen ? (
          <div style={styles.dropdown} role="menu" aria-label="Admin account menu">
            <button
              type="button"
              style={styles.dropdownItem}
              onClick={() => {
                setMenuOpen(false)
                navigate('/dashboard/admin/change-password')
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
    border: '1px solid rgba(2, 51, 65, 0.1)',
    borderRadius: 24,
    boxShadow: '0 18px 40px rgba(2, 51, 65, 0.08)',
    zIndex: 50,
  },
  topbarPhone: {
    padding: '12px',
    gap: 10,
  },
  leftWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    minWidth: 0,
    flex: 1,
  },
  leftWrapPhone: {
    gap: 10,
  },
  titleWrap: {
    minWidth: 0,
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
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  titlePhone: {
    fontSize: 15,
  },
  profileWrap: {
    position: 'relative',
  },
  profileWrapPhone: {
    minWidth: 'auto',
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
    cursor: 'pointer',
    maxWidth: 220,
  },
  avatarWrapPhone: {
    padding: '6px',
    borderRadius: 14,
    maxWidth: 48,
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
    minWidth: 0,
  },
  avatarMetaPhone: {
    display: 'none',
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
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
    border: '1px solid rgba(2, 51, 65, 0.12)',
    background: '#ffffff',
    boxShadow: '0 18px 32px rgba(2,51,65,0.14)',
    overflow: 'hidden',
    zIndex: 100,
  },
  dropdownItem: {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid rgba(2, 51, 65, 0.08)',
    background: '#ffffff',
    color: '#023341',
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
