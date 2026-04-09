import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, FormEvent } from 'react'
import AdminShell from './AdminShell'
import { getAuthSession } from '../authStorage'
import {
  deleteAdminInvestor,
  fetchAdminInvestorById,
  fetchAdminInvestors,
  type AdminInvestor,
  updateAdminInvestor,
} from '../dashboardApi'
import { buildApiUrl } from '../../config/api'
import {
  getCellsBySector,
  getDistrictsByProvince,
  getProvinces,
  getSectorsByDistrict,
  getVillagesByCell,
} from 'rwanda-geo-structure'

type InvestorFormState = {
  users_id: string
  first_name: string
  last_name: string
  telephone: string
  date_of_birth: string
  gender: string
  nationality: string
  province: string
  district: string
  sector: string
  cell: string
  village: string
  id_type: string
  id_number: string
  image: string
  imageFile: File | null
}

const emptyForm: InvestorFormState = {
  users_id: '',
  first_name: '',
  last_name: '',
  telephone: '',
  date_of_birth: '',
  gender: '',
  nationality: '',
  province: '',
  district: '',
  sector: '',
  cell: '',
  village: '',
  id_type: '',
  id_number: '',
  image: '',
  imageFile: null,
}

function getAccessToken() {
  const session = getAuthSession()
  return session ? (session.payload as { token?: string })?.token ?? '' : ''
}

function toDateInputValue(value: string | null) {
  if (!value) {
    return ''
  }

  const matchedDate = value.match(/^(\d{4}-\d{2}-\d{2})/)
  return matchedDate ? matchedDate[1] : ''
}

function toImageUrl(value: string) {
  const text = value.trim()

  if (!text) {
    return ''
  }

  if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:')) {
    return text
  }

  return buildApiUrl(text)
}

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<AdminInvestor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewInvestor, setViewInvestor] = useState<AdminInvestor | null>(null)
  const [form, setForm] = useState<InvestorFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [provinces, setProvinces] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [sectors, setSectors] = useState<string[]>([])
  const [cells, setCells] = useState<string[]>([])
  const [villages, setVillages] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const accessToken = getAccessToken()

  const computedMetrics = useMemo(() => {
    const total = investors.length
    const activeProfiles = investors.filter((item) => Boolean(item.first_name && item.last_name && item.telephone)).length
    const pendingReviews = investors.filter((item) => !item.id_number || !item.id_type).length

    return [
      { label: 'Total Investors', value: String(total) },
      { label: 'Active Profiles', value: String(activeProfiles) },
      { label: 'Pending Reviews', value: String(pendingReviews) },
    ]
  }, [investors])

  useEffect(() => {
    setProvinces(getProvinces())
  }, [])

  function loadDistrictsByProvince(provinceName: string) {
    return provinceName ? getDistrictsByProvince(provinceName) : []
  }

  function loadSectorsByDistrict(provinceName: string, districtName: string) {
    return provinceName && districtName ? getSectorsByDistrict(provinceName, districtName) : []
  }

  function loadCellsBySector(provinceName: string, districtName: string, sectorName: string) {
    return provinceName && districtName && sectorName
      ? getCellsBySector(provinceName, districtName, sectorName)
      : []
  }

  function loadVillagesByCell(provinceName: string, districtName: string, sectorName: string, cellName: string) {
    return provinceName && districtName && sectorName && cellName
      ? getVillagesByCell(provinceName, districtName, sectorName, cellName)
      : []
  }

  function hydrateLocationOptions(values: Pick<InvestorFormState, 'province' | 'district' | 'sector' | 'cell'>) {
    setDistricts(loadDistrictsByProvince(values.province))
    setSectors(loadSectorsByDistrict(values.province, values.district))
    setCells(loadCellsBySector(values.province, values.district, values.sector))
    setVillages(loadVillagesByCell(values.province, values.district, values.sector, values.cell))
  }

  function handleProvinceChange(provinceName: string) {
    const nextDistricts = loadDistrictsByProvince(provinceName)

    setForm((prev) => ({
      ...prev,
      province: provinceName,
      district: '',
      sector: '',
      cell: '',
      village: '',
    }))
    setDistricts(nextDistricts)
    setSectors([])
    setCells([])
    setVillages([])
  }

  function handleDistrictChange(districtName: string) {
    const nextSectors = loadSectorsByDistrict(form.province, districtName)

    setForm((prev) => ({
      ...prev,
      district: districtName,
      sector: '',
      cell: '',
      village: '',
    }))
    setSectors(nextSectors)
    setCells([])
    setVillages([])
  }

  function handleSectorChange(sectorName: string) {
    const nextCells = loadCellsBySector(form.province, form.district, sectorName)

    setForm((prev) => ({
      ...prev,
      sector: sectorName,
      cell: '',
      village: '',
    }))
    setCells(nextCells)
    setVillages([])
  }

  function handleCellChange(cellName: string) {
    const nextVillages = loadVillagesByCell(form.province, form.district, form.sector, cellName)

    setForm((prev) => ({
      ...prev,
      cell: cellName,
      village: '',
    }))
    setVillages(nextVillages)
  }

  async function loadInvestors() {
    setLoading(true)
    setError(null)

    try {
      const rows = await fetchAdminInvestors(accessToken)
      setInvestors(rows)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load investors.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadInvestors()
  }, [])

  function closeForm() {
    setShowForm(false)
    setActiveId(null)
    setForm(emptyForm)
    setDistricts([])
    setSectors([])
    setCells([])
    setVillages([])
    setFormError(null)
    if (fileRef.current) {
      fileRef.current.value = ''
    }
  }

  function closeViewModal() {
    setShowViewModal(false)
    setViewInvestor(null)
  }

  async function openEdit(investorId: number) {
    setFormError(null)
    setError(null)
    setSuccess(null)

    try {
      const investor = await fetchAdminInvestorById(investorId, accessToken)
      setActiveId(investor.id)
      setForm({
        users_id: String(investor.users_id ?? ''),
        first_name: investor.first_name ?? '',
        last_name: investor.last_name ?? '',
        telephone: investor.telephone ?? '',
        date_of_birth: toDateInputValue(investor.date_of_birth),
        gender: investor.gender ?? '',
        nationality: investor.nationality ?? '',
        province: investor.province ?? '',
        district: investor.district ?? '',
        sector: investor.sector ?? '',
        cell: investor.cell ?? '',
        village: investor.village ?? '',
        id_type: investor.id_type ?? '',
        id_number: investor.id_number ?? '',
        image: investor.image ?? '',
        imageFile: null,
      })
      hydrateLocationOptions({
        province: investor.province ?? '',
        district: investor.district ?? '',
        sector: investor.sector ?? '',
        cell: investor.cell ?? '',
      })
      setShowForm(true)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load investor details.')
    }
  }

  async function openView(investorId: number) {
    setError(null)
    setSuccess(null)

    try {
      const investor = await fetchAdminInvestorById(investorId, accessToken)
      setViewInvestor(investor)
      setShowViewModal(true)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load investor details.')
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setForm((prev) => ({ ...prev, imageFile: file }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSuccess(null)

    if (!activeId) {
      setFormError('No investor is selected for update.')
      return
    }

    const parsedUserId = Number(form.users_id)
    if (!Number.isFinite(parsedUserId)) {
      setFormError('users_id must be a valid number.')
      return
    }

    if (!form.first_name.trim() || !form.last_name.trim() || !form.telephone.trim()) {
      setFormError('first_name, last_name, and telephone are required.')
      return
    }

    setSaving(true)
    try {
      const payload = await updateAdminInvestor(
        activeId,
        {
          users_id: parsedUserId,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          telephone: form.telephone.trim(),
          date_of_birth: form.date_of_birth.trim(),
          gender: form.gender.trim(),
          nationality: form.nationality.trim(),
          province: form.province.trim(),
          district: form.district.trim(),
          sector: form.sector.trim(),
          cell: form.cell.trim(),
          village: form.village.trim(),
          id_type: form.id_type.trim(),
          id_number: form.id_number.trim(),
          image: form.image.trim(),
          imageFile: form.imageFile,
        },
        accessToken,
      )

      setSuccess(payload.message ?? 'Investor updated successfully.')
      closeForm()
      await loadInvestors()
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Failed to update investor.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(investorId: number) {
    setConfirmDeleteId(null)
    setDeletingId(investorId)
    setError(null)
    setSuccess(null)

    try {
      const payload = await deleteAdminInvestor(investorId, accessToken)
      setInvestors((prev) => prev.filter((item) => item.id !== investorId))
      setSuccess(payload.message ?? 'Investor deleted successfully.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete investor.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminShell
      title="Investors"
      subtitle="View and manage investor records, profile status, and engagement details."
    >
      <section style={styles.grid}>
        {computedMetrics.map((metric) => (
          <article key={metric.label} style={styles.card}>
            <p style={styles.metricLabel}>{metric.label}</p>
            <p style={styles.metricValue}>{metric.value}</p>
          </article>
        ))}
      </section>

      {error ? <p style={styles.errorBanner}>{error}</p> : null}
      {success ? <p style={styles.successBanner}>{success}</p> : null}

      {confirmDeleteId !== null ? (
        <div style={styles.overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.confirmModal} onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete Investor?</h3>
            <p style={styles.confirmText}>This action cannot be undone.</p>
            <div style={styles.confirmActions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button
                type="button"
                style={styles.deleteBtn}
                disabled={deletingId === confirmDeleteId}
                onClick={() => handleDelete(confirmDeleteId)}
              >
                {deletingId === confirmDeleteId ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <div style={styles.overlay} onClick={closeForm}>
          <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Investor</h3>
              <button type="button" style={styles.closeBtn} onClick={closeForm}>x</button>
            </div>

            <form style={styles.form} onSubmit={handleSubmit}>
              {formError ? <p style={styles.formError}>{formError}</p> : null}

              <div style={styles.formGrid}>
                <label style={styles.field}>
                  <span>First Name *</span>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
                    style={styles.input}
                    disabled={saving}
                  />
                </label>
                <label style={styles.field}>
                  <span>Last Name *</span>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
                    style={styles.input}
                    disabled={saving}
                  />
                </label>
                <label style={styles.field}>
                  <span>Telephone *</span>
                  <input
                    type="text"
                    value={form.telephone}
                    onChange={(event) => setForm((prev) => ({ ...prev, telephone: event.target.value }))}
                    style={styles.input}
                    disabled={saving}
                  />
                </label>
                <label style={styles.field}>
                  <span>Date Of Birth</span>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(event) => setForm((prev) => ({ ...prev, date_of_birth: event.target.value }))}
                    style={styles.input}
                    disabled={saving}
                  />
                </label>
                <label style={styles.field}>
                  <span>Gender</span>
                  <input
                    type="text"
                    value={form.gender}
                    onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}
                    style={styles.input}
                    disabled={saving}
                  />
                </label>
                <label style={styles.field}>
                  <span>Nationality</span>
                  <input
                    type="text"
                    value={form.nationality}
                    onChange={(event) => setForm((prev) => ({ ...prev, nationality: event.target.value }))}
                    style={styles.input}
                    disabled={saving}
                  />
                </label>
                <label style={styles.field}>
                  <span>Province</span>
                  <select
                    value={form.province}
                    onChange={(event) => handleProvinceChange(event.target.value)}
                    style={styles.input}
                    disabled={saving}
                  >
                    <option value="">Select Province</option>
                    {provinces.map((provinceName) => (
                      <option key={provinceName} value={provinceName}>{provinceName}</option>
                    ))}
                  </select>
                </label>
                <label style={styles.field}>
                  <span>District</span>
                  <select
                    value={form.district}
                    onChange={(event) => handleDistrictChange(event.target.value)}
                    style={styles.input}
                    disabled={saving || !form.province}
                  >
                    <option value="">Select District</option>
                    {districts.map((districtName) => (
                      <option key={districtName} value={districtName}>{districtName}</option>
                    ))}
                  </select>
                </label>
                <label style={styles.field}>
                  <span>Sector</span>
                  <select
                    value={form.sector}
                    onChange={(event) => handleSectorChange(event.target.value)}
                    style={styles.input}
                    disabled={saving || !form.district}
                  >
                    <option value="">Select Sector</option>
                    {sectors.map((sectorName) => (
                      <option key={sectorName} value={sectorName}>{sectorName}</option>
                    ))}
                  </select>
                </label>
                <label style={styles.field}>
                  <span>Cell</span>
                  <select
                    value={form.cell}
                    onChange={(event) => handleCellChange(event.target.value)}
                    style={styles.input}
                    disabled={saving || !form.sector}
                  >
                    <option value="">Select Cell</option>
                    {cells.map((cellName) => (
                      <option key={cellName} value={cellName}>{cellName}</option>
                    ))}
                  </select>
                </label>
                <label style={styles.field}>
                  <span>Village</span>
                  <select
                    value={form.village}
                    onChange={(event) => setForm((prev) => ({ ...prev, village: event.target.value }))}
                    style={styles.input}
                    disabled={saving || !form.cell}
                  >
                    <option value="">Select Village</option>
                    {villages.map((villageName) => (
                      <option key={villageName} value={villageName}>{villageName}</option>
                    ))}
                  </select>
                </label>
                <label style={styles.field}>
                  <span>ID Type</span>
                  <input
                    type="text"
                    value={form.id_type}
                    onChange={(event) => setForm((prev) => ({ ...prev, id_type: event.target.value }))}
                    style={styles.input}
                    disabled={saving}
                  />
                </label>
                <label style={styles.field}>
                  <span>ID Number</span>
                  <input
                    type="text"
                    value={form.id_number}
                    onChange={(event) => setForm((prev) => ({ ...prev, id_number: event.target.value }))}
                    style={styles.input}
                    disabled={saving}
                  />
                </label>
              </div>

              <label style={styles.field}>
                <span>Current Image</span>
                {form.image ? (
                  <a
                    href={toImageUrl(form.image)}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.imageLink}
                    title="Open full image in new tab"
                  >
                    <img src={toImageUrl(form.image)} alt="Current investor profile" style={styles.imagePreview} />
                    <span style={styles.imageLinkText}>Click image to open full size</span>
                  </a>
                ) : (
                  <div style={styles.noImage}>No image available</div>
                )}
              </label>

              <label style={styles.field}>
                <span>Upload New Image</span>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={styles.input} disabled={saving} />
              </label>

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={closeForm} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showViewModal && viewInvestor ? (
        <div style={styles.overlay} onClick={closeViewModal}>
          <div style={styles.viewModal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Investor Details</h3>
              <button type="button" style={styles.closeBtn} onClick={closeViewModal}>x</button>
            </div>

            <div style={styles.viewBody}>
              <div style={styles.viewImageWrap}>
                {viewInvestor.image ? (
                  <a href={toImageUrl(viewInvestor.image)} target="_blank" rel="noreferrer" style={styles.imageLink}>
                    <img src={toImageUrl(viewInvestor.image)} alt={`${viewInvestor.first_name} ${viewInvestor.last_name}`} style={styles.viewImage} />
                    <span style={styles.imageLinkText}>Open full-size image</span>
                  </a>
                ) : (
                  <div style={styles.noImage}>No image available</div>
                )}
              </div>

              <div style={styles.viewGrid}>
                <div style={styles.viewItem}><span style={styles.viewLabel}>ID</span><strong>{viewInvestor.id}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>User ID</span><strong>{viewInvestor.users_id}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Email</span><strong>{viewInvestor.email || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>First Name</span><strong>{viewInvestor.first_name || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Last Name</span><strong>{viewInvestor.last_name || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Telephone</span><strong>{viewInvestor.telephone || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Date Of Birth</span><strong>{toDateInputValue(viewInvestor.date_of_birth) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Gender</span><strong>{viewInvestor.gender || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Nationality</span><strong>{viewInvestor.nationality || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Province</span><strong>{viewInvestor.province || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>District</span><strong>{viewInvestor.district || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Sector</span><strong>{viewInvestor.sector || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Cell</span><strong>{viewInvestor.cell || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Village</span><strong>{viewInvestor.village || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>ID Type</span><strong>{viewInvestor.id_type || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>ID Number</span><strong>{viewInvestor.id_number || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Created At</span><strong>{viewInvestor.created_at || '-'}</strong></div>
              </div>
            </div>

            <div style={styles.viewActions}>
              <button type="button" style={styles.cancelBtn} onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      ) : null}

      <section style={styles.panel}>
        <h3 style={styles.panelTitle}>Investor Directory</h3>

        {loading ? <p style={styles.panelText}>Loading investors...</p> : null}

        {!loading && investors.length === 0 ? (
          <p style={styles.panelText}>No investors found.</p>
        ) : null}

        {!loading && investors.length > 0 ? (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Telephone</th>
                  <th style={styles.th}>Nationality</th>
                  <th style={styles.th}>Image</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {investors.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.id}</td>
                    <td style={styles.td}>{item.first_name} {item.last_name}</td>
                    <td style={styles.td}>{item.email}</td>
                    <td style={styles.td}>{item.telephone}</td>
                    <td style={styles.td}>{item.nationality ?? '-'}</td>
                    <td style={styles.td}>
                      {item.image ? (
                        <img src={toImageUrl(item.image)} alt={`${item.first_name} ${item.last_name}`} style={styles.avatar} />
                      ) : '-'}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button type="button" style={styles.secondaryBtn} onClick={() => openView(item.id)}>
                          View
                        </button>
                        <button type="button" style={styles.secondaryBtn} onClick={() => openEdit(item.id)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          style={styles.deleteBtn}
                          onClick={() => setConfirmDeleteId(item.id)}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  grid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e4eaf3',
    borderRadius: 14,
    padding: '16px 18px',
    boxShadow: '0 10px 25px rgba(15, 30, 53, 0.06)',
  },
  metricLabel: {
    margin: 0,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#4c6483',
    fontWeight: 700,
  },
  metricValue: {
    margin: '8px 0 0',
    fontSize: 26,
    color: '#0e2a4f',
    fontWeight: 800,
  },
  panel: {
    marginTop: 16,
    background: '#ffffff',
    border: '1px solid #e4eaf3',
    borderRadius: 14,
    padding: '20px',
  },
  panelTitle: {
    margin: 0,
    color: '#0e2a4f',
    fontSize: 18,
  },
  panelText: {
    margin: '10px 0 0',
    color: '#4c6483',
    lineHeight: 1.6,
  },
  errorBanner: {
    marginTop: 14,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #f4c2c2',
    background: '#fff1f1',
    color: '#8d1e1e',
  },
  successBanner: {
    marginTop: 14,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #c4e9cf',
    background: '#f2fff5',
    color: '#155e30',
  },
  tableWrap: {
    marginTop: 14,
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 900,
  },
  th: {
    textAlign: 'left',
    padding: '10px 8px',
    fontSize: 12,
    color: '#4c6483',
    borderBottom: '1px solid #e4eaf3',
  },
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid #eef2f8',
    color: '#143a64',
    fontSize: 14,
    verticalAlign: 'middle',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid #d7e1f0',
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  primaryBtn: {
    border: 'none',
    borderRadius: 8,
    padding: '9px 12px',
    cursor: 'pointer',
    background: '#0e2a4f',
    color: '#fff',
    fontWeight: 700,
  },
  secondaryBtn: {
    border: '1px solid #d9e2ef',
    borderRadius: 8,
    padding: '8px 12px',
    cursor: 'pointer',
    background: '#fff',
    color: '#0e2a4f',
    fontWeight: 700,
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
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(8, 20, 38, 0.45)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 99,
    padding: 16,
  },
  modal: {
    width: 'min(900px, 100%)',
    maxHeight: '90vh',
    overflow: 'auto',
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #e4eaf3',
    boxShadow: '0 20px 50px rgba(8, 20, 38, 0.2)',
  },
  viewModal: {
    width: 'min(980px, 100%)',
    maxHeight: '90vh',
    overflow: 'auto',
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #e4eaf3',
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
    color: '#0e2a4f',
    fontSize: 18,
  },
  closeBtn: {
    border: '1px solid #dbe3ef',
    borderRadius: 8,
    background: '#fff',
    color: '#234b78',
    width: 30,
    height: 30,
    cursor: 'pointer',
    fontWeight: 700,
  },
  form: {
    padding: 16,
    display: 'grid',
    gap: 12,
  },
  formError: {
    margin: 0,
    color: '#a32828',
    background: '#fff3f3',
    border: '1px solid #f3d0d0',
    borderRadius: 8,
    padding: '10px 12px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 10,
  },
  field: {
    display: 'grid',
    gap: 6,
    color: '#334f71',
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    border: '1px solid #d8e3f0',
    borderRadius: 9,
    padding: '9px 10px',
    fontSize: 14,
    color: '#0e2a4f',
    background: '#fff',
  },
  imageLink: {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: 6,
    textDecoration: 'none',
    alignItems: 'flex-start',
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 12,
    objectFit: 'cover',
    border: '1px solid #d8e3f0',
    background: '#f5f8fc',
  },
  imageLinkText: {
    color: '#1f578d',
    fontSize: 12,
    fontWeight: 700,
  },
  noImage: {
    border: '1px dashed #cfdbea',
    borderRadius: 10,
    padding: '10px 12px',
    color: '#567497',
    background: '#f8fbff',
    fontSize: 13,
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    border: '1px solid #d9e2ef',
    borderRadius: 8,
    padding: '9px 12px',
    cursor: 'pointer',
    background: '#fff',
    color: '#1e4878',
    fontWeight: 700,
  },
  confirmModal: {
    width: 'min(420px, 100%)',
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #e4eaf3',
    boxShadow: '0 20px 50px rgba(8, 20, 38, 0.2)',
  },
  confirmTitle: {
    margin: '0 0 8px',
    color: '#0e2a4f',
    fontSize: 18,
  },
  confirmText: {
    margin: 0,
    color: '#4c6483',
  },
  confirmActions: {
    marginTop: 14,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
  },
  viewBody: {
    padding: 16,
    display: 'grid',
    gap: 14,
  },
  viewImageWrap: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  viewImage: {
    width: 220,
    height: 220,
    borderRadius: 14,
    objectFit: 'cover',
    border: '1px solid #d8e3f0',
    background: '#f5f8fc',
  },
  viewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 10,
  },
  viewItem: {
    display: 'grid',
    gap: 4,
    border: '1px solid #e4eaf3',
    borderRadius: 10,
    background: '#fbfdff',
    padding: '10px 12px',
    color: '#143a64',
  },
  viewLabel: {
    color: '#4c6483',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: 700,
  },
  viewActions: {
    borderTop: '1px solid #ecf1f7',
    padding: 16,
    display: 'flex',
    justifyContent: 'flex-end',
  },
}
