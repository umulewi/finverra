import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import '../Dashboard.css'
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
          : 'Email verified successfully. Redirecting to login...',
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
    <main className="dashboard-page">
      <div className="account-layout auth-layout">
        <aside className="account-aside">
          <p className="aside-brand">FINVERRA</p>
          <h1>Verify Your Email</h1>
          <p>Enter the OTP sent to your email to complete investor account verification.</p>
          <div className="aside-points">
            <span>OTP required</span>
            <span>Valid for limited time</span>
            <span>Secure account activation</span>
          </div>
        </aside>

        <section className="account-main auth-main">
          <p className="dashboard-eyebrow">Investor Verification</p>
          <h2 className="account-title">Enter verification code</h2>
          <p className="dashboard-subtitle">
            {email ? `Code sent to ${email}` : 'No email found. Please restart signup.'}
          </p>

          {errorMessage ? <div className="dashboard-status-card error">{errorMessage}</div> : null}
          {successMessage ? <div className="dashboard-status-card success">{successMessage}</div> : null}

          <form className="auth-form" onSubmit={handleVerify}>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              required
              disabled={isSubmitting || isResending}
            />
            <button type="submit" className="auth-submit-btn" disabled={isSubmitting || isResending || !email}>
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="auth-links-row">
            <button
              type="button"
              className="auth-link-button"
              onClick={handleResend}
              disabled={isSubmitting || isResending || !email}
            >
              {isResending ? 'Resending...' : 'Resend OTP'}
            </button>
            <Link to="/dashboard/investor/login">Back to login</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
