import React, { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type CollectionRecord = {
  id: number
  users_id: number
  email: string
  first_name?: string
  last_name?: string
  payment_reason: string
  amount: number
}

function resolveToken(payload: unknown): string {
  if (typeof payload === 'string') return payload
  if (!payload || typeof payload !== 'object') return ''
  const p = payload as Record<string, unknown>
  const direct = p.token ?? p.accessToken ?? p.access_token ?? p.jwt
  if (typeof direct === 'string') return direct
  const nested = p.data
  if (nested && typeof nested === 'object') {
    const d = nested as Record<string, unknown>
    const nestedToken = d.token ?? d.accessToken ?? d.access_token ?? d.jwt
    if (typeof nestedToken === 'string') return nestedToken
  }
  return ''
}

export default function EntrepreneurPaidCollectionPage(): React.ReactElement {
  const session = getAuthSession()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<CollectionRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const pageSize = 10

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const token = resolveToken(session?.payload)
      const resp = await fetch(buildApiUrl('/admin/entrepreneur_paid_collection'), {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), Accept: 'application/json' },
      })
      const body = await resp.json().catch(() => null)
      if (!resp.ok) {
        setError((body && body.message) || `Request failed (${resp.status})`)
        setRecords([])
        return
      }

      const rows = (body && typeof body === 'object' && (body.entrepreneur_paid_collection ?? body.rows)) || body || []
      if (!Array.isArray(rows)) {
        setError('Unexpected response from server')
        setRecords([])
        return
      }

      setRecords(rows as CollectionRecord[])
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load collection')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const paymentReasons = Array.from(new Set(records.map((r) => (r.payment_reason || '').toString())))
  const visible = filter ? records.filter((r) => r.payment_reason === filter) : records
  useEffect(() => { setPage(0) }, [filter, records])
  const total = visible.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const paginated = visible.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <AdminShell title="Paid Collections" subtitle="All entrepreneur payments">
      <section style={styles.container}>
        <div style={styles.headerRow}>
          <h3 style={styles.heading}>Paid Collections</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={styles.select}>
              <option value="">All reasons</option>
              {paymentReasons.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button style={styles.refreshBtn} type="button" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p style={styles.hint}>Loading…</p>
        ) : error ? (
          <p style={styles.error}>{error}</p>
        ) : visible.length === 0 ? (
          <p style={styles.hint}>No records found.</p>
        ) : (
          <>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Reason</th>
                    <th style={styles.th}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r, idx) => (
                    <tr key={r.id}>
                      <td style={styles.td}>{page * pageSize + idx + 1}</td>
                      <td style={styles.td}>{r.email}</td>
                      <td style={styles.td}>{[r.first_name, r.last_name].filter(Boolean).join(' ')}</td>
                      <td style={styles.td}>{r.payment_reason}</td>
                      <td style={styles.td}>{r.amount?.toLocaleString?.() ?? r.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.paginationRow}>
              <div style={styles.paginationInfo}>
                Showing {Math.min(total, page * pageSize + 1)}-{Math.min(total, (page + 1) * pageSize)} of {total}
              </div>
              <div style={styles.paginationControls}>
                <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={styles.pageBtn}>
                  Prev
                </button>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={(page + 1) >= totalPages} style={styles.pageBtn}>
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  container: { padding: '18px 22px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heading: { margin: 0, fontSize: 18 },
  select: { padding: '8px 10px', borderRadius: 8, border: '1px solid #d9dee8' },
  refreshBtn: { padding: '8px 12px', borderRadius: 8, border: '1px solid #d9dee8', background: '#fff', cursor: 'pointer' },
  hint: { color: '#6e8086' },
  error: { color: '#d85656' },
  tableWrap: { overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(15,30,53,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 12px', background: '#fbfdfe', borderBottom: '1px solid rgba(15,30,53,0.06)' },
  td: { padding: '10px 12px', borderBottom: '1px solid rgba(15,30,53,0.04)' },
  paginationRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  paginationControls: { display: 'flex', gap: 8 },
  paginationInfo: { color: '#6e8086' },
  pageBtn: { padding: '8px 12px', borderRadius: 8, border: '1px solid #d9dee8', background: '#fff', cursor: 'pointer' },
}
