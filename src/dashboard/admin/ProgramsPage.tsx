import { useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type Program = {
  id: number
  title: string
  slug: string
  description: string
  launch_date: string | null
  duration: string | null
  program_highlight: string | null
}

type FormState = {
  title: string
  slug: string
  description: string
  launch_date: string
  duration: string
  program_highlight: string
}

const emptyForm: FormState = {
  title: '',
  slug: '',
  description: '',
  launch_date: '',
  duration: '',
  program_highlight: '',
}

function formatDateForInput(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

function authHeader(): HeadersInit {
  const session = getAuthSession()
  return session ? { Authorization: `Bearer ${(session.payload as { token?: string })?.token ?? ''}` } : {}
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadPrograms() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(buildApiUrl('/admin/programs'), { headers: authHeader() })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) throw new Error((data && data.message) || 'Failed to load')
      const rows: Program[] = Array.isArray(data) ? data : data.programs ?? []
      setPrograms(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPrograms()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(program: Program) {
    setEditingId(program.id)
    setForm({
      title: program.title,
      slug: program.slug,
      description: program.description,
      launch_date: formatDateForInput(program.launch_date),
      duration: program.duration ?? '',
      program_highlight: program.program_highlight ?? '',
    })
    setFormError(null)
    setShowForm(true)
  }

  async function handleDelete(id: number) {
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      const res = await fetch(buildApiUrl(`/admin/programs/${id}`), { method: 'DELETE', headers: authHeader() })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error((data && data.message) || 'Delete failed')
      setPrograms(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.slug.trim() || !form.description.trim()) return setFormError('Title, slug, and description are required')
    setSubmitting(true)
    try {
      const body = new FormData()
      body.append('title', form.title.trim())
      body.append('slug', form.slug.trim())
      body.append('description', form.description.trim())
      if (form.launch_date) body.append('launch_date', form.launch_date)
      if (form.duration) body.append('duration', form.duration.trim())
      if (form.program_highlight) body.append('program_highlight', form.program_highlight.trim())

      const url = editingId ? buildApiUrl(`/admin/programs/${editingId}`) : buildApiUrl('/admin/programs')
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, { method, headers: authHeader(), body })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error((data && data.message) || 'Save failed')

      closeForm()
      await loadPrograms()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminShell title="Programs" subtitle="Manage programs and initiatives.">
      <div style={styles.toolbar}>
        <span style={styles.count}>{programs.length} program{programs.length !== 1 ? 's' : ''}</span>
        <button type="button" style={styles.addBtn} onClick={openCreate}>Add Program</button>
      </div>

      {error && <p style={styles.errorBanner}>{error}</p>}

      {confirmDeleteId !== null && (
        <div style={styles.overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete program?</h3>
            <p style={styles.confirmMsg}>This action cannot be undone.</p>
            <div style={styles.confirmActions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button type="button" style={styles.confirmDeleteBtn} disabled={deletingId === confirmDeleteId} onClick={() => handleDelete(confirmDeleteId!)}>
                {deletingId === confirmDeleteId ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={styles.overlay} onClick={closeForm}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingId ? 'Edit Program' : 'New Program'}</h3>
              <button type="button" style={styles.closeBtn} onClick={closeForm} aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              {formError && <div style={styles.formError}>{formError}</div>}
              <label style={styles.fieldLabel}>Title *</label>
              <input style={styles.input} value={form.title} onChange={e => setForm({...form, title: e.target.value})} disabled={submitting} placeholder="Program title" required />

              <label style={styles.fieldLabel}>Slug *</label>
              <input style={styles.input} value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} disabled={submitting} placeholder="slug-name" required />

              <label style={styles.fieldLabel}>Description *</label>
              <textarea style={{...styles.input, minHeight: 80}} value={form.description} onChange={e => setForm({...form, description: e.target.value})} disabled={submitting} placeholder="Program description" required />

              <label style={styles.fieldLabel}>Launch Date (optional)</label>
              <input type="date" style={styles.input} value={form.launch_date} onChange={e => setForm({...form, launch_date: e.target.value})} disabled={submitting} />

              <label style={styles.fieldLabel}>Duration (optional)</label>
              <input style={styles.input} value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} disabled={submitting} placeholder="e.g., 12 weeks" />

              <label style={styles.fieldLabel}>Program Highlight (optional)</label>
              <textarea style={{...styles.input, minHeight: 60}} value={form.program_highlight} onChange={e => setForm({...form, program_highlight: e.target.value})} disabled={submitting} placeholder="Brief highlight or tagline" />

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={closeForm} disabled={submitting}>Cancel</button>
                <button type="submit" style={styles.submitBtn} disabled={submitting}>{submitting ? 'Saving…' : editingId ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p style={styles.emptyMsg}>Loading…</p>
      ) : programs.length === 0 ? (
        <p style={styles.emptyMsg}>No programs yet. Click "Add Program" to create one.</p>
      ) : (
        <div style={styles.grid}>
          {programs.map(program => (
            <div key={program.id} style={styles.card}>
              <div style={styles.cardBody}>
                <p style={{ marginTop: 0, fontWeight: 700, color: '#1a2b3a', fontSize: 14 }}>{program.title}</p>
                <p style={{ margin: '4px 0', fontSize: 12, color: '#7a90a8' }}>{program.slug}</p>
                <p style={{ margin: '6px 0', fontSize: 12, color: '#57707b' }}>{program.description}</p>
                {program.launch_date && <p style={{ margin: '4px 0', fontSize: 11, color: '#9db0c1' }}>Launch: {new Date(program.launch_date).toLocaleDateString()}</p>}
                {program.duration && <p style={{ margin: '4px 0', fontSize: 11, color: '#9db0c1' }}>Duration: {program.duration}</p>}
              </div>
              <div style={styles.cardActions}>
                <button type="button" style={styles.editBtn} onClick={() => openEdit(program)}>Edit</button>
                <button type="button" style={styles.deleteBtn} onClick={() => setConfirmDeleteId(program.id)} disabled={deletingId === program.id}>{deletingId === program.id ? 'Deleting…' : 'Delete'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  count: { fontSize: 13, color: '#516178', fontWeight: 500 },
  addBtn: { background: 'linear-gradient(135deg, #1a4080, #0EA5A0)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' },
  errorBanner: { background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#b91c1c', borderRadius: 12, padding: '12px 16px', fontSize: 13, marginBottom: 18 },
  emptyMsg: { color: '#7a90a8', fontSize: 14, textAlign: 'center', padding: '40px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 },
  card: { borderRadius: 12, border: '1px solid rgba(15,30,53,0.06)', background: '#fff', display: 'flex', flexDirection: 'column' },
  cardBody: { padding: 12 },
  cardActions: { display: 'flex', gap: 8, padding: '10px 12px' },
  editBtn: { flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(26,64,128,0.25)', background: 'rgba(26,64,128,0.06)', color: '#1a4080', fontWeight: 600, cursor: 'pointer' },
  deleteBtn: { flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(220,38,38,0.25)', background: 'rgba(220,38,38,0.06)', color: '#b91c1c', fontWeight: 600, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(10,25,50,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 64px rgba(10,25,50,0.22)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(15,30,53,0.06)' },
  modalTitle: { margin: 0, fontSize: 16, fontWeight: 700 },
  closeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18 },
  form: { padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: 700, color: '#516178', marginTop: 8 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(15,30,53,0.08)', fontSize: 14 },
  formActions: { display: 'flex', gap: 10, marginTop: 12 },
  cancelBtn: { flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid rgba(15,30,53,0.12)', background: 'transparent', cursor: 'pointer' },
  submitBtn: { flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1a4080, #0EA5A0)', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  confirmModal: { background: '#fff', borderRadius: 10, padding: 20, maxWidth: 360 },
  confirmTitle: { fontSize: 16, fontWeight: 700, margin: '0 0 8px' },
  confirmMsg: { margin: '0 0 16px' },
  confirmActions: { display: 'flex', gap: 8 },
  confirmDeleteBtn: { flex: 1, padding: '10px 0', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' },
  formError: { padding: '8px 12px', borderRadius: 8, background: '#fee', color: '#c33', fontSize: 12, marginBottom: 8, fontWeight: 500 },
}
