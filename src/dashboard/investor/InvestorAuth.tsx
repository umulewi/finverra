import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import '../Dashboard.css'
import { saveAuthSession } from '../authStorage'
import { fetchAvailableRoles, loginWithRole, signupInvestor } from '../dashboardApi'
import type { RoleOption } from '../roles'
import { getRoleDefinition } from '../roles'

type InvestorAuthProps = {
  mode: 'login' | 'signup'
}

export default function InvestorAuth({ mode }: InvestorAuthProps) {
  const navigate = useNavigate()
  const roleDefinition = getRoleDefinition('investor')
  const basePath = '/dashboard/investor'
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [isLoadingRole, setIsLoadingRole] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

        setErrorMessage(error instanceof Error ? error.message : 'Unable to verify investor role access.')
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
    () => roles.find((item) => item.slug === 'investor'),
    [roles],
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!currentRole) {
      setErrorMessage('Investor role is not currently available from the server.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setErrorMessage('Password and confirm password do not match.')
          return
        }

        const payload = await signupInvestor({
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
            : 'Signup successful. Verification token sent to your email.',
        )
        setPassword('')
        setConfirmPassword('')
        window.setTimeout(() => {
          navigate(`/dashboard/investor/verify-otp?email=${encodeURIComponent(email)}`, { replace: true })
        }, 700)
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
      setErrorMessage(error instanceof Error ? error.message : 'Investor login failed.')
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
            <span>Deal sourcing</span>
            <span>Portfolio tracking</span>
            <span>Investment workflow</span>
          </div>
          <Link to="/dashboard" className="aside-link">Change Role</Link>
        </aside>

        <section className="account-main auth-main">
          <p className="dashboard-eyebrow">Investor Account</p>
          <h2 className="account-title">{mode === 'login' ? 'Welcome investor' : 'Create investor account'}</h2>
          <p className="dashboard-subtitle">
            {mode === 'login'
              ? 'Sign in to review opportunities and manage your portfolio pipeline.'
              : 'Set up your investment profile, ticket size, and focus areas.'}
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
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={isLoadingRole || isSubmitting}
              />
              <button
                type="button"
                className="password-toggle-button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isLoadingRole || isSubmitting}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
                      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a18.15 18.15 0 0 1-4.23 5.48" />
                      <path d="M6.11 6.11A16.53 16.53 0 0 0 2 12s3 7 10 7a10.62 10.62 0 0 0 4.14-.83" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {mode === 'signup' && (
              <div className="password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  disabled={isLoadingRole || isSubmitting}
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  aria-pressed={showConfirmPassword}
                  disabled={isLoadingRole || isSubmitting}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {showConfirmPassword ? (
                      <>
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
                        <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a18.15 18.15 0 0 1-4.23 5.48" />
                        <path d="M6.11 6.11A16.53 16.53 0 0 0 2 12s3 7 10 7a10.62 10.62 0 0 0 4.14-.83" />
                      </>
                    ) : (
                      <>
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={isLoadingRole || isSubmitting || (!currentRole && !errorMessage)}>
              {isSubmitting
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Login as Investor'
                  : 'Create Investor Account'}
            </button>
          </form>

          <div className="auth-links-row">
            {mode === 'login' ? <Link to="/dashboard/investor/forgot-password">Forgot password?</Link> : null}
            {mode === 'signup' ? <Link to={`/dashboard/investor/verify-otp?email=${encodeURIComponent(email)}`}>Verify account</Link> : null}
            <Link to="/">Back to Home</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
