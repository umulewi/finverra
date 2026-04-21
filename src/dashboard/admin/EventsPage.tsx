import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, FormEvent } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type Event = {
  id: number
  title: string
  description: string
  type: string
  date: string
  image: string
}

type FormState = {
  title: string
  description: string
  type: string
  date: string
  image: File | null
  existingImage: string
}

const emptyForm: FormState = {
  title: '',
  description: '',
  type: '',
  date: '',
  image: null,
  existingImage: '',
}

function formatDateForInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function authHeader(): HeadersInit {
  const session = getAuthSession()
  return session ? { Authorization: `Bearer ${(session.payload as { token?: string })?.token ?? ''}` } : {}
}

export default function EventsPage() {
  const todayDate = formatDateForInput(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadEvents() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(buildApiUrl('/admin/events'), { headers: authHeader() })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message ?? 'Failed to load events')
      }

      setEvents(Array.isArray(data?.events) ? data.events : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setPreview(null)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(event: Event) {
    setEditingId(event.id)
    setForm({
      title: event.title,
      description: event.description,
      type: event.type,
      date: todayDate,
      image: null,
      existingImage: event.image,
    })
    setPreview(buildApiUrl(event.image))
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
    } else {
      setPreview(null)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (!form.title.trim()) {
      setFormError('Event title is required.')
      return
    }
    if (!form.description.trim()) {
      setFormError('Event description is required.')
      return
    }
    if (!form.type) {
      setFormError('Event type is required.')
      return
    }
    if (!form.date) {
      setFormError('Event date is required.')
      return
    }
    if (form.date < todayDate) {
      setFormError('Only current or future dates are allowed.')
      return
    }
    if (!editingId && !form.image) {
      setFormError('Event image is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('title', form.title.trim())
      payload.append('description', form.description.trim())
      payload.append('type', form.type)
      payload.append('date', form.date)
      if (form.image) {
  payload.append('image', form.image)
} else if (editingId && form.existingImage) {
  payload.append('image', form.existingImage)
}
      const targetUrl = editingId
        ? buildApiUrl(`/admin/events/${editingId}`)
        : buildApiUrl('/admin/events')
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(targetUrl, {
        method,
        headers: authHeader(),
        body: payload,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message ?? 'Failed to save event')
      }

      closeForm()
      await loadEvents()
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Failed to save event')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      const response = await fetch(buildApiUrl(`/admin/events/${id}`), {
        method: 'DELETE',
        headers: authHeader(),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message ?? 'Failed to delete event')
      }
      setEvents((prev) => prev.filter((event) => event.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete event')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminShell
      title="Events Management"
      subtitle="Plan timelines, publish announcements, and keep campaign events current for users and partners."
    >
      <div style={styles.toolbar}>
        <span style={styles.count}>{events.length} event{events.length !== 1 ? 's' : ''}</span>
        <button type="button" style={styles.addBtn} onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Event
        </button>
      </div>

      {error && <p style={styles.errorBanner}>{error}</p>}

      {confirmDeleteId !== null && (
        <div style={styles.overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.confirmModal} onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete Event?</h3>
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

      {showForm && (
        <div style={styles.overlay} onClick={closeForm}>
          <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingId ? 'Edit Event' : 'New Event'}</h3>
              <button type="button" style={styles.closeBtn} onClick={closeForm} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form style={styles.form} onSubmit={handleSubmit}>
              {formError && <p style={styles.formError}>{formError}</p>}

              <label style={styles.fieldLabel}>Event Title</label>
              <input
                type="text"
                style={styles.input}
                placeholder="e.g., Annual Investment Summit"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>Description</label>
              <textarea
                style={{...styles.input, minHeight: 100, resize: 'vertical'}}
                placeholder="Enter event description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>Event Type</label>
              <select
                style={styles.input}
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                disabled={submitting}
              >
                <option value="">Select event type</option>
                <option value="webinar">Webinar</option>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="networking">Networking</option>
                <option value="launch">Launch</option>
              </select>

              <label style={styles.fieldLabel}>Date</label>
              <input
                type="date"
                style={styles.input}
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                min={todayDate}
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>
                Event Image {editingId ? '(leave blank to keep existing)' : ''}
              </label>
              <div
                style={styles.dropZone}
                onClick={() => fileRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  const file = event.dataTransfer.files?.[0]
                  if (file) {
                    setForm((prev) => ({ ...prev, image: file }))
                    setPreview(URL.createObjectURL(file))
                  }
                }}
              >
                {preview ? (
                  <img src={preview} alt="Event preview" style={styles.preview} />
                ) : (
                  <span style={styles.dropText}>Click or drag image here</span>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={submitting}
              />

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={closeForm} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p style={styles.emptyMsg}>Loading...</p>
      ) : events.length === 0 ? (
        <p style={styles.emptyMsg}>No events yet. Click "Add Event" to create one.</p>
      ) : (
        <div style={styles.grid}>
          {events.map((event) => (
            <article key={event.id} style={styles.eventCard}>
              <img src={buildApiUrl(event.image)} alt="Event" style={styles.eventImage} />
              <div style={styles.eventContent}>
                <h4 style={styles.eventTitle}>{event.title}</h4>
                <p style={styles.eventDescription}>{event.description.substring(0, 80)}...</p>
                <div style={styles.eventMeta}>
                  <span style={styles.eventType}>{event.type}</span>
                  <span style={styles.eventDate}>{new Date(event.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={styles.cardActions}>
                <button type="button" style={styles.editBtn} onClick={() => openEdit(event)}>
                  Edit
                </button>
                <button
                  type="button"
                  style={{ ...styles.deleteBtn, ...(deletingId === event.id ? styles.deletingBtn : {}) }}
                  onClick={() => setConfirmDeleteId(event.id)}
                  disabled={deletingId === event.id}
                >
                  {deletingId === event.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
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
  emptyMsg: {
    color: '#7a90a8',
    fontSize: 14,
    textAlign: 'center',
    padding: '40px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 14,
  },
  eventCard: {
    borderRadius: 14,
    border: '1px solid rgba(15,30,53,0.1)',
    background: '#fff',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 24px rgba(15,45,92,0.06)',
  },
  eventImage: {
    width: '100%',
    height: 140,
    objectFit: 'cover',
    display: 'block',
    background: '#e8edf4',
  },
  eventContent: {
    padding: '12px 14px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  eventTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: '#0f1e35',
    lineHeight: 1.4,
  },
  eventDescription: {
    margin: '6px 0 0',
    fontSize: 12,
    color: '#7a90a8',
    lineHeight: 1.4,
  },
  eventMeta: {
    display: 'flex',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 8,
  },
  eventType: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: 'rgba(26,64,128,0.08)',
    color: '#1a4080',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  eventDate: {
    display: 'inline-block',
    fontSize: 11,
    color: '#9aafc6',
    fontWeight: 500,
  },
  cardActions: {
    display: 'flex',
    gap: 8,
    padding: '0 12px 12px',
  },
  editBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 10,
    border: '1px solid rgba(26,64,128,0.25)',
    background: 'rgba(26,64,128,0.06)',
    color: '#1a4080',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 10,
    border: '1px solid rgba(220,38,38,0.25)',
    background: 'rgba(220,38,38,0.06)',
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  deletingBtn: {
    opacity: 0.5,
    cursor: 'not-allowed',
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
  confirmModal: {
    background: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    padding: '26px 24px 22px',
    boxShadow: '0 32px 64px rgba(10,25,50,0.22)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  confirmTitle: {
    margin: '0 0 8px',
    fontSize: 17,
    fontWeight: 700,
    color: '#0f1e35',
  },
  confirmMsg: {
    margin: '0 0 20px',
    color: '#516178',
    fontSize: 13,
  },
  confirmActions: {
    display: 'flex',
    gap: 10,
    width: '100%',
  },
  confirmDeleteBtn: {
    flex: 2,
    padding: '11px 0',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #b91c1c, #dc2626)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
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
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '20px 24px 24px',
  },
  fieldLabel: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: 600,
    color: '#516178',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 12,
    border: '1px solid rgba(15,30,53,0.15)',
    background: '#f7f9fc',
    fontSize: 14,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  dropZone: {
    minHeight: 120,
    borderRadius: 14,
    border: '2px dashed rgba(15,30,53,0.18)',
    background: '#f7f9fc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  dropText: {
    color: '#9aafc6',
    fontSize: 13,
    fontWeight: 500,
  },
  preview: {
    width: '100%',
    maxHeight: 200,
    objectFit: 'cover',
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
    fontWeight: 700,
    cursor: 'pointer',
  },
}
