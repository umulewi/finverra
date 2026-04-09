import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import '../investor/Investorauth.css'
import { forgotEntrepreneurPassword, resendEntrepreneurForgotOtp, verifyEntrepreneurForgotOtp } from '../dashboardApi'

export default function EntrepreneurForgotPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const emailFromQuery = useMemo(() => searchParams.get('email')?.trim() ?? '', [searchParams])

  const [email, setEmail] = useState(emailFromQuery)
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const payload = await forgotEntrepreneurPassword(email)
      setOtpSent(true)
      setSuccessMessage(
        payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : 'OTP sent to your email.',
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send OTP.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const payload = await verifyEntrepreneurForgotOtp({ email, otp })
      setSuccessMessage(
        payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : 'OTP verified successfully.',
      )
      navigate(`/dashboard/entrepreneur/reset-password?email=${encodeURIComponent(email)}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'OTP verification failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setErrorMessage('')
    setSuccessMessage('')
    setIsResending(true)

    try {
      const payload = await resendEntrepreneurForgotOtp(email)
      setSuccessMessage(
        payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : 'A new OTP has been sent.',
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to resend OTP.')
    } finally {
      setIsResending(false)
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
              Regain access<br />to your venture.
            </h1>
            <p className="fv-aside-desc">
              Request a one-time code using your entrepreneur email, then verify it to set a new password.
            </p>

            <div className="fv-aside-features">
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>Email verification</span>
              </div>
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>OTP confirmation</span>
              </div>
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>Secure password reset</span>
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
            <div className={`fv-step ${!otpSent ? 'fv-step--active' : 'fv-step--done'}`}>
              <span className="fv-step-num">{otpSent ? '✓' : '1'}</span>
              <span>Email</span>
            </div>
            <div className="fv-step-connector" />
            <div className={`fv-step ${otpSent ? 'fv-step--active' : ''}`}>
              <span className="fv-step-num">2</span>
              <span>Verify OTP</span>
            </div>
            <div className="fv-step-connector" />
            <div className="fv-step">
              <span className="fv-step-num">3</span>
              <span>New password</span>
            </div>
          </div>

          <div className="fv-form-header">
            <h2 className="fv-form-title">{!otpSent ? 'Forgot your password?' : 'Enter your code'}</h2>
            <p className="fv-form-subtitle">
              {!otpSent
                ? 'Enter the email associated with your entrepreneur account and we\'ll send you a one-time code.'
                : 'We sent a verification code to your email. Enter it below to continue.'}
            </p>
            {otpSent && email && (
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

          {!otpSent ? (
            <form className="fv-form" onSubmit={handleSendOtp} noValidate>
              <div className="fv-field">
                <label className="fv-label" htmlFor="fp-email">Email address</label>
                <input
                  id="fp-email"
                  className="fv-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <button type="submit" className="fv-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? <><span className="fv-spinner fv-spinner--light" /> Sending…</> : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form className="fv-form" onSubmit={handleVerifyOtp} noValidate>
              <div className="fv-field">
                <label className="fv-label" htmlFor="fp-email-confirm">Email address</label>
                <input
                  id="fp-email-confirm"
                  className="fv-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isSubmitting || isResending}
                />
              </div>
              <div className="fv-field">
                <label className="fv-label" htmlFor="fp-otp">Verification code</label>
                <input
                  id="fp-otp"
                  className="fv-input"
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  required
                  disabled={isSubmitting || isResending}
                />
              </div>
              <button type="submit" className="fv-btn-primary" disabled={isSubmitting || isResending}>
                {isSubmitting ? <><span className="fv-spinner fv-spinner--light" /> Verifying…</> : 'Verify OTP'}
              </button>
            </form>
          )}

          <div className="fv-form-footer">
            {otpSent ? (
              <button type="button" className="fv-btn-secondary" onClick={handleResend} disabled={isSubmitting || isResending}>
                {isResending ? 'Resending...' : 'Resend OTP'}
              </button>
            ) : null}
            <Link to="/dashboard/entrepreneur/login" className="fv-text-link fv-text-link--muted">Back to login</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
