import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'
import InvestorLayout, { investorCardStyle } from './InvestorLayout'

// ─── Brand tokens ────────────────────────────────────────────────────────────
const BRAND_DARK = '#023341'
const BRAND_YELLOW = '#ffec00'
const BRAND_YELLOW_PALE = '#fffbe6'
const BRAND_MID = 'rgba(2,51,65,0.08)'
const BRAND_BORDER = 'rgba(2,51,65,0.14)'

// ─── Types ───────────────────────────────────────────────────────────────────
type AppliedProjectRecord = Record<string, unknown> & {
  id?: number | string
  project_id?: number | string
  investor_id?: number | string
  amount?: string | number | null
  shares?: string | number | null
  investment_type?: string | null
  timeline?: string | null
  conditions_text?: string | null
  nda?: string | null
  nda_action?: string | null
  documents?: string | null
  attachment_path?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  project_title?: string | null
  title?: string | null
  project_name?: string | null
}

type ApiResponse = unknown

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) return response.json()
  return response.text().then((text) => {
    try { return JSON.parse(text) } catch { return text }
  })
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }
  return fallbackMessage
}

function authHeader(): HeadersInit {
  const session = getAuthSession()
  if (!session || typeof session.payload !== 'object' || session.payload === null) {
    return {}
  }
  const payload = session.payload as { token?: unknown; accessToken?: unknown; access_token?: unknown; jwt?: unknown }
  const tokenValue = typeof payload.token === 'string'
    ? payload.token
    : typeof payload.accessToken === 'string'
      ? payload.accessToken
      : typeof payload.access_token === 'string'
        ? payload.access_token
        : typeof payload.jwt === 'string'
          ? payload.jwt
          : ''
  return tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}
}

function resolveUserId() {
  const session = getAuthSession()
  if (!session) return null
  const payload = session.payload as {
    user?: { id?: unknown; users_id?: unknown }
    id?: unknown
    users_id?: unknown
  } | string | null
  if (!payload || typeof payload === 'string') return null
  const candidate = payload.user?.id ?? payload.user?.users_id ?? payload.id ?? payload.users_id
  const parsed = Number(candidate)
  return Number.isFinite(parsed) ? parsed : null
}

function toText(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatValue(value: unknown) {
  const text = toText(value).trim()
  return text || 'Not provided'
}

function formatDate(value: unknown) {
  const text = toText(value)
  if (!text) return 'Not provided'
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return text
  return date.toLocaleString()
}

function formatCurrency(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return formatValue(value)
  return `RWF ${parsed.toLocaleString()}`
}

function getProjectName(item: AppliedProjectRecord) {
  return (
    toText(item.project_title).trim() ||
    toText(item.project_name).trim() ||
    toText(item.title).trim() ||
    `Project #${formatValue(item.project_id)}`
  )
}

/** Returns 2-letter initials from a project name */
function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function extractDocumentsFromRecord(item: AppliedProjectRecord | null) {
  if (!item) return [] as Array<{ url: string; name: string; isImage: boolean }>
  const docs: string[] = []
  const pushIf = (v: unknown) => {
    if (!v) return
    if (Array.isArray(v)) v.forEach((x) => typeof x === 'string' && docs.push(x))
    else if (typeof v === 'string') {
      const s = v.trim()
      if (s.startsWith('[')) {
        try {
          const parsed = JSON.parse(s)
          if (Array.isArray(parsed)) { parsed.forEach((x) => typeof x === 'string' && docs.push(x)); return }
        } catch {}
      }
      docs.push(v)
    }
  }
  pushIf(item.documents)
  pushIf(item.attachment_path)
  pushIf(item.nda)
  return docs.map((d) => {
    let url = d
    if (!url.includes('://') && !url.startsWith('/')) url = buildApiUrl(url)
    const lower = url.toLowerCase()
    const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif')
    const name = url.split('/').pop() ?? url
    return { url, name, isImage }
  })
}

function normalizeRecords(payload: ApiResponse) {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const o = payload as { data?: unknown; projects?: unknown; applications?: unknown; rows?: unknown; results?: unknown }
    if (Array.isArray(o.data)) return o.data
    if (Array.isArray(o.projects)) return o.projects
    if (Array.isArray(o.applications)) return o.applications
    if (Array.isArray(o.rows)) return o.rows
    if (Array.isArray(o.results)) return o.results
  }
  return []
}

function getStatusLabel(status: unknown) {
  const text = toText(status).trim()
  return text || 'Submitted'
}

type StatusTone = { bg: string; color: string; border: string }

function getStatusTone(status: unknown): StatusTone {
  const text = toText(status).toLowerCase()
  if (text.includes('approve')) return { bg: '#e8f5ee', color: '#1a5c36', border: '#b8dfc8' }
  if (text.includes('reject'))  return { bg: '#fdf0f0', color: '#8b1a1a', border: '#f5c5c5' }
  if (text.includes('review') || text.includes('pending')) return { bg: BRAND_YELLOW_PALE, color: '#7a5c00', border: BRAND_YELLOW }
  return { bg: BRAND_MID, color: BRAND_DARK, border: BRAND_BORDER }
}

async function fetchAppliedProjects(investorId: number) {
  const candidatePaths = [
    `/investors/select_project_applied_for/${encodeURIComponent(String(investorId))}`,
    `/investors/select_project_applied_for/id/${encodeURIComponent(String(investorId))}`,
    `/investors/select_project_applied_for?id=${encodeURIComponent(String(investorId))}`,
    `/investors/select_project_applied_for/id?id=${encodeURIComponent(String(investorId))}`,
  ]
  let lastError: string | null = null
  for (const path of candidatePaths) {
    const response = await fetch(buildApiUrl(path), { headers: authHeader() })
    const payload = await parseResponseBody(response)
    if (response.ok) return payload
    lastError = getErrorMessage(payload, response.statusText || 'Failed to load applied projects.')
    if (response.status !== 404) throw new Error(lastError)
  }
  throw new Error(lastError || 'Applied projects endpoint was not found.')
}

function isAppliedProjectRecord(item: unknown): item is AppliedProjectRecord {
  return !!item && typeof item === 'object'
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function AppliedProjectsPage() {
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [records, setRecords]       = useState<AppliedProjectRecord[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'pending' | 'approved' | 'rejected'>('all')
  const [cardColumns, setCardColumns] = useState(() => {
    if (typeof window === 'undefined') return 1
    if (window.innerWidth >= 1280) return 3
    if (window.innerWidth >= 860) return 2
    return 1
  })

  // Load data
  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true); setError(null)
      try {
        const userId = resolveUserId()
        if (!userId) throw new Error('No logged-in user id found. Please log in again.')

        const investorIdRes = await fetch(buildApiUrl(`/investors_id/${encodeURIComponent(String(userId))}`), {
          headers: authHeader(),
        })
        const investorIdPayload = await parseResponseBody(investorIdRes)
        if (!investorIdRes.ok) throw new Error(getErrorMessage(investorIdPayload, 'Failed to resolve investor id.'))

        const investorId = toNumber((investorIdPayload as { investor_id?: unknown })?.investor_id)
        if (investorId == null) throw new Error('Invalid investor_id returned by the server.')

        const appliedPayload = await fetchAppliedProjects(investorId)
        const rows = normalizeRecords(appliedPayload)
          .filter(isAppliedProjectRecord)
          .filter((item) => toNumber(item.investor_id) === investorId || item.investor_id == null)

        if (!mounted) return
        setRecords(rows)
        setSelectedId((current) => current ?? toNumber(rows[0]?.id))
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load applied projects.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [])

  // Responsive columns
  useEffect(() => {
    function update() {
      if (window.innerWidth >= 1280) { setCardColumns(3); return }
      if (window.innerWidth >= 860)  { setCardColumns(2); return }
      setCardColumns(1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const navigate = useNavigate()

  const totalAmount = useMemo(() =>
    records.reduce((sum, r) => { const a = Number(r.amount); return Number.isFinite(a) ? sum + a : sum }, 0),
  [records])

  const filteredRecords = useMemo(() => {
    if (statusFilter === 'all') return records
    return records.filter((record) => {
      const s = toText(record.status).toLowerCase()
      
      if (statusFilter === 'approved')  return s.includes('approve')
      if (statusFilter === 'rejected')  return s.includes('reject')
      if (statusFilter === 'pending')   return s.includes('pending') || s.includes('review')
      return !s || s === 'submitted'
    })
  }, [records, statusFilter])

  // ─── Filter chips config ────────────────────────────────────────────────
  const filterOptions = [
    { key: 'all',       label: 'All' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'pending',   label: 'Pending / Review' },
    { key: 'approved',  label: 'Approved' },
    { key: 'rejected',  label: 'Rejected' },
  ] as const

  return (
    <InvestorLayout>
      <section style={investorCardStyle}>

        {/* ── Header ── */}
        <div style={styles.headerBlock}>
          <p style={styles.kicker}>Investor Applications</p>
          <h2 style={styles.title}>Projects I have applied for</h2>
          <p style={styles.description}>
            View the projects you have applied for and review your submitted investment details.
          </p>
        </div>

        {/* ── States ── */}
        {loading ? <div style={styles.notice}>Loading applied projects…</div> : null}
        {error   ? <div style={{ ...styles.notice, ...styles.errorNotice }}>{error}</div> : null}

        {/* ── Metrics ── */}
        {!loading && !error && records.length > 0 ? (
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Applications</span>
              <strong style={styles.metricValue}>{records.length}</strong>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Total amount</span>
              <strong style={styles.metricValue}>{formatCurrency(totalAmount)}</strong>
            </div>
            
          </div>
        ) : null}

        {!loading && !error && records.length === 0 ? (
          <div style={styles.notice}>No applied projects were found for your account.</div>
        ) : null}

        {/* ── Cards ── */}
        {!loading && !error && records.length > 0 ? (
          <div style={styles.stackLayout}>

            {/* Filter chips */}
            <div style={styles.filterBar}>
              {filterOptions.map((opt) => {
                const active = statusFilter === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setStatusFilter(opt.key)}
                    style={{ ...styles.filterChip, ...(active ? styles.filterChipActive : {}) }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <div style={styles.filterSummary}>
              Showing {filteredRecords.length} of {records.length} applications
            </div>

            {/* Card grid */}
            <div style={{ ...styles.cardGrid, gridTemplateColumns: `repeat(${cardColumns}, minmax(0,1fr))` }}>
              {filteredRecords.map((record) => {
                const isSelected  = toNumber(record.id) === selectedId
                const statusTone  = getStatusTone(record.status)
                const idNum       = toNumber(record.id)
                const name        = getProjectName(record)
                const initials    = getInitials(name)
                const docs        = extractDocumentsFromRecord(record)
                const thumb       = docs[0]

                return (
                  <div key={String(record.id)} style={{ position: 'relative' }}>
                    

                    <button
                      type="button"
                      onClick={() => setSelectedId(idNum)}
                      style={{
                        ...styles.applicationCard,
                        ...(isSelected ? styles.applicationCardActive : {}),
                      }}
                    >
                      {/* Top row: avatar + title + badge */}
                      <div style={styles.cardTop}>
                        <div style={styles.avatar}>
                          {thumb?.isImage
                            ? <img src={thumb.url} alt={thumb.name} style={styles.avatarImg} />
                            : initials
                          }
                        </div>

                        <div style={styles.cardHead}>
                          <span style={styles.projectTitle}>{name}</span>
                          <span style={styles.cardSub}>{formatDate(record.created_at)}</span>
                        </div>

                        <span style={{
                          ...styles.statusBadge,
                          background:   statusTone.bg,
                          color:        statusTone.color,
                          borderColor:  statusTone.border,
                        }}>
                          {getStatusLabel(record.status)}
                        </span>
                      </div>

                      {/* Divider */}
                      <div style={styles.divider} />

                      {/* Meta pills */}
                      <div style={styles.metaRow}>
                        <div style={styles.metaItem}>
                          <span style={styles.metaLabel}>Amount</span>
                          <strong style={styles.metaValue}>{formatCurrency(record.amount)}</strong>
                        </div>
                        <div style={styles.metaItem}>
                          <span style={styles.metaLabel}>Type</span>
                          <strong style={styles.metaValue}>{formatValue(record.investment_type)}</strong>
                        </div>
                        <div style={styles.metaItem}>
                          <span style={styles.metaLabel}>Shares</span>
                          <strong style={styles.metaValue}>{formatValue(record.shares)}</strong>
                        </div>
                      </div>

                      {/* Footer */}
                      <div style={styles.cardFooter}>
                        <span style={styles.projId}>#{formatValue(record.project_id)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/dashboard/investor/applied-projects/${String(record.id)}`, { state: { record } })
                          }}
                          style={styles.viewDetailsButton}
                        >
                          View details →
                        </button>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>

          </div>
        ) : null}
      </section>
    </InvestorLayout>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, CSSProperties> = {
  // Header
  headerBlock: { marginBottom: 20 },
  kicker: {
    margin: 0,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: BRAND_DARK,
    opacity: 0.55,
  },
  title: { margin: '6px 0 8px', fontSize: 26, fontWeight: 700, color: BRAND_DARK },
  description: { margin: 0, maxWidth: 680, color: BRAND_DARK, opacity: 0.6, lineHeight: 1.6, fontSize: 14 },

  // Metrics row
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    background: BRAND_DARK,
    borderRadius: 12,
    padding: '14px 16px',
  },
  metricLabel: {
    display: 'block',
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: BRAND_YELLOW,
    opacity: 0.75,
    marginBottom: 4,
  },
  metricValue: {
    display: 'block',
    fontSize: 22,
    fontWeight: 700,
    color: BRAND_YELLOW,
  },

  // Layout
  stackLayout: { display: 'grid', gap: 16 },

  // Filter bar
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '10px 12px',
    borderRadius: 14,
    background: BRAND_MID,
    border: `1px solid ${BRAND_BORDER}`,
  },
  filterChip: {
    border: `1px solid ${BRAND_BORDER}`,
    background: '#ffffff',
    color: BRAND_DARK,
    borderRadius: 999,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
  },
  filterChipActive: {
    background: BRAND_DARK,
    color: BRAND_YELLOW,
    borderColor: BRAND_DARK,
  },
  filterSummary: { fontSize: 12, color: BRAND_DARK, opacity: 0.4 },

  // Card grid
  cardGrid: { display: 'grid', gap: 14 },

  // Card shell
  applicationCard: {
    width: '100%',
    textAlign: 'left',
    borderRadius: 16,
    border: `1px solid ${BRAND_BORDER}`,
    background: '#ffffff',
    padding: 16,
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  },
  applicationCardActive: {
    border: `2px solid ${BRAND_DARK}`,
    background: '#fafcfd',
  },

  // Card internals
  cardTop: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: BRAND_DARK,
    color: BRAND_YELLOW,
    fontSize: 13,
    fontWeight: 700,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  cardHead: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 },
  projectTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: BRAND_DARK,
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardSub: { fontSize: 11, color: BRAND_DARK, opacity: 0.45 },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    border: '1px solid transparent',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  divider: { height: 1, background: BRAND_BORDER, margin: '0 0 14px' },

  metaRow: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, marginBottom: 14 },
  metaItem: {
    background: BRAND_MID,
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 0,
  },
  metaLabel: {
    display: 'block',
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: BRAND_DARK,
    opacity: 0.5,
    marginBottom: 3,
  },
  metaValue: {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: BRAND_DARK,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  projId: { fontSize: 11, color: BRAND_DARK, opacity: 0.35 },
  viewDetailsButton: {
    background: BRAND_DARK,
    color: BRAND_YELLOW,
    border: 'none',
    borderRadius: 10,
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },

  // Saved dot
  savedDot: {
    display: 'block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: BRAND_YELLOW,
    border: `1px solid ${BRAND_BORDER}`,
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },

  // Notices
  notice: {
    padding: 16,
    borderRadius: 12,
    background: BRAND_MID,
    border: `1px solid ${BRAND_BORDER}`,
    color: BRAND_DARK,
    fontSize: 14,
  },
  errorNotice: {
    background: '#fdf0f0',
    border: '1px solid #f5c5c5',
    color: '#8b1a1a',
  },
}