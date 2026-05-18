import { useEffect, useState, type CSSProperties } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { API_BASE_URL, buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'
import InvestorLayout from './InvestorLayout'

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

function resolveToken() {
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

function formatDate(value: unknown) {
  const text = toText(value)
  if (!text) return 'Not provided'
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return text
  return date.toLocaleString()
}

function resolveBackendFileUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${API_BASE_URL}${normalizedPath}`
}

export default function AppliedProjectDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const initial = (location.state as any)?.record ?? null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [record, setRecord] = useState<Record<string, unknown> | null>(initial)
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1280)
  const isPhone = viewportWidth <= 640
  const isTablet = viewportWidth <= 960

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (record) return
      setLoading(true)
      try {
        const token = resolveToken()
        if (!token) throw new Error('No authentication token found. Please sign in.')
        if (!applicationId) throw new Error('Invalid application id.')

        const candidates = [
          `/investors/application/${encodeURIComponent(applicationId)}`,
          `/applications/${encodeURIComponent(applicationId)}`,
          `/admin/applications/${encodeURIComponent(applicationId)}`,
        ]

        let found: any = null
        for (const path of candidates) {
          const res = await fetch(buildApiUrl(path), { headers: { Authorization: `Bearer ${token}` } })
          const payload = await parseResponseBody(res)
          if (res.ok) {
            if (Array.isArray(payload)) {
              if (payload.length > 0) found = payload[0]
            } else if (payload && typeof payload === 'object') {
              found = payload
            }
            if (found) break
          }
        }

        if (!found) {
          // final fallback: try fetching investor's applied list then filter
          const userPayload = getAuthSession()
          const userId = typeof userPayload?.payload === 'object' ? (userPayload.payload as any).id ?? (userPayload.payload as any).users_id : null
          if (userId) {
            const invRes = await fetch(buildApiUrl(`/investors_id/${encodeURIComponent(String(userId))}`), { headers: { Authorization: `Bearer ${token}` } })
            const invPayload = await parseResponseBody(invRes)
            if (invRes.ok) {
              const invId = (invPayload as any)?.investor_id
              if (invId) {
                const listRes = await fetch(buildApiUrl(`/investors/select_project_applied_for/${encodeURIComponent(String(invId))}`), { headers: { Authorization: `Bearer ${token}` } })
                const listPayload = await parseResponseBody(listRes)
                const arr = Array.isArray(listPayload) ? listPayload : (listPayload && typeof listPayload === 'object' ? (listPayload as any).data ?? (listPayload as any).results ?? [] : [])
                const foundItem = (arr as any[]).find((r) => String(r.id) === String(applicationId))
                if (foundItem) found = foundItem
              }
            }
          }
        }

        if (!mounted) return
        if (!found) throw new Error('Application not found.')
        setRecord(found)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [applicationId, record])

  function extractCombinedDocument(item: Record<string, unknown> | null) {
    if (!item) return null as null | { url: string; name: string; isImage: boolean; isPdf?: boolean }

    const raw = typeof item.attachment_path === 'string' && item.attachment_path.trim()
      ? item.attachment_path
      : typeof item.nda === 'string' && item.nda.trim()
        ? item.nda
        : ''

    if (!raw) return null

    const url = resolveBackendFileUrl(raw)
    const lower = url.toLowerCase()

    return {
      url,
      name: url.split('/').pop() ?? url,
      isImage: lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif'),
      isPdf: lower.endsWith('.pdf'),
    }
  }

  const combinedDocument = extractCombinedDocument(record)
  const [preview, setPreview] = useState<null | { url: string; name: string; isImage: boolean; isPdf?: boolean }>(null)

  return (
    <InvestorLayout>
      <section style={{ ...styles.container, padding: isPhone ? 10 : isTablet ? 14 : 20 }}>
        <div style={styles.header}>
          <button type="button" onClick={() => navigate(-1)} style={styles.backButton}>
            ← Back
          </button>
          <h2 style={{ ...styles.title, fontSize: isPhone ? 20 : 28 }}>{record ? (String(record.project_title ?? record.project_name ?? record.title ?? `Application #${String(record.id)}`)) : 'Application details'}</h2>
          {loading ? <div style={styles.notice}>Loading...</div> : null}
          {error ? <div style={{ ...styles.notice, ...styles.error }}>{error}</div> : null}
        </div>

        {record ? (
          <div
            style={{
              ...styles.contentGrid,
              gridTemplateColumns: isTablet ? '1fr' : '1fr 420px',
              gap: isPhone ? 12 : 18,
            }}
          >
            <div style={styles.summary}>
              <div style={styles.row}><strong>Project:</strong> <span style={{ marginLeft: isPhone ? 0 : 8 }}>{String(record.project_title ?? record.project_name ?? record.title ?? `Project #${String(record.project_id ?? '')}`)}</span></div>
              <div style={styles.row}><strong>Status:</strong> <span style={{ marginLeft: isPhone ? 0 : 8 }}>{String(record.status ?? 'Submitted')}</span></div>
              <div style={styles.row}><strong>Submitted:</strong> <span style={{ marginLeft: isPhone ? 0 : 8 }}>{formatDate(record.created_at)}</span></div>

              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: '8px 0' }}>Notes & Conditions</h4>
                <div style={styles.box}>{String(record.conditions_text ?? 'No additional notes')}</div>
              </div>

              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: '8px 0' }}>Application Fields</h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  {(() => {
                    const preferredOrder = [
                      'amount', 'shares', 'investment_type', 'timeline', 'conditions_text', 'nda', 'nda_action', 'documents', 'status', 'created_at', 'title'
                    ]
                    const hideFields = new Set(['id', 'investor_id', 'project_id', 'updated_at', 'attachment_path', 'save_for_later'])

                    const entries = Object.entries(record as Record<string, unknown>)
                    const orderMap = new Map(preferredOrder.map((k, i) => [k, i]))
                    entries.sort(([a], [b]) => {
                      const ar = orderMap.get(a) ?? Number.MAX_SAFE_INTEGER
                      const br = orderMap.get(b) ?? Number.MAX_SAFE_INTEGER
                      if (ar !== br) return ar - br
                      return a.localeCompare(b)
                    })

                    function renderFieldValue(value: unknown) {
                      if (value == null || value === '') return <span style={{ color: '#6b8ca8' }}>Not provided</span>
                      if (typeof value === 'string') {
                        const s = value.trim()
                        if ((s.startsWith('{') || s.startsWith('['))) {
                          try { const parsed = JSON.parse(s); value = parsed } catch {}
                        }
                      }
                      if (Array.isArray(value)) return (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {value.map((v, i) => <li key={i} style={{ fontSize: 13 }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</li>)}
                        </ul>
                      )
                      if (typeof value === 'object') return <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(value, null, 2)}</pre>
                      return <span>{String(value)}</span>
                    }

                    return entries.filter(([k]) => !hideFields.has(k)).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', flexDirection: isPhone ? 'column' : 'row', justifyContent: 'space-between', alignItems: isPhone ? 'flex-start' : 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: '#fbfdfe', border: '1px solid rgba(2,51,65,0.06)' }}>
                        <div style={{ color: '#6b8ca8', fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>{formatLabel(k)}</div>
                        <div style={{ textAlign: isPhone ? 'left' : 'right', maxWidth: isPhone ? '100%' : 420, width: isPhone ? '100%' : 'auto', overflowWrap: 'anywhere' }}>{renderFieldValue(k === 'created_at' || k === 'updated_at' ? formatDate(v) : v)}</div>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>

            <div style={styles.documents}>
              <h4 style={{ marginTop: 0 }}>Uploaded Documents</h4>

              {!combinedDocument ? (
                <div style={styles.notice}>No documents uploaded for this application.</div>
              ) : (
                <div style={styles.combinedDocCard}>
                  {combinedDocument.isImage ? (
                    <img src={combinedDocument.url} alt={combinedDocument.name} style={styles.docPreview} />
                  ) : (
                    <div style={styles.docPreviewPlaceholder}>{combinedDocument.name}</div>
                  )}
                  <div style={styles.combinedDocActions}>
                    <button
                      type="button"
                      onClick={() => setPreview(combinedDocument)}
                      style={styles.previewButton}
                    >
                      Preview combined file
                    </button>
                    <a href={combinedDocument.url} target="_blank" rel="noreferrer" style={styles.docLink}>Open / Download</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
      {preview ? (
        <div style={styles.modalOverlay} onClick={() => setPreview(null)}>
          <div style={{ ...styles.modalContent, width: isPhone ? '96%' : '90%', height: isPhone ? '86%' : '80%' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <strong style={{ maxWidth: '75%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview.name}</strong>
              <button type="button" onClick={() => setPreview(null)} style={styles.modalClose}>Close</button>
            </div>
            <div style={styles.modalBody}>
              {preview.isImage ? (
                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                <img src={preview.url} alt={preview.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <iframe src={preview.url} title={preview.name} style={{ width: '100%', height: '100%', border: 'none' }} />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </InvestorLayout>
  )
}

const styles: Record<string, CSSProperties> = {
  container: { padding: 20 },
  header: { marginBottom: 16 },
  backButton: { background: 'transparent', border: 'none', color: '#023341', cursor: 'pointer', marginBottom: 8 },
  title: { margin: '6px 0 0', color: '#023341' },
  notice: { padding: 12, borderRadius: 10, background: '#f8fbfd', border: '1px solid rgba(2,51,65,0.08)', color: '#365463' },
  error: { background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.18)', color: '#8b1d1d' },
  contentGrid: { display: 'grid', gridTemplateColumns: '1fr 420px', gap: 18 },
  summary: { padding: 16, borderRadius: 12, background: '#ffffff', border: '1px solid rgba(2,51,65,0.08)' },
  documents: { padding: 16, borderRadius: 12, background: '#ffffff', border: '1px solid rgba(2,51,65,0.08)' },
  row: { marginBottom: 8 },
  box: { padding: 12, borderRadius: 8, background: '#fbfdfe', border: '1px solid rgba(2,51,65,0.06)' },
  docGrid: { display: 'grid', gap: 12 },
  combinedDocCard: { padding: 12, borderRadius: 10, border: '1px solid rgba(2,51,65,0.06)', background: '#fff', display: 'grid', gap: 10 },
  combinedDocActions: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  previewButton: { background: '#023341', color: '#ffec00', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 },
  docCard: { padding: 12, borderRadius: 10, border: '1px solid rgba(2,51,65,0.06)', background: '#fff', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' },
  docPreview: { width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8 },
  docPreviewPlaceholder: { height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f7f9', borderRadius: 8, color: '#365463' },
  docLink: { color: '#023341', fontWeight: 700, textDecoration: 'none' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(2,51,65,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 },
  modalContent: { width: '90%', maxWidth: 1000, height: '80%', background: '#fff', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  modalHeader: { padding: 12, borderBottom: '1px solid rgba(2,51,65,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalClose: { background: 'transparent', border: 'none', color: '#023341', cursor: 'pointer', fontWeight: 700 },
  modalBody: { padding: 12, flex: 1 },
}
