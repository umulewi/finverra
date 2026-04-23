import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import AdminShell from './AdminShell'
import { getAuthSession } from '../authStorage'
import {
  deleteAdminEntrepreneur,
  type AdminEntrepreneur,
} from '../dashboardApi'
import { buildApiUrl } from '../../config/api'

const editableFields = [
  { key: 'support_needed', label: 'Support Needed' },
  { key: 'urgency_level', label: 'Urgency Level' },
  { key: 'problem_faced', label: 'Problem Faced' },
  { key: 'experience', label: 'Experience' },
  { key: 'opportunity', label: 'Opportunity' },
  { key: 'product_offers', label: 'Product Offers' },
  { key: 'how_it_works', label: 'How It Works' },
  { key: 'what_makes_unique', label: 'What Makes Unique' },
  { key: 'target_customers', label: 'Target Customers' },
  { key: 'customer_location', label: 'Customer Location' },
  { key: 'customer_numbers', label: 'Customer Numbers' },
  { key: 'competitors', label: 'Competitors' },
  { key: 'competitive_advantages', label: 'Competitive Advantages' },
  { key: 'business_idea', label: 'Business Idea' },
  { key: 'monthly_revenue', label: 'Monthly Revenue' },
  { key: 'growth_trend', label: 'Growth Trend' },
  { key: 'key_achievement', label: 'Key Achievement' },
  { key: 'amount_requested', label: 'Amount Requested' },
  { key: 'preferred_type', label: 'Preferred Type' },
  { key: 'funds_be_used', label: 'Funds Be Used' },
  { key: 'expected_impacts', label: 'Expected Impacts' },
  { key: 'financial_record', label: 'Financial Record' },
  { key: 'can_repay_loan', label: 'Can Repay Loan' },
  { key: 'existing_loan', label: 'Existing Loan' },
  { key: 'method_used', label: 'Method Used' },
  { key: 'main_risk', label: 'Main Risk' },
  { key: 'current_challenges', label: 'Current Challenges' },
  { key: 'handle_challenges', label: 'Handle Challenges' },
  { key: 'what_do_you_want', label: 'What Do You Want' },
  { key: 'preferred_support', label: 'Preferred Support' },
] as const

type EntrepreneurFormState = {
  users_id: string
} & Record<string, string>

const emptyForm: EntrepreneurFormState = {
  users_id: '',
}

function getAccessToken() {
  const session = getAuthSession()
  return session ? (session.payload as { token?: string })?.token ?? '' : ''
}



function toImageUrl(value: string) {
  const text = value.trim()

  if (!text) {
    return ''
  }

  if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:')) {
    return text
  }

  return buildApiUrl(text)
}

function toText(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function fileNameFromPath(value: string) {
  if (!value) return ''
  const parts = value.split('/')
  return parts[parts.length - 1] || value
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) return response.json()
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }
  return fallbackMessage
}

function getInitials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0).toUpperCase()
  const last = lastName.trim().charAt(0).toUpperCase()
  return `${first || '?'}${last || '?'}`
}

const allowedStatuses = ['pending', 'approved', 'rejected'] as const

export default function EntrepreneurApplicationsPage() {
  const [entrepreneurs, setEntrepreneurs] = useState<AdminEntrepreneur[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewEntrepreneur, setViewEntrepreneur] = useState<AdminEntrepreneur | null>(null)
  const [form, setForm] = useState<EntrepreneurFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [confirmStatusUpdateId, setConfirmStatusUpdateId] = useState<number | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [statusSavingId, setStatusSavingId] = useState<number | null>(null)
  const [statusDraftById, setStatusDraftById] = useState<Record<number, string>>({})

  const pageSize = 10

  const accessToken = getAccessToken()

  const computedMetrics = useMemo(() => {
    const total = entrepreneurs.length
    const approvedCount = entrepreneurs.filter((item) => toText((item as Record<string, unknown>).status).toLowerCase().includes('approve')).length

    return [
      { label: 'Total Applications', value: String(total) },
      { label: 'Approved Applications', value: String(approvedCount) },
    ]
  }, [entrepreneurs])

  const visibleEntrepreneurs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const sorted = [...entrepreneurs].sort((left, right) => left.id - right.id)

    const filtered = query
      ? sorted.filter((item) => (
        [
          item.id,
          item.users_id,
          item.email,
          item.first_name,
          item.last_name,
          item.telephone,
          (item as Record<string, unknown>).status,
          (item as Record<string, unknown>).support_needed,
          (item as Record<string, unknown>).urgency_level,
        ]
          .filter((value) => value !== null && value !== undefined)
          .some((value) => String(value).toLowerCase().includes(query))
      ))
      : sorted

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const safePage = Math.min(currentPage, totalPages)
    const startIndex = (safePage - 1) * pageSize

    return {
      items: filtered.slice(startIndex, startIndex + pageSize),
      totalPages,
      totalItems: filtered.length,
      currentPage: safePage,
    }
  }, [entrepreneurs, searchQuery, currentPage])



  async function loadEntrepreneurs() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(buildApiUrl('/admin/entrepreneur_applications'), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const payload = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Failed to load entrepreneur applications.'))
      }

      const rows = Array.isArray((payload as { entrepreneur_applications?: unknown }).entrepreneur_applications)
        ? ((payload as { entrepreneur_applications: unknown[] }).entrepreneur_applications
          .filter((item): item is AdminEntrepreneur => !!item && typeof item === 'object'))
        : []

      setEntrepreneurs(rows)
      const nextDrafts: Record<number, string> = {}
      rows.forEach((item) => {
        const status = toText((item as Record<string, unknown>).status).trim().toLowerCase()
        nextDrafts[item.id] = allowedStatuses.includes(status as (typeof allowedStatuses)[number])
          ? status
          : 'pending'
      })
      setStatusDraftById(nextDrafts)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load entrepreneur applications.')
    } finally {
      setLoading(false)
    }
  }

  function handleStatusDraftChange(applicationId: number, value: string) {
    setStatusDraftById((prev) => ({
      ...prev,
      [applicationId]: value,
    }))
  }

  async function handleUpdateStatus(applicationId: number) {
    const nextStatus = (statusDraftById[applicationId] ?? '').trim().toLowerCase()

    if (!allowedStatuses.includes(nextStatus as (typeof allowedStatuses)[number])) {
      setError('Status must be one of: pending, approved, rejected.')
      return
    }

    // Get the current entrepreneur to retrieve users_id
    const entrepreneur = entrepreneurs.find((item) => item.id === applicationId)
    if (!entrepreneur) {
      setError('Entrepreneur application not found.')
      return
    }

    setConfirmStatusUpdateId(null)
    setStatusSavingId(applicationId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(buildApiUrl(`/admin/entrepreneur_applications/${applicationId}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          users_id: entrepreneur.users_id,
          status: nextStatus 
        }),
      })
      const payload = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Failed to update entrepreneur application status.'))
      }

      setEntrepreneurs((prev) => prev.map((item) => (
        item.id === applicationId
          ? ({ ...item, status: nextStatus } as AdminEntrepreneur)
          : item
      )))
      setSuccess(getErrorMessage(payload, 'Entrepreneur application status updated successfully.'))
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Failed to update entrepreneur application status.')
    } finally {
      setStatusSavingId(null)
    }
  }

  useEffect(() => {
    void loadEntrepreneurs()
  }, [])

  function closeForm() {
    setShowForm(false)
    setActiveId(null)
    setForm(emptyForm)

    setFormError(null)

  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  function closeViewModal() {
    setShowViewModal(false)
    setViewEntrepreneur(null)
  }

  function openEdit(entrepreneurId: number) {
    setFormError(null)
    setError(null)
    setSuccess(null)

    const entrepreneur = entrepreneurs.find((item) => item.id === entrepreneurId)
    if (!entrepreneur) {
      setError('Selected entrepreneur application was not found.')
      return
    }

    setActiveId(entrepreneur.id)
    const initialForm: EntrepreneurFormState = { users_id: String(entrepreneur.users_id ?? '') }
    for (const field of editableFields) {
      initialForm[field.key] = toText((entrepreneur as Record<string, unknown>)[field.key])
    }
    setForm(initialForm)
    setShowForm(true)
  }

  function openView(entrepreneurId: number) {
    setError(null)
    setSuccess(null)

    const entrepreneur = entrepreneurs.find((item) => item.id === entrepreneurId)
    if (!entrepreneur) {
      setError('Selected entrepreneur application was not found.')
      return
    }

    setViewEntrepreneur(entrepreneur)
    setShowViewModal(true)
  }



  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSuccess(null)

    if (!activeId) {
      setFormError('No entrepreneur application is selected for update.')
      return
    }

    const parsedUserId = Number(form.users_id)
    if (!Number.isFinite(parsedUserId)) {
      setFormError('users_id must be a valid number.')
      return
    }

    const entrepreneur = entrepreneurs.find((item) => item.id === activeId)
    if (!entrepreneur) {
      setFormError('Entrepreneur application not found.')
      return
    }

    setSaving(true)
    try {
      const requestBody = { ...entrepreneur }
      requestBody.users_id = parsedUserId
      for (const field of editableFields) {
        ;(requestBody as Record<string, unknown>)[field.key] = form[field.key]
      }

      const response = await fetch(buildApiUrl(`/admin/entrepreneur_applications/${activeId}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      const payload = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Failed to update entrepreneur application.'))
      }

      setSuccess(getErrorMessage(payload, 'Entrepreneur application updated successfully.'))
      closeForm()
      await loadEntrepreneurs()
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Failed to update entrepreneur application.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(entrepreneurId: number) {
    setConfirmDeleteId(null)
    setDeletingId(entrepreneurId)
    setError(null)
    setSuccess(null)

    try {
      const payload = await deleteAdminEntrepreneur(entrepreneurId, accessToken)
      setEntrepreneurs((prev) => prev.filter((item) => item.id !== entrepreneurId))
      setSuccess(payload.message ?? 'Entrepreneur deleted successfully.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete entrepreneur.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminShell
      title="Entrepreneur Applications"
      subtitle="Handle entrepreneur onboarding requests, review details, and keep records updated."
    >
      <section style={styles.grid}>
        {computedMetrics.map((metric, index) => (
          <article key={metric.label} style={styles.card} className="entrepreneur-metric-card">
            <span style={{ ...styles.metricGlow, animationDelay: `${index * 80}ms` }} />
            <p style={styles.metricLabel}>{metric.label}</p>
            <p style={styles.metricValue}>{metric.value}</p>
          </article>
        ))}
      </section>

      {error ? <p style={styles.errorBanner}>{error}</p> : null}
      {success ? <p style={styles.successBanner}>{success}</p> : null}

      {confirmDeleteId !== null ? (
        <div style={styles.overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.confirmModal} onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete Entrepreneur Application?</h3>
            <p style={styles.confirmText}>This action cannot be undone.</p>
            <div style={styles.confirmActions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button
                type="button"
                style={styles.deleteBtn}
                disabled={deletingId === confirmDeleteId}
                onClick={() => handleDelete(confirmDeleteId)}
              >
                {deletingId === confirmDeleteId ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmStatusUpdateId !== null ? (
        <div style={styles.overlay} onClick={() => setConfirmStatusUpdateId(null)}>
          <div style={styles.confirmModal} onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Update Application Status?</h3>
            <p style={styles.confirmText}>
              This will set status to <strong>{statusDraftById[confirmStatusUpdateId] ?? 'pending'}</strong>.
            </p>
            <div style={styles.confirmActions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setConfirmStatusUpdateId(null)}>
                Cancel
              </button>
              <button
                type="button"
                style={styles.primaryBtn}
                disabled={statusSavingId === confirmStatusUpdateId}
                onClick={() => { void handleUpdateStatus(confirmStatusUpdateId) }}
              >
                {statusSavingId === confirmStatusUpdateId ? 'Updating...' : 'Yes, Update'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <div style={styles.overlay} onClick={closeForm}>
          <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Entrepreneur Application</h3>
              <button type="button" style={styles.closeBtn} onClick={closeForm}>x</button>
            </div>

            <form style={styles.form} onSubmit={handleSubmit}>
              {formError ? <p style={styles.formError}>{formError}</p> : null}

              <div style={styles.formGrid}>
                {editableFields.map((field) => (
                  <label key={field.key} style={styles.field}>
                    <span>{field.label}</span>
                    <input
                      type="text"
                      value={form[field.key] || ''}
                      onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                      style={styles.input}
                      disabled={saving}
                    />
                  </label>
                ))}
              </div>

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={closeForm} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showViewModal && viewEntrepreneur ? (
        <div style={styles.overlay} onClick={closeViewModal}>
          <div style={styles.viewModal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Entrepreneur Application Details</h3>
              <button type="button" style={styles.closeBtn} onClick={closeViewModal}>x</button>
            </div>

            <div style={styles.viewBody}>
              <div style={styles.viewImageWrap}>
                {toText((viewEntrepreneur as Record<string, unknown>).photo_of_business) ? (
                  <div style={styles.viewImageCard}>
                    <a
                      href={toImageUrl(toText((viewEntrepreneur as Record<string, unknown>).photo_of_business))}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.viewImageLink}
                    >
                      <img
                        src={toImageUrl(toText((viewEntrepreneur as Record<string, unknown>).photo_of_business))}
                        alt={`${viewEntrepreneur.first_name} ${viewEntrepreneur.last_name}`}
                        style={styles.viewImage}
                      />
                      <span style={styles.imageLinkText}>Open full-size image</span>
                    </a>
                  </div>
                ) : (
                  <div style={styles.noImage}>No image available</div>
                )}
              </div>

              <div style={styles.viewGrid}>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Email</span><strong>{viewEntrepreneur.email || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>First Name</span><strong>{viewEntrepreneur.first_name || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Last Name</span><strong>{viewEntrepreneur.last_name || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Telephone</span><strong>{viewEntrepreneur.telephone || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Status</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).status) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Support Needed</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).support_needed) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Urgency Level</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).urgency_level) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Problem Faced</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).problem_faced) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Experience</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).experience) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Opportunity</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).opportunity) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Product Offers</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).product_offers) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>How It Works</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).how_it_works) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>What Makes Unique</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).what_makes_unique) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Target Customers</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).target_customers) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Customer Location</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).customer_location) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Customer Numbers</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).customer_numbers) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Competitors</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).competitors) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Competitive Advantages</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).competitive_advantages) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Business Idea</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).business_idea) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Monthly Revenue</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).monthly_revenue) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Growth Trend</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).growth_trend) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Key Achievement</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).key_achievement) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Amount Requested</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).amount_requested) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Preferred Type</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).preferred_type) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Funds Be Used</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).funds_be_used) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Expected Impacts</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).expected_impacts) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Financial Record</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).financial_record) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Can Repay Loan</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).can_repay_loan) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Existing Loan</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).existing_loan) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Method Used</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).method_used) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Main Risk</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).main_risk) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Current Challenges</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).current_challenges) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Handle Challenges</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).handle_challenges) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>What Do You Want</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).what_do_you_want) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Preferred Support</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).preferred_support) || '-'}</strong></div>
                <div style={styles.viewItem}>
                  <span style={styles.viewLabel}>Business Plan</span>
                  {toText((viewEntrepreneur as Record<string, unknown>).business_plan)
                    ? <a href={toImageUrl(toText((viewEntrepreneur as Record<string, unknown>).business_plan))} target="_blank" rel="noreferrer">{fileNameFromPath(toText((viewEntrepreneur as Record<string, unknown>).business_plan))}</a>
                    : <strong>-</strong>}
                </div>
                <div style={styles.viewItem}>
                  <span style={styles.viewLabel}>Pitch Deck</span>
                  {toText((viewEntrepreneur as Record<string, unknown>).pitch_deck)
                    ? <a href={toImageUrl(toText((viewEntrepreneur as Record<string, unknown>).pitch_deck))} target="_blank" rel="noreferrer">{fileNameFromPath(toText((viewEntrepreneur as Record<string, unknown>).pitch_deck))}</a>
                    : <strong>-</strong>}
                </div>
                <div style={styles.viewItem}>
                  <span style={styles.viewLabel}>Financial Records</span>
                  {toText((viewEntrepreneur as Record<string, unknown>).financial_records)
                    ? <a href={toImageUrl(toText((viewEntrepreneur as Record<string, unknown>).financial_records))} target="_blank" rel="noreferrer">{fileNameFromPath(toText((viewEntrepreneur as Record<string, unknown>).financial_records))}</a>
                    : <strong>-</strong>}
                </div>
                <div style={styles.viewItem}>
                  <span style={styles.viewLabel}>Registration Certificate</span>
                  {toText((viewEntrepreneur as Record<string, unknown>).registration_certificate)
                    ? <a href={toImageUrl(toText((viewEntrepreneur as Record<string, unknown>).registration_certificate))} target="_blank" rel="noreferrer">{fileNameFromPath(toText((viewEntrepreneur as Record<string, unknown>).registration_certificate))}</a>
                    : <strong>-</strong>}
                </div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Information Is True</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).information_is_true) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Agree To Share My Data</span><strong>{toText((viewEntrepreneur as Record<string, unknown>).agree_to_share_my_data) || '-'}</strong></div>
              </div>
            </div>

            <div style={styles.viewActions}>
              <button type="button" style={styles.cancelBtn} onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      ) : null}

      <section style={styles.panel} className="entrepreneur-directory-panel">
        <div style={styles.panelHeader}>
          <div>
            <h3 style={styles.panelTitle}>Application Queue</h3>
            <p style={styles.panelText}>Live entrepreneur application records from the real API payload.</p>
          </div>
          <div style={styles.panelHeaderActions}>
            <span style={styles.countPill}>{visibleEntrepreneurs.totalItems} records</span>
            <button type="button" style={styles.refreshBtn} onClick={() => void loadEntrepreneurs()}>
              Refresh
            </button>
          </div>
        </div>

        <div style={styles.searchRow}>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by name, email, phone, location, or ID..."
            style={styles.searchInput}
          />
          <span style={styles.searchHint}>
            Showing {visibleEntrepreneurs.items.length} of {visibleEntrepreneurs.totalItems}
          </span>
        </div>

        {loading ? <p style={styles.panelText}>Loading entrepreneur applications...</p> : null}

        {!loading && visibleEntrepreneurs.totalItems === 0 ? (
          <p style={styles.panelText}>No entrepreneur applications found.</p>
        ) : null}

        {!loading && visibleEntrepreneurs.totalItems > 0 ? (
          <div style={styles.tableWrap}>
            <table style={styles.table} className="entrepreneur-table">
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Telephone</th>
                  <th style={styles.th}>Support Needed</th>
                
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleEntrepreneurs.items.map((item, index) => (
                  <tr key={item.id} className="entrepreneur-row" style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={styles.td}>{(visibleEntrepreneurs.currentPage - 1) * pageSize + index + 1}</td>
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        <span style={styles.nameAvatar}>{getInitials(item.first_name ?? '', item.last_name ?? '')}</span>
                        <div style={styles.nameTextWrap}>
                          <strong style={styles.namePrimary}>{item.first_name} {item.last_name}</strong>
                          
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{item.email}</td>
                    <td style={styles.td}>{item.telephone}</td>
                    <td style={styles.td}>{toText((item as Record<string, unknown>).support_needed) || '-'}</td>
                    
                    <td style={styles.td}>{toText((item as Record<string, unknown>).status) || '-'}</td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button type="button" style={{ ...styles.secondaryBtn, ...styles.viewBtn }} onClick={() => openView(item.id)}>
                          View
                        </button>
                        <div style={styles.statusActionWrap}>
                          <select
                            value={statusDraftById[item.id] ?? 'pending'}
                            onChange={(event) => handleStatusDraftChange(item.id, event.target.value)}
                            style={styles.statusSelect}
                            disabled={statusSavingId === item.id}
                          >
                            <option value="pending">pending</option>
                            <option value="approved">approved</option>
                            <option value="rejected">rejected</option>
                          </select>
                          <button
                            type="button"
                            style={styles.statusUpdateBtn}
                            onClick={() => setConfirmStatusUpdateId(item.id)}
                            disabled={statusSavingId === item.id}
                          >
                            {statusSavingId === item.id ? 'Updating...' : 'Update'}
                          </button>
                        </div>
                        <button type="button" style={{ ...styles.secondaryBtn, ...styles.editBtn }} onClick={() => openEdit(item.id)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          style={styles.deleteBtn}
                          onClick={() => setConfirmDeleteId(item.id)}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && visibleEntrepreneurs.totalPages > 1 ? (
          <div style={styles.pagination}>
            <button
              type="button"
              style={styles.pageBtn}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={visibleEntrepreneurs.currentPage === 1}
            >
              Prev
            </button>

            <div style={styles.pageNumbers}>
              {Array.from({ length: visibleEntrepreneurs.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  style={{
                    ...styles.pageBtn,
                    ...(pageNumber === visibleEntrepreneurs.currentPage ? styles.pageBtnActive : {}),
                  }}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>

            <button
              type="button"
              style={styles.pageBtn}
              onClick={() => setCurrentPage((page) => Math.min(visibleEntrepreneurs.totalPages, page + 1))}
              disabled={visibleEntrepreneurs.currentPage === visibleEntrepreneurs.totalPages}
            >
              Next
            </button>
          </div>
        ) : null}
      </section>

      <style>{`
        .entrepreneur-metric-card {
          position: relative;
          overflow: hidden;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .entrepreneur-metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 36px rgba(15, 30, 53, 0.12);
        }

        .entrepreneur-directory-panel {
          background: linear-gradient(180deg, #ffffff 0%, #f9fcfd 100%);
        }

        .entrepreneur-table tbody tr {
          transition: background 180ms ease, transform 180ms ease;
        }

        .entrepreneur-table tbody tr:hover {
          background: #f4fcfd !important;
        }
      `}</style>
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  grid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #d8e8eb',
    borderRadius: 14,
    padding: '16px 18px',
    boxShadow: '0 10px 25px rgba(15, 30, 53, 0.06)',
  },
  metricGlow: {
    position: 'absolute',
    top: -36,
    right: -36,
    width: 94,
    height: 94,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(41,119,235,0.2), rgba(41,119,235,0))',
  },
  metricLabel: {
    margin: 0,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#4f6f78',
    fontWeight: 700,
  },
  metricValue: {
    margin: '8px 0 0',
    fontSize: 26,
    color: '#023341',
    fontWeight: 800,
  },
  panel: {
    marginTop: 16,
    background: '#ffffff',
    border: '1px solid #d8e8eb',
    borderRadius: 14,
    padding: '20px',
  },
  panelTitle: {
    margin: 0,
    color: '#023341',
    fontSize: 18,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  panelHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  searchRow: {
    marginTop: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: '1 1 320px',
    border: '1px solid #bdd8de',
    borderRadius: 12,
    padding: '11px 14px',
    background: '#f9fcfd',
    color: '#023341',
    fontSize: 14,
    outline: 'none',
  },
  searchHint: {
    color: '#5f7f88',
    fontSize: 13,
    fontWeight: 600,
  },
  countPill: {
    border: '1px solid #c8dde1',
    borderRadius: 999,
    padding: '7px 11px',
    fontSize: 12,
    fontWeight: 800,
    color: '#03475a',
    background: '#f6fbfc',
  },
  refreshBtn: {
    border: '1px solid #bdd8de',
    borderRadius: 9,
    padding: '7px 12px',
    cursor: 'pointer',
    color: '#03475a',
    background: 'linear-gradient(180deg, #ffffff 0%, #eef7f8 100%)',
    fontWeight: 700,
  },
  panelText: {
    margin: '10px 0 0',
    color: '#4f6f78',
    lineHeight: 1.6,
  },
  errorBanner: {
    marginTop: 14,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #f4c2c2',
    background: '#fff1f1',
    color: '#8d1e1e',
  },
  successBanner: {
    marginTop: 14,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #c4e9cf',
    background: '#f2fff5',
    color: '#155e30',
  },
  tableWrap: {
    marginTop: 14,
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 900,
    borderRadius: 12,
    overflow: 'hidden',
  },
  th: {
    textAlign: 'left',
    padding: '10px 8px',
    fontSize: 12,
    color: '#4f6f78',
    borderBottom: '1px solid #d8e8eb',
  },
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid #e6f0f2',
    color: '#03475a',
    fontSize: 14,
    verticalAlign: 'middle',
  },
  rowEven: {
    background: '#ffffff',
  },
  rowOdd: {
    background: '#fcfdff',
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  nameAvatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
    fontSize: 12,
    color: '#ffffff',
    background: 'linear-gradient(135deg, #244f7b 0%, #3f7ebb 100%)',
  },
  nameTextWrap: {
    display: 'grid',
    gap: 2,
  },
  namePrimary: {
    color: '#023341',
    fontSize: 14,
    lineHeight: 1.2,
  },
  nameSecondary: {
    color: '#5f7f88',
    fontSize: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid #cadee3',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusActionWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statusSelect: {
    border: '1px solid #cfe0e3',
    borderRadius: 8,
    padding: '7px 10px',
    background: '#ffffff',
    color: '#023341',
    fontWeight: 600,
    fontSize: 12,
  },
  statusUpdateBtn: {
    border: '1px solid #023341',
    borderRadius: 8,
    padding: '7px 10px',
    background: '#023341',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
  },
  primaryBtn: {
    border: 'none',
    borderRadius: 8,
    padding: '9px 12px',
    cursor: 'pointer',
    background: '#023341',
    color: '#fff',
    fontWeight: 700,
  },
  secondaryBtn: {
    border: '1px solid #cfe0e3',
    borderRadius: 8,
    padding: '8px 12px',
    cursor: 'pointer',
    background: '#fff',
    color: '#023341',
    fontWeight: 700,
  },
  viewBtn: {
    borderColor: '#c7dffc',
    color: '#03475a',
    background: '#f2fbfc',
  },
  editBtn: {
    borderColor: '#d7e8d9',
    color: '#1c5f35',
    background: '#f3fbf5',
  },
  deleteBtn: {
    border: '1px solid #f3c8c8',
    borderRadius: 8,
    padding: '8px 12px',
    cursor: 'pointer',
    background: '#fff5f5',
    color: '#a32828',
    fontWeight: 700,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(8, 20, 38, 0.45)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 99,
    padding: 16,
  },
  modal: {
    width: 'min(900px, 100%)',
    maxHeight: '90vh',
    overflow: 'auto',
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #d8e8eb',
    boxShadow: '0 20px 50px rgba(8, 20, 38, 0.2)',
  },
  viewModal: {
    width: 'min(980px, 100%)',
    maxHeight: '90vh',
    overflow: 'auto',
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #d8e8eb',
    boxShadow: '0 20px 50px rgba(8, 20, 38, 0.2)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid #ecf1f7',
  },
  modalTitle: {
    margin: 0,
    color: '#023341',
    fontSize: 18,
  },
  closeBtn: {
    border: '1px solid #d1e0e3',
    borderRadius: 8,
    background: '#fff',
    color: '#03475a',
    width: 30,
    height: 30,
    cursor: 'pointer',
    fontWeight: 700,
  },
  form: {
    padding: 16,
    display: 'grid',
    gap: 12,
  },
  formError: {
    margin: 0,
    color: '#a32828',
    background: '#fff3f3',
    border: '1px solid #f3d0d0',
    borderRadius: 8,
    padding: '10px 12px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 10,
  },
  field: {
    display: 'grid',
    gap: 6,
    color: '#334f71',
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    border: '1px solid #cfdee1',
    borderRadius: 9,
    padding: '9px 10px',
    fontSize: 14,
    color: '#023341',
    background: '#fff',
  },
  imageLink: {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: 6,
    textDecoration: 'none',
    alignItems: 'flex-start',
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 12,
    objectFit: 'cover',
    border: '1px solid #cfdee1',
    background: '#f5f8fc',
  },
  imageLinkText: {
    color: '#03475a',
    fontSize: 12,
    fontWeight: 700,
  },
  noImage: {
    border: '1px dashed #cfdbea',
    borderRadius: 10,
    padding: '10px 12px',
    color: '#567497',
    background: '#f9fcfd',
    fontSize: 13,
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    border: '1px solid #cfe0e3',
    borderRadius: 8,
    padding: '9px 12px',
    cursor: 'pointer',
    background: '#fff',
    color: '#1e4878',
    fontWeight: 700,
  },
  confirmModal: {
    width: 'min(420px, 100%)',
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #d8e8eb',
    boxShadow: '0 20px 50px rgba(8, 20, 38, 0.2)',
  },
  confirmTitle: {
    margin: '0 0 8px',
    color: '#023341',
    fontSize: 18,
  },
  confirmText: {
    margin: 0,
    color: '#4f6f78',
  },
  confirmActions: {
    marginTop: 14,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
  },
  viewBody: {
    padding: 16,
    display: 'grid',
    gap: 14,
  },
  viewImageWrap: {
    display: 'flex',
    justifyContent: 'center',
  },
  viewImageCard: {
    border: '1px solid #dde7f3',
    borderRadius: 16,
    background: 'linear-gradient(180deg, #fcfefe 0%, #f6fbfc 100%)',
    padding: 12,
    boxShadow: '0 8px 24px rgba(14, 42, 79, 0.08)',
  },
  viewImageLink: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
  },
  viewImage: {
    width: 260,
    height: 260,
    borderRadius: 16,
    objectFit: 'cover',
    border: '1px solid #cfdceb',
    background: '#f5f8fc',
  },
  viewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 10,
  },
  viewItem: {
    display: 'grid',
    gap: 4,
    border: '1px solid #d8e8eb',
    borderRadius: 10,
    background: '#fcfefe',
    padding: '10px 12px',
    color: '#03475a',
  },
  viewLabel: {
    color: '#4f6f78',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: 700,
  },
  viewActions: {
    borderTop: '1px solid #ecf1f7',
    padding: 16,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  pagination: {
    marginTop: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pageNumbers: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pageBtn: {
    border: '1px solid #bfd5da',
    borderRadius: 10,
    padding: '8px 12px',
    background: '#fff',
    color: '#023341',
    fontWeight: 700,
    cursor: 'pointer',
  },
  pageBtnActive: {
    background: 'linear-gradient(180deg, #03475a 0%, #023341 100%)',
    color: '#fff',
    borderColor: '#03475a',
  },
}
