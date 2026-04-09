import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './InvestorAuth.css'
import { resendInvestorOtp, verifyInvestorOtp } from '../dashboardApi'

export default function InvestorVerifyOtp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = useMemo(() => searchParams.get('email')?.trim() ?? '', [searchParams])

  const [otp, setOtp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!email) {
      setErrorMessage('Email is missing. Please sign up again.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await verifyInvestorOtp({ email, otp })
      setSuccessMessage(
        payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : 'Email verified successfully. Redirecting to login…',
      )
      window.setTimeout(() => {
        navigate('/dashboard/investor/login', { replace: true })
      }, 1000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'OTP verification failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!email) {
      setErrorMessage('Email is missing. Please sign up again.')
      return
    }

    setIsResending(true)

    try {
      const payload = await resendInvestorOtp(email)
      setSuccessMessage(
        payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : 'OTP resent successfully.',
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to resend OTP.')
    } finally {
      setIsResending(false)
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
            <p className="fv-aside-eyebrow">Account Verification</p>
            <h1 className="fv-aside-headline">
              One step away<br />from investing.
            </h1>
            <p className="fv-aside-desc">
              Enter the verification code sent to your email to activate your investor account.
            </p>

            <div className="fv-aside-features">
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>OTP required</span>
              </div>
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>Code valid for limited time</span>
              </div>
              <div className="fv-feature">
                <span className="fv-feature-dot" />
                <span>Secure account activation</span>
              </div>
            </div>
          </div>

          <div className="fv-aside-footer">
            <Link to="/dashboard/investor/signup" className="fv-role-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back to signup
            </Link>
          </div>
        </div>
      </aside>

      {/* Right main */}
      <section className="fv-main">
        <div className="fv-main-inner">

          <div className="fv-page-badge">
            <span className="fv-page-badge-dot" />
            Investor verification
          </div>

          <div className="fv-form-header">
            <h2 className="fv-form-title">Enter verification code</h2>
            <p className="fv-form-subtitle">
              {email
                ? 'We sent a code to your email address. Enter it below to complete verification.'
                : 'No email found. Please restart signup to receive a new code.'}
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

          <form className="fv-form" onSubmit={handleVerify} noValidate>
            <div className="fv-field">
              <label className="fv-label" htmlFor="vo-otp">Verification code</label>
              <input
                id="vo-otp"
                className="fv-input"
                type="text"
                placeholder="Enter your code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={isSubmitting || isResending}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                style={{ letterSpacing: otp ? '0.25em' : undefined, fontWeight: otp ? 500 : undefined }}
              />
              <p className="fv-otp-hint">Didn't receive it? Check your spam folder or resend below.</p>
            </div>

            <button
              type="submit"
              className="fv-btn-primary"
              disabled={isSubmitting || isResending || !email}
            >
              {isSubmitting
                ? <><span className="fv-spinner fv-spinner--light" /> Verifying…</>
                : 'Verify account'}
            </button>
          </form>

          <div className="fv-links-row">
            <button
              type="button"
              className="fv-btn-secondary"
              onClick={handleResend}
              disabled={isSubmitting || isResending || !email}
            >
              {isResending ? <><span className="fv-spinner" /> Resending…</> : 'Resend code'}
            </button>
            <Link to="/dashboard/investor/login" className="fv-text-link fv-text-link--muted">
              Back to login
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}