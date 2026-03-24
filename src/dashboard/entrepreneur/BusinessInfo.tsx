import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import {
  getCellsBySector,
  getDistrictsByProvince,
  getProvinces,
  getSectorsByDistrict,
  getVillagesByCell,
} from 'rwanda-geo-structure'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'
import EntrepreneurShell from './EntrepreneurShell'

type BusinessForm = {
  business_name: string
  registration_status: string
  establishment_year: string
  province: string
  district: string
  sector: string
  cell: string
  village: string
  business_description: string
  number_of_employees: string
  ownership_structure: string
}

const initialForm: BusinessForm = {
  business_name: '',
  registration_status: '',
  establishment_year: '',
  province: '',
  district: '',
  sector: '',
  cell: '',
  village: '',
  business_description: '',
  number_of_employees: '',
  ownership_structure: '',
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

function currentYear() {
  return new Date().getFullYear()
}

function toText(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

export default function BusinessInfo() {
  const session = getAuthSession()
  const [form, setForm] = useState<BusinessForm>(initialForm)
  const [userId, setUserId] = useState<number | null>(null)
  const [provinces, setProvinces] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [sectors, setSectors] = useState<string[]>([])
  const [cells, setCells] = useState<string[]>([])
  const [villages, setVillages] = useState<string[]>([])
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const email = useMemo(
    () => (session && typeof session.email === 'string' ? session.email : ''),
    [session],
  )

  useEffect(() => {
    setProvinces(getProvinces())
  }, [])

  useEffect(() => {
    if (!email) {
      setError('No authenticated entrepreneur email found. Please login again.')
      setIsLoadingUser(false)
      return
    }

    let isMounted = true

    async function resolveUserId() {
      setIsLoadingUser(true)
      setError(null)

      try {
        const response = await fetch(buildApiUrl(`/entrepreneurs/${encodeURIComponent(email)}`), {
          headers: authHeader(),
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(
            typeof payload?.message === 'string' ? payload.message : 'Failed to resolve entrepreneur user id.',
          )
        }

        const maybeId = Number(payload?.users_id)
        if (!Number.isFinite(maybeId)) {
          throw new Error('Invalid users_id returned by the server.')
        }

        if (isMounted) {
          setUserId(maybeId)
        }
      } catch (resolveError) {
        if (isMounted) {
          setError(resolveError instanceof Error ? resolveError.message : 'Failed to resolve user id.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false)
        }
      }
    }

    void resolveUserId()

    return () => {
      isMounted = false
    }
  }, [email])

  function handleProvinceChange(provinceName: string) {
    setForm((prev) => ({
      ...prev,
      province: provinceName,
      district: '',
      sector: '',
      cell: '',
      village: '',
    }))
    setDistricts(provinceName ? getDistrictsByProvince(provinceName) : [])
    setSectors([])
    setCells([])
    setVillages([])
  }

  function handleDistrictChange(districtName: string) {
    setForm((prev) => ({
      ...prev,
      district: districtName,
      sector: '',
      cell: '',
      village: '',
    }))
    setSectors(form.province && districtName ? getSectorsByDistrict(form.province, districtName) : [])
    setCells([])
    setVillages([])
  }

  function handleSectorChange(sectorName: string) {
    setForm((prev) => ({
      ...prev,
      sector: sectorName,
      cell: '',
      village: '',
    }))
    setCells(form.province && form.district && sectorName ? getCellsBySector(form.province, form.district, sectorName) : [])
    setVillages([])
  }

  function handleCellChange(cellName: string) {
    setForm((prev) => ({
      ...prev,
      cell: cellName,
      village: '',
    }))
    setVillages(
      form.province && form.district && form.sector && cellName
        ? getVillagesByCell(form.province, form.district, form.sector, cellName)
        : [],
    )
  }

  function hydrateLocationOptions(values: Pick<BusinessForm, 'province' | 'district' | 'sector' | 'cell'>) {
    const nextDistricts = values.province ? getDistrictsByProvince(values.province) : []
    const nextSectors = values.province && values.district ? getSectorsByDistrict(values.province, values.district) : []
    const nextCells = values.province && values.district && values.sector
      ? getCellsBySector(values.province, values.district, values.sector)
      : []
    const nextVillages = values.province && values.district && values.sector && values.cell
      ? getVillagesByCell(values.province, values.district, values.sector, values.cell)
      : []

    setDistricts(nextDistricts)
    setSectors(nextSectors)
    setCells(nextCells)
    setVillages(nextVillages)
  }

  useEffect(() => {
    if (!userId) {
      return
    }

    let isMounted = true

    async function loadExistingBusinessInfo() {
      setIsLoadingBusiness(true)

      try {
        const response = await fetch(buildApiUrl(`/entrepreneurs/business-info/${userId}`), {
          headers: authHeader(),
        })
        const payload = await response.json()

        if (!response.ok) {
          if (response.status === 404) {
            // First-time setup: no business info yet.
            return
          }

          throw new Error(
            typeof payload?.message === 'string'
              ? payload.message
              : 'Failed to fetch existing business information.',
          )
        }

        const data = payload?.data
        const nextForm: BusinessForm = {
          business_name: toText(data?.business_name),
          registration_status: toText(data?.registration_status),
          establishment_year: toText(data?.establishment_year),
          province: toText(data?.province),
          district: toText(data?.district),
          sector: toText(data?.sector),
          cell: toText(data?.cell),
          village: toText(data?.village),
          business_description: toText(data?.business_description),
          number_of_employees: toText(data?.number_of_employees),
          ownership_structure: toText(data?.ownership_structure),
        }

        if (isMounted) {
          setForm(nextForm)
          hydrateLocationOptions(nextForm)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to fetch business info.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingBusiness(false)
        }
      }
    }

    void loadExistingBusinessInfo()

    return () => {
      isMounted = false
    }
  }, [userId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId) {
      setError('Unable to submit because users_id is missing.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(buildApiUrl(`/entrepreneurs/business-info/${userId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({
          business_name: form.business_name,
          registration_status: form.registration_status,
          establishment_year: form.establishment_year,
          province: form.province,
          district: form.district,
          sector: form.sector,
          cell: form.cell,
          village: form.village,
          business_description: form.business_description,
          number_of_employees: form.number_of_employees,
          ownership_structure: form.ownership_structure,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(typeof payload?.message === 'string' ? payload.message : 'Failed to create business info.')
      }

      setSuccess(typeof payload?.message === 'string' ? payload.message : 'Business information saved successfully.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create business info.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <EntrepreneurShell
      title="Business Information"
      subtitle="Register your venture profile details and ownership structure in one guided flow."
    >
      {isLoadingUser ? <div style={styles.info}>Resolving users_id from your entrepreneur email...</div> : null}
      {isLoadingBusiness ? <div style={styles.info}>Loading existing business info...</div> : null}
      {error ? <div style={{ ...styles.info, ...styles.error }}>{error}</div> : null}
      {success ? <div style={{ ...styles.info, ...styles.success }}>{success}</div> : null}

      <form style={styles.formShell} onSubmit={handleSubmit}>
        <article style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionStep}>A</span>
            <div>
              <h4 style={styles.sectionTitle}>Business Basic Information</h4>
              <p style={styles.sectionSubtitle}>Core legal, sector, and operating details.</p>
            </div>
          </div>

          <div style={styles.grid}>
            <label style={styles.field}>
              Business Name
              <input
                style={styles.input}
                type="text"
                value={form.business_name}
                onChange={(event) => setForm((prev) => ({ ...prev, business_name: event.target.value }))}
                required
              />
            </label>

            <label style={styles.field}>
              Business Registration Status
              <select
                style={styles.input}
                value={form.registration_status}
                onChange={(event) => setForm((prev) => ({ ...prev, registration_status: event.target.value }))}
                required
              >
                <option value="">Select status</option>
                <option value="Not Registered">Not Registered</option>
                <option value="Registered Company">Registered Company</option>
              </select>
            </label>

            <label style={styles.field}>
              Year of Establishment
              <input
                style={styles.input}
                type="number"
                min={1900}
                max={currentYear()}
                value={form.establishment_year}
                onChange={(event) => setForm((prev) => ({ ...prev, establishment_year: event.target.value }))}
                required
              />
            </label>

            <label style={styles.field}>
              Province
              <select
                style={styles.input}
                value={form.province}
                onChange={(event) => handleProvinceChange(event.target.value)}
                required
              >
                <option value="">Select province</option>
                {provinces.map((provinceName) => (
                  <option key={provinceName} value={provinceName}>{provinceName}</option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              District
              <select
                style={styles.input}
                value={form.district}
                onChange={(event) => handleDistrictChange(event.target.value)}
                disabled={!form.province}
                required
              >
                <option value="">Select district</option>
                {districts.map((districtName) => (
                  <option key={districtName} value={districtName}>{districtName}</option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              Sector
              <select
                style={styles.input}
                value={form.sector}
                onChange={(event) => handleSectorChange(event.target.value)}
                disabled={!form.district}
                required
              >
                <option value="">Select sector</option>
                {sectors.map((sectorName) => (
                  <option key={sectorName} value={sectorName}>{sectorName}</option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              Cell
              <select
                style={styles.input}
                value={form.cell}
                onChange={(event) => handleCellChange(event.target.value)}
                disabled={!form.sector}
                required
              >
                <option value="">Select cell</option>
                {cells.map((cellName) => (
                  <option key={cellName} value={cellName}>{cellName}</option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              Village
              <select
                style={styles.input}
                value={form.village}
                onChange={(event) => setForm((prev) => ({ ...prev, village: event.target.value }))}
                disabled={!form.cell}
                required
              >
                <option value="">Select village</option>
                {villages.map((villageName) => (
                  <option key={villageName} value={villageName}>{villageName}</option>
                ))}
              </select>
            </label>

            <label style={styles.fieldWide}>
              Business Description
              <textarea
                style={styles.textarea}
                value={form.business_description}
                onChange={(event) => setForm((prev) => ({ ...prev, business_description: event.target.value }))}
                placeholder="Briefly describe your business model, products or services, and target customers."
                required
              />
            </label>
          </div>
        </article>

        <article style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionStep}>B</span>
            <div>
              <h4 style={styles.sectionTitle}>Ownership and Team</h4>
              <p style={styles.sectionSubtitle}>Columns available in current business_info table.</p>
            </div>
          </div>

          <div style={styles.grid}>
            <label style={styles.field}>
              Number of Employees
              <input
                style={styles.input}
                type="number"
                min={0}
                value={form.number_of_employees}
                onChange={(event) => setForm((prev) => ({ ...prev, number_of_employees: event.target.value }))}
                required
              />
            </label>

            <label style={styles.field}>
              Ownership Structure
              <select
                style={styles.input}
                value={form.ownership_structure}
                onChange={(event) => setForm((prev) => ({ ...prev, ownership_structure: event.target.value }))}
                required
              >
                <option value="">Select structure</option>
                <option value="Single owner">Single owner</option>
                <option value="Partnership">Partnership</option>
                <option value="Company">Company</option>
              </select>
            </label>
          </div>
        </article>

        <div style={styles.actionRow}>
          <button type="submit" style={styles.submitBtn} disabled={isLoadingUser || isSubmitting || !userId}>
            {isSubmitting ? 'Saving Business Info...' : 'Save Business Information'}
          </button>
        </div>
      </form>
    </EntrepreneurShell>
  )
}

const styles: Record<string, CSSProperties> = {
  heroStrip: {
    marginBottom: 18,
    borderRadius: 22,
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    background: 'linear-gradient(120deg, rgba(12,34,69,0.98) 0%, rgba(20,76,117,0.95) 54%, rgba(7,146,122,0.93) 100%)',
    boxShadow: '0 26px 58px rgba(11, 38, 74, 0.22)',
  },
  heroLabel: {
    margin: 0,
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: 700,
  },
  heroTitle: {
    margin: '7px 0 0',
    color: '#ffffff',
    fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
  },
  heroCopy: {
    margin: '8px 0 0',
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
  },
  userBadge: {
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.08)',
    padding: '10px 12px',
    minWidth: 154,
  },
  userBadgeLabel: {
    display: 'block',
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.68)',
  },
  userBadgeValue: {
    display: 'block',
    marginTop: 4,
    color: '#fff4c9',
    fontSize: 18,
    lineHeight: 1.1,
  },
  info: {
    borderRadius: 12,
    border: '1px solid rgba(15, 30, 53, 0.1)',
    padding: '11px 13px',
    background: '#ffffff',
    color: '#21324d',
    marginBottom: 12,
  },
  error: {
    borderColor: 'rgba(220, 38, 38, 0.28)',
    background: 'rgba(254, 242, 242, 0.9)',
    color: '#991b1b',
  },
  success: {
    borderColor: 'rgba(5, 150, 105, 0.28)',
    background: 'rgba(236, 253, 245, 0.9)',
    color: '#065f46',
  },
  formShell: {
    display: 'grid',
    gap: 16,
  },
  sectionCard: {
    borderRadius: 20,
    border: '1px solid rgba(15, 30, 53, 0.1)',
    background: '#ffffff',
    boxShadow: '0 16px 38px rgba(15, 45, 92, 0.07)',
    padding: 20,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  sectionStep: {
    width: 32,
    height: 32,
    borderRadius: 999,
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
    color: '#143b74',
    background: 'linear-gradient(145deg, #ffe3a6, #f8cc6a)',
  },
  sectionTitle: {
    margin: 0,
    color: '#0f1e35',
    fontSize: 19,
  },
  sectionSubtitle: {
    margin: '4px 0 0',
    color: '#53647e',
    fontSize: 13,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },
  field: {
    display: 'grid',
    gap: 6,
    color: '#29456e',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldWide: {
    display: 'grid',
    gap: 6,
    color: '#29456e',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    gridColumn: '1 / -1',
  },
  input: {
    borderRadius: 11,
    border: '1px solid rgba(15, 30, 53, 0.15)',
    padding: '10px 12px',
    color: '#16263e',
    background: '#ffffff',
    outline: 'none',
    fontSize: 14,
  },
  textarea: {
    borderRadius: 11,
    border: '1px solid rgba(15, 30, 53, 0.15)',
    padding: '12px',
    color: '#16263e',
    background: '#ffffff',
    outline: 'none',
    minHeight: 108,
    resize: 'vertical',
    fontSize: 14,
    fontFamily: 'inherit',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  submitBtn: {
    border: 'none',
    borderRadius: 14,
    padding: '12px 18px',
    cursor: 'pointer',
    fontWeight: 800,
    color: '#ffffff',
    background: 'linear-gradient(140deg, #0f2d5c, #1a4080)',
  },
}