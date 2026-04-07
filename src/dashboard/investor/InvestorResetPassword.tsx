import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import '../Dashboard.css'
import { resetInvestorPassword } from '../dashboardApi'

export default function InvestorResetPassword() {
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
      setErrorMessage('New password and confirm password do not match.')
      return
    }

    if (!email) {
      setErrorMessage('Missing email context. Please restart forgot password from login.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await resetInvestorPassword({
        email,
        newPassword,
      })

      setSuccessMessage(
        payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : 'Password changed successfully. Redirecting to login...',
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
    <main className="dashboard-page">
      <div className="account-layout auth-layout">
        <aside className="account-aside">
          <p className="aside-brand">FINVERRA</p>
          <h1>Set New Password</h1>
          <p>Complete your password update, then return to investor login.</p>
          <div className="aside-points">
            <span>Secure update</span>
            <span>Strong password</span>
            <span>Back to login</span>
          </div>
        </aside>

        <section className="account-main auth-main">
          <p className="dashboard-eyebrow">Investor Password</p>
          <h2 className="account-title">Create a new password</h2>
          <p className="dashboard-subtitle">
            {email ? `Updating access for ${email}` : 'Update your password to regain account access.'}
          </p>

          {errorMessage ? <div className="dashboard-status-card error">{errorMessage}</div> : null}
          {successMessage ? <div className="dashboard-status-card success">{successMessage}</div> : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              disabled={isSubmitting}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={isSubmitting}
            />
            <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div className="auth-links-row">
            <Link to="/dashboard/investor/login">Back to login</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
