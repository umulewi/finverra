import { useEffect, useState } from 'react'
import type { CSSProperties, ChangeEvent, FormEvent } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type WhatDrivesItem = {
  id: number
  title: string
  description: string
}

type FormState = {
  title: string
  description: string
}

const emptyForm: FormState = {
  title: '',
  description: '',
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function authHeader(): HeadersInit {
  const session = getAuthSession()

  if (!session) {
    return {}
  }

  const payload = session.payload as { token?: unknown; accessToken?: unknown; access_token?: unknown; jwt?: unknown }
  const tokenValue = typeof payload.token === 'string'
    ? payload.token
    : typeof payload.accessToken === 'string'
      ? payload.accessToken
      : typeof payload.access_token === 'string'
        ? payload.access_token
        : typeof payload.jwt === 'string'
          ? payload.jwt
          : ''

  return tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}
}

export default function WhatDrivesFinverraPage() {
  const [items, setItems] = useState<WhatDrivesItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  async function loadItems() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(buildApiUrl('/admin/what_drives'), { headers: authHeader() })
      const data = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : data?.message ?? 'Failed to load what drives content')
      }

      setItems(Array.isArray(data?.what_drives) ? data.what_drives : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load what drives content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadItems()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(item: WhatDrivesItem) {
    setEditingId(item.id)
    setForm({ title: item.title, description: item.description })
    setFormError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Title and description are required.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
      }

      const targetUrl = editingId
        ? buildApiUrl(`/admin/what_drives/${editingId}`)
        : buildApiUrl('/admin/what_drives')
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(targetUrl, {
        method,
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : data?.message ?? 'Failed to save what drives item')
      }

      closeForm()
      await loadItems()
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Failed to save what drives item')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setConfirmDeleteId(null)
    setDeletingId(id)

    try {
      const response = await fetch(buildApiUrl(`/admin/what_drives/${id}`), {
        method: 'DELETE',
        headers: authHeader(),
      })

      const data = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : data?.message ?? 'Failed to delete what drives item')
      }

      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete what drives item')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminShell
      title="What Drives Finverra"
      subtitle="Manage the vision and mission content shown across the site and admin workflows."
    >
      <div style={styles.toolbar}>
        <span style={styles.count}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
        <button type="button" style={styles.addBtn} onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Item
        </button>
      </div>

      {error && <p style={styles.errorBanner}>{error}</p>}

      {showForm && (
        <div style={styles.overlay} onClick={closeForm}>
          <form style={styles.formCard} onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
            <h3 style={styles.formTitle}>{editingId ? 'Edit Item' : 'Add Item'}</h3>
            <label style={styles.fieldLabel}>
              Title
              <input
                style={styles.input}
                value={form.title}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Enter title"
              />
            </label>
            <label style={styles.fieldLabel}>
              Description
              <textarea
                style={styles.textarea}
                value={form.description}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Enter description"
                rows={6}
              />
            </label>
            {formError && <p style={styles.formError}>{formError}</p>}
            <div style={styles.formActions}>
              <button type="button" style={styles.cancelBtn} onClick={closeForm}>Cancel</button>
              <button type="submit" style={styles.saveBtn} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div style={styles.overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.confirmModal} onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete Item?</h3>
            <p style={styles.confirmMsg}>This action cannot be undone.</p>
            <div style={styles.confirmActions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button
                type="button"
                style={styles.confirmDeleteBtn}
                disabled={deletingId === confirmDeleteId}
                onClick={() => handleDelete(confirmDeleteId)}
              >
                {deletingId === confirmDeleteId ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div style={styles.emptyState}>Loading what drives entries...</div> : null}

      {!loading && items.length === 0 ? <div style={styles.emptyState}>No what drives entries have been added yet.</div> : null}

      {!loading && items.length > 0 ? (
        <div style={styles.grid}>
          {items.map((item) => (
            <article key={item.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIndex}>{String(item.id).padStart(2, '0')}</div>
                <div style={styles.cardActions}>
                  <button type="button" style={styles.actionBtn} onClick={() => openEdit(item)}>Edit</button>
                  <button type="button" style={{ ...styles.actionBtn, ...styles.deleteBtn }} onClick={() => setConfirmDeleteId(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
              <h3 style={styles.cardTitle}>{item.title}</h3>
              <p style={styles.cardDescription}>{item.description}</p>
            </article>
          ))}
        </div>
      ) : null}
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  count: {
    fontWeight: 700,
    color: '#023341',
  },
  addBtn: {
    border: 'none',
    borderRadius: 12,
    padding: '11px 14px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'linear-gradient(135deg, #0e7abf, #07507d)',
    color: '#ffffff',
    fontWeight: 700,
    boxShadow: '0 12px 24px rgba(2, 51, 65, 0.18)',
  },
  errorBanner: {
    padding: '14px 16px',
    borderRadius: 14,
    background: '#fff2f2',
    border: '1px solid rgba(190, 55, 55, 0.2)',
    color: '#8a2d2d',
    marginBottom: 18,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 120,
    padding: 20,
  },
  formCard: {
    width: 'min(720px, 100%)',
    background: '#ffffff',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 22px 48px rgba(2, 51, 65, 0.18)',
    display: 'grid',
    gap: 14,
  },
  formTitle: {
    margin: 0,
    color: '#023341',
    fontSize: 22,
  },
  fieldLabel: {
    display: 'grid',
    gap: 8,
    color: '#023341',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    borderRadius: 12,
    border: '1px solid rgba(2, 51, 65, 0.14)',
    padding: '12px 14px',
    fontSize: 14,
  },
  textarea: {
    width: '100%',
    borderRadius: 12,
    border: '1px solid rgba(2, 51, 65, 0.14)',
    padding: '12px 14px',
    fontSize: 14,
    resize: 'vertical',
  },
  formError: {
    margin: 0,
    color: '#8a2d2d',
    fontWeight: 600,
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    border: '1px solid rgba(2, 51, 65, 0.14)',
    borderRadius: 12,
    padding: '11px 14px',
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
  },
  saveBtn: {
    border: 'none',
    borderRadius: 12,
    padding: '11px 14px',
    background: 'linear-gradient(135deg, #0e7abf, #07507d)',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
  },
  confirmModal: {
    width: 'min(420px, 100%)',
    background: '#ffffff',
    borderRadius: 18,
    padding: 22,
    boxShadow: '0 20px 44px rgba(2, 51, 65, 0.18)',
  },
  confirmTitle: {
    margin: 0,
    color: '#023341',
  },
  confirmMsg: {
    color: '#446073',
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmDeleteBtn: {
    border: 'none',
    borderRadius: 12,
    padding: '11px 14px',
    background: '#c0392b',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
  },
  emptyState: {
    padding: '18px 20px',
    borderRadius: 16,
    background: '#ffffff',
    border: '1px solid rgba(2, 51, 65, 0.1)',
    color: '#446073',
    boxShadow: '0 12px 28px rgba(2, 51, 65, 0.06)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 18,
  },
  card: {
    background: '#ffffff',
    borderRadius: 20,
    border: '1px solid rgba(2, 51, 65, 0.1)',
    boxShadow: '0 14px 30px rgba(2, 51, 65, 0.08)',
    padding: 20,
    display: 'grid',
    gap: 14,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardIndex: {
    width: 48,
    height: 48,
    borderRadius: 16,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    color: '#023341',
    background: 'linear-gradient(135deg, rgba(14, 122, 191, 0.14), rgba(243, 179, 64, 0.16))',
  },
  cardActions: {
    display: 'flex',
    gap: 10,
  },
  actionBtn: {
    border: '1px solid rgba(2, 51, 65, 0.12)',
    borderRadius: 12,
    padding: '9px 12px',
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
    color: '#023341',
  },
  deleteBtn: {
    color: '#8a2d2d',
  },
  cardTitle: {
    margin: 0,
    fontSize: 18,
    color: '#023341',
    fontWeight: 800,
  },
  cardDescription: {
    margin: 0,
    color: '#446073',
    lineHeight: 1.75,
  },
}