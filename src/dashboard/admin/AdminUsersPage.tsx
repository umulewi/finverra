import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type AdminUser = {
  id: number
  email: string
  roleId: number
}

type ApiResponse = {
  success?: boolean
  message?: string
  users?: unknown
  user?: unknown
}

function authHeader(): HeadersInit {
  const session = getAuthSession()
  return session ? { Authorization: `Bearer ${(session.payload as { token?: string })?.token ?? ''}` } : {}
}

function getMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && typeof (payload as ApiResponse).message === 'string') {
    return (payload as ApiResponse).message as string
  }

  return fallback
}

function readUsersArray(payload: unknown): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const users = (payload as ApiResponse).users
  if (!Array.isArray(users)) {
    return []
  }

  return users.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
}

function mapAdminUsers(payload: unknown): AdminUser[] {
  return readUsersArray(payload)
    .map((item, index) => {
      const id = typeof item.id === 'number' ? item.id : index + 1
      const email = typeof item.email === 'string' ? item.email : ''
      const roleId = typeof item.role_id === 'number' ? item.role_id : 0

      return {
        id,
        email,
        roleId,
      }
    })
    .filter((item) => item.email)
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')

  useEffect(() => {
    void loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(buildApiUrl('/admin/users'), {
        method: 'GET',
        headers: authHeader(),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(getMessage(payload, 'Failed to load admin users'))
      }

      setUsers(mapAdminUsers(payload))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load admin users')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setEditingId(null)
    setFormEmail('')
    setFormPassword('')
    setShowForm(false)
  }

  function startEdit(user: AdminUser) {
    setEditingId(user.id)
    setFormEmail(user.email)
    setFormPassword('')
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  async function handleCreate() {
    setError('')
    setSuccess('')

    if (!formEmail.trim() || !formPassword.trim()) {
      setError('Email and password are required.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(buildApiUrl('/admin/users'), {
        method: 'POST',
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formEmail.trim(),
          password: formPassword,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(getMessage(payload, 'Failed to create admin user'))
      }

      setSuccess(getMessage(payload, 'Admin user created successfully'))
      resetForm()
      await loadUsers()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create admin user')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate() {
    setError('')
    setSuccess('')

    if (editingId === null) {
      setError('No admin user selected.')
      return
    }

    const target = users.find((item) => item.id === editingId)
    if (!target) {
      setError('Admin user not found.')
      return
    }

    const emailChanged = formEmail.trim() && formEmail.trim() !== target.email
    const passwordChanged = Boolean(formPassword.trim())

    if (!emailChanged && !passwordChanged) {
      setError('Provide a new email or password to update.')
      return
    }

    setSubmitting(true)

    try {
      const body: Record<string, string> = {}
      if (emailChanged) {
        body.email = formEmail.trim()
      }
      if (passwordChanged) {
        body.password = formPassword
      }

      const response = await fetch(buildApiUrl(`/admin/users/${editingId}`), {
        method: 'PUT',
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(getMessage(payload, 'Failed to update admin user'))
      }

      setSuccess(getMessage(payload, 'Admin user updated successfully'))
      resetForm()
      await loadUsers()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to update admin user')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(buildApiUrl(`/admin/users/${id}`), {
        method: 'DELETE',
        headers: authHeader(),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(getMessage(payload, 'Failed to delete admin user'))
      }

      setSuccess(getMessage(payload, 'Admin user deleted successfully'))

      if (editingId === id) {
        resetForm()
      }

      setUsers((prev) => prev.filter((item) => item.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete admin user')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users

    return users.filter((user) => (
      user.email.toLowerCase().includes(query)
      || String(user.id).includes(query)
    ))
  }, [search, users])

  const isEditing = editingId !== null

  return (
    <AdminShell
      title="Admin Users"
      subtitle="Super user can create, update, and delete admin accounts using email and password."
    >
      <div style={styles.page}>
        <div style={styles.toolbar}>
          <button
            type="button"
            style={styles.addBtn}
            onClick={() => {
              setShowForm((prev) => !prev)
              if (editingId !== null) {
                setEditingId(null)
                setFormEmail('')
                setFormPassword('')
              }
            }}
          >
            {showForm ? 'Close Form' : 'Add Admin User'}
          </button>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search by email or id"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="button" style={styles.reloadBtn} onClick={() => void loadUsers()} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {showForm ? (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>{isEditing ? `Edit Admin #${editingId}` : 'Create Admin User'}</h3>
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                type="email"
                placeholder="Email"
                value={formEmail}
                onChange={(event) => setFormEmail(event.target.value)}
                disabled={submitting}
              />
              <input
                style={styles.input}
                type="password"
                placeholder={isEditing ? 'New password (optional)' : 'Password'}
                value={formPassword}
                onChange={(event) => setFormPassword(event.target.value)}
                disabled={submitting}
              />
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                style={styles.primaryBtn}
                disabled={submitting}
                onClick={() => {
                  if (isEditing) {
                    void handleUpdate()
                  } else {
                    void handleCreate()
                  }
                }}
              >
                {submitting ? 'Saving...' : isEditing ? 'Update Admin User' : 'Create Admin User'}
              </button>
              <button type="button" style={styles.secondaryBtn} onClick={resetForm} disabled={submitting}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p style={styles.error}>{error}</p> : null}
        {success ? <p style={styles.success}>{success}</p> : null}

        {loading ? (
          <p style={styles.info}>Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p style={styles.info}>No admin users found.</p>
        ) : (
          <div style={styles.cardList}>
            {filteredUsers.map((user, index) => {
              const isDeleting = deletingId === user.id

              return (
                <article key={user.id} style={styles.userCard}>
                  <div style={styles.cardHead}>
                    <h3 style={styles.userEmail}>{user.email}</h3>
                    <span style={styles.idPill}>#{index + 1}</span>
                  </div>

                  <div style={styles.actionsRow}>
                    <button
                      type="button"
                      style={styles.actionBtn}
                      onClick={() => startEdit(user)}
                      disabled={submitting || isDeleting}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={styles.deleteBtn}
                      disabled={isDeleting}
                      onClick={() => void handleDelete(user.id)}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  toolbar: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  addBtn: {
    border: 'none',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #0a5c72, #023341)',
    color: '#fff',
    padding: '11px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  formCard: {
    background: '#ffffff',
    border: '1px solid rgba(2,51,65,0.14)',
    borderRadius: 16,
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  formTitle: {
    margin: 0,
    color: '#023341',
    fontSize: 16,
    fontWeight: 700,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 10,
  },
  input: {
    borderRadius: 10,
    border: '1px solid rgba(2, 51, 65, 0.2)',
    padding: '10px 12px',
    fontSize: 14,
    background: '#fff',
  },
  formActions: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  primaryBtn: {
    border: 'none',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #023341, #0a5c72)',
    color: '#fff',
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryBtn: {
    border: '1px solid rgba(2, 51, 65, 0.2)',
    borderRadius: 10,
    background: '#f8fbfd',
    color: '#023341',
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  searchInput: {
    flex: 1,
    minWidth: 240,
    borderRadius: 12,
    border: '1px solid rgba(2, 51, 65, 0.2)',
    background: '#fff',
    padding: '11px 12px',
    fontSize: 14,
  },
  reloadBtn: {
    border: 'none',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #023341, #0a5c72)',
    color: '#fff',
    padding: '11px 16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  error: {
    margin: 0,
    color: '#9e1a1a',
    borderRadius: 10,
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.2)',
    padding: '10px 12px',
  },
  success: {
    margin: 0,
    color: '#0f7a57',
    borderRadius: 10,
    background: 'rgba(16,185,129,0.08)',
    border: '1px solid rgba(16,185,129,0.22)',
    padding: '10px 12px',
  },
  info: {
    margin: 0,
    borderRadius: 10,
    background: 'rgba(2,51,65,0.06)',
    border: '1px solid rgba(2,51,65,0.12)',
    color: '#023341',
    padding: '12px 14px',
  },
  cardList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 12,
  },
  userCard: {
    background: '#fff',
    border: '1px solid rgba(2,51,65,0.14)',
    borderRadius: 16,
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  cardHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  userEmail: {
    margin: 0,
    color: '#023341',
    fontSize: 15,
    fontWeight: 700,
  },
  idPill: {
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 700,
    color: '#375867',
    background: 'rgba(2,51,65,0.08)',
    border: '1px solid rgba(2,51,65,0.12)',
  },
  metaText: {
    margin: 0,
    fontSize: 13,
    color: '#52727e',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionBtn: {
    border: '1px solid rgba(2, 51, 65, 0.2)',
    borderRadius: 10,
    background: '#f5fbfd',
    color: '#023341',
    padding: '8px 12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  deleteBtn: {
    border: '1px solid rgba(220,38,38,0.25)',
    borderRadius: 10,
    background: 'rgba(220,38,38,0.08)',
    color: '#8f1d25',
    padding: '8px 12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
}
