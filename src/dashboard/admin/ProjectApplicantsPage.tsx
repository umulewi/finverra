import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminShell from './AdminShell'
import { getAuthSession } from '../authStorage'
import { buildApiUrl } from '../../config/api'

type ProjectApplicant = Record<string, unknown> & {
  id?: number | string
  title?: string | null
  first_name?: string | null
  last_name?: string | null
  status?: string | null
  created_at?: string | null
}

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

export default function ProjectApplicantsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applicants, setApplicants] = useState<ProjectApplicant[]>([])
  const [search, setSearch] = useState('')
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'not_approved'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const token = getAccessToken()
        if (!token) throw new Error('No authentication token found. Please sign in again.')

        const response = await fetch(buildApiUrl('/admin/project-applicants'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await parseResponseBody(response)

        if (!response.ok) {
          const message = typeof payload === 'object' && payload && 'message' in payload ? String((payload as any).message) : 'Failed to load project applicants.'
          throw new Error(message)
        }

        const rows = Array.isArray((payload as any)?.applicants) ? (payload as any).applicants : []
        if (mounted) setApplicants(rows)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load project applicants.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [])

  const filteredApplicants = useMemo(() => {
    const query = search.trim().toLowerCase()
    const approvalFiltered = approvalFilter === 'all'
      ? applicants
      : applicants.filter((item) => {
        const status = toText(item.status).trim().toLowerCase()
        return approvalFilter === 'approved' ? status === 'approved' : status !== 'approved'
      })

    if (!query) return approvalFiltered

    return approvalFiltered.filter((item) => (
      [
        item.title,
        item.first_name,
        item.last_name,
        item.status,
        item.id,
        item.project_id,
        item.investor_id,
        item.created_at,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(query))
    ))
  }, [applicants, search, approvalFilter])

  const pagedApplicants = useMemo(() => {
    const totalItems = filteredApplicants.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const safePage = Math.min(Math.max(1, currentPage), totalPages)
    const startIndex = (safePage - 1) * pageSize
    return {
      items: filteredApplicants.slice(startIndex, startIndex + pageSize),
      totalPages,
      totalItems,
      currentPage: safePage,
      startIndex,
    }
  }, [filteredApplicants, currentPage])

  const stats = useMemo(() => [
    { label: 'Total Applicants', value: String(applicants.length) },
    { label: 'Matched Results', value: String(filteredApplicants.length) },
  ], [applicants.length, filteredApplicants.length])

  return (
    <AdminShell title="Project Applicants" subtitle="Investors who applied to projects.">
      <section style={styles.page}>
        <div style={styles.headerRow}>
          <div>
            <h3 style={styles.heading}>Project Applicants</h3>
            <p style={styles.description}>Review which investors applied to each project and when they submitted the application.</p>
          </div>
          <label style={styles.searchBox}>
            <span style={styles.searchLabel}>Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project or investor"
              style={styles.searchInput}
            />
            <select
              value={approvalFilter}
              onChange={(e) => {
                setApprovalFilter(e.target.value as 'all' | 'approved' | 'not_approved')
                setCurrentPage(1)
              }}
              style={{ ...styles.searchInput, width: 180, marginTop: 8 }}
              aria-label="Filter by approval status"
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="not_approved">Not Approved</option>
            </select>
          </label>
        </div>

        <div style={styles.statsGrid}>
          {stats.map((stat) => (
            <div key={stat.label} style={styles.statCard}>
              <span style={styles.statLabel}>{stat.label}</span>
              <strong style={styles.statValue}>{stat.value}</strong>
            </div>
          ))}
        </div>

        {loading ? <div style={styles.notice}>Loading project applicants…</div> : null}
        {error ? <div style={{ ...styles.notice, ...styles.error }}>{error}</div> : null}

        {!loading && !error && filteredApplicants.length === 0 ? (
          <div style={styles.notice}>No project applicants found.</div>
        ) : null}

        {!loading && !error && filteredApplicants.length > 0 ? (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Applicant</th>
                  <th style={styles.th}>Project</th>
                  <th style={styles.th}>Attachment</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Invest Type</th>
                  <th style={styles.th}>Submitted</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedApplicants.items.map((item, i) => {
                  const applicantName = `${toText(item.first_name)} ${toText(item.last_name)}`.trim() || 'Unknown investor'
                  const projectTitle = toText(item.title).trim() || 'Untitled project'
                  const status = toText(item.status).trim() || 'Submitted'
                  const amount = toText((item as any).amount)
                  const investmentType = toText((item as any).investment_type)

                  return (
                    <tr key={String(item.id ?? `${applicantName}-${projectTitle}`)}>
                      <td style={styles.td}>{pagedApplicants.startIndex + i + 1}</td>
                      <td style={styles.td}>
                        <div style={styles.primaryCell}>{applicantName}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.primaryCell}>{projectTitle}</div>
                      </td>
                      <td style={styles.td}>
                        {(() => {
                          const attachmentPath = toText((item as any).attachment_path)
                          if (!attachmentPath) return '-'
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
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge}>{status}</span>
                      </td>
                      <td style={styles.td}>{amount || '-'}</td>
                      <td style={styles.td}>{investmentType || '-'}</td>
                      <td style={styles.td}>{formatDateShort(item.created_at)}</td>
                      <td style={styles.td}>
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/admin/project-applicants/${String(item.id)}`)}
                          style={styles.viewMoreButton}
                        >
                          View more
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={styles.paginationWrap}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={styles.navBtn}
                disabled={pagedApplicants.currentPage === 1}
              >
                Prev
              </button>
              <div style={styles.navInfo}>
                Page {pagedApplicants.currentPage} of {pagedApplicants.totalPages}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(pagedApplicants.totalPages, p + 1))}
                style={styles.navBtn}
                disabled={pagedApplicants.currentPage === pagedApplicants.totalPages}
              >
                Next
              </button>
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
    alignItems: 'flex-end',
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
    maxWidth: 700,
    lineHeight: 1.5,
  },
  searchBox: {
    display: 'grid',
    gap: 6,
    minWidth: 280,
  },
  searchLabel: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    color: '#023341',
  },
  searchInput: {
    height: 44,
    borderRadius: 10,
    border: '1px solid rgba(2,51,65,0.14)',
    padding: '0 14px',
    fontSize: 14,
    outline: 'none',
    background: '#fff',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },
  statCard: {
    background: '#fff',
    border: '1px solid rgba(2,51,65,0.08)',
    borderRadius: 14,
    padding: 16,
  },
  statLabel: {
    display: 'block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    color: '#6b7a94',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    color: '#023341',
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
  tableWrap: {
    overflowX: 'auto',
    background: '#fff',
    borderRadius: 14,
    border: '1px solid rgba(2,51,65,0.08)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 860,
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    color: '#6b7a94',
    borderBottom: '1px solid rgba(2,51,65,0.08)',
    background: '#fbfdfe',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid rgba(2,51,65,0.06)',
    color: '#023341',
    verticalAlign: 'top',
  },
  primaryCell: {
    fontWeight: 700,
    color: '#023341',
  },
  secondaryCell: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7a94',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(2,51,65,0.06)',
    color: '#023341',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'capitalize',
  },
  viewMoreButton: {
    height: 36,
    padding: '0 12px',
    borderRadius: 10,
    border: 'none',
    background: '#023341',
    color: '#ffec00',
    fontWeight: 700,
    cursor: 'pointer',
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
  paginationWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
  },
  navBtn: {
    border: '1px solid rgba(2,51,65,0.12)',
    borderRadius: 8,
    padding: '8px 12px',
    background: '#fff',
    color: '#023341',
    cursor: 'pointer',
    fontWeight: 700,
  },
  navInfo: {
    fontSize: 13,
    color: '#365463',
    fontWeight: 700,
  },
}