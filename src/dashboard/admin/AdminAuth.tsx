import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import '../Dashboard.css'
import { saveAuthSession } from '../authStorage'
import { fetchAvailableRoles, loginWithRole } from '../dashboardApi'
import type { RoleOption } from '../roles'
import { getRoleDefinition } from '../roles'

type AdminAuthProps = {
  mode: 'login' | 'signup'
}

export default function AdminAuth({ mode }: AdminAuthProps) {
  const navigate = useNavigate()
  const roleDefinition = getRoleDefinition('admin')
  const basePath = '/dashboard/admin'
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [isLoadingRole, setIsLoadingRole] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadRoles = async () => {
      try {
        const nextRoles = await fetchAvailableRoles()

        if (!isMounted) {
          return
        }

        setRoles(nextRoles)
        setErrorMessage('')
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(error instanceof Error ? error.message : 'Unable to verify admin role access.')
      } finally {
        if (isMounted) {
          setIsLoadingRole(false)
        }
      }
    }

    void loadRoles()

    return () => {
      isMounted = false
    }
  }, [])

  const currentRole = useMemo(
    () => roles.find((item) => item.slug === 'admin'),
    [roles],
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!currentRole) {
      setErrorMessage('Admin role is not currently available from the server.')
      return
    }

    if (mode === 'signup') {
      setSuccessMessage('Admin signup form is ready. Connect your admin registration endpoint to activate account creation.')
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
    <main className="dashboard-page">
      <div className="account-layout auth-layout">
        <aside className="account-aside">
          <p className="aside-brand">FINVERRA</p>
          <h1>{roleDefinition.name} Portal</h1>
          <p>{roleDefinition.loginDescription}</p>
          <div className="aside-points">
            <span>Platform governance</span>
            <span>Security controls</span>
            <span>Operational oversight</span>
          </div>
          <Link to="/dashboard" className="aside-link">Change Role</Link>
        </aside>

        <section className="account-main auth-main">
          <p className="dashboard-eyebrow">Admin Account</p>
          <h2 className="account-title">{mode === 'login' ? 'Administrator sign in' : 'Create admin access'}</h2>
          <p className="dashboard-subtitle">
            {mode === 'login'
              ? 'Use your admin credentials to manage platform-wide operations.'
              : 'Set up an admin account with governance-specific details.'}
          </p>

          {isLoadingRole ? <div className="dashboard-status-card">Checking role access...</div> : null}
          {!isLoadingRole && errorMessage ? <div className="dashboard-status-card error">{errorMessage}</div> : null}
          {successMessage ? <div className="dashboard-status-card success">{successMessage}</div> : null}

          <div className="auth-mode-toggle" role="tablist" aria-label="Auth mode">
            <Link to={`${basePath}/login`} className={mode === 'login' ? 'active' : ''} aria-current={mode === 'login' ? 'page' : undefined}>
              Login
            </Link>
            <Link to={`${basePath}/signup`} className={mode === 'signup' ? 'active' : ''} aria-current={mode === 'signup' ? 'page' : undefined}>
              Sign Up
            </Link>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="auth-row">
                  <input type="text" placeholder="First Name" required />
                  <input type="text" placeholder="Last Name" required />
                </div>
                <input type="text" placeholder="Admin ID" required />
                <select required defaultValue="">
                  <option value="" disabled>Select admin scope</option>
                  <option>User Management</option>
                  <option>Content Operations</option>
                  <option>Compliance Review</option>
                  <option>System Monitoring</option>
                </select>
              </>
            )}

            <input
              type="email"
              placeholder="Work Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isLoadingRole || isSubmitting}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isLoadingRole || isSubmitting}
            />

            <button type="submit" className="auth-submit-btn" disabled={isLoadingRole || isSubmitting || (!currentRole && !errorMessage)}>
              {isSubmitting
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Login as Admin'
                  : 'Create Admin Account'}
            </button>
          </form>

          <div className="auth-links-row">
            <Link to="/">Back to Home</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
