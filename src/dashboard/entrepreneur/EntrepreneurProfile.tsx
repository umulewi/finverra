import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'
import EntrepreneurShell from './EntrepreneurShell'
import {
  getCellsBySector,
  getDistrictsByProvince,
  getProvinces,
  getSectorsByDistrict,
  getVillagesByCell,
} from 'rwanda-geo-structure'

type BasicInfo = {
  email: string
  first_name: string
  last_name: string
  telephone: string
}

type CompleteProfile = {
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
}

const emptyProfile: CompleteProfile = {
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
}

function authHeader(): HeadersInit {
  const session = getAuthSession()

  if (!session || typeof session.payload !== 'object' || session.payload === null) {
    return {}
  }

  const payload = session.payload as { token?: unknown; accessToken?: unknown }
  const tokenValue = typeof payload.token === 'string'
    ? payload.token
    : typeof payload.accessToken === 'string'
      ? payload.accessToken
      : ''

  return tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}
}

function toText(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function toDateInputValue(value: unknown) {
  const text = toText(value).trim()

  if (!text) {
    return ''
  }

  // Accept ISO datetime values and keep only yyyy-mm-dd for date input.
  const matchedDate = text.match(/^(\d{4}-\d{2}-\d{2})/)
  if (matchedDate) {
    return matchedDate[1]
  }

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear()
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const day = String(parsed.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return ''
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const next = Number(value)
    return Number.isFinite(next) ? next : null
  }

  return null
}

function resolveImageUrl(value: string) {
  const text = value.trim()

  if (!text) {
    return ''
  }

  if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:')) {
    return text
  }

  return buildApiUrl(text)
}

export default function EntrepreneurProfile() {
  const session = getAuthSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null)
  const [form, setForm] = useState<CompleteProfile>(emptyProfile)
  const [existingImage, setExistingImage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [provinces, setProvinces] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [sectors, setSectors] = useState<string[]>([])
  const [cells, setCells] = useState<string[]>([])
  const [villages, setVillages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const email = useMemo(
    () => (session && typeof session.email === 'string' ? session.email : ''),
    [session],
  )

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

  function hydrateLocationOptions(values: Pick<CompleteProfile, 'province' | 'district' | 'sector' | 'cell'>) {
    const nextDistricts = loadDistrictsByProvince(values.province)
    const nextSectors = loadSectorsByDistrict(values.province, values.district)
    const nextCells = loadCellsBySector(values.province, values.district, values.sector)
    const nextVillages = loadVillagesByCell(values.province, values.district, values.sector, values.cell)

    setDistricts(nextDistricts)
    setSectors(nextSectors)
    setCells(nextCells)
    setVillages(nextVillages)
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

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      if (!email) {
        if (isMounted) {
          setError('No authenticated entrepreneur email was found. Please login again.')
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const userRes = await fetch(buildApiUrl(`/entrepreneurs/${encodeURIComponent(email)}`), {
          headers: authHeader(),
        })
        const userPayload = await userRes.json()

        if (!userRes.ok) {
          throw new Error(
            typeof userPayload?.message === 'string'
              ? userPayload.message
              : 'Failed to fetch entrepreneur user id.',
          )
        }

        const resolvedUserId = toNumber(userPayload?.users_id)
        if (!resolvedUserId) {
          throw new Error('Invalid entrepreneur user id returned by the server.')
        }

        if (isMounted) {
          setUserId(resolvedUserId)
        }

        const [basicRes, completeRes] = await Promise.all([
          fetch(buildApiUrl(`/entrepreneurs/select_basic/${resolvedUserId}`), {
            headers: authHeader(),
          }),
          fetch(buildApiUrl(`/entrepreneurs/complete-profile/${resolvedUserId}`), {
            headers: authHeader(),
          }),
        ])

        const basicPayload = await basicRes.json()
        const completePayload = await completeRes.json()

        const basicRows = basicRes.ok && Array.isArray(basicPayload) ? basicPayload : []
        const basicRow = basicRows[0] ?? null

        const nextBasicInfo: BasicInfo | null = basicRes.ok
          ? {
              email: toText(basicRow?.email),
              first_name: toText(basicRow?.first_name),
              last_name: toText(basicRow?.last_name),
              telephone: toText(basicRow?.telephone),
            }
          : null

        const nextForm: CompleteProfile = completeRes.ok
          ? {
              date_of_birth: toDateInputValue(completePayload?.data?.date_of_birth),
              gender: toText(completePayload?.data?.gender),
              nationality: toText(completePayload?.data?.nationality),
              province: toText(completePayload?.data?.province),
              district: toText(completePayload?.data?.district),
              sector: toText(completePayload?.data?.sector),
              cell: toText(completePayload?.data?.cell),
              village: toText(completePayload?.data?.village),
              id_type: toText(completePayload?.data?.id_type),
              id_number: toText(completePayload?.data?.id_number),
            }
          : emptyProfile

        const imageValue = completeRes.ok ? toText(completePayload?.data?.image) : ''

        if (isMounted) {
          setBasicInfo(nextBasicInfo)
          setForm(nextForm)
          hydrateLocationOptions(nextForm)
          setExistingImage(imageValue)
          setImageFile(null)
          setImagePreview(resolveImageUrl(imageValue))

          if (!basicRes.ok && !completeRes.ok) {
            setError('User ID found, but profile records were not found yet. You can still use this ID.')
          }
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load entrepreneur profile.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [email])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId) {
      setError('User id is missing. Reload this page and try again.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('date_of_birth', form.date_of_birth)
      formData.append('gender', form.gender)
      formData.append('nationality', form.nationality)
      formData.append('province', form.province)
      formData.append('district', form.district)
      formData.append('sector', form.sector)
      formData.append('cell', form.cell)
      formData.append('village', form.village)
      formData.append('id_type', form.id_type)
      formData.append('id_number', form.id_number)

      if (imageFile) {
        formData.append('image', imageFile)
      } else if (existingImage) {
        // Keep previously saved image when user does not upload a new one.
        formData.append('existing_image', existingImage)
      }

      const response = await fetch(buildApiUrl(`/entrepreneurs/complete-profile/${userId}`), {
        method: 'POST',
        headers: {
          ...authHeader(),
        },
        body: formData,
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof payload?.message === 'string'
            ? payload.message
            : 'Failed to save entrepreneur profile.',
        )
      }

      setSuccess(typeof payload?.message === 'string' ? payload.message : 'Profile updated successfully.')

      const savedImage = typeof payload?.data?.image === 'string'
        ? payload.data.image
        : existingImage

      setExistingImage(savedImage)
      setImageFile(null)
      setImagePreview(resolveImageUrl(savedImage))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save entrepreneur profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <EntrepreneurShell
      title="My Profile Management"
      subtitle="Keep your account details current so investors and platform services can trust your profile."
    >
      
      {loading ? <div style={styles.infoCard}>Loading entrepreneur profile...</div> : null}
      {error ? <div style={{ ...styles.infoCard, ...styles.errorCard }}>{error}</div> : null}
      {success ? <div style={{ ...styles.infoCard, ...styles.successCard }}>{success}</div> : null}

      <section style={styles.grid}>
        <article style={styles.card}>
          <p style={styles.label}>Basic Information</p>
          <h3 style={styles.heading}>Account details from registration</h3>
          <div style={styles.kvWrap}>
            <div style={styles.kvItem}><span style={styles.kvLabel}>Email</span><strong>{basicInfo?.email || email || '-'}</strong></div>
            <div style={styles.kvItem}><span style={styles.kvLabel}>First name</span><strong>{basicInfo?.first_name || '-'}</strong></div>
            <div style={styles.kvItem}><span style={styles.kvLabel}>Last name</span><strong>{basicInfo?.last_name || '-'}</strong></div>
            <div style={styles.kvItem}><span style={styles.kvLabel}>Telephone</span><strong>{basicInfo?.telephone || '-'}</strong></div>
          
          </div>
        </article>

        <article style={styles.card}>
          <p style={styles.label}>Complete Profile</p>
          <h3 style={styles.heading}>Personal and identification details</h3>

          <div style={styles.avatarSection}>
            <div style={styles.avatarCircle}>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Entrepreneur profile"
                  style={styles.avatarImage}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <span style={styles.avatarPlaceholder}>Add Photo</span>
              )}
            </div>

            <label htmlFor="entrepreneur-image-upload" style={styles.uploadLabel}>
              Upload profile image
            </label>
            <input
              id="entrepreneur-image-upload"
              style={styles.hiddenInput}
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setImageFile(file)

                if (!file) {
                  setImagePreview(resolveImageUrl(existingImage))
                  return
                }

                setImagePreview(URL.createObjectURL(file))
              }}
              disabled={loading || saving}
            />
            <p style={styles.uploadHint}>Use a clear front-facing photo for better profile trust.</p>
          </div>

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <label style={styles.fieldLabel}>
                Date of birth
                <input
                  style={styles.input}
                  type="date"
                  value={form.date_of_birth}
                  onChange={(event) => setForm((prev) => ({ ...prev, date_of_birth: event.target.value }))}
                  disabled={loading || saving}
                />
              </label>

              <label style={styles.fieldLabel}>
                Gender
                <select
                  style={styles.input}
                  value={form.gender}
                  onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}
                  disabled={loading || saving}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>

              <label style={styles.fieldLabel}>
                Nationality
                <input
                  style={styles.input}
                  type="text"
                  value={form.nationality}
                  onChange={(event) => setForm((prev) => ({ ...prev, nationality: event.target.value }))}
                  disabled={loading || saving}
                />
              </label>

              <label style={styles.fieldLabel}>
                Province
                <select
                  style={styles.input}
                  value={form.province}
                  onChange={(event) => handleProvinceChange(event.target.value)}
                  disabled={loading || saving}
                >
                  <option value="">Select Province</option>
                  {provinces.map((provinceName) => (
                    <option key={provinceName} value={provinceName}>{provinceName}</option>
                  ))}
                </select>
              </label>

              <label style={styles.fieldLabel}>
                District
                <select
                  style={styles.input}
                  value={form.district}
                  onChange={(event) => handleDistrictChange(event.target.value)}
                  disabled={loading || saving || !form.province}
                >
                  <option value="">Select District</option>
                  {districts.map((districtName) => (
                    <option key={districtName} value={districtName}>{districtName}</option>
                  ))}
                </select>
              </label>

              <label style={styles.fieldLabel}>
                Sector
                <select
                  style={styles.input}
                  value={form.sector}
                  onChange={(event) => handleSectorChange(event.target.value)}
                  disabled={loading || saving || !form.district}
                >
                  <option value="">Select Sector</option>
                  {sectors.map((sectorName) => (
                    <option key={sectorName} value={sectorName}>{sectorName}</option>
                  ))}
                </select>
              </label>

              <label style={styles.fieldLabel}>
                Cell
                <select
                  style={styles.input}
                  value={form.cell}
                  onChange={(event) => handleCellChange(event.target.value)}
                  disabled={loading || saving || !form.sector}
                >
                  <option value="">Select Cell</option>
                  {cells.map((cellName) => (
                    <option key={cellName} value={cellName}>{cellName}</option>
                  ))}
                </select>
              </label>

              <label style={styles.fieldLabel}>
                Village
                <select
                  style={styles.input}
                  value={form.village}
                  onChange={(event) => setForm((prev) => ({ ...prev, village: event.target.value }))}
                  disabled={loading || saving || !form.cell}
                >
                  <option value="">Select Village</option>
                  {villages.map((villageName) => (
                    <option key={villageName} value={villageName}>{villageName}</option>
                  ))}
                </select>
              </label>

              <label style={styles.fieldLabel}>
                ID type
                <select
                  style={styles.input}
                  value={form.id_type}
                  onChange={(event) => setForm((prev) => ({ ...prev, id_type: event.target.value }))}
                  disabled={loading || saving}
                >
                  <option value="">Select ID type</option>
                  <option value="National ID">National ID</option>
                  <option value="Passport">Passport</option>
                </select>
              </label>

              <label style={styles.fieldLabel}>
                ID number
                <input
                  style={styles.input}
                  type="text"
                  value={form.id_number}
                  onChange={(event) => setForm((prev) => ({ ...prev, id_number: event.target.value }))}
                  disabled={loading || saving}
                />
              </label>

            </div>

            <button type="submit" style={styles.submitBtn} disabled={loading || saving || !userId}>
              {saving ? 'Saving profile...' : 'Save Complete Profile'}
            </button>
          </form>
        </article>
      </section>
    </EntrepreneurShell>
  )
}

const styles: Record<string, CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 16,
  },
  card: {
    borderRadius: 20,
    border: '1px solid rgba(15, 30, 53, 0.1)',
    padding: 20,
    background: '#ffffff',
    boxShadow: '0 18px 36px rgba(15, 45, 92, 0.06)',
  },
  infoCard: {
    borderRadius: 14,
    border: '1px solid rgba(15, 30, 53, 0.08)',
    background: '#ffffff',
    color: '#1e2e46',
    padding: '12px 14px',
    marginBottom: 12,
  },
  userIdCard: {
    borderColor: 'rgba(26, 64, 128, 0.24)',
    background: 'rgba(239, 246, 255, 0.9)',
    color: '#1e3a8a',
  },
  errorCard: {
    borderColor: 'rgba(220, 38, 38, 0.28)',
    color: '#991b1b',
    background: 'rgba(254, 242, 242, 0.88)',
  },
  successCard: {
    borderColor: 'rgba(5, 150, 105, 0.26)',
    color: '#065f46',
    background: 'rgba(236, 253, 245, 0.9)',
  },
  label: {
    margin: 0,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: 700,
    color: '#1a4080',
  },
  heading: {
    margin: '8px 0 14px',
    color: '#0f1e35',
    fontSize: 20,
  },
  avatarSection: {
    display: 'grid',
    justifyItems: 'center',
    gap: 10,
    marginBottom: 18,
    padding: '14px 0 8px',
  },
  avatarCircle: {
    width: 132,
    height: 132,
    borderRadius: '50%',
    border: '3px solid rgba(26, 64, 128, 0.2)',
    overflow: 'hidden',
    background: 'linear-gradient(145deg, rgba(26,64,128,0.08), rgba(15,45,92,0.14))',
    display: 'grid',
    placeItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  avatarPlaceholder: {
    fontSize: 13,
    color: '#2b4e84',
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  uploadLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(15, 45, 92, 0.18)',
    borderRadius: 10,
    padding: '8px 12px',
    color: '#16376b',
    background: 'rgba(239, 246, 255, 0.9)',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 13,
  },
  hiddenInput: {
    display: 'none',
  },
  uploadHint: {
    margin: 0,
    color: '#4e5c73',
    fontSize: 12,
  },
  kvWrap: {
    display: 'grid',
    gap: 10,
  },
  kvItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid rgba(15, 30, 53, 0.08)',
    borderRadius: 12,
    padding: '10px 12px',
    background: 'rgba(245, 248, 252, 0.9)',
    gap: 10,
  },
  kvLabel: {
    color: '#4e5c73',
    fontSize: 13,
  },
  form: {
    display: 'grid',
    gap: 14,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },
  fieldLabel: {
    display: 'grid',
    gap: 6,
    color: '#29456e',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  input: {
    borderRadius: 10,
    border: '1px solid rgba(15, 30, 53, 0.16)',
    padding: '10px 12px',
    color: '#16263e',
    background: '#ffffff',
    outline: 'none',
  },
  submitBtn: {
    border: 'none',
    borderRadius: 12,
    padding: '12px 16px',
    cursor: 'pointer',
    fontWeight: 700,
    color: '#ffffff',
    background: 'linear-gradient(140deg, #0f2d5c, #1a4080)',
    justifySelf: 'start',
  },
}
