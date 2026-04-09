import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import '../investor/Investorauth.css'
import { resetEntrepreneurPassword } from '../dashboardApi'

export default function EntrepreneurResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = useMemo(() => searchParams.get('email')?.trim() ?? '', [searchParams])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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
      const payload = await resetEntrepreneurPassword({ email, newPassword })

      setSuccessMessage(
        payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : 'Password updated successfully. Redirecting to login...',
      )
      window.setTimeout(() => {
        navigate('/dashboard/entrepreneur/login', { replace: true })
      }, 1000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Password reset failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="fv-auth-root">
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
              Almost there. Create a secure password to protect your entrepreneur account.
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
            <Link to="/dashboard/entrepreneur/login" className="fv-role-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to login
            </Link>
          </div>
        </div>
      </aside>

      <section className="fv-main">
        <div className="fv-main-inner">
          <div className="fv-steps">
            <div className="fv-step fv-step--done">
              <span className="fv-step-num">✓</span>
              <span>Email</span>
            </div>
            <div className="fv-step-connector" />
            <div className="fv-step fv-step--done">
              <span className="fv-step-num">✓</span>
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
              {email ? 'Updating access for your account.' : 'Choose a strong password to secure your account.'}
            </p>
            {email && (
              <div className="fv-email-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" /></svg>
                {email}
              </div>
            )}
          </div>

          {errorMessage ? (
            <div className="fv-status fv-status--error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {errorMessage}
            </div>
          ) : null}
          {successMessage ? (
            <div className="fv-status fv-status--success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              {successMessage}
            </div>
          ) : null}

          <form className="fv-form" onSubmit={handleSubmit} noValidate>
            <div className="fv-field">
              <label className="fv-label" htmlFor="rp-new">New password</label>
              <input
                id="rp-new"
                className="fv-input"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="fv-field">
              <label className="fv-label" htmlFor="rp-confirm">Confirm new password</label>
              <input
                id="rp-confirm"
                className="fv-input"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <button type="submit" className="fv-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><span className="fv-spinner fv-spinner--light" /> Updating…</> : 'Update Password'}
            </button>
          </form>

          <div className="fv-form-footer">
            <Link to="/dashboard/entrepreneur/login" className="fv-text-link fv-text-link--muted">Back to login</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
