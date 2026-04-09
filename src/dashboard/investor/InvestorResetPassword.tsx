import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './InvestorAuth.css'
import { resetInvestorPassword } from '../dashboardApi'

export default function InvestorResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = useMemo(() => searchParams.get('email')?.trim() ?? '', [searchParams])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const passwordStrength = (() => {
    if (!newPassword) return 0
    let score = 0
    if (newPassword.length >= 8) score++
    if (/[A-Z]/.test(newPassword)) score++
    if (/[0-9]/.test(newPassword)) score++
    if (/[^A-Za-z0-9]/.test(newPassword)) score++
    return score
  })()

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength] ?? ''
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#16a34a'][passwordStrength] ?? ''

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    if (!email) {
      setErrorMessage('Missing email context. Please restart from the forgot password page.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await resetInvestorPassword({ email, newPassword })

      setSuccessMessage(
        payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : 'Password updated successfully. Redirecting to login…',
      )
      window.setTimeout(() => {
        navigate('/dashboard/investor/login', { replace: true })
      }, 1000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Password reset failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="fv-auth-root">
      {/* Left aside */}
      <aside className="fv-aside">
        <div className="fv-aside-inner">
          <Link to="/dashboard" className="fv-logo">
            <img src="/logo-finverra-white.png" alt="Finverra" className="fv-logo-image" />
          </Link>

          <div className="fv-aside-content">
            <p className="fv-aside-eyebrow">Account Recovery</p>
            <h1 className="fv-aside-headline">
              Set a strong<br />new password.
            </h1>
            <p className="fv-aside-desc">
              Almost there. Create a secure password to protect your investment account.
            </p>

            <div className="fv-aside-features">
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>8+ characters</span>
              </div>
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>Mix of letters & numbers</span>
              </div>
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>Special characters recommended</span>
              </div>
            </div>
          </div>

          <div className="fv-aside-footer">
            <Link to="/dashboard/investor/login" className="fv-role-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back to login
            </Link>
          </div>
        </div>
      </aside>

      {/* Right main */}
      <section className="fv-main">
        <div className="fv-main-inner">

          {/* Step indicator — step 3 active */}
          <div className="fv-steps">
            <div className="fv-step fv-step--done">
              <span className="fv-step-num">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span>Email</span>
            </div>
            <div className="fv-step-connector" />
            <div className="fv-step fv-step--done">
              <span className="fv-step-num">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span>Verify OTP</span>
            </div>
            <div className="fv-step-connector" />
            <div className="fv-step fv-step--active">
              <span className="fv-step-num">3</span>
              <span>New password</span>
            </div>
          </div>

          <div className="fv-form-header">
            <h2 className="fv-form-title">Create new password</h2>
            <p className="fv-form-subtitle">
              {email
                ? `Updating access for your account.`
                : 'Choose a strong password to secure your account.'}
            </p>
            {email && (
              <div className="fv-email-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
                {email}
              </div>
            )}
          </div>

          {errorMessage && (
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
            <div className="fv-field">
              <label className="fv-label" htmlFor="rp-new">New password</label>
              <div className="fv-input-wrap">
                <input
                  id="rp-new"
                  className="fv-input fv-input--icon-right"
                  type={showNew ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="fv-eye-btn"
                  onClick={() => setShowNew((c) => !c)}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                  disabled={isSubmitting}
                >
                  <EyeIcon open={!showNew} />
                </button>
              </div>

              {/* Password strength meter */}
              {newPassword && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 2,
                          background: n <= passwordStrength ? strengthColor : 'rgba(2,51,65,0.1)',
                          transition: 'background 0.2s',
                        }}
                      />
                    ))}
                  </div>
                  <p style={{ fontSize: 11.5, color: strengthColor, fontWeight: 500 }}>{strengthLabel}</p>
                </div>
              )}
            </div>

            <div className="fv-field">
              <label className="fv-label" htmlFor="rp-confirm">Confirm new password</label>
              <div className="fv-input-wrap">
                <input
                  id="rp-confirm"
                  className="fv-input fv-input--icon-right"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="fv-eye-btn"
                  onClick={() => setShowConfirm((c) => !c)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                  disabled={isSubmitting}
                >
                  <EyeIcon open={!showConfirm} />
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p style={{ fontSize: 11.5, color: '#ef4444', marginTop: 4 }}>Passwords do not match</p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p style={{ fontSize: 11.5, color: '#16a34a', marginTop: 4 }}>Passwords match</p>
              )}
            </div>

            <button type="submit" className="fv-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><span className="fv-spinner fv-spinner--light" /> Updating…</> : 'Update password'}
            </button>
          </form>

          <div className="fv-links-row">
            <Link to="/dashboard/investor/login" className="fv-text-link fv-text-link--muted">
              Back to login
            </Link>
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