import React, { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type PaymentRecord = {
  id: number
  users_id: number
  email: string
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

export default function EntrepreneurPaymentsPage(): React.ReactElement {
  const session = getAuthSession()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  async function loadPayments() {
    try {
      setLoading(true)
      setError(null)
      const token = resolveToken(session?.payload)
      const resp = await fetch(buildApiUrl('/admin/entrepreneur_payments'), {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: 'application/json',
        },
      })

      const body = await resp.json().catch(() => null)

      if (!resp.ok) {
        const msg = body && typeof body === 'object' && 'message' in body ? (body as any).message : `Request failed (${resp.status})`
        setError(String(msg ?? 'Failed to load payments'))
        setPayments([])
        return
      }

      // backend may return { success: true, entrepreneur_payments: [...] }
      const rows = (body && typeof body === 'object' && (body.entrepreneur_payments ?? body.rows)) || body || []
      if (!Array.isArray(rows)) {
        setError('Unexpected response shape from server')
        setPayments([])
        return
      }

      setPayments(rows as PaymentRecord[])
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load payments')
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AdminShell title="Entrepreneur Payments" subtitle="Payments recorded for entrepreneurs">
      <section style={styles.container}>
        <div style={styles.headerRow}>
          <h3 style={styles.heading}>Entrepreneur Payments</h3>
          <div>
            <button style={styles.refreshBtn} type="button" onClick={() => void loadPayments()}>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p style={styles.hint}>Loading payments…</p>
        ) : error ? (
          <p style={styles.error}>{error}</p>
        ) : payments.length === 0 ? (
          <p style={styles.hint}>No payments found.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>users_id</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Reason</th>
                  <th style={styles.th}>Amount (RWF)</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={styles.td}>{p.id}</td>
                    <td style={styles.td}>{p.users_id}</td>
                    <td style={styles.td}>{p.email ?? ''}</td>
                    <td style={styles.td}>{p.payment_reason}</td>
                    <td style={styles.td}>{p.amount?.toLocaleString?.() ?? p.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  container: { padding: '18px 22px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heading: { margin: 0, fontSize: 18 },
  refreshBtn: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #d9dee8',
    background: '#ffffff',
    cursor: 'pointer',
  },
  hint: { color: '#6e8086' },
  error: { color: '#d85656' },
  tableWrap: { overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(15,30,53,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 12px', background: '#fbfdfe', borderBottom: '1px solid rgba(15,30,53,0.06)' },
  td: { padding: '10px 12px', borderBottom: '1px solid rgba(15,30,53,0.04)' },
}
