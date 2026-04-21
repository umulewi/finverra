import { useState } from 'react'
import type { CSSProperties } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type SessionPayload = Record<string, unknown>

function authHeader(): HeadersInit {
  const session = getAuthSession()
  return session ? { Authorization: `Bearer ${(session.payload as { token?: string })?.token ?? ''}` } : {}
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

  const nested = [source.user, source.admin, source.data]
  for (const value of nested) {
    const id = readUserId(value)
    if (id !== null) {
      return id
    }
  }

  return null
}

export default function AdminChangePasswordPage() {
  const session = getAuthSession()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Extract ID and Email for the new API requirements
  const userId = readUserId(session?.payload)
  const userEmail = (session?.payload as any)?.email || (session?.payload as any)?.user?.email

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('All fields are required.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (!userId || !userEmail) {
      setError('Session data missing (ID or Email). Please sign in again.')
      return
    }

    setSubmitting(true)

    try {
      // Endpoint updated to /admin/users/:id/change-password
      const response = await fetch(buildApiUrl(`/admin/users/${userId}/change-password`), {
        method: 'PUT',
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json',
        },
        // Body keys updated to match the backend req.body mapping
        body: JSON.stringify({
          email: userEmail,
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
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
    <AdminShell
      title="Change Password"
      subtitle="Update your administrator password from the account menu."
    >
      <div style={styles.wrap}>
        <form style={styles.card} onSubmit={handleSubmit}>
          <h3 style={styles.title}>Administrator Password</h3>
          <p style={styles.copy}>Set a new secure password for your admin account.</p>

          <label style={styles.label}>Current Password</label>
          <input
            type="password"
            style={styles.input}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={submitting}
            placeholder="Enter current password"
          />

          <label style={styles.label}>New Password</label>
          <input
            type="password"
            style={styles.input}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={submitting}
            placeholder="Enter new password"
          />

          <label style={styles.label}>Confirm New Password</label>
          <input
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
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    background: '#ffffff',
    border: '1px solid rgba(2,51,65,0.12)',
    borderRadius: 18,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  title: {
    margin: 0,
    color: '#023341',
    fontSize: 19,
  },
  copy: {
    margin: '2px 0 8px',
    color: '#4d6f7c',
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    color: '#4d6f7c',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: 700,
    marginTop: 4,
  },
  input: {
    borderRadius: 10,
    border: '1px solid rgba(2, 51, 65, 0.2)',
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