import { useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
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

function readAppointmentsArray(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return [] as AppointmentSlot[]
  }

  const items = (payload as ApiResponse).appointment_slots
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

export default function CreateAppointmentSlotsPage() {
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<SlotFormState>(emptyForm)

  async function loadSlots() {
    setError(null)

    try {
      const response = await fetch(buildApiUrl('/admin/appointment-slots'), { headers: authHeader() })
      const payload = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(getMessage(payload, 'Failed to load appointment slots'))
      }

      setSlots(readAppointmentsArray(payload))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load appointment slots')
    } finally {
    }
  }

  useEffect(() => {
    void loadSlots()
  }, [])

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
      await loadSlots()
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Failed to create appointment slots')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminShell title="Create Appointment Slots" subtitle="Add new appointment availability for clients to book.">
      {error && <p style={styles.errorBanner}>{error}</p>}
      {success && <p style={styles.successBanner}>{success}</p>}

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelKicker}>Availability</span>
            <h3 style={styles.panelTitle}>Create appointment slots</h3>
          </div>
        </div>

        <form style={styles.form} onSubmit={handleCreateSlots}>
          {formError && <p style={styles.formError}>{formError}</p>}

          <label style={styles.fieldLabel} htmlFor="slotDate">
            Slot date
          </label>
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

          <label style={styles.fieldLabel} htmlFor="slotTime">
            Time slot
          </label>
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
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  panel: {
    background: '#ffffff',
    borderRadius: 22,
    padding: 20,
    border: '1px solid rgba(2, 51, 65, 0.08)',
    boxShadow: '0 16px 34px rgba(2, 51, 65, 0.06)',
  },
  panelHeader: {
    marginBottom: 16,
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
  formError: {
    margin: 0,
    padding: '10px 12px',
    borderRadius: 12,
    background: 'rgba(208, 54, 54, 0.08)',
    color: '#a32121',
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
}
