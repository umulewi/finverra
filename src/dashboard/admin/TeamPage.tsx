import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, FormEvent } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type TeamMember = {
  id: number
  name: string
  position: string
  phone: string
  team_category: string
  email: string
  image: string
}

type FormState = {
  name: string
  position: string
  phone: string
  team_category: string
  email: string
  image: File | null
  existingImage: string
}

const emptyForm: FormState = {
  name: '',
  position: '',
  phone: '',
  team_category: '',
  email: '',
  image: null,
  existingImage: '',
}

const TEAM_CATEGORY_OPTIONS = [
  { value: 'Board of Directors', label: 'Board of Directors (Governance)' },
  { value: 'Executive Management Team', label: 'Executive Management Team (Operations)' },
] as const

type TeamCategory = (typeof TEAM_CATEGORY_OPTIONS)[number]['value']

function isTeamCategory(value: string): value is TeamCategory {
  return TEAM_CATEGORY_OPTIONS.some((option) => option.value === value)
}

function authHeader(): HeadersInit {
  const session = getAuthSession()
  return session ? { Authorization: `Bearer ${(session.payload as { token?: string })?.token ?? ''}` } : {}
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
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

  async function loadTeam() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(buildApiUrl('/admin/team'), { headers: authHeader() })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message ?? 'Failed to load team')
      }

      setTeam(Array.isArray(data?.team) ? data.team : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load team')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeam()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setPreview(null)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(member: TeamMember) {
    setEditingId(member.id)
    setForm({
      name: member.name,
      position: member.position,
      phone: member.phone,
      team_category: member.team_category,
      email: member.email,
      image: null,
      existingImage: member.image,
    })
    setPreview(buildApiUrl(member.image))
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
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (!form.name.trim() || !form.position.trim() || !form.team_category.trim()) {
      setFormError('Name, position, and team category are required.')
      return
    }
    if (!isTeamCategory(form.team_category)) {
      setFormError('Team category must be Board of Directors or Executive Management Team.')
      return
    }
    if (!form.email.trim()) {
      setFormError('Email is required.')
      return
    }
    if (!form.phone.trim()) {
      setFormError('Phone is required.')
      return
    }
    if (!editingId && !form.image) {
      setFormError('Image file is required for new team members.')
      return
    }

    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('name', form.name.trim())
      payload.append('position', form.position.trim())
      payload.append('phone', form.phone.trim())
      payload.append('team_category', form.team_category.trim())
      payload.append('email', form.email.trim())

      if (form.image) {
        payload.append('image', form.image)
      } else if (editingId && form.existingImage) {
        payload.append('image', form.existingImage)
      }

      const targetUrl = editingId
        ? buildApiUrl(`/admin/team/${editingId}`)
        : buildApiUrl('/admin/team')
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(targetUrl, {
        method,
        headers: authHeader(),
        body: payload,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message ?? 'Failed to save team member')
      }

      closeForm()
      await loadTeam()
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Failed to save team member')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      const response = await fetch(buildApiUrl(`/admin/team/${id}`), {
        method: 'DELETE',
        headers: authHeader(),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message ?? 'Failed to delete team member')
      }

      setTeam((prev) => prev.filter((member) => member.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete team member')
    } finally {
      setDeletingId(null)
    }
  }

  const boardMembers = team.filter((member) => member.team_category === 'Board of Directors')
  const executiveMembers = team.filter((member) => member.team_category === 'Executive Management Team')

  return (
    <AdminShell
      title="Team Management"
      subtitle="Create, update, and maintain leadership profiles and contact details."
    >
      <div style={styles.toolbar}>
        <span style={styles.count}>{team.length} member{team.length !== 1 ? 's' : ''}</span>
        <button type="button" style={styles.addBtn} onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Team Member
        </button>
      </div>

      {error && <p style={styles.errorBanner}>{error}</p>}

      {confirmDeleteId !== null && (
        <div style={styles.overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.confirmModal} onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete Team Member?</h3>
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
              <h3 style={styles.modalTitle}>{editingId ? 'Edit Team Member' : 'New Team Member'}</h3>
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
                placeholder="Full name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>Position</label>
              <input
                type="text"
                style={styles.input}
                placeholder="e.g. Chief Investment Officer"
                value={form.position}
                onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>Phone</label>
              <input
                type="text"
                style={styles.input}
                placeholder="e.g. +250 7XX XXX XXX"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>Team Category</label>
              <select
                style={styles.input}
                value={form.team_category}
                onChange={(event) => setForm((prev) => ({ ...prev, team_category: event.target.value }))}
                disabled={submitting}
              >
                <option value="">Select team category</option>
                {TEAM_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <label style={styles.fieldLabel}>Email</label>
              <input
                type="email"
                style={styles.input}
                placeholder="name@finverra.com"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                disabled={submitting}
              />

              <label style={styles.fieldLabel}>
                Profile Image {editingId ? '(leave blank to keep existing)' : ''}
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
                  <img src={preview} alt="Team preview" style={styles.preview} />
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
                  {submitting ? (
                    <span style={styles.submitBusy}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={styles.submitSpinner}>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                        <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Saving...
                    </span>
                  ) : editingId ? 'Save Changes' : 'Create Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p style={styles.emptyMsg}>Loading...</p>
      ) : team.length === 0 ? (
        <p style={styles.emptyMsg}>No team members yet. Click "Add Team Member" to create one.</p>
      ) : (
        <div style={styles.categoryStack}>
          <section style={styles.categorySection}>
            <h3 style={styles.categoryTitle}>Board of Directors</h3>
            {boardMembers.length === 0 ? (
              <p style={styles.categoryEmpty}>No members in this category.</p>
            ) : (
              <div style={styles.grid}>
                {boardMembers.map((member) => (
                  <article key={member.id} style={styles.memberCard}>
                    <img src={buildApiUrl(member.image)} alt={member.name} style={styles.memberImage} />
                    <div style={styles.memberBody}>
                      <h4 style={styles.memberName}>{member.name}</h4>
                      <p style={styles.memberPosition}>{member.position}</p>
                      <div style={styles.memberLinks}>
                        <p style={styles.memberMeta}><span style={styles.metaLabel}>Tel:</span> <a href={`tel:${member.phone}`} style={styles.memberLink}>{member.phone}</a></p>
                        <p style={styles.memberMeta}><span style={styles.metaLabel}>Email:</span> <a href={`mailto:${member.email}`} style={styles.memberLink}>{member.email}</a></p>
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      <button type="button" style={styles.editBtn} onClick={() => openEdit(member)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.deleteBtn, ...(deletingId === member.id ? styles.deletingBtn : {}) }}
                        onClick={() => setConfirmDeleteId(member.id)}
                        disabled={deletingId === member.id}
                      >
                        {deletingId === member.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section style={styles.categorySection}>
            <h3 style={styles.categoryTitle}>Executive Management Team</h3>
            {executiveMembers.length === 0 ? (
              <p style={styles.categoryEmpty}>No members in this category.</p>
            ) : (
              <div style={styles.grid}>
                {executiveMembers.map((member) => (
                  <article key={member.id} style={styles.memberCard}>
                    <img src={buildApiUrl(member.image)} alt={member.name} style={styles.memberImage} />
                    <div style={styles.memberBody}>
                      <h4 style={styles.memberName}>{member.name}</h4>
                      <p style={styles.memberPosition}>{member.position}</p>
                      <div style={styles.memberLinks}>
                        <p style={styles.memberMeta}><span style={styles.metaLabel}>Tel:</span> <a href={`tel:${member.phone}`} style={styles.memberLink}>{member.phone}</a></p>
                        <p style={styles.memberMeta}><span style={styles.metaLabel}>Email:</span> <a href={`mailto:${member.email}`} style={styles.memberLink}>{member.email}</a></p>
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      <button type="button" style={styles.editBtn} onClick={() => openEdit(member)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.deleteBtn, ...(deletingId === member.id ? styles.deletingBtn : {}) }}
                        onClick={() => setConfirmDeleteId(member.id)}
                        disabled={deletingId === member.id}
                      >
                        {deletingId === member.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
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
  categoryStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  categorySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  categoryTitle: {
    margin: 0,
    color: '#023341',
    fontSize: 16,
    fontWeight: 700,
  },
  categoryEmpty: {
    margin: 0,
    color: '#5f7f88',
    fontSize: 13,
    padding: '4px 0 2px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(220px, 1fr))',
    gap: 14,
  },
  memberCard: {
    borderRadius: 30,
    border: '1px solid #d4dce4',
    background: '#e7edf2',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 20px rgba(15,45,92,0.08)',
  },
  memberImage: {
    width: '100%',
    height: 260,
    objectFit: 'cover',
    display: 'block',
    background: '#e8edf4',
  },
  memberBody: {
    padding: '18px 16px 14px',
    background: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    textAlign: 'center',
  },
  memberName: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: '#052f52',
  },
  memberPosition: {
    margin: 0,
    color: '#3d6284',
    fontSize: 15,
    fontWeight: 500,
  },
  memberLinks: {
    marginTop: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  memberMeta: {
    margin: 0,
    fontSize: 12,
    color: '#7a8ea4',
    lineHeight: 1.5,
  },
  metaLabel: {
    color: '#7a8ea4',
    fontWeight: 500,
  },
  memberLink: {
    color: '#6788a9',
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 400,
  },
  cardActions: {
    display: 'flex',
    gap: 8,
    padding: '0 14px 14px',
    marginTop: 'auto',
    background: '#f8fafc',
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
    maxWidth: 560,
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
    maxHeight: 220,
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
  submitBusy: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitSpinner: {
    display: 'block',
    animation: 'spin 0.8s linear infinite',
  },
}
