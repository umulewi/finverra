import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import AdminShell from './AdminShell'
import { getAuthSession } from '../authStorage'
import {
  deleteAdminInvestorApplication,
  fetchAdminInvestorApplicationById,
  fetchAdminInvestorApplications,
  type AdminInvestorApplication,
  type AdminInvestorApplicationUpdatePayload,
  updateAdminInvestorApplication,
} from '../dashboardApi'
import { buildApiUrl } from '../../config/api'

type InvestorApplicationFormState = {
  users_id: string
  investor_type: string
  residence_country: string
  investment_budget: string
  investment_size: string
  how_many_business_you_can_invest: string
  type_of_investment: string
  sectors_do_you_prefer: string
  where_do_you_want_to_invest: string
  stage_do_you_prefer: string
  risk_level: string
  return_type: string
  expected_roi: string
  investment_duration: string
  what_do_you_look_in_business: string
  minimum_requirements: string
  how_involved_do_you_want: string
  have_you_invested_before: string
  number_of_investments: string
  invested_sector: string
  success_stories: string
  preferred_contact: string
  availability: string
  confirm_the_information_is_accurate: boolean
  i_agree_to_terms: boolean
  i_consent_to_be_matched_with_entrepreneurs: boolean
  company_registration: string
  proof_of_funds: string
  kyc: string
}

const emptyForm: InvestorApplicationFormState = {
  users_id: '',
  investor_type: '',
  residence_country: '',
  investment_budget: '',
  investment_size: '',
  how_many_business_you_can_invest: '',
  type_of_investment: '',
  sectors_do_you_prefer: '',
  where_do_you_want_to_invest: '',
  stage_do_you_prefer: '',
  risk_level: '',
  return_type: '',
  expected_roi: '',
  investment_duration: '',
  what_do_you_look_in_business: '',
  minimum_requirements: '',
  how_involved_do_you_want: '',
  have_you_invested_before: '',
  number_of_investments: '',
  invested_sector: '',
  success_stories: '',
  preferred_contact: '',
  availability: '',
  confirm_the_information_is_accurate: false,
  i_agree_to_terms: false,
  i_consent_to_be_matched_with_entrepreneurs: false,
  company_registration: '',
  proof_of_funds: '',
  kyc: '',
}

const editableTextFields: Array<{ key: keyof InvestorApplicationFormState; label: string; textarea?: boolean }> = [
  { key: 'users_id', label: 'User ID' },
  { key: 'investor_type', label: 'Investor Type' },
  { key: 'residence_country', label: 'Residence Country' },
  { key: 'investment_budget', label: 'Investment Budget' },
  { key: 'investment_size', label: 'Investment Size' },
  { key: 'how_many_business_you_can_invest', label: 'How Many Businesses Can Invest' },
  { key: 'type_of_investment', label: 'Type Of Investment' },
  { key: 'sectors_do_you_prefer', label: 'Preferred Sectors' },
  { key: 'where_do_you_want_to_invest', label: 'Preferred Investment Location' },
  { key: 'stage_do_you_prefer', label: 'Preferred Business Stage' },
  { key: 'risk_level', label: 'Risk Level' },
  { key: 'return_type', label: 'Return Type' },
  { key: 'expected_roi', label: 'Expected ROI' },
  { key: 'investment_duration', label: 'Investment Duration' },
  { key: 'what_do_you_look_in_business', label: 'What To Look In Business', textarea: true },
  { key: 'minimum_requirements', label: 'Minimum Requirements', textarea: true },
  { key: 'how_involved_do_you_want', label: 'Involvement Level' },
  { key: 'have_you_invested_before', label: 'Invested Before' },
  { key: 'number_of_investments', label: 'Number Of Investments' },
  { key: 'invested_sector', label: 'Invested Sector' },
  { key: 'success_stories', label: 'Success Stories', textarea: true },
  { key: 'preferred_contact', label: 'Preferred Contact' },
  { key: 'availability', label: 'Availability' },
  { key: 'company_registration', label: 'Company Registration Path' },
  { key: 'proof_of_funds', label: 'Proof Of Funds Path' },
  { key: 'kyc', label: 'KYC Path' },
]

function getAccessToken() {
  const session = getAuthSession()
  return session ? (session.payload as { token?: string })?.token ?? '' : ''
}

function toText(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
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

const allowedStatuses = ['pending', 'approved', 'rejected'] as const

function toBool(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'yes'
  }
  return false
}

function toDateDisplay(value: unknown) {
  const text = toText(value)
  if (!text) return '-'
  const matchedDate = text.match(/^(\d{4}-\d{2}-\d{2})/)
  return matchedDate ? matchedDate[1] : text
}

function toAssetUrl(value: string) {
  const text = value.trim()

  if (!text) {
    return ''
  }

  if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:')) {
    return text
  }

  return buildApiUrl(text)
}

function isImagePath(value: string) {
  const text = value.trim().toLowerCase()
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(text)
}

function isPdfPath(value: string) {
  return value.trim().toLowerCase().endsWith('.pdf')
}

function fileNameFromPath(value: string) {
  if (!value) return ''
  const parts = value.split('/')
  return parts[parts.length - 1] || value
}

export default function InvestorApplicationsPage() {
  const [applications, setApplications] = useState<AdminInvestorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewApplication, setViewApplication] = useState<AdminInvestorApplication | null>(null)
  const [form, setForm] = useState<InvestorApplicationFormState>(emptyForm)
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
    const total = applications.length
    const approved = applications.filter((item) => toText((item as Record<string, unknown>).status).toLowerCase() === 'approved').length

    return [
      { label: 'Total Applications', value: String(total) },
      { label: 'Approved Applications', value: String(approved) },
    ]
  }, [applications])

  const visibleApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const sorted = [...applications].sort((left, right) => left.id - right.id)

    const filtered = query
      ? sorted.filter((item) => (
        [
          item.id,
          item.users_id,
          item.email,
          item.investor_type,
          item.residence_country,
          item.investment_budget,
          item.sectors_do_you_prefer,
          item.where_do_you_want_to_invest,
          item.stage_do_you_prefer,
          item.risk_level,
          item.return_type,
          item.preferred_contact,
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
  }, [applications, searchQuery, currentPage])

  async function loadApplications() {
    setLoading(true)
    setError(null)

    try {
      const rows = await fetchAdminInvestorApplications(accessToken)
      setApplications(rows)
      const nextDrafts: Record<number, string> = {}
      rows.forEach((item) => {
        const status = toText((item as Record<string, unknown>).status).trim().toLowerCase()
        nextDrafts[item.id] = allowedStatuses.includes(status as (typeof allowedStatuses)[number]) ? status : 'pending'
      })
      setStatusDraftById(nextDrafts)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load investor applications.')
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

    setConfirmStatusUpdateId(null)
    setStatusSavingId(applicationId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(buildApiUrl(`/admin/investor_applications/${applicationId}/status`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      })
      const payload = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Failed to update investor application status.'))
      }

      setApplications((prev) => prev.map((item) => (
        item.id === applicationId
          ? ({ ...item, status: nextStatus } as AdminInvestorApplication)
          : item
      )))
      setSuccess(getErrorMessage(payload, 'Investor application status updated successfully.'))
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Failed to update investor application status.')
    } finally {
      setStatusSavingId(null)
    }
  }

  useEffect(() => {
    void loadApplications()
  }, [])

  function closeForm() {
    setShowForm(false)
    setActiveId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  function closeViewModal() {
    setShowViewModal(false)
    setViewApplication(null)
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  function setFormFromApplication(application: AdminInvestorApplication) {
    setForm({
      users_id: toText(application.users_id),
      investor_type: toText(application.investor_type),
      residence_country: toText(application.residence_country),
      investment_budget: toText(application.investment_budget),
      investment_size: toText(application.investment_size),
      how_many_business_you_can_invest: toText(application.how_many_business_you_can_invest),
      type_of_investment: toText(application.type_of_investment),
      sectors_do_you_prefer: toText(application.sectors_do_you_prefer),
      where_do_you_want_to_invest: toText(application.where_do_you_want_to_invest),
      stage_do_you_prefer: toText(application.stage_do_you_prefer),
      risk_level: toText(application.risk_level),
      return_type: toText(application.return_type),
      expected_roi: toText(application.expected_roi),
      investment_duration: toText(application.investment_duration),
      what_do_you_look_in_business: toText(application.what_do_you_look_in_business),
      minimum_requirements: toText(application.minimum_requirements),
      how_involved_do_you_want: toText(application.how_involved_do_you_want),
      have_you_invested_before: toText(application.have_you_invested_before),
      number_of_investments: toText(application.number_of_investments),
      invested_sector: toText(application.invested_sector),
      success_stories: toText(application.success_stories),
      preferred_contact: toText(application.preferred_contact),
      availability: toText(application.availability),
      confirm_the_information_is_accurate: toBool(application.confirm_the_information_is_accurate),
      i_agree_to_terms: toBool(application.i_agree_to_terms),
      i_consent_to_be_matched_with_entrepreneurs: toBool(application.i_consent_to_be_matched_with_entrepreneurs),
      company_registration: toText(application.company_registration),
      proof_of_funds: toText(application.proof_of_funds),
      kyc: toText(application.kyc),
    })
  }

  async function openEdit(applicationId: number) {
    setFormError(null)
    setError(null)
    setSuccess(null)

    try {
      const application = await fetchAdminInvestorApplicationById(applicationId, accessToken)
      setActiveId(application.id)
      setFormFromApplication(application)
      setShowForm(true)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load investor application details.')
    }
  }

  async function openView(applicationId: number) {
    setError(null)
    setSuccess(null)

    try {
      const application = await fetchAdminInvestorApplicationById(applicationId, accessToken)
      setViewApplication(application)
      setShowViewModal(true)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load investor application details.')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSuccess(null)

    if (!activeId) {
      setFormError('No investor application is selected for update.')
      return
    }

    const parsedUserId = Number(form.users_id)
    if (!Number.isFinite(parsedUserId)) {
      setFormError('users_id must be a valid number.')
      return
    }

    const payload: AdminInvestorApplicationUpdatePayload = {
      users_id: parsedUserId,
      investor_type: form.investor_type.trim() || null,
      residence_country: form.residence_country.trim() || null,
      investment_budget: form.investment_budget.trim() || null,
      investment_size: form.investment_size.trim() || null,
      how_many_business_you_can_invest: form.how_many_business_you_can_invest.trim() || null,
      type_of_investment: form.type_of_investment.trim() || null,
      sectors_do_you_prefer: form.sectors_do_you_prefer.trim() || null,
      where_do_you_want_to_invest: form.where_do_you_want_to_invest.trim() || null,
      stage_do_you_prefer: form.stage_do_you_prefer.trim() || null,
      risk_level: form.risk_level.trim() || null,
      return_type: form.return_type.trim() || null,
      expected_roi: form.expected_roi.trim() || null,
      investment_duration: form.investment_duration.trim() || null,
      what_do_you_look_in_business: form.what_do_you_look_in_business.trim() || null,
      minimum_requirements: form.minimum_requirements.trim() || null,
      how_involved_do_you_want: form.how_involved_do_you_want.trim() || null,
      have_you_invested_before: form.have_you_invested_before.trim() || null,
      number_of_investments: form.number_of_investments.trim() || null,
      invested_sector: form.invested_sector.trim() || null,
      success_stories: form.success_stories.trim() || null,
      preferred_contact: form.preferred_contact.trim() || null,
      availability: form.availability.trim() || null,
      confirm_the_information_is_accurate: form.confirm_the_information_is_accurate,
      i_agree_to_terms: form.i_agree_to_terms,
      i_consent_to_be_matched_with_entrepreneurs: form.i_consent_to_be_matched_with_entrepreneurs,
      company_registration: form.company_registration.trim() || null,
      proof_of_funds: form.proof_of_funds.trim() || null,
      kyc: form.kyc.trim() || null,
    }

    setSaving(true)
    try {
      const responsePayload = await updateAdminInvestorApplication(activeId, payload, accessToken)

      setSuccess(responsePayload.message ?? 'Investor application updated successfully.')
      closeForm()
      await loadApplications()
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Failed to update investor application.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(applicationId: number) {
    setConfirmDeleteId(null)
    setDeletingId(applicationId)
    setError(null)
    setSuccess(null)

    try {
      const payload = await deleteAdminInvestorApplication(applicationId, accessToken)
      setApplications((prev) => prev.filter((item) => item.id !== applicationId))
      setSuccess(payload.message ?? 'Investor application deleted successfully.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete investor application.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminShell
      title="Investor Applications"
      subtitle="Review investor submissions, verify details, and progress approvals."
    >
      <section style={styles.grid}>
        {computedMetrics.map((metric, index) => (
          <article key={metric.label} style={styles.card} className="investor-app-metric-card">
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
            <h3 style={styles.confirmTitle}>Delete Investor Application?</h3>
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
              <h3 style={styles.modalTitle}>Edit Investor Application</h3>
              <button type="button" style={styles.closeBtn} onClick={closeForm}>x</button>
            </div>

            <form style={styles.form} onSubmit={handleSubmit}>
              {formError ? <p style={styles.formError}>{formError}</p> : null}

              <div style={styles.formGrid}>
                {editableTextFields.map((field) => (
                  <label style={styles.field} key={field.key}>
                    <span>{field.label}{field.key === 'users_id' ? ' *' : ''}</span>
                    {field.textarea ? (
                      <textarea
                        value={toText(form[field.key])}
                        onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                        style={{ ...styles.input, minHeight: 88, resize: 'vertical' }}
                        disabled={saving}
                      />
                    ) : (
                      <input
                        type="text"
                        value={toText(form[field.key])}
                        onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                        style={styles.input}
                        disabled={saving}
                      />
                    )}
                  </label>
                ))}

                <label style={styles.field}>
                  <span>Information Accurate</span>
                  <select
                    value={form.confirm_the_information_is_accurate ? 'true' : 'false'}
                    onChange={(event) => setForm((prev) => ({ ...prev, confirm_the_information_is_accurate: event.target.value === 'true' }))}
                    style={styles.input}
                    disabled={saving}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </label>

                <label style={styles.field}>
                  <span>Agreed To Terms</span>
                  <select
                    value={form.i_agree_to_terms ? 'true' : 'false'}
                    onChange={(event) => setForm((prev) => ({ ...prev, i_agree_to_terms: event.target.value === 'true' }))}
                    style={styles.input}
                    disabled={saving}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </label>

                <label style={styles.field}>
                  <span>Consent To Match</span>
                  <select
                    value={form.i_consent_to_be_matched_with_entrepreneurs ? 'true' : 'false'}
                    onChange={(event) => setForm((prev) => ({ ...prev, i_consent_to_be_matched_with_entrepreneurs: event.target.value === 'true' }))}
                    style={styles.input}
                    disabled={saving}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </label>
              </div>

              <div style={styles.previewSection}>
                <h4 style={styles.previewTitle}>Current Documents</h4>
                <div style={styles.previewGrid}>
                  {[
                    { label: 'Company Registration', value: form.company_registration },
                    { label: 'Proof Of Funds', value: form.proof_of_funds },
                    { label: 'KYC', value: form.kyc },
                  ].map((document) => (
                    <label key={document.label} style={styles.previewItem}>
                      <span style={styles.previewLabel}>{document.label}</span>
                      {document.value ? (
                        <a
                          href={toAssetUrl(document.value)}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.imageLink}
                          title="Open full file in new tab"
                        >
                          {isImagePath(document.value) ? (
                            <img src={toAssetUrl(document.value)} alt={document.label} style={styles.imagePreview} />
                          ) : (
                            <div style={styles.filePreview}>
                              <span style={styles.fileIcon}>{isPdfPath(document.value) ? 'PDF' : 'FILE'}</span>
                              <span style={styles.fileName}>{fileNameFromPath(document.value)}</span>
                            </div>
                          )}
                          <span style={styles.imageLinkText}>Click to open in new tab</span>
                        </a>
                      ) : (
                        <div style={styles.noImage}>No file available</div>
                      )}
                    </label>
                  ))}
                </div>
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

      {showViewModal && viewApplication ? (
        <div style={styles.overlay} onClick={closeViewModal}>
          <div style={styles.viewModal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Investor Application Details</h3>
              <button type="button" style={styles.closeBtn} onClick={closeViewModal}>x</button>
            </div>

            <div style={styles.viewBody}>
              <div style={styles.viewImageWrap}>
                <div style={styles.previewGrid}>
                  {[
                    { label: 'Company Registration', value: toText(viewApplication.company_registration) },
                    { label: 'Proof Of Funds', value: toText(viewApplication.proof_of_funds) },
                    { label: 'KYC', value: toText(viewApplication.kyc) },
                  ].map((document) => (
                    <div key={document.label} style={styles.viewImageCard}>
                      <span style={styles.previewLabel}>{document.label}</span>
                      {document.value ? (
                        <a href={toAssetUrl(document.value)} target="_blank" rel="noreferrer" style={styles.viewImageLink}>
                          {isImagePath(document.value) ? (
                            <img src={toAssetUrl(document.value)} alt={document.label} style={styles.viewImage} />
                          ) : (
                            <div style={styles.filePreview}>
                              <span style={styles.fileIcon}>{isPdfPath(document.value) ? 'PDF' : 'FILE'}</span>
                              <span style={styles.fileName}>{fileNameFromPath(document.value)}</span>
                            </div>
                          )}
                          <span style={styles.imageLinkText}>Open full-size file</span>
                        </a>
                      ) : (
                        <div style={styles.noImage}>No file available</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.viewGrid}>
                
                
                <div style={styles.viewItem}><span style={styles.viewLabel}>Email</span><strong>{toText(viewApplication.email) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Investor Type</span><strong>{toText(viewApplication.investor_type) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Residence Country</span><strong>{toText(viewApplication.residence_country) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Investment Budget</span><strong>{toText(viewApplication.investment_budget) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Investment Size</span><strong>{toText(viewApplication.investment_size) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Preferred Sectors</span><strong>{toText(viewApplication.sectors_do_you_prefer) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Preferred Location</span><strong>{toText(viewApplication.where_do_you_want_to_invest) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Risk Level</span><strong>{toText(viewApplication.risk_level) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Return Type</span><strong>{toText(viewApplication.return_type) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Expected ROI</span><strong>{toText(viewApplication.expected_roi) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Preferred Contact</span><strong>{toText(viewApplication.preferred_contact) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Availability</span><strong>{toText(viewApplication.availability) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Terms Agreed</span><strong>{toBool(viewApplication.i_agree_to_terms) ? 'Yes' : 'No'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Consent To Match</span><strong>{toBool(viewApplication.i_consent_to_be_matched_with_entrepreneurs) ? 'Yes' : 'No'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Information Accurate</span><strong>{toBool(viewApplication.confirm_the_information_is_accurate) ? 'Yes' : 'No'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Created At</span><strong>{toDateDisplay(viewApplication.created_at)}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Updated At</span><strong>{toDateDisplay(viewApplication.updated_at)}</strong></div>
              </div>
            </div>

            <div style={styles.viewActions}>
              <button type="button" style={styles.cancelBtn} onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      ) : null}

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <h3 style={styles.panelTitle}>Application Queue</h3>
            <p style={styles.panelText}>Live investor application records with one-click actions for view, edit, and delete.</p>
          </div>
          <div style={styles.panelHeaderActions}>
            <span style={styles.countPill}>{visibleApplications.totalItems} records</span>
            <button type="button" style={styles.refreshBtn} onClick={() => void loadApplications()}>
              Refresh
            </button>
          </div>
        </div>

        <div style={styles.searchRow}>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by type, email, user id, budget, sectors, or risk..."
            style={styles.searchInput}
          />
          <span style={styles.searchHint}>
            Showing {visibleApplications.items.length} of {visibleApplications.totalItems}
          </span>
        </div>

        {loading ? <p style={styles.panelText}>Loading investor applications...</p> : null}

        {!loading && visibleApplications.totalItems === 0 ? (
          <p style={styles.panelText}>No investor applications found.</p>
        ) : null}

        {!loading && visibleApplications.totalItems > 0 ? (
          <div style={styles.tableWrap}>
            <table style={styles.table} className="investor-app-table">
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Investor Type</th>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Budget</th>
                  <th style={styles.th}>Preferred Sectors</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleApplications.items.map((item, index) => (
                  <tr key={item.id} className="investor-app-row" style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={styles.td}>{(visibleApplications.currentPage - 1) * pageSize + index + 1}</td>
                    
                    <td style={styles.td}>{toText(item.investor_type) || '-'}</td>
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        
                        <div style={styles.nameTextWrap}>
                          <strong style={styles.namePrimary}>{toText(item.email) || 'Unknown email'}</strong>
                          
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{toText(item.investment_budget) || '-'}</td>
                    <td style={styles.td}>{toText(item.sectors_do_you_prefer) || '-'}</td>
                    <td style={styles.td}>{toText(item.preferred_contact) || '-'}</td>
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

        {!loading && visibleApplications.totalPages > 1 ? (
          <div style={styles.pagination}>
            <button
              type="button"
              style={styles.pageBtn}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={visibleApplications.currentPage === 1}
            >
              Prev
            </button>

            <div style={styles.pageNumbers}>
              {Array.from({ length: visibleApplications.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  style={{
                    ...styles.pageBtn,
                    ...(pageNumber === visibleApplications.currentPage ? styles.pageBtnActive : {}),
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
              onClick={() => setCurrentPage((page) => Math.min(visibleApplications.totalPages, page + 1))}
              disabled={visibleApplications.currentPage === visibleApplications.totalPages}
            >
              Next
            </button>
          </div>
        ) : null}
      </section>

      <style>{`
        .investor-app-metric-card {
          position: relative;
          overflow: hidden;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .investor-app-metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 36px rgba(15, 30, 53, 0.12);
        }

        .investor-app-table tbody tr {
          transition: background 180ms ease;
        }

        .investor-app-table tbody tr:hover {
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
    minWidth: 980,
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
    minWidth: 34,
    height: 34,
    padding: '0 8px',
    borderRadius: 17,
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
    fontSize: 11,
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
    width: 'min(1020px, 100%)',
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
    fontFamily: 'inherit',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  previewSection: {
    border: '1px solid #d8e8eb',
    borderRadius: 12,
    padding: 12,
    background: '#fcfefe',
    display: 'grid',
    gap: 10,
  },
  previewTitle: {
    margin: 0,
    color: '#023341',
    fontSize: 15,
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 10,
  },
  previewItem: {
    display: 'grid',
    gap: 6,
  },
  previewLabel: {
    color: '#4f6f78',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: 700,
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
    display: 'grid',
    gap: 10,
  },
  viewImageCard: {
    border: '1px solid #dde7f3',
    borderRadius: 16,
    background: 'linear-gradient(180deg, #fcfefe 0%, #f6fbfc 100%)',
    padding: 12,
    boxShadow: '0 8px 24px rgba(14, 42, 79, 0.08)',
    display: 'grid',
    gap: 8,
  },
  viewImageLink: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
  },
  viewImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    objectFit: 'cover',
    border: '1px solid #cfdceb',
    background: '#f5f8fc',
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
  filePreview: {
    minHeight: 72,
    borderRadius: 10,
    border: '1px dashed #cfdbea',
    background: '#f9fcfd',
    color: '#2e5379',
    display: 'grid',
    gap: 8,
    justifyItems: 'center',
    alignContent: 'center',
    padding: '10px 12px',
    textAlign: 'center',
  },
  fileIcon: {
    background: 'linear-gradient(180deg, #ea3a3a 0%, #b71d1d 100%)',
    color: '#ffffff',
    borderRadius: 7,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.4,
    padding: '3px 8px',
  },
  fileName: {
    color: '#2e5379',
    fontWeight: 700,
    fontSize: 12,
    wordBreak: 'break-word',
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
