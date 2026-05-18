import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, FormEvent } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type WhoWeAreItem = {
  id: number
  title: string
  first_paragraph: string
  second_paragraph: string
  image: string | null
}

type FormState = {
  title: string
  first_paragraph: string
  second_paragraph: string
  image: File | null
  existingImage: string
}

const emptyForm: FormState = {
  title: '',
  first_paragraph: '',
  second_paragraph: '',
  image: null,
  existingImage: '',
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

export default function WhoWeArePage() {
  const [items, setItems] = useState<WhoWeAreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [preview, setPreview] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadItems() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(buildApiUrl('/admin/whoweare'), { headers: authHeader() })
      const data = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : data?.message ?? 'Failed to load who we are items')
      }

      setItems(Array.isArray(data?.whoweare) ? data.whoweare : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load who we are items')
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
    setPreview(null)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(item: WhoWeAreItem) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      first_paragraph: item.first_paragraph,
      second_paragraph: item.second_paragraph,
      image: null,
      existingImage: item.image ?? '',
    })
    setPreview(item.image ? buildApiUrl(item.image) : null)
    setFormError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setPreview(null)
    setFormError(null)
    if (fileRef.current) {
      fileRef.current.value = ''
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setForm((prev) => ({ ...prev, image: file }))

    if (file) {
      setPreview(URL.createObjectURL(file))
    } else if (editingId && form.existingImage) {
      setPreview(buildApiUrl(form.existingImage))
    } else {
      setPreview(null)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (!form.title.trim() || !form.first_paragraph.trim() || !form.second_paragraph.trim()) {
      setFormError('Title, first paragraph, and second paragraph are required.')
      return
    }

    if (!editingId && !form.image) {
      setFormError('Who we are image is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('title', form.title.trim())
      payload.append('first_paragraph', form.first_paragraph.trim())
      payload.append('second_paragraph', form.second_paragraph.trim())

      if (form.image) {
        payload.append('image', form.image)
      }

      const targetUrl = editingId
        ? buildApiUrl(`/admin/whoweare/${editingId}`)
        : buildApiUrl('/admin/whoweare')
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(targetUrl, {
        method,
        headers: authHeader(),
        body: payload,
      })

      const data = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : data?.message ?? 'Failed to save who we are item')
      }

      closeForm()
      await loadItems()
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Failed to save who we are item')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setConfirmDeleteId(null)
    setDeletingId(id)

    try {
      const response = await fetch(buildApiUrl(`/admin/whoweare/${id}`), {
        method: 'DELETE',
        headers: authHeader(),
      })

      const data = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : data?.message ?? 'Failed to delete who we are item')
      }

      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete who we are item')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminShell
      title="Who We Are"
      subtitle="Manage the who we are content shown across the site."
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
          <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingId ? 'Edit Item' : 'Add Item'}</h3>
              <button type="button" style={styles.closeBtn} onClick={closeForm} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form style={styles.form} onSubmit={handleSubmit}>
              {formError && <p style={styles.formError}>{formError}</p>}

              <label style={styles.fieldLabel}>Title</label>
              <input
                style={styles.input}
                type="text"
                value={form.title}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Enter title"
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>First Paragraph</label>
              <textarea
                style={{ ...styles.input, ...styles.textarea }}
                value={form.first_paragraph}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, first_paragraph: event.target.value }))}
                placeholder="Enter first paragraph"
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>Second Paragraph</label>
              <textarea
                style={{ ...styles.input, ...styles.textarea }}
                value={form.second_paragraph}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, second_paragraph: event.target.value }))}
                placeholder="Enter second paragraph"
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>Image</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={styles.input}
                onChange={handleFileChange}
                disabled={submitting}
              />

              {preview && (
                <div style={styles.previewContainer}>
                  <img src={preview} alt="Preview" style={styles.previewImage} />
                </div>
              )}

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={closeForm} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div style={styles.overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.confirmModal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.confirmIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <h3 style={styles.confirmTitle}>Delete Item?</h3>
            <p style={styles.confirmMsg}>This action cannot be undone. The item will be permanently removed.</p>
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

      {loading ? <p style={styles.emptyState}>Loading who we are entries...</p> : null}

      {!loading && items.length === 0 ? <p style={styles.emptyState}>No who we are entries have been added yet.</p> : null}

      {!loading && items.length > 0 ? (
        <div style={styles.grid}>
          {items.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIndex}>{String(item.id).padStart(2, '0')}</div>
                <div style={styles.cardActions}>
                  <button type="button" style={styles.actionBtn} onClick={() => openEdit(item)}>Edit</button>
                  <button type="button" style={{ ...styles.actionBtn, ...styles.deleteBtn }} onClick={() => setConfirmDeleteId(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
              {item.image && (
                <div style={styles.cardImageContainer}>
                  <img src={buildApiUrl(item.image)} alt={item.title} style={styles.cardImage} />
                </div>
              )}
              <div style={styles.cardBody}>
                <p style={styles.cardTitle}>{item.title}</p>
                <p style={styles.cardDescription}>{item.first_paragraph}</p>
                <p style={styles.cardDescription}>{item.second_paragraph}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  count: {
    fontSize: 13,
    color: '#516178',
    fontWeight: 500,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    background: 'linear-gradient(135deg, #1a4080, #0EA5A0)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  errorBanner: {
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.25)',
    color: '#b91c1c',
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: 13,
    marginBottom: 18,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10,25,50,0.45)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    background: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 32px 64px rgba(10,25,50,0.22)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '22px 24px 16px',
    borderBottom: '1px solid rgba(15,30,53,0.08)',
  },
  modalTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: '#0f1e35',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#7a90a8',
    display: 'flex',
    padding: 4,
  },
  form: {
    padding: '20px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#516178',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 12,
    border: '1px solid rgba(15,30,53,0.15)',
    fontSize: 14,
    color: '#0f1e35',
    background: '#f7f9fc',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  textarea: {
    resize: 'vertical',
    minHeight: 90,
  },
  previewContainer: {
    marginTop: 12,
    marginBottom: 14,
    padding: 12,
    backgroundColor: '#f7f9fc',
    borderRadius: 12,
    border: '1px solid rgba(15,30,53,0.08)',
  },
  previewImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: 8,
    display: 'block',
  },
  formError: {
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.2)',
    color: '#b91c1c',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    margin: '4px 0 8px',
  },
  formActions: {
    display: 'flex',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    padding: '11px 0',
    borderRadius: 12,
    border: '1px solid rgba(15,30,53,0.18)',
    background: 'transparent',
    color: '#516178',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    flex: 2,
    padding: '11px 0',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #1a4080, #0EA5A0)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  confirmModal: {
    background: '#ffffff',
    borderRadius: 24,
    padding: 24,
    maxWidth: 400,
    boxShadow: '0 32px 64px rgba(10,25,50,0.22)',
  },
  confirmIcon: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    margin: 0,
    marginBottom: 8,
    fontSize: 17,
    fontWeight: 700,
    color: '#0f1e35',
    textAlign: 'center',
  },
  confirmMsg: {
    margin: '0 0 20px',
    fontSize: 14,
    color: '#7a90a8',
    textAlign: 'center',
  },
  confirmActions: {
    display: 'flex',
    gap: 10,
  },
  confirmDeleteBtn: {
    flex: 1,
    padding: '11px 0',
    borderRadius: 12,
    border: '1px solid rgba(220,38,38,0.25)',
    background: 'rgba(220,38,38,0.08)',
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
  },
  card: {
    borderRadius: 20,
    border: '1px solid rgba(15,30,53,0.1)',
    background: '#ffffff',
    boxShadow: '0 8px 24px rgba(15,45,92,0.06)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '14px 16px 0',
  },
  cardIndex: {
    fontSize: 12,
    fontWeight: 700,
    color: '#9ca3af',
  },
  cardActions: {
    display: 'flex',
    gap: 8,
  },
  actionBtn: {
    padding: '6px 10px',
    borderRadius: 10,
    border: '1px solid rgba(26,64,128,0.25)',
    background: 'rgba(26,64,128,0.06)',
    color: '#1a4080',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteBtn: {
    border: '1px solid rgba(220,38,38,0.25)',
    background: 'rgba(220,38,38,0.06)',
    color: '#b91c1c',
  },
  cardImageContainer: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
    backgroundColor: '#f7f9fc',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  cardBody: {
    padding: '14px 16px',
    flex: 1,
  },
  cardTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: '#0f1e35',
  },
  cardDescription: {
    margin: '6px 0 0',
    fontSize: 13,
    color: '#516178',
    lineHeight: 1.6,
  },
  emptyState: {
    color: '#7a90a8',
    fontSize: 14,
    textAlign: 'center',
    padding: '40px 0',
  },
}
