import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, FormEvent } from 'react'
import AdminShell from './AdminShell'
import { getAuthSession } from '../authStorage'
import {
  deleteAdminEntrepreneur,
  fetchAdminEntrepreneurById,
  fetchAdminEntrepreneurs,
  fetchAdminVerifiedEntrepreneurs,
  type AdminEntrepreneur,
  updateAdminEntrepreneur,
} from '../dashboardApi'
import { buildApiUrl } from '../../config/api'
import {
  getCellsBySector,
  getDistrictsByProvince,
  getProvinces,
  getSectorsByDistrict,
  getVillagesByCell,
} from 'rwanda-geo-structure'

type EntrepreneurFormState = {
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

const emptyForm: EntrepreneurFormState = {
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

function getInitials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0).toUpperCase()
  const last = lastName.trim().charAt(0).toUpperCase()
  return `${first || '?'}${last || '?'}`
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

export default function EntrepreneursPage() {
  const [entrepreneurs, setEntrepreneurs] = useState<AdminEntrepreneur[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewEntrepreneur, setViewEntrepreneur] = useState<AdminEntrepreneur | null>(null)
  const [form, setForm] = useState<EntrepreneurFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [provinces, setProvinces] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [sectors, setSectors] = useState<string[]>([])
  const [cells, setCells] = useState<string[]>([])
  const [villages, setVillages] = useState<string[]>([])
  const [verifiedProfiles, setVerifiedProfiles] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const fileRef = useRef<HTMLInputElement>(null)
  const pageSize = 10

  const accessToken = getAccessToken()

  const computedMetrics = useMemo(() => {
    const total = entrepreneurs.length

    return [
      { label: 'Total Entrepreneurs', value: String(total) },
      { label: 'Active Profiles', value: String(verifiedProfiles) },
    ]
  }, [entrepreneurs, verifiedProfiles])

  const visibleEntrepreneurs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const sorted = [...entrepreneurs].sort((left, right) => left.id - right.id)

    const filtered = query
      ? sorted.filter((item) => (
        [
          item.id,
          item.users_id,
          item.email,
          item.first_name,
          item.last_name,
          item.telephone,
          item.nationality,
          item.province,
          item.district,
          item.sector,
          item.cell,
          item.village,
          item.id_type,
          item.id_number,
        ]
          .filter((value) => value !== null && value !== undefined)
          .some((value) => String(value).toLowerCase().includes(query))
      ))
      : sorted

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const safePage = Math.min(currentPage, totalPages)
    const startIndex = (safePage - 1) * pageSize

    return {
      items: filtered.slice(startIndex, startIndex + pageSize),
      totalPages,
      totalItems: filtered.length,
      currentPage: safePage,
    }
  }, [entrepreneurs, searchQuery, currentPage])

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

  function hydrateLocationOptions(values: Pick<EntrepreneurFormState, 'province' | 'district' | 'sector' | 'cell'>) {
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

  async function loadEntrepreneurs() {
    setLoading(true)
    setError(null)

    try {
      const [rows, verifiedCount] = await Promise.all([
        fetchAdminEntrepreneurs(accessToken),
        fetchAdminVerifiedEntrepreneurs(accessToken),
      ])
      setEntrepreneurs(rows)
      setVerifiedProfiles(verifiedCount)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load entrepreneurs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEntrepreneurs()
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

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  function closeViewModal() {
    setShowViewModal(false)
    setViewEntrepreneur(null)
  }

  async function openEdit(entrepreneurId: number) {
    setFormError(null)
    setError(null)
    setSuccess(null)

    try {
      const entrepreneur = await fetchAdminEntrepreneurById(entrepreneurId, accessToken)
      setActiveId(entrepreneur.id)
      setForm({
        users_id: String(entrepreneur.users_id ?? ''),
        first_name: entrepreneur.first_name ?? '',
        last_name: entrepreneur.last_name ?? '',
        telephone: entrepreneur.telephone ?? '',
        date_of_birth: toDateInputValue(entrepreneur.date_of_birth),
        gender: entrepreneur.gender ?? '',
        nationality: entrepreneur.nationality ?? '',
        province: entrepreneur.province ?? '',
        district: entrepreneur.district ?? '',
        sector: entrepreneur.sector ?? '',
        cell: entrepreneur.cell ?? '',
        village: entrepreneur.village ?? '',
        id_type: entrepreneur.id_type ?? '',
        id_number: entrepreneur.id_number ?? '',
        image: entrepreneur.image ?? '',
        imageFile: null,
      })
      hydrateLocationOptions({
        province: entrepreneur.province ?? '',
        district: entrepreneur.district ?? '',
        sector: entrepreneur.sector ?? '',
        cell: entrepreneur.cell ?? '',
      })
      setShowForm(true)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load entrepreneur details.')
    }
  }

  async function openView(entrepreneurId: number) {
    setError(null)
    setSuccess(null)

    try {
      const entrepreneur = await fetchAdminEntrepreneurById(entrepreneurId, accessToken)
      setViewEntrepreneur(entrepreneur)
      setShowViewModal(true)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load entrepreneur details.')
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
      setFormError('No entrepreneur is selected for update.')
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
      const payload = await updateAdminEntrepreneur(
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

      setSuccess(payload.message ?? 'Entrepreneur updated successfully.')
      closeForm()
      await loadEntrepreneurs()
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Failed to update entrepreneur.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(entrepreneurId: number) {
    setConfirmDeleteId(null)
    setDeletingId(entrepreneurId)
    setError(null)
    setSuccess(null)

    try {
      const payload = await deleteAdminEntrepreneur(entrepreneurId, accessToken)
      setEntrepreneurs((prev) => prev.filter((item) => item.id !== entrepreneurId))
      setSuccess(payload.message ?? 'Entrepreneur deleted successfully.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete entrepreneur.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminShell
      title="Entrepreneurs"
      subtitle="View and manage entrepreneur records, profile status, and engagement details."
    >
      <section style={styles.grid}>
        {computedMetrics.map((metric, index) => (
          <article key={metric.label} style={styles.card} className="entrepreneur-metric-card">
            <span style={{ ...styles.metricGlow, animationDelay: `${index * 80}ms` }} />
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
            <h3 style={styles.confirmTitle}>Delete Entrepreneur?</h3>
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
              <h3 style={styles.modalTitle}>Edit Entrepreneur</h3>
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
                    <img src={toImageUrl(form.image)} alt="Current entrepreneur profile" style={styles.imagePreview} />
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

      {showViewModal && viewEntrepreneur ? (
        <div style={styles.overlay} onClick={closeViewModal}>
          <div style={styles.viewModal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Entrepreneur Details</h3>
              <button type="button" style={styles.closeBtn} onClick={closeViewModal}>x</button>
            </div>

            <div style={styles.viewBody}>
              <div style={styles.viewImageWrap}>
                {viewEntrepreneur.image ? (
                  <div style={styles.viewImageCard}>
                    <a href={toImageUrl(viewEntrepreneur.image)} target="_blank" rel="noreferrer" style={styles.viewImageLink}>
                      <img src={toImageUrl(viewEntrepreneur.image)} alt={`${viewEntrepreneur.first_name} ${viewEntrepreneur.last_name}`} style={styles.viewImage} />
                      <span style={styles.imageLinkText}>Open full-size image</span>
                    </a>
                  </div>
                ) : (
                  <div style={styles.noImage}>No image available</div>
                )}
              </div>

              <div style={styles.viewGrid}>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Email</span><strong>{viewEntrepreneur.email || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>First Name</span><strong>{viewEntrepreneur.first_name || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Last Name</span><strong>{viewEntrepreneur.last_name || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Telephone</span><strong>{viewEntrepreneur.telephone || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Date Of Birth</span><strong>{toDateInputValue(viewEntrepreneur.date_of_birth) || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Gender</span><strong>{viewEntrepreneur.gender || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Nationality</span><strong>{viewEntrepreneur.nationality || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Province</span><strong>{viewEntrepreneur.province || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>District</span><strong>{viewEntrepreneur.district || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Sector</span><strong>{viewEntrepreneur.sector || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Cell</span><strong>{viewEntrepreneur.cell || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Village</span><strong>{viewEntrepreneur.village || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>ID Type</span><strong>{viewEntrepreneur.id_type || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>ID Number</span><strong>{viewEntrepreneur.id_number || '-'}</strong></div>
                <div style={styles.viewItem}><span style={styles.viewLabel}>Created At</span><strong>{toDateDisplay(viewEntrepreneur.created_at)}</strong></div>
              </div>
            </div>

            <div style={styles.viewActions}>
              <button type="button" style={styles.cancelBtn} onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      ) : null}

      <section style={styles.panel} className="entrepreneur-directory-panel">
        <div style={styles.panelHeader}>
          <div>
            <h3 style={styles.panelTitle}>Entrepreneur Directory</h3>
            <p style={styles.panelText}>Curated entrepreneur records with one-click actions for view, edit, and cleanup.</p>
          </div>
          <div style={styles.panelHeaderActions}>
            <span style={styles.countPill}>{visibleEntrepreneurs.totalItems} records</span>
            <button type="button" style={styles.refreshBtn} onClick={() => void loadEntrepreneurs()}>
              Refresh
            </button>
          </div>
        </div>

        <div style={styles.searchRow}>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by name, email, phone, location, or ID..."
            style={styles.searchInput}
          />
          <span style={styles.searchHint}>
            Showing {visibleEntrepreneurs.items.length} of {visibleEntrepreneurs.totalItems}
          </span>
        </div>

        {loading ? <p style={styles.panelText}>Loading entrepreneurs...</p> : null}

        {!loading && visibleEntrepreneurs.totalItems === 0 ? (
          <p style={styles.panelText}>No entrepreneurs found.</p>
        ) : null}

        {!loading && visibleEntrepreneurs.totalItems > 0 ? (
          <div style={styles.tableWrap}>
            <table style={styles.table} className="entrepreneur-table">
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
                {visibleEntrepreneurs.items.map((item, index) => (
                  <tr key={item.id} className="entrepreneur-row" style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={styles.td}>{(visibleEntrepreneurs.currentPage - 1) * pageSize + index + 1}</td>
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        <span style={styles.nameAvatar}>{getInitials(item.first_name ?? '', item.last_name ?? '')}</span>
                        <div style={styles.nameTextWrap}>
                          <strong style={styles.namePrimary}>{item.first_name} {item.last_name}</strong>
                          <span style={styles.nameSecondary}>{item.province || 'Unknown province'}</span>
                        </div>
                      </div>
                    </td>
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
                        <button type="button" style={{ ...styles.secondaryBtn, ...styles.viewBtn }} onClick={() => openView(item.id)}>
                          View
                        </button>
                        <button type="button" style={{ ...styles.secondaryBtn, ...styles.editBtn }} onClick={() => openEdit(item.id)}>
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

        {!loading && visibleEntrepreneurs.totalPages > 1 ? (
          <div style={styles.pagination}>
            <button
              type="button"
              style={styles.pageBtn}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={visibleEntrepreneurs.currentPage === 1}
            >
              Prev
            </button>

            <div style={styles.pageNumbers}>
              {Array.from({ length: visibleEntrepreneurs.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  style={{
                    ...styles.pageBtn,
                    ...(pageNumber === visibleEntrepreneurs.currentPage ? styles.pageBtnActive : {}),
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
              onClick={() => setCurrentPage((page) => Math.min(visibleEntrepreneurs.totalPages, page + 1))}
              disabled={visibleEntrepreneurs.currentPage === visibleEntrepreneurs.totalPages}
            >
              Next
            </button>
          </div>
        ) : null}
      </section>

      <style>{`
        .entrepreneur-metric-card {
          position: relative;
          overflow: hidden;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .entrepreneur-metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 36px rgba(15, 30, 53, 0.12);
        }

        .entrepreneur-directory-panel {
          background: linear-gradient(180deg, #ffffff 0%, #f9fcfd 100%);
        }

        .entrepreneur-table tbody tr {
          transition: background 180ms ease, transform 180ms ease;
        }

        .entrepreneur-table tbody tr:hover {
          background: #f4fcfd !important;
        }
      `}</style>
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
    border: '1px solid #d8e8eb',
    borderRadius: 14,
    padding: '16px 18px',
    boxShadow: '0 10px 25px rgba(15, 30, 53, 0.06)',
  },
  metricGlow: {
    position: 'absolute',
    top: -36,
    right: -36,
    width: 94,
    height: 94,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(41,119,235,0.2), rgba(41,119,235,0))',
  },
  metricLabel: {
    margin: 0,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#4f6f78',
    fontWeight: 700,
  },
  metricValue: {
    margin: '8px 0 0',
    fontSize: 26,
    color: '#023341',
    fontWeight: 800,
  },
  panel: {
    marginTop: 16,
    background: '#ffffff',
    border: '1px solid #d8e8eb',
    borderRadius: 14,
    padding: '20px',
  },
  panelTitle: {
    margin: 0,
    color: '#023341',
    fontSize: 18,
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
  panelText: {
    margin: '10px 0 0',
    color: '#4f6f78',
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
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  nameAvatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
    fontSize: 12,
    color: '#ffffff',
    background: 'linear-gradient(135deg, #244f7b 0%, #3f7ebb 100%)',
  },
  nameTextWrap: {
    display: 'grid',
    gap: 2,
  },
  namePrimary: {
    color: '#023341',
    fontSize: 14,
    lineHeight: 1.2,
  },
  nameSecondary: {
    color: '#5f7f88',
    fontSize: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid #cadee3',
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
    background: '#023341',
    color: '#fff',
    fontWeight: 700,
  },
  secondaryBtn: {
    border: '1px solid #cfe0e3',
    borderRadius: 8,
    padding: '8px 12px',
    cursor: 'pointer',
    background: '#fff',
    color: '#023341',
    fontWeight: 700,
  },
  viewBtn: {
    borderColor: '#c7dffc',
    color: '#03475a',
    background: '#f2fbfc',
  },
  editBtn: {
    borderColor: '#d7e8d9',
    color: '#1c5f35',
    background: '#f3fbf5',
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
    border: '1px solid #d8e8eb',
    boxShadow: '0 20px 50px rgba(8, 20, 38, 0.2)',
  },
  viewModal: {
    width: 'min(980px, 100%)',
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
    border: '1px solid #cfdee1',
    borderRadius: 9,
    padding: '9px 10px',
    fontSize: 14,
    color: '#023341',
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
    border: '1px solid #cfdee1',
    background: '#f5f8fc',
  },
  imageLinkText: {
    color: '#03475a',
    fontSize: 12,
    fontWeight: 700,
  },
  noImage: {
    border: '1px dashed #cfdbea',
    borderRadius: 10,
    padding: '10px 12px',
    color: '#567497',
    background: '#f9fcfd',
    fontSize: 13,
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
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
  viewBody: {
    padding: 16,
    display: 'grid',
    gap: 14,
  },
  viewImageWrap: {
    display: 'flex',
    justifyContent: 'center',
  },
  viewImageCard: {
    border: '1px solid #dde7f3',
    borderRadius: 16,
    background: 'linear-gradient(180deg, #fcfefe 0%, #f6fbfc 100%)',
    padding: 12,
    boxShadow: '0 8px 24px rgba(14, 42, 79, 0.08)',
  },
  viewImageLink: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
  },
  viewImage: {
    width: 260,
    height: 260,
    borderRadius: 16,
    objectFit: 'cover',
    border: '1px solid #cfdceb',
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
  viewActions: {
    borderTop: '1px solid #ecf1f7',
    padding: 16,
    display: 'flex',
    justifyContent: 'flex-end',
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
