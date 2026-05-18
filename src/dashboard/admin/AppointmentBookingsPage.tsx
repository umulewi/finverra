import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
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
  appointment_slots?: unknown
  bookings?: unknown
  created_slots?: unknown
}

type SlotFormState = {
  slotDate: string
  time: string
}

const emptyForm: SlotFormState = {
  slotDate: '',
  time: '',
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

function readAppointmentsArray(payload: unknown, key: keyof Pick<ApiResponse, 'appointment_slots' | 'bookings' | 'created_slots'>) {
  if (!payload || typeof payload !== 'object') {
    return [] as AppointmentSlot[]
  }

  const items = (payload as ApiResponse)[key]
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

  // Extract date part if it's an ISO datetime string (e.g., 2006-03-28T05:00:00.000Z -> 2006-03-28)
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

function generateBusinessHours() {
  const times: string[] = []
  for (let hour = 9; hour <= 16; hour++) {
    times.push(`${String(hour).padStart(2, '0')}:00`)
  }
  return times
}

function getMinimumDate() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

function isWeekend(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`)
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

function getAvailableTimesForDate(dateString: string, slots: AppointmentSlot[]) {
  const businessHours = generateBusinessHours()
  const bookedTimes = slots
    .filter((slot) => slot.slot_date === dateString && slot.status === 'booked')
    .map((slot) => slot.slot_time)
  return businessHours.filter((time) => !bookedTimes.includes(time))
}

export default function AppointmentBookingsPage() {
  const { hash } = useLocation()
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [bookings, setBookings] = useState<AppointmentSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<SlotFormState>(emptyForm)

  async function loadAppointments() {
    setLoading(true)
    setError(null)

    try {
      const [slotsResponse, bookingsResponse] = await Promise.all([
        fetch(buildApiUrl('/admin/appointment-slots'), { headers: authHeader() }),
        fetch(buildApiUrl('/admin/appointment-bookings'), { headers: authHeader() }),
      ])

      const [slotsPayload, bookingsPayload] = await Promise.all([
        parseResponseBody(slotsResponse),
        parseResponseBody(bookingsResponse),
      ])

      if (!slotsResponse.ok) {
        throw new Error(getMessage(slotsPayload, 'Failed to load appointment slots'))
      }

      if (!bookingsResponse.ok) {
        throw new Error(getMessage(bookingsPayload, 'Failed to load appointment bookings'))
      }

      setSlots(readAppointmentsArray(slotsPayload, 'appointment_slots'))
      setBookings(readAppointmentsArray(bookingsPayload, 'bookings'))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load appointment data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAppointments()
  }, [])

  useEffect(() => {
    if (!hash) {
      return
    }

    const targetId = hash.replace('#', '')
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [hash, loading])

  const summary = useMemo(() => {
    const bookedCount = bookings.length
    const availableCount = slots.filter((slot) => slot.status !== 'booked').length

    return {
      total: slots.length,
      available: availableCount,
      booked: bookedCount,
    }
  }, [bookings.length, slots])

  async function handleCreateSlots(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSuccess(null)

    if (!form.slotDate) {
      setFormError('Slot date is required.')
      return
    }

    if (isWeekend(form.slotDate)) {
      setFormError('Weekends are not available. Please select a weekday.')
      return
    }

    if (!form.time) {
      setFormError('Time slot is required.')
      return
    }

    setSubmitting(true)

    try {
      // Ensure date is in YYYY-MM-DD format
      const dateObj = new Date(`${form.slotDate}T00:00:00`)
      const formattedDate = dateObj.toISOString().split('T')[0]

      const response = await fetch(buildApiUrl('/admin/appointment-slots'), {
        method: 'POST',
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formattedDate,
          times: [form.time],
        }),
      })

      const payload = await parseResponseBody(response)
      if (!response.ok) {
        throw new Error(getMessage(payload, 'Failed to create appointment slots'))
      }

      setSuccess(getMessage(payload, 'Appointment slots created successfully'))
      setForm(emptyForm)
      await loadAppointments()
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Failed to create appointment slots')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancelBooking(slot: AppointmentSlot) {
    const confirmed = window.confirm(`Cancel booking for ${slot.slot_date} at ${slot.slot_time}?`)

    if (!confirmed) {
      return
    }

    const reason = window.prompt('Optional cancellation reason')?.trim() ?? ''

    setCancellingId(slot.id)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(buildApiUrl(`/admin/appointment-slots/${slot.id}/cancel`), {
        method: 'PUT',
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reason ? { cancelled_reason: reason } : {}),
      })

      const payload = await parseResponseBody(response)
      if (!response.ok) {
        throw new Error(getMessage(payload, 'Failed to cancel appointment booking'))
      }

      setSuccess(getMessage(payload, 'Appointment booking cancelled successfully'))
      await loadAppointments()
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Failed to cancel appointment booking')
    } finally {
      setCancellingId(null)
    }
  }

  async function handleDeleteSlot(slot: AppointmentSlot) {
    const confirmed = window.confirm(`Delete appointment slot for ${formatDateLabel(slot.slot_date)} at ${formatTimeLabel(slot.slot_time)}?`)

    if (!confirmed) {
      return
    }

    setDeletingId(slot.id)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(buildApiUrl(`/admin/appointment-slots/${slot.id}`), {
        method: 'DELETE',
        headers: authHeader(),
      })

      const payload = await parseResponseBody(response)
      if (!response.ok) {
        throw new Error(getMessage(payload, 'Failed to delete appointment slot'))
      }

      setSuccess(getMessage(payload, 'Appointment slot deleted successfully'))
      await loadAppointments()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete appointment slot')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminShell
      title="Appointment Bookings"
      subtitle="Create appointment availability, review confirmed bookings, and cancel booked slots when needed."
    >
      <div style={styles.toolbar}>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Total slots</span>
            <strong style={styles.summaryValue}>{summary.total}</strong>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Available</span>
            <strong style={styles.summaryValue}>{summary.available}</strong>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Bookings</span>
            <strong style={styles.summaryValue}>{summary.booked}</strong>
          </div>
        </div>
      </div>

      {error && <p style={styles.errorBanner}>{error}</p>}
      {success && <p style={styles.successBanner}>{success}</p>}

      <div style={styles.grid}>
        <section id="create-slots" style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelKicker}>Availability</span>
              <h3 style={styles.panelTitle}>Create appointment slots</h3>
            </div>
          </div>

          <form style={styles.form} onSubmit={handleCreateSlots}>
            {formError && <p style={styles.formError}>{formError}</p>}

            <label style={styles.fieldLabel} htmlFor="slotDate">Slot date</label>
            <input
              id="slotDate"
              type="date"
              style={styles.input}
              value={form.slotDate}
              min={getMinimumDate()}
              onChange={(event) => {
                const newDate = event.target.value
                setForm((prev) => ({ ...prev, slotDate: newDate, time: '' }))
              }}
            />
            {form.slotDate && isWeekend(form.slotDate) && (
              <p style={{ color: '#d32f2f', fontSize: 12, marginTop: 4 }}>❌ Weekends are not available. Please select a weekday.</p>
            )}

            <label style={styles.fieldLabel} htmlFor="slotTime">Time slot</label>
            {form.slotDate ? (
              form.slotDate && isWeekend(form.slotDate) ? (
                <p style={{ color: '#d32f2f', fontSize: 12, marginBottom: 12 }}>Cannot select time on weekends</p>
              ) : (
                <select
                  id="slotTime"
                  style={styles.input}
                  value={form.time}
                  onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))}
                >
                  <option value="">Select a time...</option>
                  {getAvailableTimesForDate(form.slotDate, slots).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              )
            ) : (
              <p style={{ color: '#757575', fontSize: 12, marginBottom: 12 }}>Select a date first</p>
            )}

            <button type="submit" style={styles.primaryBtn} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Slots'}
            </button>
          </form>
        </section>

        <section id="confirmed" style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelKicker}>Booked</span>
              <h3 style={styles.panelTitle}>Confirmed appointments</h3>
            </div>
            <button type="button" style={styles.secondaryBtn} onClick={() => void loadAppointments()}>
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
                          disabled={cancellingId === slot.id}
                          onClick={() => void handleCancelBooking(slot)}
                        >
                          {cancellingId === slot.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section id="availability" style={{ ...styles.panel, marginTop: 18 }}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelKicker}>All slots</span>
            <h3 style={styles.panelTitle}>Appointment availability</h3>
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyState}>Loading appointment slots...</div>
        ) : slots.length === 0 ? (
          <div style={styles.emptyState}>No appointment slots have been created yet.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Booked by</th>
                  <th style={styles.th}>Notes</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                    <tr key={slot.id}>
                      <td style={styles.td}>{formatDateLabel(slot.slot_date)}</td>
                      <td style={styles.td}>{formatTimeLabel(slot.slot_time)}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusBadge, ...(slot.status === 'booked' ? styles.statusBooked : styles.statusAvailable) }}>
                          {slot.status}
                        </span>
                      </td>
                      <td style={styles.td}>{slot.booked_name || '—'}</td>
                      <td style={styles.td}>
                        <div style={styles.cellStack}>
                          <span style={styles.cellMeta}>{slot.cancelled_reason || slot.message || '—'}</span>
                          <span style={styles.cellMeta}>{slot.cancelled_at ? `Cancelled: ${formatDateTimeLabel(slot.cancelled_at)}` : ''}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <button
                          type="button"
                          style={styles.deleteBtn}
                          disabled={deletingId === slot.id}
                          onClick={() => void handleDeleteSlot(slot)}
                        >
                          {deletingId === slot.id ? 'Deleting...' : 'Delete'}
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
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(150px, 1fr))',
    gap: 12,
    width: '100%',
  },
  summaryCard: {
    borderRadius: 18,
    padding: '16px 18px',
    background: '#ffffff',
    border: '1px solid rgba(2, 51, 65, 0.08)',
    boxShadow: '0 12px 24px rgba(2, 51, 65, 0.06)',
  },
  summaryLabel: {
    display: 'block',
    fontSize: 12,
    color: '#56707a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: 700,
  },
  summaryValue: {
    fontSize: 28,
    color: '#023341',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)',
    gap: 18,
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
  form: {
    display: 'grid',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#35515b',
  },
  input: {
    width: '100%',
    borderRadius: 14,
    border: '1px solid rgba(2, 51, 65, 0.14)',
    padding: '12px 14px',
    fontSize: 14,
    color: '#023341',
    background: '#f9fcfd',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    borderRadius: 16,
    border: '1px solid rgba(2, 51, 65, 0.14)',
    padding: '12px 14px',
    fontSize: 14,
    color: '#023341',
    background: '#f9fcfd',
    outline: 'none',
    resize: 'vertical',
  },
  primaryBtn: {
    justifySelf: 'start',
    border: 'none',
    borderRadius: 14,
    padding: '12px 18px',
    background: 'linear-gradient(135deg, #023341, #03546b)',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
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
    border: '1px solid rgba(170, 50, 50, 0.18)',
    borderRadius: 12,
    padding: '10px 14px',
    background: 'rgba(208, 54, 54, 0.08)',
    color: '#a32121',
    fontWeight: 700,
    cursor: 'pointer',
  },
  deleteBtn: {
    border: '1px solid rgba(170, 50, 50, 0.18)',
    borderRadius: 12,
    padding: '10px 14px',
    background: 'rgba(208, 54, 54, 0.08)',
    color: '#a32121',
    fontWeight: 700,
    cursor: 'pointer',
  },
  formError: {
    margin: 0,
    padding: '10px 12px',
    borderRadius: 12,
    background: 'rgba(208, 54, 54, 0.08)',
    color: '#a32121',
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
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'capitalize',
    width: 'fit-content',
  },
  statusBooked: {
    background: 'rgba(208, 54, 54, 0.12)',
    color: '#a32121',
  },
  statusAvailable: {
    background: 'rgba(34, 139, 85, 0.12)',
    color: '#1f6d43',
  },
}