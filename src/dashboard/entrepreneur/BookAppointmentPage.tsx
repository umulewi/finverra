import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'
import EntrepreneurShell from './EntrepreneurShell'
import { fetchEntrepreneurDisplayName } from './header'

type AvailableSlot = {
  id: number
  slot_date: string
  slot_time: string
  status: string
}

type BookingFormState = {
  names: string
  email: string
  phone: string
  date: string
  time: string
  meeting_format: string
  message: string
}

type ApiPayload = {
  success?: boolean
  message?: string
  available_slots?: unknown
  appointment?: unknown
}

const WORD_LIMIT = 250

function getTodayValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function authToken() {
  const session = getAuthSession()
  if (!session || typeof session.payload !== 'object' || session.payload === null) {
    return ''
  }

  const payload = session.payload as { token?: unknown; accessToken?: unknown }
  if (typeof payload.token === 'string') {
    return payload.token
  }
  if (typeof payload.accessToken === 'string') {
    return payload.accessToken
  }
  return ''
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

  if (payload && typeof payload === 'object' && 'message' in payload && typeof (payload as ApiPayload).message === 'string') {
    return (payload as ApiPayload).message as string
  }

  return fallback
}

function countWords(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  return words.length === 1 && words[0] === '' ? 0 : words.length
}

function trimToWordLimit(value: string, limit: number) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, limit).join(' ')
}

function readSlots(payload: unknown): AvailableSlot[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  // Accept either `available_slots` (old) or `slots` (API) keys
  const rawSlots = (payload as ApiPayload).available_slots ?? ((payload as any).slots ?? [])
  if (!Array.isArray(rawSlots)) {
    return []
  }

  return rawSlots
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      const rawDate = typeof item.slot_date === 'string' ? item.slot_date : ''
      // normalize date: parse any ISO datetime or date string into local YYYY-MM-DD
      let slotDate = rawDate
      try {
        const parsed = new Date(rawDate)
        if (!Number.isNaN(parsed.getTime())) {
          const y = parsed.getFullYear()
          const m = String(parsed.getMonth() + 1).padStart(2, '0')
          const d = String(parsed.getDate()).padStart(2, '0')
          slotDate = `${y}-${m}-${d}`
        }
      } catch {
        slotDate = rawDate
      }

      const rawTime = typeof item.slot_time === 'string' ? item.slot_time : ''
      let slotTime = rawTime
      // normalize time to HH:MM
      try {
        if (rawTime.includes('T')) {
          // full datetime -> parse and use local time
          const dt = new Date(rawTime)
          if (!Number.isNaN(dt.getTime())) {
            const hh = String(dt.getHours()).padStart(2, '0')
            const mm = String(dt.getMinutes()).padStart(2, '0')
            slotTime = `${hh}:${mm}`
          }
        } else if (rawTime.split(':').length >= 2) {
          slotTime = rawTime.slice(0, 5)
        } else if (/^\d{3,4}$/.test(rawTime)) {
          // e.g., "900" or "0900"
          const padded = rawTime.padStart(4, '0')
          slotTime = `${padded.slice(0, 2)}:${padded.slice(2)}`
        }
      } catch {
        slotTime = rawTime
      }

      return {
        id: typeof item.id === 'number' ? item.id : Number(item.id) || 0,
        slot_date: slotDate,
        slot_time: slotTime,
        status: typeof item.status === 'string' ? item.status : 'available',
      }
    })
    .filter((item) => item.id > 0 && item.status === 'available')
}

function normalizeTimeLabel(value: string) {
  if (!value) {
    return ''
  }

  return value.length > 5 ? value.slice(0, 5) : value
}

function formatDateLabel(value: string) {
  if (!value) return ''
  try {
    // value expected as YYYY-MM-DD; fall back to Date parsing
    const dt = new Date(value)
    if (Number.isNaN(dt.getTime())) {
      return value
    }
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return value
  }
}

export default function BookAppointmentPage() {
  const session = getAuthSession()
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const availabilityRef = useRef<HTMLElement | null>(null)
  const [dateChosen, setDateChosen] = useState(false)
  const [form, setForm] = useState<BookingFormState>({
    names: '',
    email: session?.email ?? '',
    phone: '',
    date: getTodayValue(),
    time: '',
    meeting_format: '',
    message: '',
  })
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    function check() {
      if (typeof window === 'undefined') return
      setIsSmallScreen(window.innerWidth <= 640)
    }

    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const messageWords = useMemo(() => countWords(form.message), [form.message])

  useEffect(() => {
    let isMounted = true

    async function loadDisplayName() {
      if (!session?.email) {
        return
      }

      try {
        const token = authToken()
        const name = await fetchEntrepreneurDisplayName(session.email, token)
        if (!isMounted) {
          return
        }

        setDisplayName(name)
        setForm((previous) => ({
          ...previous,
          names: previous.names || name,
          email: previous.email || session.email,
        }))
      } catch {
        if (!isMounted) {
          return
        }

        setForm((previous) => ({
          ...previous,
          email: previous.email || session.email,
        }))
      }
    }

    void loadDisplayName()

    return () => {
      isMounted = false
    }
  }, [session?.email])

  useEffect(() => {
    let isMounted = true

    async function loadAvailability() {
      setLoadingSlots(true)
      setError('')

      try {
        const response = await fetch(
          form.date ? buildApiUrl(`/appointment-availability?date=${encodeURIComponent(form.date)}`) : buildApiUrl('/appointment-availability'),
        )

        const payload = await parseResponseBody(response)
        if (!response.ok) {
          throw new Error(getMessage(payload, 'Failed to load available appointment slots'))
        }

        if (!isMounted) {
          return
        }

        const slots = readSlots(payload)
        setAvailableSlots(slots)
        // if the currently selected time is no longer available for the chosen date, clear it
        if (form.time) {
          const normalizedSelected = normalizeTimeLabel(form.time)
          const exists = slots.some((s) => normalizeTimeLabel(s.slot_time) === normalizedSelected && s.slot_date === form.date)
          if (!exists) {
            setForm((prev) => ({ ...prev, time: '' }))
          }
        }
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setAvailableSlots([])
        setError(loadError instanceof Error ? loadError.message : 'Failed to load available appointment slots')
      } finally {
        if (isMounted) {
          setLoadingSlots(false)
        }
      }
    }

    void loadAvailability()

    return () => {
      isMounted = false
    }
  }, [form.date])

  function handleDateChange(value: string) {
    setForm((previous) => ({ ...previous, date: value, time: '' }))
    setDateChosen(true)
    if (error) setError('')
    if (isSmallScreen) {
      setTimeout(() => {
        if (availabilityRef.current) {
          availabilityRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 120)
    }
  }

  function handleMessageChange(value: string) {
    const nextMessage = trimToWordLimit(value, WORD_LIMIT)
    setForm((previous) => ({ ...previous, message: nextMessage }))
    if (error) {
      setError('')
    }
  }

  function handleSlotSelect(slotTime: string) {
    setForm((previous) => ({ ...previous, time: slotTime }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.names.trim() || !form.email.trim() || !form.phone.trim() || !form.date || !form.meeting_format || !form.message.trim()) {
      setError('All fields are required.')
      return
    }

    // Ensure selected time is one of the available slots for the chosen date
    const selectedNormalized = normalizeTimeLabel(form.time)
    const selectedSlot = availableSlots.find(
      (s) => normalizeTimeLabel(s.slot_time) === selectedNormalized && s.slot_date === form.date,
    )

    if (!selectedSlot) {
      setError('Please select a time from the available slots.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(buildApiUrl('/book-appointment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const payload = await parseResponseBody(response)
      if (!response.ok || !payload || typeof payload !== 'object' || (payload as ApiPayload).success !== true) {
        throw new Error(getMessage(payload, 'Failed to book appointment'))
      }

      setSuccess(getMessage(payload, 'Appointment booked successfully'))
      setForm((previous) => ({
        ...previous,
        phone: '',
        time: '',
        meeting_format: '',
        message: '',
        date: getTodayValue(),
        names: displayName || previous.names,
      }))
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to book appointment')
    } finally {
      setSubmitting(false)
    }
  }

    return (
    <EntrepreneurShell
      title="Book Appointment"
      subtitle="Reserve a meeting with the Finverra team and see available slots before you submit your request."
    >
      <div style={{ ...styles.topGrid, ...(isSmallScreen ? styles.topGridMobile : {}) }}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.kicker}>Booking form</span>
              <h3 style={styles.title}>Request a meeting</h3>
            </div>
          </div>

          {error ? <p style={styles.errorBanner}>{error}</p> : null}
          {success ? <p style={styles.successBanner}>{success}</p> : null}

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.row}>
              <label style={styles.label} htmlFor="names">Full name</label>
              <input
                id="names"
                type="text"
                style={styles.input}
                value={form.names}
                onChange={(event) => setForm((previous) => ({ ...previous, names: event.target.value }))}
                placeholder="Your full name"
              />
            </div>

            <div style={styles.row}>
              <label style={styles.label} htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                style={styles.input}
                value={form.email}
                onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
                placeholder="you@example.com"
              />
            </div>

            <div style={styles.row}>
              <label style={styles.label} htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                style={styles.input}
                value={form.phone}
                onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
                placeholder="+250 ..."
              />
            </div>

            <div style={{ ...styles.inlineGrid, ...(isSmallScreen ? styles.inlineGridMobile : {}) }}>
              <div style={styles.row}>
                <label style={styles.label} htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  style={{ ...styles.input, ...(isSmallScreen ? styles.inputMobile : {}) }}
                  value={form.date}
                  min={getTodayValue()}
                  onChange={(event) => handleDateChange(event.target.value)}
                />
              </div>

              <div style={styles.row}>
                <label style={styles.label} htmlFor="meeting_format">Meeting format</label>
                <select
                  id="meeting_format"
                  style={{ ...styles.input, ...(isSmallScreen ? styles.inputMobile : {}) }}
                  value={form.meeting_format}
                  onChange={(event) => setForm((previous) => ({ ...previous, meeting_format: event.target.value }))}
                >
                  <option value="">Select format</option>
                  <option value="Onsite">Onsite</option>
                  <option value="Virtual">Virtual</option>
                  <option value="Phone Call">Phone Call</option>
                </select>
              </div>
            </div>

              <div style={styles.row}>
              <label style={styles.label} htmlFor="time">Time</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  id="time"
                  type="text"
                  style={{ ...styles.input, ...(isSmallScreen ? styles.inputMobile : {}), flex: 1 }}
                  value={form.time}
                  readOnly
                  placeholder="Choose a time from available slots"
                />
                {form.time ? (
                  <button
                    type="button"
                    style={styles.clearBtn}
                    onClick={() => setForm((previous) => ({ ...previous, time: '' }))}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            <div style={styles.row}>
              <label style={styles.label} htmlFor="message">Message</label>
              <textarea
                id="message"
                rows={5}
                style={styles.textarea}
                value={form.message}
                onChange={(event) => handleMessageChange(event.target.value)}
                placeholder="Briefly describe why you need the meeting"
              />
              <div style={styles.counterRow}>
                <span>{messageWords} / {WORD_LIMIT} words</span>
                <span>Max {WORD_LIMIT} words</span>
              </div>
            </div>

            <button type="submit" style={styles.primaryBtn} disabled={submitting}>
              {submitting ? 'Sending...' : 'Book Appointment'}
            </button>
          </form>
        </section>

        <section style={styles.panel} ref={availabilityRef}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.kicker}>Availability</span>
              <h3 style={styles.title}>Available slots</h3>
            </div>
          </div>

          <p style={styles.helperText}>
            Select a date to refresh the available appointment slots. Tap a slot to copy its time into the form.
          </p>

          {isSmallScreen && !dateChosen ? (
            <div style={styles.emptyState}>Choose a date above to view available slots.</div>
          ) : loadingSlots ? (
            <div style={styles.emptyState}>Loading available slots...</div>
          ) : availableSlots.length === 0 ? (
            <div style={styles.emptyState}>No available slots found for the selected date.</div>
          ) : (
            <div style={{ ...styles.slotGrid, ...(isSmallScreen ? styles.slotGridMobile : {}) }}>
              {availableSlots.map((slot) => {
                const isSelected = normalizeTimeLabel(slot.slot_time) === form.time

                return (
                  <button
                    key={slot.id}
                    type="button"
                    style={{ ...styles.slotChip, ...(isSmallScreen ? styles.slotChipMobile : {}), ...(isSelected ? styles.slotChipActive : {}) }}
                    onClick={() => handleSlotSelect(normalizeTimeLabel(slot.slot_time))}
                  >
                    <strong style={{ fontSize: isSmallScreen ? 14 : undefined }}>{normalizeTimeLabel(slot.slot_time)}</strong>
                    <span style={{ fontSize: isSmallScreen ? 12 : undefined }}>{formatDateLabel(slot.slot_date)}</span>
                  </button>
                )
              })}
            </div>
          )}

          <div style={styles.noteBox}>
            <strong style={styles.noteStrong}>Tip</strong>
            <p style={styles.noteText}>
              Your name and email are prefilled from your entrepreneur account when available.
            </p>
          </div>
        </section>
      </div>
    </EntrepreneurShell>
  )
}

const styles: Record<string, CSSProperties> = {
  topGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
    gap: 18,
  },
  panel: {
    background: '#ffffff',
    borderRadius: 24,
    padding: 22,
    border: '1px solid rgba(2, 49, 62, 0.08)',
    boxShadow: '0 18px 38px rgba(15, 45, 92, 0.08)',
  },
  panelHeader: {
    marginBottom: 14,
  },
  kicker: {
    display: 'inline-block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#71818d',
    fontWeight: 700,
    marginBottom: 4,
  },
  title: {
    margin: 0,
    color: '#023341',
    fontSize: 22,
  },
  helperText: {
    margin: '0 0 14px',
    color: '#57707b',
    lineHeight: 1.6,
  },
  errorBanner: {
    margin: '0 0 14px',
    padding: '12px 14px',
    borderRadius: 14,
    background: 'rgba(208, 54, 54, 0.1)',
    color: '#a32121',
    border: '1px solid rgba(208, 54, 54, 0.18)',
  },
  successBanner: {
    margin: '0 0 14px',
    padding: '12px 14px',
    borderRadius: 14,
    background: 'rgba(34, 139, 85, 0.12)',
    color: '#1f6d43',
    border: '1px solid rgba(34, 139, 85, 0.16)',
  },
  form: {
    display: 'grid',
    gap: 12,
  },
  row: {
    display: 'grid',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: '#35515b',
  },
  inlineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
  input: {
    width: '100%',
    borderRadius: 14,
    border: '1px solid rgba(2, 49, 62, 0.14)',
    padding: '12px 14px',
    fontSize: 14,
    color: '#023341',
    background: '#f9fcfd',
    outline: 'none',
  },
  inputMobile: {
    padding: '10px 12px',
    fontSize: 13,
  },
  textarea: {
    width: '100%',
    borderRadius: 16,
    border: '1px solid rgba(2, 49, 62, 0.14)',
    padding: '12px 14px',
    fontSize: 14,
    color: '#023341',
    background: '#f9fcfd',
    outline: 'none',
    resize: 'vertical',
  },
  counterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 12,
    color: '#6b7f88',
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
  slotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 10,
    marginBottom: 18,
  },
  slotGridMobile: {
    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
    gap: 8,
  },
  slotChip: {
    border: '1px solid rgba(2, 49, 62, 0.12)',
    background: '#f8fcfd',
    color: '#023341',
    borderRadius: 16,
    padding: '12px 10px',
    display: 'grid',
    gap: 4,
    cursor: 'pointer',
    textAlign: 'center',
  },
  slotChipMobile: {
    padding: '10px 8px',
    borderRadius: 12,
  },
  slotChipActive: {
    border: '1px solid rgba(230, 168, 23, 0.35)',
    background: 'linear-gradient(135deg, rgba(230, 168, 23, 0.18), rgba(255, 255, 255, 1))',
  },
  noteBox: {
    borderRadius: 18,
    padding: 16,
    background: 'rgba(92, 33, 187, 0.08)',
    border: '1px solid rgba(13, 13, 183, 0.16)',
  },
  clearBtn: {
    border: 'none',
    background: 'transparent',
    color: '#023341',
    cursor: 'pointer',
    padding: '8px 10px',
    borderRadius: 10,
    fontWeight: 700,
  },
  noteStrong: {
    display: 'block',
    marginBottom: 6,
    color: '#023341',
  },
  noteText: {
    margin: 0,
    color: '#5d5a46',
    lineHeight: 1.6,
  },
  emptyState: {
    padding: '18px 16px',
    borderRadius: 16,
    background: '#f7fbfc',
    color: '#54707a',
    border: '1px dashed rgba(2, 49, 62, 0.16)',
    textAlign: 'center',
  },
  topGridMobile: {
    gridTemplateColumns: '1fr',
    gap: 12,
  },
  panelMobile: {
    padding: 14,
  },
  inlineGridMobile: {
    gridTemplateColumns: '1fr',
  },
}