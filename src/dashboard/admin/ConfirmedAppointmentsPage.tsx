import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type AppointmentSlot = {
  id: number
  slot_date: string
  slot_time: string
  status: string
  booked_name?: string | null
  booked_email?: string | null
  booked_phone?: string | null
  meeting_format?: string | null
  message?: string | null
  booked_at?: string | null
  cancelled_at?: string | null
  cancelled_reason?: string | null
}

type ApiResponse = {
  success?: boolean
  message?: string
  bookings?: unknown
}

function authHeader(): HeadersInit {
  const session = getAuthSession()
  return session ? { Authorization: `Bearer ${(session.payload as { token?: string })?.token ?? ''}` } : {}
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

function getMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (payload && typeof payload === 'object' && 'message' in payload && typeof (payload as ApiResponse).message === 'string') {
    return (payload as ApiResponse).message as string
  }

  return fallback
}

function readAppointmentsArray(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return [] as AppointmentSlot[]
  }

  const items = (payload as ApiResponse).bookings
  if (!Array.isArray(items)) {
    return [] as AppointmentSlot[]
  }

  return items
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      id: typeof item.id === 'number' ? item.id : Number(item.id) || 0,
      slot_date: typeof item.slot_date === 'string' ? item.slot_date : '',
      slot_time: typeof item.slot_time === 'string' ? item.slot_time : '',
      status: typeof item.status === 'string' ? item.status : 'available',
      booked_name: typeof item.booked_name === 'string' ? item.booked_name : null,
      booked_email: typeof item.booked_email === 'string' ? item.booked_email : null,
      booked_phone: typeof item.booked_phone === 'string' ? item.booked_phone : null,
      meeting_format: typeof item.meeting_format === 'string' ? item.meeting_format : null,
      message: typeof item.message === 'string' ? item.message : null,
      booked_at: typeof item.booked_at === 'string' ? item.booked_at : null,
      cancelled_at: typeof item.cancelled_at === 'string' ? item.cancelled_at : null,
      cancelled_reason: typeof item.cancelled_reason === 'string' ? item.cancelled_reason : null,
    }))
    .filter((item) => item.id > 0)
}

function formatDateLabel(dateString: string) {
  if (!dateString) {
    return 'Unknown date'
  }

  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString

  const parsed = new Date(`${datePart}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return dateString
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatTimeLabel(timeString: string) {
  if (!timeString) {
    return 'Unknown time'
  }

  return timeString.length > 5 ? timeString.slice(0, 5) : timeString
}

function formatDateTimeLabel(value?: string | null) {
  if (!value) {
    return 'N/A'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function ConfirmedAppointmentsPage() {
  const [bookings, setBookings] = useState<AppointmentSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function loadBookings() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(buildApiUrl('/admin/appointment-bookings'), { headers: authHeader() })
      const payload = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(getMessage(payload, 'Failed to load appointment bookings'))
      }

      setBookings(readAppointmentsArray(payload))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load appointment bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBookings()
  }, [])

  async function handleCancelBooking(slotId: number) {
    setConfirmCancelId(null)
    setCancellingId(slotId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(buildApiUrl(`/admin/appointment-slots/${slotId}/cancel`), {
        method: 'PUT',
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cancelReason ? { cancelled_reason: cancelReason } : {}),
      })

      const payload = await parseResponseBody(response)
      if (!response.ok) {
        throw new Error(getMessage(payload, 'Failed to cancel appointment booking'))
      }

      setSuccess(getMessage(payload, 'Appointment booking cancelled successfully'))
      setCancelReason('')
      setBookings((prev) => prev.filter((item) => item.id !== slotId))
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Failed to cancel appointment booking')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <AdminShell title="Confirmed Appointments" subtitle="View all confirmed bookings and cancel when needed.">
      {confirmCancelId !== null ? (
        <div style={styles.overlay} onClick={() => setConfirmCancelId(null)}>
          <div style={styles.confirmModal} onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Cancel Appointment Booking?</h3>
            <p style={styles.confirmText}>This action cannot be undone.</p>
            
            <div style={styles.formField}>
              <label style={styles.fieldLabel}>Optional Cancellation Reason</label>
              <textarea
                style={styles.textarea}
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="Why are you cancelling this booking?"
                disabled={cancellingId === confirmCancelId}
                rows={3}
              />
            </div>

            <div style={styles.confirmActions}>
              <button type="button" style={styles.cancelBtnModal} onClick={() => setConfirmCancelId(null)}>
                Don't Cancel
              </button>
              <button
                type="button"
                style={styles.cancelBtnConfirm}
                disabled={cancellingId === confirmCancelId}
                onClick={() => void handleCancelBooking(confirmCancelId)}
              >
                {cancellingId === confirmCancelId ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {error && <p style={styles.errorBanner}>{error}</p>}
      {success && <p style={styles.successBanner}>{success}</p>}

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelKicker}>Booked</span>
            <h3 style={styles.panelTitle}>Confirmed appointments</h3>
          </div>
          <button type="button" style={styles.secondaryBtn} onClick={() => void loadBookings()}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={styles.emptyState}>Loading appointment records...</div>
        ) : bookings.length === 0 ? (
          <div style={styles.emptyState}>No appointment bookings found.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Client</th>
                  <th style={styles.th}>Format</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((slot) => (
                  <tr key={slot.id}>
                    <td style={styles.td}>{formatDateLabel(slot.slot_date)}</td>
                    <td style={styles.td}>{formatTimeLabel(slot.slot_time)}</td>
                    <td style={styles.td}>
                      <div style={styles.cellStack}>
                        <strong style={styles.cellTitle}>{slot.booked_name || 'Unnamed client'}</strong>
                        <span style={styles.cellMeta}>{slot.booked_email || 'No email provided'}</span>
                        <span style={styles.cellMeta}>{slot.booked_phone || 'No phone provided'}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.cellStack}>
                        <span style={styles.badge}>{slot.meeting_format || 'Not specified'}</span>
                        <span style={styles.cellMeta}>{formatDateTimeLabel(slot.booked_at)}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <button
                        type="button"
                        style={styles.cancelBtn}
                        onClick={() => setConfirmCancelId(slot.id)}
                      >
                        Cancel
                      </button>
                    </td>
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
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(8, 20, 38, 0.45)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 99,
    padding: 16,
  },
  confirmModal: {
    width: 'min(480px, 100%)',
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
    margin: '0 0 14px',
    color: '#4f6f78',
  },
  formField: {
    marginBottom: 14,
    display: 'grid',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#35515b',
  },
  textarea: {
    borderRadius: 10,
    border: '1px solid rgba(2, 51, 65, 0.14)',
    padding: '10px 12px',
    fontSize: 13,
    color: '#023341',
    background: '#f9fcfd',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  confirmActions: {
    marginTop: 14,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtnModal: {
    border: '1px solid #cfe0e3',
    borderRadius: 8,
    padding: '9px 12px',
    cursor: 'pointer',
    background: '#fff',
    color: '#1e4878',
    fontWeight: 700,
  },
  cancelBtnConfirm: {
    border: '1px solid rgba(170, 50, 50, 0.18)',
    borderRadius: 8,
    padding: '9px 12px',
    background: 'rgba(208, 54, 54, 0.08)',
    color: '#a32121',
    fontWeight: 700,
    cursor: 'pointer',
  },
  panel: {
    background: '#ffffff',
    borderRadius: 22,
    padding: 20,
    border: '1px solid rgba(2, 51, 65, 0.08)',
    boxShadow: '0 16px 34px rgba(2, 51, 65, 0.06)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  panelKicker: {
    display: 'inline-block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#72868f',
    fontWeight: 700,
    marginBottom: 4,
  },
  panelTitle: {
    margin: 0,
    fontSize: 20,
    color: '#023341',
  },
  secondaryBtn: {
    border: '1px solid rgba(2, 51, 65, 0.14)',
    borderRadius: 14,
    padding: '10px 14px',
    background: '#ffffff',
    color: '#023341',
    fontWeight: 700,
    cursor: 'pointer',
  },
  cancelBtn: {
    border: '1px solid #f3c8c8',
    borderRadius: 8,
    padding: '8px 12px',
    cursor: 'pointer',
    background: '#fff5f5',
    color: '#a32828',
    fontWeight: 700,
  },
  errorBanner: {
    margin: '0 0 16px',
    padding: '12px 14px',
    borderRadius: 14,
    background: 'rgba(208, 54, 54, 0.1)',
    color: '#a32121',
    border: '1px solid rgba(208, 54, 54, 0.18)',
  },
  successBanner: {
    margin: '0 0 16px',
    padding: '12px 14px',
    borderRadius: 14,
    background: 'rgba(34, 139, 85, 0.12)',
    color: '#1f6d43',
    border: '1px solid rgba(34, 139, 85, 0.16)',
  },
  emptyState: {
    padding: '20px 16px',
    borderRadius: 16,
    background: '#f7fbfc',
    color: '#54707a',
    border: '1px dashed rgba(2, 51, 65, 0.16)',
    textAlign: 'center',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
  },
  th: {
    textAlign: 'left',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#6a8089',
    padding: '0 12px 12px 0',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '14px 12px 14px 0',
    borderTop: '1px solid rgba(2, 51, 65, 0.08)',
    verticalAlign: 'top',
    color: '#24414a',
  },
  cellStack: {
    display: 'grid',
    gap: 4,
  },
  cellTitle: {
    color: '#023341',
  },
  cellMeta: {
    fontSize: 13,
    color: '#5f7680',
    lineHeight: 1.5,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '6px 10px',
    background: 'rgba(2, 51, 65, 0.08)',
    color: '#023341',
    fontSize: 12,
    fontWeight: 700,
    width: 'fit-content',
  },
}
