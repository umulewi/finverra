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
  appointment_slots?: unknown
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

export default function AppointmentAvailabilityPage() {
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'booked'>('all')
  const [filterDate, setFilterDate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const PAGE_SIZE = 10

  async function loadSlots() {
    setLoading(true)
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
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSlots()
  }, [])

  async function handleDeleteSlot(slotId: number) {
    setConfirmDeleteId(null)
    setDeletingId(slotId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(buildApiUrl(`/admin/appointment-slots/${slotId}`), {
        method: 'DELETE',
        headers: authHeader(),
      })

      const payload = await parseResponseBody(response)
      if (!response.ok) {
        throw new Error(getMessage(payload, 'Failed to delete appointment slot'))
      }

      setSuccess(getMessage(payload, 'Appointment slot deleted successfully'))
      setSlots((prev) => prev.filter((item) => item.id !== slotId))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete appointment slot')
    } finally {
      setDeletingId(null)
    }
  }

  const displayedSlots = slots.filter((slot) => {
    if (filterStatus !== 'all' && slot.status !== filterStatus) return false

    if (filterDate) {
      const slotDatePart = slot.slot_date.includes('T') ? slot.slot_date.split('T')[0] : slot.slot_date
      if (slotDatePart !== filterDate) return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      const combined = `${slot.booked_name || ''} ${slot.booked_email || ''} ${slot.booked_phone || ''} ${slot.slot_date} ${slot.slot_time}`.toLowerCase()
      if (!combined.includes(q)) return false
    }

    return true
  })
  const totalPages = Math.max(1, Math.ceil(displayedSlots.length / PAGE_SIZE))
  const paginatedSlots = displayedSlots.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    // Reset to first page when filters or data change
    setPage(1)
  }, [filterStatus, filterDate, searchQuery, slots])

  return (
    <AdminShell title="Appointment Availability" subtitle="View and manage all appointment slots.">
      {confirmDeleteId !== null ? (
        <div style={styles.overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.confirmModal} onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete Appointment Slot?</h3>
            <p style={styles.confirmText}>This action cannot be undone.</p>
            <div style={styles.confirmActions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button
                type="button"
                style={styles.deleteBtn}
                disabled={deletingId === confirmDeleteId}
                onClick={() => void handleDeleteSlot(confirmDeleteId)}
              >
                {deletingId === confirmDeleteId ? 'Deleting...' : 'Yes, Delete'}
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
            <span style={styles.panelKicker}>All slots</span>
            <h3 style={styles.panelTitle}>Appointment availability</h3>
          </div>

          <div style={styles.filterRow}>
            <input
              type="search"
              placeholder="Search name, email, phone, date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={styles.filterInput}
            />

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} style={styles.filterSelect}>
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
            </select>

            <button type="button" style={styles.secondaryBtn} onClick={() => void loadSlots()}>
              Refresh
            </button>
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
                {paginatedSlots.map((slot) => (
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
                        onClick={() => setConfirmDeleteId(slot.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.paginationRow}>
              <button
                type="button"
                style={{ ...styles.pageBtn, ...(page === 1 ? styles.pageBtnDisabled : {}) }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </button>

              <div style={styles.pageInfo}>
                Page {page} of {totalPages} — Showing {paginatedSlots.length} of {displayedSlots.length} filtered
              </div>

              <button
                type="button"
                style={{ ...styles.pageBtn, ...(page >= totalPages ? styles.pageBtnDisabled : {}) }}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
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
    width: 'min(420px, 100%)',
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
    margin: 0,
    color: '#4f6f78',
  },
  confirmActions: {
    marginTop: 14,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    border: '1px solid #cfe0e3',
    borderRadius: 8,
    padding: '9px 12px',
    cursor: 'pointer',
    background: '#fff',
    color: '#1e4878',
    fontWeight: 700,
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
  deleteBtn: {
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
  cellMeta: {
    fontSize: 13,
    color: '#5f7680',
    lineHeight: 1.5,
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
  paginationRow: {
    marginTop: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
    borderTop: '1px solid rgba(2, 51, 65, 0.04)',
  },
  pageBtn: {
    border: '1px solid #bdd8de',
    borderRadius: 8,
    padding: '8px 12px',
    background: '#fff',
    color: '#023341',
    fontWeight: 700,
    cursor: 'pointer',
  },
  pageBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  pageInfo: {
    color: '#5f7680',
    fontSize: 13,
    fontWeight: 600,
  },
  filterRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInput: {
    border: '1px solid #bdd8de',
    borderRadius: 10,
    padding: '8px 10px',
    fontSize: 14,
    color: '#023341',
    background: '#fff',
    minWidth: 200,
  },
  filterInput: {
    border: '1px solid #bdd8de',
    borderRadius: 10,
    padding: '8px 10px',
    fontSize: 14,
    color: '#023341',
    background: '#fff',
  },
  filterSelect: {
    border: '1px solid #bdd8de',
    borderRadius: 10,
    padding: '8px 10px',
    fontSize: 14,
    color: '#023341',
    background: '#fff',
  },
}
