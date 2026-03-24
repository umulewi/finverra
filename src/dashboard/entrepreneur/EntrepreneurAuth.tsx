import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import '../Dashboard.css'
import { saveAuthSession } from '../authStorage'
import { fetchAvailableRoles, loginWithRole, signupEntrepreneur } from '../dashboardApi'
import type { RoleOption } from '../roles'
import { getRoleDefinition } from '../roles'

type EntrepreneurAuthProps = {
  mode: 'login' | 'signup'
}

export default function EntrepreneurAuth({ mode }: EntrepreneurAuthProps) {
  const navigate = useNavigate()
  const roleDefinition = getRoleDefinition('entrepreneur')
  const basePath = '/dashboard/entrepreneur'
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [isLoadingRole, setIsLoadingRole] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [telephone, setTelephone] = useState('')

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

        setErrorMessage(error instanceof Error ? error.message : 'Unable to verify entrepreneur role access.')
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
    () => roles.find((item) => item.slug === 'entrepreneur'),
    [roles],
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!currentRole) {
      setErrorMessage('Entrepreneur role is not currently available from the server.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        const payload = await signupEntrepreneur({
          email,
          password,
          role: currentRole,
          firstName,
          lastName,
          telephone,
        })

        setSuccessMessage(
          payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
            ? payload.message
            : 'Signup successful. Please verify your account before login.',
        )
        setPassword('')
        return
      }

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
      setErrorMessage(error instanceof Error ? error.message : 'Entrepreneur login failed.')
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
            <span>Startup profile</span>
            <span>Fundraising goals</span>
            <span>Investor matching</span>
          </div>
          <Link to="/dashboard" className="aside-link">Change Role</Link>
        </aside>

        <section className="account-main auth-main">
          <p className="dashboard-eyebrow">Entrepreneur Account</p>
          <h2 className="account-title">{mode === 'login' ? 'Welcome back founder' : 'Create entrepreneur account'}</h2>
          <p className="dashboard-subtitle">
            {mode === 'login'
              ? 'Sign in to manage your venture profile and fundraising pipeline.'
              : 'Set up your startup identity and funding focus in one place.'}
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
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  disabled={isLoadingRole || isSubmitting}
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  disabled={isLoadingRole || isSubmitting}
                />
                <input
                  type="tel"
                  placeholder="Telephone"
                  value={telephone}
                  onChange={(event) => setTelephone(event.target.value)}
                  required
                  disabled={isLoadingRole || isSubmitting}
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email Address"
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
                  ? 'Login as Entrepreneur'
                  : 'Create Entrepreneur Account'}
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
