import { useState, type CSSProperties } from 'react'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'
import EntrepreneurShell from './EntrepreneurShell'

type SessionPayload = Record<string, unknown>

function authHeader(): HeadersInit {
  const session = getAuthSession()
  const token = (session?.payload as { token?: string } | undefined)?.token ?? ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function readUserId(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const source = payload as SessionPayload
  const direct = [source.id, source.user_id, source.users_id]

  for (const value of direct) {
    if (typeof value === 'number') {
      return value
    }
    if (typeof value === 'string' && !Number.isNaN(Number(value))) {
      return Number(value)
    }
  }

  const nested = [source.user, source.entrepreneur, source.data]
  for (const value of nested) {
    const id = readUserId(value)
    if (id !== null) {
      return id
    }
  }

  return null
}

function readUserEmail(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return ''
  }

  const source = payload as SessionPayload
  const candidates = [source.email, (source.user as SessionPayload | undefined)?.email, (source.data as SessionPayload | undefined)?.email]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
  }

  return ''
}

export default function EntrepreneurChangePasswordPage() {
  const session = getAuthSession()
  const userId = readUserId(session?.payload)
  const userEmail = session?.email || readUserEmail(session?.payload)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('All fields are required.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.')
      return
    }

    if (!userId || !userEmail) {
      setError('Session data is missing (user id or email). Please sign in again.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(buildApiUrl(`/enterpreneur/users/${userId}/change-password`), {
        method: 'PUT',
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message ?? 'Failed to change password')
      }

      setSuccess(payload?.message ?? 'Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to change password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <EntrepreneurShell
      title="Change Password"
      subtitle="Update your entrepreneur account password from your profile menu."
    >
      <div style={styles.wrap}>
        <form style={styles.card} onSubmit={handleSubmit}>
          <h3 style={styles.cardTitle}>Entrepreneur Password</h3>
          <p style={styles.cardCopy}>Use your current password and set a new secure password.</p>

          <label style={styles.label} htmlFor="currentPassword">Current Password</label>
          <input
            id="currentPassword"
            type="password"
            style={styles.input}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={submitting}
            placeholder="Enter current password"
          />

          <label style={styles.label} htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            style={styles.input}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={submitting}
            placeholder="Enter new password"
          />

          <label style={styles.label} htmlFor="confirmPassword">Confirm New Password</label>
          <input
            id="confirmPassword"
            type="password"
            style={styles.input}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={submitting}
            placeholder="Re-enter new password"
          />

          {error ? <p style={styles.error}>{error}</p> : null}
          {success ? <p style={styles.success}>{success}</p> : null}

          <button type="submit" style={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </EntrepreneurShell>
  )
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 540,
    background: '#ffffff',
    border: '1px solid rgba(15,30,53,0.12)',
    borderRadius: 18,
    padding: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    boxShadow: '0 14px 30px rgba(15, 45, 92, 0.08)',
  },
  cardTitle: {
    margin: 0,
    color: '#0f1e35',
    fontSize: 19,
  },
  cardCopy: {
    margin: '2px 0 8px',
    color: '#4d607d',
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    color: '#4d607d',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: 700,
    marginTop: 4,
  },
  input: {
    borderRadius: 10,
    border: '1px solid rgba(15, 30, 53, 0.2)',
    padding: '11px 12px',
    fontSize: 14,
    background: '#fff',
  },
  error: {
    margin: '6px 0 0',
    padding: '10px 12px',
    borderRadius: 10,
    color: '#a61d24',
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.2)',
  },
  success: {
    margin: '6px 0 0',
    padding: '10px 12px',
    borderRadius: 10,
    color: '#0f7a57',
    background: 'rgba(16,185,129,0.08)',
    border: '1px solid rgba(16,185,129,0.22)',
  },
  submitBtn: {
    marginTop: 8,
    border: 'none',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #023341, #0a5c72)',
    color: '#fff',
    padding: '11px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
}
