import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import '../investor/Investorauth.css'
import { saveAuthSession } from '../authStorage'
import { fetchAvailableRoles, loginWithRole } from '../dashboardApi'
import type { RoleOption } from '../roles'
import { getRoleDefinition } from '../roles'

export default function AdminAuth() {
  const navigate = useNavigate()
  const roleDefinition = getRoleDefinition('admin')
  const basePath = '/dashboard/admin'
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [isLoadingRole, setIsLoadingRole] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    let isMounted = true
    const loadRoles = async () => {
      try {
        const nextRoles = await fetchAvailableRoles()
        if (!isMounted) return
        setRoles(nextRoles)
        setErrorMessage('')
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(error instanceof Error ? error.message : 'Unable to verify admin role access.')
      } finally {
        if (isMounted) setIsLoadingRole(false)
      }
    }
    void loadRoles()
    return () => { isMounted = false }
  }, [])

  const currentRole = useMemo(
    () => roles.find((item) => item.slug === 'admin'),
    [roles],
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (!currentRole) {
      setErrorMessage('Admin role is not currently available from the server.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await loginWithRole({
        email,
        password,
        role: currentRole,
      })

      saveAuthSession({
        roleId: currentRole.id,
        roleName: currentRole.name,
        roleSlug: currentRole.slug,
        email,
        loginAt: new Date().toISOString(),
        payload,
      })

      navigate(basePath, { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Admin login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoadingRole && !errorMessage && !currentRole) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="fv-auth-root">
      {/* Left panel */}
      <aside className="fv-aside">
        <div className="fv-aside-inner">
          <Link to="/dashboard" className="fv-logo">
            <img src="/logo-finverra-white.png" alt="Finverra" className="fv-logo-image" />
          </Link>

          <div className="fv-aside-content">
            <p className="fv-aside-eyebrow">Admin Portal</p>
            <h1 className="fv-aside-headline">
              Manage platform<br />with control.
            </h1>
            <p className="fv-aside-desc">{roleDefinition.loginDescription}</p>

            <div className="fv-aside-features">
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>Platform governance</span>
              </div>
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>Security controls</span>
              </div>
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>Operational oversight</span>
              </div>
            </div>
          </div>

          <div className="fv-aside-footer">
            <Link to="/dashboard" className="fv-role-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Change role
            </Link>
          </div>
        </div>
      </aside>

      {/* Right panel */}
      <section className="fv-main">
        <div className="fv-main-inner">
          <div className="fv-form-header">
            <h2 className="fv-form-title">Administrator sign in</h2>
            <p className="fv-form-subtitle">
              Use your admin credentials to manage platform-wide operations.
            </p>
          </div>

          {isLoadingRole && (
            <div className="fv-status fv-status--loading">
              <span className="fv-spinner" />
              Checking role access...
            </div>
          )}
          {!isLoadingRole && errorMessage && (
            <div className="fv-status fv-status--error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errorMessage}
            </div>
          )}

          <form className="fv-form" onSubmit={handleSubmit} noValidate>
            <div className="fv-field">
              <label className="fv-label" htmlFor="email">Email address</label>
              <input
                id="email"
                className="fv-input"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoadingRole || isSubmitting}
              />
            </div>

            <div className="fv-field">
              <label className="fv-label" htmlFor="password">Password</label>
              <div className="fv-input-wrap">
                <input
                  id="password"
                  className="fv-input fv-input--icon-right"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoadingRole || isSubmitting}
                />
                <button
                  type="button"
                  className="fv-eye-btn"
                  onClick={() => setShowPassword((c) => !c)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  disabled={isLoadingRole || isSubmitting}
                  tabIndex={-1}
                >
                  <EyeIcon open={!showPassword} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="fv-btn-primary"
              disabled={isLoadingRole || isSubmitting || (!currentRole && !errorMessage)}
            >
              {isSubmitting ? (
                <><span className="fv-spinner fv-spinner--light" /> Please wait…</>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="fv-form-footer">
            <Link to="/" className="fv-text-link fv-text-link--muted">Back to home</Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
          <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a18.15 18.15 0 0 1-4.23 5.48" />
          <path d="M6.11 6.11A16.53 16.53 0 0 0 2 12s3 7 10 7a10.62 10.62 0 0 0 4.14-.83" />
        </>
      )}
    </svg>
  )
}
