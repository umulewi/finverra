import { useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type OurProject = {
  id: number
  image: string | null
  link: string
}

function resolveImageUrl(imagePath: string | null) {
  if (!imagePath) return null
  if (/^https?:\/\//i.test(imagePath)) return imagePath
  return buildApiUrl(imagePath)
}

function authHeader(): HeadersInit {
  const session = getAuthSession()
  return session ? { Authorization: `Bearer ${(session.payload as { token?: string })?.token ?? ''}` } : {}
}

export default function OurProjectsPage() {
  const [items, setItems] = useState<OurProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [link, setLink] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  async function loadItems() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(buildApiUrl('/admin/our_projects'))
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) throw new Error((data && data.message) || 'Failed to load')
      // Accept shape { success:true, our_projects: [] } or raw array
      const rows: OurProject[] = Array.isArray(data) ? data : data.our_projects ?? []
      setItems(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load our projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadItems() }, [])

  function openCreate() {
    setEditingId(null)
    setLink('')
    setFile(null)
    setShowForm(true)
  }

  function openEdit(item: OurProject) {
    setEditingId(item.id)
    setLink(item.link || '')
    setFile(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setLink('')
    setFile(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!link.trim()) return setError('Link is required')
    setSubmitting(true)
    try {
      const body = new FormData()
      body.append('link', link.trim())
      if (file) body.append('image', file)

      const url = editingId ? buildApiUrl(`/admin/our_projects/${editingId}`) : buildApiUrl('/admin/our_projects')
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, { method, headers: authHeader(), body })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error((data && data.message) || 'Save failed')

      closeForm()
      await loadItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      const res = await fetch(buildApiUrl(`/admin/our_projects/${id}`), { method: 'DELETE', headers: authHeader() })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error((data && data.message) || 'Delete failed')
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminShell title="Our Projects" subtitle="Manage the items shown in the Our Project website section.">
      <div style={styles.toolbar}>
        <span style={styles.count}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
        <button type="button" style={styles.addBtn} onClick={openCreate}>Add Item</button>
      </div>

      {error && <p style={styles.errorBanner}>{error}</p>}

      {confirmDeleteId !== null && (
        <div style={styles.overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete item?</h3>
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
              <h3 style={styles.modalTitle}>{editingId ? 'Edit Item' : 'New Item'}</h3>
              <button type="button" style={styles.closeBtn} onClick={closeForm} aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.fieldLabel}>Link</label>
              <input style={styles.input} value={link} onChange={e => setLink(e.target.value)} disabled={submitting} placeholder="https://..." />

              <label style={styles.fieldLabel}>Image (optional)</label>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} disabled={submitting} />

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
      ) : items.length === 0 ? (
        <p style={styles.emptyMsg}>No items yet. Click "Add Item" to create one.</p>
      ) : (
        <div style={styles.grid}>
          {items.map(item => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardBody}>
                {item.image ? <img src={resolveImageUrl(item.image) ?? undefined} alt="project" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 140 }} /> : <div style={{ height: 140, background: '#f1f5f9', borderRadius: 12 }} />}
                <p style={{ marginTop: 12, color: '#1a2b3a' }}>{item.link}</p>
              </div>
              <div style={styles.cardActions}>
                <button type="button" style={styles.editBtn} onClick={() => openEdit(item)}>Edit</button>
                <button type="button" style={styles.deleteBtn} onClick={() => setConfirmDeleteId(item.id)} disabled={deletingId === item.id}>{deletingId === item.id ? 'Deleting…' : 'Delete'}</button>
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
  // modal styles (reused simplified)
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
}
