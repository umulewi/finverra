import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import './Investorauth.css'
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
        if (!isMounted) return
        setRoles(nextRoles)
        setErrorMessage('')
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(error instanceof Error ? error.message : 'Unable to verify investor role access.')
      } finally {
        if (isMounted) setIsLoadingRole(false)
      }
    }
    void loadRoles()
    return () => { isMounted = false }
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
          email, password, role: currentRole, firstName, lastName, telephone,
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

      const payload = await loginWithRole({ email, password, role: currentRole })

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
    <main className="fv-auth-root">
      {/* Left panel */}
      <aside className="fv-aside">
        <div className="fv-aside-inner">
          <Link to="/dashboard" className="fv-logo">
            <span className="fv-logo-mark">F</span>
            <span className="fv-logo-name">FINVERRA</span>
          </Link>

          <div className="fv-aside-content">
            <p className="fv-aside-eyebrow">Investor Portal</p>
            <h1 className="fv-aside-headline">
              Where capital<br />meets opportunity.
            </h1>
            <p className="fv-aside-desc">{roleDefinition.loginDescription}</p>

            <div className="fv-aside-features">
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>Deal sourcing & pipeline</span>
              </div>
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>Portfolio tracking</span>
              </div>
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>Investment workflow</span>
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
          <div className="fv-mode-toggle" role="tablist">
            <Link
              to={`${basePath}/login`}
              className={`fv-tab${mode === 'login' ? ' fv-tab--active' : ''}`}
              aria-current={mode === 'login' ? 'page' : undefined}
            >
              Sign In
            </Link>
            <Link
              to={`${basePath}/signup`}
              className={`fv-tab${mode === 'signup' ? ' fv-tab--active' : ''}`}
              aria-current={mode === 'signup' ? 'page' : undefined}
            >
              Create Account
            </Link>
          </div>

          <div className="fv-form-header">
            <h2 className="fv-form-title">
              {mode === 'login' ? 'Welcome back' : 'Join Finverra'}
            </h2>
            <p className="fv-form-subtitle">
              {mode === 'login'
                ? 'Sign in to review opportunities and manage your portfolio pipeline.'
                : 'Set up your investment profile, ticket size, and focus areas.'}
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
          {successMessage && (
            <div className="fv-status fv-status--success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              {successMessage}
            </div>
          )}

          <form className="fv-form" onSubmit={handleSubmit} noValidate>
            {mode === 'signup' && (
              <div className="fv-field-row">
                <div className="fv-field">
                  <label className="fv-label" htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    className="fv-input"
                    type="text"
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isLoadingRole || isSubmitting}
                  />
                </div>
                <div className="fv-field">
                  <label className="fv-label" htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    className="fv-input"
                    type="text"
                    placeholder="Smith"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isLoadingRole || isSubmitting}
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="fv-field">
                <label className="fv-label" htmlFor="telephone">Phone number</label>
                <input
                  id="telephone"
                  className="fv-input"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  required
                  disabled={isLoadingRole || isSubmitting}
                />
              </div>
            )}

            <div className="fv-field">
              <label className="fv-label" htmlFor="email">Email address</label>
              <input
                id="email"
                className="fv-input"
                type="email"
                placeholder="you@example.com"
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

            {mode === 'signup' && (
              <div className="fv-field">
                <label className="fv-label" htmlFor="confirmPassword">Confirm password</label>
                <div className="fv-input-wrap">
                  <input
                    id="confirmPassword"
                    className="fv-input fv-input--icon-right"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoadingRole || isSubmitting}
                  />
                  <button
                    type="button"
                    className="fv-eye-btn"
                    onClick={() => setShowConfirmPassword((c) => !c)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showConfirmPassword}
                    disabled={isLoadingRole || isSubmitting}
                    tabIndex={-1}
                  >
                    <EyeIcon open={!showConfirmPassword} />
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="fv-form-meta">
                <Link to="/dashboard/investor/forgot-password" className="fv-text-link">
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              className="fv-btn-primary"
              disabled={isLoadingRole || isSubmitting || (!currentRole && !errorMessage)}
            >
              {isSubmitting ? (
                <><span className="fv-spinner fv-spinner--light" /> Please wait…</>
              ) : mode === 'login' ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="fv-form-footer">
            {mode === 'signup' && (
              <Link to={`/dashboard/investor/verify-otp?email=${encodeURIComponent(email)}`} className="fv-text-link">
                Already have a code? Verify account
              </Link>
            )}
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