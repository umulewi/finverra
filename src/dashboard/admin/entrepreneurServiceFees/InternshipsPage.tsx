import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { buildApiUrl } from '../../../config/api'
import { getAuthSession } from '../../authStorage'

interface Internship {
  id: number
  details: string
  amount: string
  duration: string
}

interface FormState {
  details: string
  amount: string
  duration: string
}

export default function InternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>({ details: '', amount: '', duration: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const authSession = getAuthSession()
  const authHeader = {
    Authorization: `Bearer ${(authSession?.payload as { token?: string } | undefined)?.token ?? ''}`,
  }

  useEffect(() => {
    loadInternships()
  }, [])

  const loadInternships = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(buildApiUrl('/admin/e_internships'), {
        headers: authHeader,
      })
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      const data = await response.json()
      setInternships(data.e_internships || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load internships')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ details: '', amount: '', duration: '' })
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (internship: Internship) => {
    setEditingId(internship.id)
    setForm({ details: internship.details, amount: internship.amount, duration: internship.duration })
    setFormError(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ details: '', amount: '', duration: '' })
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.details || !form.amount || !form.duration) {
      setFormError('All fields are required')
      return
    }

    try {
      setSubmitting(true)
      setFormError(null)
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId
        ? buildApiUrl(`/admin/e_internships/${editingId}`)
        : buildApiUrl('/admin/e_internships')

      const response = await fetch(url, {
        method,
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!response.ok) throw new Error(`Error: ${response.status}`)
      closeForm()
      await loadInternships()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(buildApiUrl(`/admin/e_internships/${id}`), {
        method: 'DELETE',
        headers: authHeader,
      })
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      setConfirmDeleteId(null)
      await loadInternships()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Internships</h2>
        <button style={styles.primaryBtn} onClick={openCreate}>
          + Add Internship
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}
      {loading && <p style={styles.loadingText}>Loading internships...</p>}

      {!loading && internships.length === 0 && <p style={styles.emptyText}>No internships found</p>}

      {!loading && internships.length > 0 && (
        <div style={styles.cardsGrid}>
          {internships.map(internship => (
            <div key={internship.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{internship.details}</h3>
                <div style={styles.cardActions}>
                  <button style={styles.editBtn} onClick={() => openEdit(internship)} title="Edit">
                    ✎
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => setConfirmDeleteId(internship.id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p style={styles.cardInfo}>Duration: {internship.duration}</p>
              <p style={styles.cardInfo}>Amount: {internship.amount}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={styles.modalOverlay} onClick={closeForm}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingId ? 'Edit Internship' : 'Create Internship'}
              </h3>
              <button style={styles.closeBtn} onClick={closeForm}>
                ✕
              </button>
            </div>

            {formError && <div style={styles.errorBox}>{formError}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Details *</label>
                <textarea
                  value={form.details}
                  onChange={e => setForm({ ...form, details: e.target.value })}
                  style={styles.textarea}
                  placeholder="e.g., Web Development Internship"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Duration *</label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={e => setForm({ ...form, duration: e.target.value })}
                  style={styles.input}
                  placeholder="e.g., 3 months"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Amount *</label>
                <input
                  type="text"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  style={styles.input}
                  placeholder="e.g., $800"
                  required
                />
              </div>

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div style={styles.modalOverlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.confirmDialog} onClick={e => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete Internship?</h3>
            <p style={styles.confirmText}>This action cannot be undone.</p>
            <div style={styles.confirmActions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button
                type="button"
                style={styles.deleteBtn}
                onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              >
                <span style={styles.deleteBtnIcon}>🗑</span>
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f1e35',
    margin: 0,
  },
  primaryBtn: {
    padding: '10px 20px',
    background: '#04617a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
  errorBox: {
    background: '#fee',
    border: '1px solid #fcc',
    color: '#c33',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    padding: '24px',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: '24px',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  card: {
    background: '#f7fafd',
    border: '1px solid rgba(15,30,53,0.08)',
    borderRadius: '12px',
    padding: '16px',
    transition: 'all 0.3s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f1e35',
    margin: 0,
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
    background: '#04617a',
    color: '#fff',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.3s',
  },
  deleteBtn: {
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    minWidth: '96px',
    height: '32px',
    padding: '0 14px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    transition: 'background 0.3s',
  },
  deleteBtnIcon: {
    fontSize: '14px',
    lineHeight: 1,
  },
  cardInfo: {
    fontSize: '14px',
    color: '#4e5c73',
    margin: '8px 0 0',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    width: '90%',
    maxWidth: '500px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(15,30,53,0.08)',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f1e35',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#999',
    cursor: 'pointer',
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f1e35',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid rgba(15,30,53,0.12)',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid rgba(15,30,53,0.12)',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    minHeight: '100px',
    resize: 'vertical',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelBtn: {
    padding: '10px 20px',
    background: '#e0e6ed',
    color: '#0f1e35',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 20px',
    background: '#04617a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  confirmDialog: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  confirmTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f1e35',
    margin: '0 0 12px',
  },
  confirmText: {
    fontSize: '14px',
    color: '#4e5c73',
    margin: '0 0 20px',
  },
  confirmActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
}
