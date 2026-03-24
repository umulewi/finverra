import { useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type Testimonial = {
  id: number
  name: string
  position: string
  company: string
  testimony: string
}

type FormState = {
  name: string
  position: string
  company: string
  testimony: string
}

const emptyForm: FormState = {
  name: '',
  position: '',
  company: '',
  testimony: '',
}

function authHeader(): HeadersInit {
  const session = getAuthSession()
  return session ? { Authorization: `Bearer ${(session.payload as { token?: string })?.token ?? ''}` } : {}
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  async function loadTestimonials() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(buildApiUrl('/admin/testimonials'), {
        headers: authHeader(),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message ?? 'Failed to load testimonials')
      }
      setTestimonials(Array.isArray(data?.testimonials) ? data.testimonials : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTestimonials()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(testimonial: Testimonial) {
    setEditingId(testimonial.id)
    setForm({
      name: testimonial.name,
      position: testimonial.position,
      company: testimonial.company,
      testimony: testimonial.testimony,
    })
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

    if (!form.name.trim() || !form.position.trim() || !form.company.trim() || !form.testimony.trim()) {
      setFormError('Name, position, company, and testimony are required.')
      return
    }

    setSubmitting(true)
    try {
      const targetUrl = editingId
        ? buildApiUrl(`/admin/testimonials/${editingId}`)
        : buildApiUrl('/admin/testimonials')
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(targetUrl, {
        method,
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          position: form.position.trim(),
          company: form.company.trim(),
          testimony: form.testimony.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message ?? 'Failed to save testimonial')
      }

      closeForm()
      await loadTestimonials()
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Failed to save testimonial')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      const response = await fetch(buildApiUrl(`/admin/testimonials/${id}`), {
        method: 'DELETE',
        headers: authHeader(),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message ?? 'Failed to delete testimonial')
      }

      setTestimonials((prev) => prev.filter((testimonial) => testimonial.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete testimonial')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminShell
      title="Testimonials Management"
      subtitle="Create, update, and curate social proof statements from founders, investors, and partners."
    >
      <div style={styles.toolbar}>
        <span style={styles.count}>{testimonials.length} testimonial{testimonials.length !== 1 ? 's' : ''}</span>
        <button type="button" style={styles.addBtn} onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Testimonial
        </button>
      </div>

      {error && <p style={styles.errorBanner}>{error}</p>}

      {confirmDeleteId !== null && (
        <div style={styles.overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.confirmModal} onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete Testimonial?</h3>
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
              <h3 style={styles.modalTitle}>{editingId ? 'Edit Testimonial' : 'New Testimonial'}</h3>
              <button type="button" style={styles.closeBtn} onClick={closeForm} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form style={styles.form} onSubmit={handleSubmit}>
              {formError && <p style={styles.formError}>{formError}</p>}

              <label style={styles.fieldLabel}>Name</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Client or founder name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>Position</label>
              <input
                type="text"
                style={styles.input}
                placeholder="e.g. CEO"
                value={form.position}
                onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>Company</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Company name"
                value={form.company}
                onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>Testimony</label>
              <textarea
                style={{ ...styles.input, ...styles.textarea }}
                placeholder="Write the testimonial text"
                value={form.testimony}
                onChange={(event) => setForm((prev) => ({ ...prev, testimony: event.target.value }))}
                disabled={submitting}
              />

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={closeForm} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p style={styles.emptyMsg}>Loading...</p>
      ) : testimonials.length === 0 ? (
        <p style={styles.emptyMsg}>No testimonials yet. Click "Add Testimonial" to create one.</p>
      ) : (
        <div style={styles.grid}>
          {testimonials.map((testimonial) => (
            <article key={testimonial.id} style={styles.card}>
              <div style={styles.cardBody}>
                <p style={styles.quote}>"{testimonial.testimony}"</p>
                <p style={styles.name}>{testimonial.name}</p>
                <p style={styles.meta}>{testimonial.position} · {testimonial.company}</p>
              </div>
              <div style={styles.cardActions}>
                <button type="button" style={styles.editBtn} onClick={() => openEdit(testimonial)}>
                  Edit
                </button>
                <button
                  type="button"
                  style={{ ...styles.deleteBtn, ...(deletingId === testimonial.id ? styles.deletingBtn : {}) }}
                  onClick={() => setConfirmDeleteId(testimonial.id)}
                  disabled={deletingId === testimonial.id}
                >
                  {deletingId === testimonial.id ? 'Deleting...' : 'Delete'}
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
  card: {
    borderRadius: 14,
    border: '1px solid rgba(15,30,53,0.1)',
    background: '#fff',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 24px rgba(15,45,92,0.06)',
  },
  cardBody: {
    padding: '14px 16px',
    flex: 1,
  },
  quote: {
    margin: 0,
    color: '#334155',
    lineHeight: 1.7,
    fontSize: 14,
  },
  name: {
    margin: '12px 0 0',
    fontSize: 15,
    fontWeight: 700,
    color: '#0f1e35',
  },
  meta: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#64748b',
  },
  cardActions: {
    display: 'flex',
    gap: 8,
    padding: '0 16px 14px',
  },
  editBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 10,
    border: '1px solid rgba(26,64,128,0.25)',
    background: 'rgba(26,64,128,0.06)',
    fontWeight: 700,
    color: '#1a4080',
    fontSize: 13,
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
  modal: {
    width: 'min(560px, 100%)',
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 20px 50px rgba(7,20,43,0.2)',
    border: '1px solid rgba(15,30,53,0.08)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid rgba(15,30,53,0.08)',
  },
  modalTitle: {
    margin: 0,
    fontSize: 16,
    color: '#0f1e35',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: '1px solid rgba(15,30,53,0.12)',
    background: '#fff',
    color: '#516178',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
  },
  form: {
    padding: 16,
    display: 'grid',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
    marginTop: 2,
  },
  input: {
    width: '100%',
    borderRadius: 10,
    border: '1px solid rgba(15,30,53,0.14)',
    padding: '10px 12px',
    fontSize: 14,
    color: '#0f1e35',
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
  },
  textarea: {
    minHeight: 110,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  formError: {
    margin: 0,
    fontSize: 13,
    color: '#b91c1c',
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.22)',
    borderRadius: 10,
    padding: '10px 12px',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    borderRadius: 10,
    border: '1px solid rgba(15,30,53,0.15)',
    background: '#fff',
    color: '#334155',
    fontSize: 13,
    fontWeight: 600,
    padding: '9px 14px',
    cursor: 'pointer',
  },
  submitBtn: {
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #1a4080, #0EA5A0)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    padding: '9px 14px',
    cursor: 'pointer',
  },
  confirmModal: {
    width: 'min(420px, 100%)',
    borderRadius: 14,
    background: '#fff',
    border: '1px solid rgba(15,30,53,0.09)',
    boxShadow: '0 24px 60px rgba(7,20,43,0.24)',
    padding: 18,
  },
  confirmTitle: {
    margin: 0,
    fontSize: 18,
    color: '#1a4080',
  },
  confirmMsg: {
    margin: '8px 0 0',
    color: '#516178',
    fontSize: 14,
    lineHeight: 1.5,
  },
  confirmActions: {
    marginTop: 16,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
  },
  confirmDeleteBtn: {
    borderRadius: 10,
    border: 'none',
    background: '#b91c1c',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    padding: '9px 14px',
    cursor: 'pointer',
  },
}
