import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, FormEvent } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type Project = {
  id: number
  title: string
  description: string
  category: string | null
  funding_needed: string | null
  business_stage: string | null
  location: string | null
  expected_roi: string | null
  image: string | null
}

type FormState = {
  title: string
  description: string
  category: string
  funding_needed: string
  business_stage: string
  location: string
  expected_roi: string
  image: File | null
  existingImage: string
}

const emptyForm: FormState = {
  title: '',
  description: '',
  category: '',
  funding_needed: '',
  business_stage: '',
  location: '',
  expected_roi: '',
  image: null,
  existingImage: '',
}

const projectFieldDefinitions = [
  { key: 'category', label: 'Category' },
  { key: 'funding_needed', label: 'Funding Needed' },
  { key: 'business_stage', label: 'Business Stage' },
  { key: 'location', label: 'Location' },
  { key: 'expected_roi', label: 'Expected ROI' },
] as const

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

function appendOptionalField(payload: FormData, key: string, value: string) {
  const trimmed = value.trim()

  if (trimmed) {
    payload.append(key, trimmed)
  }
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
  return session ? { Authorization: `Bearer ${(session.payload as { token?: string })?.token ?? ''}` } : {}
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
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

  async function loadProjects() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(buildApiUrl('/admin/projects'), { headers: authHeader() })
      const data = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : data?.message ?? 'Failed to load projects')
      }

      setProjects(Array.isArray(data?.projects) ? data.projects : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setPreview(null)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(project: Project) {
    setEditingId(project.id)
    setForm({
      title: project.title,
      description: project.description,
      category: project.category ?? '',
      funding_needed: project.funding_needed ?? '',
      business_stage: project.business_stage ?? '',
      location: project.location ?? '',
      expected_roi: project.expected_roi ?? '',
      image: null,
      existingImage: project.image ?? '',
    })
    setPreview(project.image ? buildApiUrl(project.image) : null)
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

    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Title and description are required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('title', form.title.trim())
      payload.append('description', form.description.trim())

      appendOptionalField(payload, 'category', form.category)
      appendOptionalField(payload, 'funding_needed', form.funding_needed)
      appendOptionalField(payload, 'business_stage', form.business_stage)
      appendOptionalField(payload, 'location', form.location)
      appendOptionalField(payload, 'expected_roi', form.expected_roi)

      if (form.image) {
        payload.append('image', form.image)
      } else if (editingId && form.existingImage) {
        payload.append('image', form.existingImage)
      }

      const targetUrl = editingId
        ? buildApiUrl(`/admin/projects/${editingId}`)
        : buildApiUrl('/admin/projects')
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(targetUrl, {
        method,
        headers: authHeader(),
        body: payload,
      })

      const data = await parseResponseBody(response)
      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : data?.message ?? 'Failed to save project')
      }

      closeForm()
      await loadProjects()
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Failed to save project')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setConfirmDeleteId(null)
    setDeletingId(id)

    try {
      const response = await fetch(buildApiUrl(`/admin/projects/${id}`), {
        method: 'DELETE',
        headers: authHeader(),
      })
      const data = await parseResponseBody(response)
      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : data?.message ?? 'Failed to delete project')
      }
      setProjects((prev) => prev.filter((project) => project.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete project')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminShell
      title="Projects Management"
      subtitle="Create and maintain the investment projects shown on the website."
    >
      <div style={styles.toolbar}>
        <span style={styles.count}>{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
        <button type="button" style={styles.addBtn} onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Project
        </button>
      </div>

      {error && <p style={styles.errorBanner}>{error}</p>}

      {confirmDeleteId !== null && (
        <div style={styles.overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.confirmModal} onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete Project?</h3>
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
              <h3 style={styles.modalTitle}>{editingId ? 'Edit Project' : 'New Project'}</h3>
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
                type="text"
                style={styles.input}
                placeholder="Project title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>Description</label>
              <textarea
                style={{ ...styles.input, ...styles.textarea }}
                placeholder="Short project description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                disabled={submitting}
                rows={4}
              />

              <div style={styles.fieldGrid}>
                {projectFieldDefinitions.map((field) => {
                  const fieldName = field.key as keyof Pick<
                    FormState,
                    'category' | 'funding_needed' | 'business_stage' | 'location' | 'expected_roi'
                  >

                  return (
                    <div key={field.key} style={styles.fieldBlock}>
                      <label style={styles.fieldLabel}>{field.label}</label>
                      <input
                        type="text"
                        style={styles.input}
                        value={form[fieldName]}
                        onChange={(event) => setForm((prev) => ({ ...prev, [fieldName]: event.target.value }))}
                        disabled={submitting}
                      />
                    </div>
                  )
                })}
              </div>

              <label style={styles.fieldLabel}>
                Project Image {editingId ? '(leave blank to keep existing)' : '(optional)'}
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
                  <img src={preview} alt="Project preview" style={styles.preview} />
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
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p style={styles.emptyMsg}>Loading...</p>
      ) : projects.length === 0 ? (
        <p style={styles.emptyMsg}>No projects yet. Click "Add Project" to create one.</p>
      ) : (
        <div style={styles.grid}>
          {projects.map((project) => (
            <article key={project.id} style={styles.projectCard}>
              <div style={styles.imageWrap}>
                {project.image ? (
                  <img src={buildApiUrl(project.image)} alt={project.title} style={styles.projectImage} />
                ) : (
                  <div style={styles.placeholderImage}>No image</div>
                )}
              </div>
              <div style={styles.cardBody}>
                <p style={styles.cardTitle}>{project.title}</p>
                <p style={styles.cardDesc}>{project.description}</p>
                <div style={styles.metaGrid}>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Category</span>
                    <strong style={styles.metaValue}>{displayValue(project.category)}</strong>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Funding</span>
                    <strong style={styles.metaValue}>{displayValue(project.funding_needed)}</strong>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Stage</span>
                    <strong style={styles.metaValue}>{displayValue(project.business_stage)}</strong>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>ROI</span>
                    <strong style={styles.metaValue}>{displayValue(project.expected_roi)}</strong>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Location</span>
                    <strong style={styles.metaValue}>{displayValue(project.location)}</strong>
                  </div>
                </div>
              </div>
              <div style={styles.cardActions}>
                <button type="button" style={styles.editBtn} onClick={() => openEdit(project)}>
                  Edit
                </button>
                <button
                  type="button"
                  style={{ ...styles.deleteBtn, ...(deletingId === project.id ? styles.deletingBtn : {}) }}
                  onClick={() => setConfirmDeleteId(project.id)}
                  disabled={deletingId === project.id}
                >
                  {deletingId === project.id ? 'Deleting...' : 'Delete'}
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 20,
  },
  projectCard: {
    borderRadius: 20,
    border: '1px solid rgba(15,30,53,0.1)',
    background: '#ffffff',
    boxShadow: '0 8px 24px rgba(15,45,92,0.06)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  imageWrap: {
    background: '#f7f9fc',
    padding: 12,
  },
  projectImage: {
    width: '100%',
    height: 160,
    objectFit: 'cover',
    borderRadius: 12,
    display: 'block',
  },
  placeholderImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #dbeafe, #f8fafc)',
    color: '#516178',
    display: 'grid',
    placeItems: 'center',
    fontSize: 13,
    fontWeight: 600,
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
  cardDesc: {
    margin: '6px 0 0',
    fontSize: 13,
    color: '#516178',
    lineHeight: 1.6,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
    marginTop: 14,
  },
  metaItem: {
    background: 'rgba(247,249,252,0.95)',
    border: '1px solid rgba(15,30,53,0.06)',
    borderRadius: 12,
    padding: '10px 12px',
    minWidth: 0,
  },
  metaLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#7a90a8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metaValue: {
    display: 'block',
    fontSize: 13,
    lineHeight: 1.45,
    color: '#0f1e35',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardActions: {
    display: 'flex',
    gap: 8,
    padding: '10px 16px 14px',
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
    padding: '28px 28px 24px',
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
    margin: '0 0 24px',
    fontSize: 13,
    color: '#516178',
    lineHeight: 1.6,
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
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 10,
    marginTop: 10,
  },
  fieldBlock: {
    display: 'flex',
    flexDirection: 'column',
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
  textarea: {
    resize: 'vertical',
    minHeight: 90,
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
  dropZone: {
    minHeight: 120,
    borderRadius: 14,
    border: '2px dashed rgba(15,30,53,0.18)',
    background: '#f7f9fc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    cursor: 'pointer',
    marginTop: 2,
  },
  dropText: {
    fontSize: 13,
    color: '#516178',
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    maxHeight: 180,
    objectFit: 'cover',
    borderRadius: 10,
    display: 'block',
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
