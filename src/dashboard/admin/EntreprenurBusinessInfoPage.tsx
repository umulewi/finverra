import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import AdminShell from './AdminShell'
import { getAuthSession } from '../authStorage'
import {
  fetchAdminEntrepreneurBusinessInfoById,
  fetchAdminEntrepreneurBusinessInfos,
  type AdminEntrepreneurBusinessInfo,
} from '../dashboardApi'
import { buildApiUrl } from '../../config/api'

function getAccessToken() {
  const session = getAuthSession()
  return session ? (session.payload as { token?: string })?.token ?? '' : ''
}

function toText(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function toDateDisplay(value: unknown) {
  const text = toText(value)
  if (!text) return '-'
  const matchedDate = text.match(/^(\d{4}-\d{2}-\d{2})/)
  return matchedDate ? matchedDate[1] : text
}

function toAssetUrl(value: string) {
  const text = value.trim()
  if (!text) return ''
  if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:')) {
    return text
  }
  return buildApiUrl(text)
}

function isAssetPath(value: unknown) {
  const text = toText(value).trim().toLowerCase()
  return text.startsWith('/uploads/')
}

export default function EntreprenurBusinessInfoPage() {
  const [records, setRecords] = useState<AdminEntrepreneurBusinessInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewRecord, setViewRecord] = useState<AdminEntrepreneurBusinessInfo | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const accessToken = getAccessToken()

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const filtered = query
      ? records.filter((item) => Object.values(item)
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(query)))
      : records

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const safePage = Math.min(currentPage, totalPages)
    const startIndex = (safePage - 1) * pageSize

    return {
      items: filtered.slice(startIndex, startIndex + pageSize),
      totalPages,
      totalItems: filtered.length,
      currentPage: safePage,
    }
  }, [records, searchQuery, currentPage])

  async function loadBusinessInfo() {
    setLoading(true)
    setError(null)

    try {
      const rows = await fetchAdminEntrepreneurBusinessInfos(accessToken)
      setRecords(rows)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load business information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBusinessInfo()
  }, [])

  async function openView(record: AdminEntrepreneurBusinessInfo) {
    setError(null)

    const possibleEntrepreneurId = Number(record.entrepreneur_id)

    if (Number.isFinite(possibleEntrepreneurId)) {
      try {
        const detail = await fetchAdminEntrepreneurBusinessInfoById(possibleEntrepreneurId, accessToken)
        setViewRecord(detail)
        setShowViewModal(true)
        return
      } catch {
        // Fallback to row data if backend list payload does not expose entrepreneur_id consistently.
      }
    }

    setViewRecord(record)
    setShowViewModal(true)
  }

  function closeViewModal() {
    setShowViewModal(false)
    setViewRecord(null)
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const detailRows = useMemo(() => {
    if (!viewRecord) return []
    return Object.entries(viewRecord)
      .filter(([key]) => key !== 'id' && key !== 'users_id')
      .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
  }, [viewRecord])

  return (
    <AdminShell
      title="Entreprenur Business info"
      subtitle="Review and manage entrepreneur business information in one place."
    >
      {error ? <p style={styles.errorBanner}>{error}</p> : null}

      {showViewModal && viewRecord ? (
        <div style={styles.overlay} onClick={closeViewModal}>
          <div style={styles.viewModal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Business Info Details</h3>
              <button type="button" style={styles.closeBtn} onClick={closeViewModal}>x</button>
            </div>

            <div style={styles.viewGrid}>
              {detailRows.map(([key, value]) => (
                <div style={styles.viewItem} key={key}>
                  <span style={styles.viewLabel}>{key.replaceAll('_', ' ')}</span>
                  {isAssetPath(value) ? (
                    <a href={toAssetUrl(toText(value))} target="_blank" rel="noreferrer" style={styles.assetLink}>
                      {toText(value)}
                    </a>
                  ) : (
                    <strong style={styles.viewValue}>
                      {key === 'created_at' ? toDateDisplay(value) : toText(value)}
                    </strong>
                  )}
                </div>
              ))}
            </div>

            <div style={styles.viewActions}>
              <button type="button" style={styles.closeActionBtn} onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      ) : null}

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <h3 style={styles.panelTitle}>Business Information</h3>
            <p style={styles.panelText}>Live entrepreneur business information records from application_foam.</p>
          </div>
          <div style={styles.panelHeaderActions}>
            <span style={styles.countPill}>{visibleRecords.totalItems} records</span>
            <button type="button" style={styles.refreshBtn} onClick={() => void loadBusinessInfo()}>
              Refresh
            </button>
          </div>
        </div>

        <div style={styles.searchRow}>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by entrepreneur, business name, status, sector, location, or phone..."
            style={styles.searchInput}
          />
          <span style={styles.searchHint}>
            Showing {visibleRecords.items.length} of {visibleRecords.totalItems}
          </span>
        </div>

        {loading ? <p style={styles.panelText}>Loading entrepreneur business information...</p> : null}

        {!loading && visibleRecords.totalItems === 0 ? (
          <p style={styles.panelText}>No business information found.</p>
        ) : null}

        {!loading && visibleRecords.totalItems > 0 ? (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Telephone</th>
                  <th style={styles.th}>Business Name</th>
                  <th style={styles.th}>Registration Status</th>
                  <th style={styles.th}>Business Sector</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Employees</th>
                  <th style={styles.th}>Created At</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.items.map((item, index) => (
                  <tr key={`${toText(item.id)}-${index}`} style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={styles.td}>{(visibleRecords.currentPage - 1) * pageSize + index + 1}</td>
                    <td style={styles.td}>{toText(item.first_name)} {toText(item.last_name)}</td>
                    <td style={styles.td}>{toText(item.email) || '-'}</td>
                    <td style={styles.td}>{toText(item.telephone) || '-'}</td>
                    <td style={styles.td}>{toText(item.business_name) || '-'}</td>
                    <td style={styles.td}>{toText(item.registration_status) || '-'}</td>
                    <td style={styles.td}>{toText(item.business_sector) || '-'}</td>
                    <td style={styles.td}>
                      {[toText(item.province), toText(item.district), toText(item.sector), toText(item.cell), toText(item.village)]
                        .filter((part) => part.trim())
                        .join(', ') || '-'}
                    </td>
                    <td style={styles.td}>{toText(item.number_of_employees) || '-'}</td>
                    <td style={styles.td}>{toDateDisplay(item.created_at)}</td>
                    <td style={styles.td}>
                      <button type="button" style={styles.viewBtn} onClick={() => openView(item)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && visibleRecords.totalPages > 1 ? (
          <div style={styles.pagination}>
            <button
              type="button"
              style={styles.pageBtn}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={visibleRecords.currentPage === 1}
            >
              Prev
            </button>

            <div style={styles.pageNumbers}>
              {Array.from({ length: visibleRecords.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  style={{
                    ...styles.pageBtn,
                    ...(pageNumber === visibleRecords.currentPage ? styles.pageBtnActive : {}),
                  }}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>

            <button
              type="button"
              style={styles.pageBtn}
              onClick={() => setCurrentPage((page) => Math.min(visibleRecords.totalPages, page + 1))}
              disabled={visibleRecords.currentPage === visibleRecords.totalPages}
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  errorBanner: {
    marginTop: 14,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #f4c2c2',
    background: '#fff1f1',
    color: '#8d1e1e',
  },
  panel: {
    marginTop: 16,
    background: '#ffffff',
    border: '1px solid #d8e8eb',
    borderRadius: 14,
    padding: '20px',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  panelHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  countPill: {
    border: '1px solid #c8dde1',
    borderRadius: 999,
    padding: '7px 11px',
    fontSize: 12,
    fontWeight: 800,
    color: '#03475a',
    background: '#f6fbfc',
  },
  refreshBtn: {
    border: '1px solid #bdd8de',
    borderRadius: 9,
    padding: '7px 12px',
    cursor: 'pointer',
    color: '#03475a',
    background: 'linear-gradient(180deg, #ffffff 0%, #eef7f8 100%)',
    fontWeight: 700,
  },
  panelTitle: {
    margin: 0,
    color: '#023341',
    fontSize: 18,
  },
  panelText: {
    margin: '10px 0 0',
    color: '#4f6f78',
    lineHeight: 1.6,
  },
  searchRow: {
    marginTop: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: '1 1 320px',
    border: '1px solid #bdd8de',
    borderRadius: 12,
    padding: '11px 14px',
    background: '#f9fcfd',
    color: '#023341',
    fontSize: 14,
    outline: 'none',
  },
  searchHint: {
    color: '#5f7f88',
    fontSize: 13,
    fontWeight: 600,
  },
  tableWrap: {
    marginTop: 14,
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 980,
    borderRadius: 12,
    overflow: 'hidden',
  },
  th: {
    textAlign: 'left',
    padding: '10px 8px',
    fontSize: 12,
    color: '#4f6f78',
    borderBottom: '1px solid #d8e8eb',
  },
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid #e6f0f2',
    color: '#03475a',
    fontSize: 14,
    verticalAlign: 'middle',
  },
  rowEven: {
    background: '#ffffff',
  },
  rowOdd: {
    background: '#fcfdff',
  },
  viewBtn: {
    border: '1px solid #c7dffc',
    borderRadius: 8,
    padding: '8px 12px',
    cursor: 'pointer',
    color: '#03475a',
    background: '#f2fbfc',
    fontWeight: 700,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(8, 20, 38, 0.45)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 99,
    padding: 16,
  },
  viewModal: {
    width: 'min(1020px, 100%)',
    maxHeight: '90vh',
    overflow: 'auto',
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #d8e8eb',
    boxShadow: '0 20px 50px rgba(8, 20, 38, 0.2)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid #ecf1f7',
  },
  modalTitle: {
    margin: 0,
    color: '#023341',
    fontSize: 18,
  },
  closeBtn: {
    border: '1px solid #d1e0e3',
    borderRadius: 8,
    background: '#fff',
    color: '#03475a',
    width: 30,
    height: 30,
    cursor: 'pointer',
    fontWeight: 700,
  },
  viewGrid: {
    padding: 16,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 10,
  },
  viewItem: {
    display: 'grid',
    gap: 4,
    border: '1px solid #d8e8eb',
    borderRadius: 10,
    background: '#fcfefe',
    padding: '10px 12px',
    color: '#03475a',
  },
  viewLabel: {
    color: '#4f6f78',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: 700,
  },
  viewValue: {
    color: '#023341',
    fontSize: 14,
  },
  assetLink: {
    color: '#03475a',
    fontWeight: 700,
    textDecoration: 'none',
    wordBreak: 'break-word',
  },
  viewActions: {
    borderTop: '1px solid #ecf1f7',
    padding: 16,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  closeActionBtn: {
    border: '1px solid #cfe0e3',
    borderRadius: 8,
    padding: '9px 12px',
    cursor: 'pointer',
    background: '#fff',
    color: '#1e4878',
    fontWeight: 700,
  },
  pagination: {
    marginTop: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pageNumbers: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pageBtn: {
    border: '1px solid #bfd5da',
    borderRadius: 10,
    padding: '8px 12px',
    background: '#fff',
    color: '#023341',
    fontWeight: 700,
    cursor: 'pointer',
  },
  pageBtnActive: {
    background: 'linear-gradient(180deg, #03475a 0%, #023341 100%)',
    color: '#fff',
    borderColor: '#03475a',
  },
}
