import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminShell from './AdminShell'
import { getAuthSession } from '../authStorage'
import { buildApiUrl } from '../../config/api'

type ApplicantRecord = Record<string, unknown>
const allowedStatuses = ['pending', 'approved', 'rejected'] as const
type ApplicantStatus = (typeof allowedStatuses)[number]

function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) return response.json()
  return response.text().then((text) => {
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  })
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }
  return fallbackMessage
}

function getAccessToken() {
  const session = getAuthSession()
  if (!session) return ''
  if (typeof session.payload === 'string') return session.payload
  if (typeof session.payload === 'object' && session.payload !== null) {
    const payload = session.payload as { token?: unknown; accessToken?: unknown; access_token?: unknown; jwt?: unknown }
    if (typeof payload.token === 'string') return payload.token
    if (typeof payload.accessToken === 'string') return payload.accessToken
    if (typeof payload.access_token === 'string') return payload.access_token
    if (typeof payload.jwt === 'string') return payload.jwt
  }
  return ''
}

function toText(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function formatLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function formatValue(value: unknown) {
  if (value == null || value === '') return 'Not provided'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}


function formatDateShort(value: unknown) {
  const text = toText(value)
  if (!text) return 'Not provided'
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return text
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

export default function ProjectApplicantDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [applicant, setApplicant] = useState<ApplicantRecord | null>(null)
  const [statusDraft, setStatusDraft] = useState<ApplicantStatus>('pending')

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        if (!id) throw new Error('Invalid applicant id.')

        const token = getAccessToken()
        if (!token) throw new Error('No authentication token found. Please sign in again.')

        const response = await fetch(buildApiUrl(`/admin/project-applicants/${encodeURIComponent(id)}`), {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await parseResponseBody(response)

        if (!response.ok) {
          throw new Error(getErrorMessage(payload, 'Failed to load applicant details.'))
        }

        const record = (payload as any)?.applicant ?? null
        if (mounted) {
          setApplicant(record)
          const nextStatus = String(record?.status ?? '').trim().toLowerCase()
          setStatusDraft(allowedStatuses.includes(nextStatus as ApplicantStatus) ? (nextStatus as ApplicantStatus) : 'pending')
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load applicant details.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [id])

  async function handleUpdateStatus() {
    if (!id) {
      setError('Invalid applicant id.')
      return
    }

    if (!allowedStatuses.includes(statusDraft)) {
      setError('Status must be one of: pending, approved, rejected.')
      return
    }

    setStatusSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const token = getAccessToken()
      if (!token) throw new Error('No authentication token found. Please sign in again.')

      const response = await fetch(buildApiUrl(`/admin/project-applicants/${encodeURIComponent(id)}/status`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: statusDraft }),
      })
      const payload = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Failed to update applicant status.'))
      }

      setApplicant((prev) => (prev ? ({ ...prev, status: statusDraft } as ApplicantRecord) : prev))
      setSuccess(getErrorMessage(payload, 'Project applicant status updated successfully.'))
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update applicant status.')
    } finally {
      setStatusSaving(false)
    }
  }

  const currentStatus = String(applicant?.status ?? '').trim().toLowerCase()
  const statusValue = allowedStatuses.includes(currentStatus as ApplicantStatus) ? currentStatus : statusDraft

  const entries = useMemo(() => {
    if (!applicant) return [] as Array<[string, unknown]>

    const hidden = new Set([
      'id',
      'investor_id',
      'status',
      'nda_action',
      'project_id',
      'save_for_later',
      'attachment_path',
      'upload',
      'created_at',
      'updated_at',
    ])

    return Object.entries(applicant)
      .filter(([key]) => !['__proto__', 'constructor', 'prototype'].includes(key))
      .filter(([key]) => {
        if (hidden.has(key)) return false
        if (/^\d+$/.test(key)) return false
        return true
      })
      .sort(([left], [right]) => left.localeCompare(right))
  }, [applicant])

  return (
    <AdminShell title="Project Applicant Details" subtitle="Complete application record for one investor.">
      <section style={styles.page}>
        <div style={styles.headerRow}>
          <div>
            <h3 style={styles.heading}>Applicant Details</h3>
            <p style={styles.description}>A complete view of the selected investor application.</p>
          </div>
          <button type="button" onClick={() => navigate(-1)} style={styles.backButton}>
            ← Back to applicants
          </button>
        </div>

        {loading ? <div style={styles.notice}>Loading applicant details…</div> : null}
        {error ? <div style={{ ...styles.notice, ...styles.error }}>{error}</div> : null}
        {success ? <div style={{ ...styles.notice, ...styles.success }}>{success}</div> : null}

        {!loading && !error && applicant ? (
          <div style={styles.card}>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Applicant</span>
                <strong style={styles.summaryValue}>{`${toText(applicant.first_name)} ${toText(applicant.last_name)}`.trim() || 'Unknown investor'}</strong>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Project</span>
                <strong style={styles.summaryValue}>{toText(applicant.title) || 'Untitled project'}</strong>
              </div>

              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Status</span>
                <div style={styles.statusEditor}>
                  <select
                    value={statusValue}
                    onChange={(event) => setStatusDraft(event.target.value as ApplicantStatus)}
                    style={styles.statusSelect}
                  >
                    {allowedStatuses.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { void handleUpdateStatus() }}
                    disabled={statusSaving || statusDraft === currentStatus}
                    style={styles.updateButton}
                  >
                    {statusSaving ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
              
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Attachment</span>
                <strong style={styles.summaryValue}>
                  {(() => {
                    const attachmentPath = toText((applicant as any).attachment_path)
                    if (!attachmentPath) return 'Not provided'
                    const url = attachmentPath.startsWith('http')
                      ? attachmentPath
                      : buildApiUrl(attachmentPath.startsWith('/') ? attachmentPath : `/${attachmentPath}`)
                    return (
                      <button
                        type="button"
                        onClick={() => window.open(String(url), '_blank', 'noopener')}
                        style={styles.openButton}
                      >
                        Open
                      </button>
                    )
                  })()}
                </strong>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Submitted</span>
                <strong style={styles.summaryValue}>{formatDateShort(applicant.created_at)}</strong>
              </div>
              {applicant.updated_at ? (
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>Updated</span>
                  <strong style={styles.summaryValue}>{formatDateShort(applicant.updated_at)}</strong>
                </div>
              ) : null}
            </div>

            <div style={styles.fieldsGrid}>
              {entries.map(([key, value]) => (
                <div key={key} style={styles.fieldCard}>
                  <span style={styles.fieldLabel}>{formatLabel(key)}</span>
                  <div style={styles.fieldValue}>
                    {typeof value === 'object' && value !== null ? (
                      <pre style={styles.pre}>{formatValue(value)}</pre>
                    ) : (
                      formatValue(value)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: 'grid',
    gap: 18,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  heading: {
    margin: 0,
    fontSize: 28,
    color: '#023341',
  },
  description: {
    margin: '6px 0 0',
    color: '#5f6f83',
    lineHeight: 1.5,
  },
  backButton: {
    height: 42,
    padding: '0 14px',
    borderRadius: 10,
    border: '1px solid rgba(2,51,65,0.14)',
    background: '#fff',
    color: '#023341',
    fontWeight: 700,
    cursor: 'pointer',
  },
  notice: {
    padding: 14,
    borderRadius: 12,
    background: '#f8fbfd',
    border: '1px solid rgba(2,51,65,0.08)',
    color: '#365463',
  },
  error: {
    background: 'rgba(192,57,43,0.08)',
    border: '1px solid rgba(192,57,43,0.18)',
    color: '#8b1d1d',
  },
  success: {
    background: 'rgba(34,139,84,0.08)',
    border: '1px solid rgba(34,139,84,0.18)',
    color: '#135b35',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    border: '1px solid rgba(2,51,65,0.08)',
    padding: 18,
    display: 'grid',
    gap: 18,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },
  summaryItem: {
    padding: 14,
    borderRadius: 12,
    background: '#f8fbfd',
    border: '1px solid rgba(2,51,65,0.06)',
  },
  summaryLabel: {
    display: 'block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    color: '#6b7a94',
    marginBottom: 6,
  },
  summaryValue: {
    color: '#023341',
  },
  statusEditor: {
    display: 'grid',
    gap: 10,
  },
  statusSelect: {
    height: 42,
    borderRadius: 10,
    border: '1px solid rgba(2,51,65,0.14)',
    padding: '0 12px',
    background: '#fff',
    color: '#023341',
    fontWeight: 600,
    outline: 'none',
  },
  updateButton: {
    height: 40,
    padding: '0 14px',
    borderRadius: 10,
    border: 'none',
    background: '#023341',
    color: '#ffec00',
    fontWeight: 700,
    cursor: 'pointer',
  },
  fieldsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12,
  },
  fieldCard: {
    padding: 14,
    borderRadius: 12,
    border: '1px solid rgba(2,51,65,0.06)',
    background: '#fbfdfe',
  },
  fieldLabel: {
    display: 'block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    color: '#6b7a94',
    marginBottom: 8,
  },
  fieldValue: {
    color: '#023341',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
  },
  pre: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    fontFamily: 'inherit',
  },
  attachmentLink: {
    color: '#023341',
    textDecoration: 'underline',
  },
  openButton: {
    height: 36,
    padding: '0 12px',
    borderRadius: 10,
    border: '1px solid rgba(2,51,65,0.12)',
    background: '#fff',
    color: '#023341',
    fontWeight: 700,
    cursor: 'pointer',
  },
}