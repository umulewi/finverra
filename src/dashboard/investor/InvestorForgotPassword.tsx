import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import '../Dashboard.css'
import { forgotInvestorPassword, resendInvestorForgotOtp, verifyInvestorForgotOtp } from '../dashboardApi'

export default function InvestorForgotPassword() {
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
      const payload = await forgotInvestorPassword(email)
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
      const payload = await verifyInvestorForgotOtp({ email, otp })
      setSuccessMessage(
        payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : 'OTP verified successfully.',
      )
      navigate(`/dashboard/investor/reset-password?email=${encodeURIComponent(email)}`)
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
      const payload = await resendInvestorForgotOtp(email)
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
    <main className="dashboard-page">
      <div className="account-layout auth-layout">
        <aside className="account-aside">
          <p className="aside-brand">FINVERRA</p>
          <h1>Forgot Password</h1>
          <p>Request an OTP using your investor email, then verify it to continue.</p>
          <div className="aside-points">
            <span>Email check</span>
            <span>OTP verification</span>
            <span>Password reset</span>
          </div>
        </aside>

        <section className="account-main auth-main">
          <p className="dashboard-eyebrow">Investor Recovery</p>
          <h2 className="account-title">Reset your account access</h2>
          <p className="dashboard-subtitle">
            {!otpSent
              ? 'Enter your investor email to receive an OTP.'
              : 'Enter the OTP from your email to continue to password reset.'}
          </p>

          {errorMessage ? <div className="dashboard-status-card error">{errorMessage}</div> : null}
          {successMessage ? <div className="dashboard-status-card success">{successMessage}</div> : null}

          {!otpSent ? (
            <form className="auth-form" onSubmit={handleSendOtp}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isSubmitting}
              />
              <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isSubmitting || isResending}
              />
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                required
                disabled={isSubmitting || isResending}
              />
              <button type="submit" className="auth-submit-btn" disabled={isSubmitting || isResending}>
                {isSubmitting ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}

          <div className="auth-links-row">
            {otpSent ? (
              <button
                type="button"
                className="auth-link-button"
                onClick={handleResend}
                disabled={isSubmitting || isResending}
              >
                {isResending ? 'Resending...' : 'Resend OTP'}
              </button>
            ) : null}
            <Link to="/dashboard/investor/login">Back to login</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
