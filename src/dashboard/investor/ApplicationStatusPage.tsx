import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'
import InvestorLayout, { investorCardStyle } from './InvestorLayout'

const BRAND_DARK = '#023341'
const BRAND_YELLOW = '#ffec00'

type StatusStep = {
  label: string
  icon: string
  description: string
  fields: string[]
}

type ApplicationRecord = Record<string, unknown> & {
  id?: number | string
  users_id?: number | string
  status?: string
  email?: string
  investor_type?: string
  residence_country?: string
  investment_budget?: string
  investment_size?: string
  type_of_investment?: string
  stage_do_you_prefer?: string
  risk_level?: string
  preferred_contact?: string
  availability?: string
}

type BasicInfo = {
  email: string
  users_id: number
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) return response.json()
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }
  return fallbackMessage
}

function authHeader(): HeadersInit {
  const session = getAuthSession()
  if (!session || typeof session.payload !== 'object' || session.payload === null) return {}
  const payload = session.payload as { token?: unknown; accessToken?: unknown }
  const tokenValue = typeof payload.token === 'string'
    ? payload.token
    : typeof payload.accessToken === 'string'
      ? payload.accessToken
      : ''
  return tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}
}

function toText(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatValue(value: unknown) {
  const text = toText(value)
  return text.trim() ? text : 'Not provided'
}

function formatFieldLabel(field: string) {
  return field
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

const preferredFieldOrder = [
  'id',
  'users_id',
  'status',
  'email',
  'investor_type',
  'residence_country',
  'investment_budget',
  'investment_size',
  'how_many_business_you_can_invest',
  'type_of_investment',
  'sectors_do_you_prefer',
  'where_do_you_want_to_invest',
  'stage_do_you_prefer',
  'risk_level',
  'return_type',
  'investment_duration',
  'what_do_you_look_in_business',
  'minimum_requirements',
  'how_involved_do_you_want',
  'have_you_invested_before',
  'number_of_investments',
  'invested_sector',
  'success_stories',
  'company_registration',
  'proof_of_funds',
  'kyc',
  'identification_document',
  'cv',
  'preferred_contact',
  'availability',
  'confirm_the_information_is_accurate',
  'i_agree_to_terms',
  'i_consent_to_be_matched_with_entrepreneurs',
]

const allowedFieldKeys = new Set(preferredFieldOrder)

const statusSteps: StatusStep[] = [
  {
    label: 'Profile',
    icon: '◈',
    description: 'Core application identity and status',
    fields: ['status', 'email', 'investor_type', 'residence_country'],
  },
  {
    label: 'Capacity',
    icon: '◉',
    description: 'Budget and investment volume',
    fields: ['investment_budget', 'investment_size', 'how_many_business_you_can_invest'],
  },
  {
    label: 'Preference',
    icon: '◆',
    description: 'Investment focus and fit',
    fields: ['type_of_investment', 'sectors_do_you_prefer', 'where_do_you_want_to_invest', 'stage_do_you_prefer'],
  },
  {
    label: 'Risk & Return',
    icon: '◇',
    description: 'Expected outcomes and involvement',
    fields: ['risk_level', 'return_type', 'investment_duration', 'what_do_you_look_in_business', 'minimum_requirements', 'how_involved_do_you_want'],
  },
  {
    label: 'Experience',
    icon: '◊',
    description: 'Past activity and history',
    fields: ['have_you_invested_before', 'number_of_investments', 'invested_sector', 'success_stories'],
  },
  {
    label: 'Docs & Verify',
    icon: '✦',
    description: 'Documents, contact, and confirmations',
    fields: [
      'company_registration',
      'proof_of_funds',
      'kyc',
      'identification_document',
      'cv',
      'preferred_contact',
      'availability',
      'confirm_the_information_is_accurate',
      'i_agree_to_terms',
      'i_consent_to_be_matched_with_entrepreneurs',
    ],
  },
]

const documentFieldKeys = new Set([
  'company_registration',
  'proof_of_funds',
  'kyc',
  'identification_document',
  'cv',
])

function getDocumentHref(value: string) {
  if (!value.trim()) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return buildApiUrl(value)
}

function getDocumentName(value: string) {
  const parts = value.split('/')
  return parts[parts.length - 1] || 'View document'
}

export default function ApplicationStatusPage() {
  const session = getAuthSession()
  const email = session?.email ?? ''

  const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null)
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!email) {
      setError('No authenticated investor email was found. Please login again.')
      return
    }

    let mounted = true

    async function loadApplicationStatus() {
      setIsLoading(true)
      setError(null)

      try {
        const userRes = await fetch(buildApiUrl(`/investors/${encodeURIComponent(email)}`), {
          headers: authHeader(),
        })
        const userPayload = await parseResponseBody(userRes)

        if (!userRes.ok) {
          throw new Error(getErrorMessage(userPayload, 'Failed to resolve investor account.'))
        }

        const resolvedUsersId = toNumber((userPayload as { users_id?: unknown })?.users_id)
        if (resolvedUsersId == null) {
          throw new Error('Invalid users_id returned by the server.')
        }

        const applicationRes = await fetch(buildApiUrl('/investor_application'), {
          headers: authHeader(),
        })
        const applicationPayload = await parseResponseBody(applicationRes)

        if (!applicationRes.ok) {
          throw new Error(getErrorMessage(applicationPayload, 'Failed to load investor applications.'))
        }

        const rows = Array.isArray(applicationPayload)
          ? applicationPayload
          : Array.isArray((applicationPayload as { applications?: unknown }).applications)
            ? (applicationPayload as { applications: unknown[] }).applications
            : []

        const normalized = rows
          .filter((item): item is ApplicationRecord => !!item && typeof item === 'object')
          .filter((item) => toNumber(item.users_id) === resolvedUsersId)

        if (mounted) {
          setBasicInfo({ email, users_id: resolvedUsersId })
          setApplications(normalized)
          setSelectedId((current) => current ?? toNumber(normalized[0]?.id))
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load application status.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadApplicationStatus()

    return () => {
      mounted = false
    }
  }, [email])

  const selectedApplication = useMemo(
    () => applications.find((application) => toNumber(application.id) === selectedId) ?? applications[0] ?? null,
    [applications, selectedId],
  )

  const statusTone = useMemo(() => {
    const status = toText(selectedApplication?.status).toLowerCase()
    if (status.includes('approve')) {
      return { background: 'rgba(255,236,0,0.2)', color: BRAND_DARK, border: 'rgba(255,236,0,0.55)' }
    }
    if (status.includes('reject')) {
      return { background: 'rgba(127,29,29,0.22)', color: '#fecaca', border: 'rgba(254,202,202,0.55)' }
    }
    if (status.includes('review')) {
      return { background: 'rgba(255,236,0,0.15)', color: '#fff9b0', border: 'rgba(255,236,0,0.45)' }
    }
    return { background: 'rgba(255,236,0,0.14)', color: '#fff9b0', border: 'rgba(255,236,0,0.42)' }
  }, [selectedApplication?.status])

  const applicationEntries = useMemo(() => {
    if (!selectedApplication) return [] as Array<[string, unknown]>

    const entries = Object.entries(selectedApplication).filter(([key]) => allowedFieldKeys.has(key))
    const orderMap = new Map(preferredFieldOrder.map((key, index) => [key, index]))

    return entries.sort(([a], [b]) => {
      const aRank = orderMap.get(a) ?? Number.MAX_SAFE_INTEGER
      const bRank = orderMap.get(b) ?? Number.MAX_SAFE_INTEGER
      if (aRank !== bRank) return aRank - bRank
      return a.localeCompare(b)
    })
  }, [selectedApplication])

  const visibleEntries = useMemo(() => {
    if (!selectedApplication) return [] as Array<[string, unknown]>

    const currentStep = statusSteps[stepIndex] ?? statusSteps[0]

    const entriesByKey = new Map(applicationEntries)
    const orderedFromStep = currentStep.fields
      .filter((key) => entriesByKey.has(key))
      .map((key) => [key, entriesByKey.get(key)] as [string, unknown])

    return orderedFromStep
  }, [applicationEntries, selectedApplication, stepIndex])

  useEffect(() => {
    setStepIndex(0)
  }, [selectedId])

  return (
    <InvestorLayout>
      <section style={investorCardStyle}>
        <div style={styles.headerBlock}>
          <p style={styles.kicker}>Investor Application</p>
          <h2 style={styles.title}>Application Status</h2>
          <p style={styles.description}>
            Review the current status of your application and switch between records when more than one is available.
          </p>
        </div>

        {isLoading ? <div style={styles.notice}>Loading application status...</div> : null}
        {error ? <div style={{ ...styles.notice, ...styles.errorNotice }}>{error}</div> : null}

        {!isLoading && !error && basicInfo ? (
          <div style={styles.stackLayout}>
            <div style={styles.panel}>
              <label style={styles.label} htmlFor="application-select">Select Application</label>
              <select
                id="application-select"
                value={selectedApplication ? String(selectedApplication.id ?? '') : ''}
                onChange={(event) => setSelectedId(Number(event.target.value))}
                style={styles.select}
              >
                {applications.length > 0 ? (
                  applications.map((application) => (
                    <option key={String(application.id)} value={String(application.id ?? '')}>
                      Application #{formatValue(application.id)} - {formatValue(application.status)}
                    </option>
                  ))
                ) : (
                  <option value="">No application found</option>
                )}
              </select>

              {selectedApplication ? (
                <>
                  <div style={{ ...styles.statusPill, background: statusTone.background, color: statusTone.color, borderColor: statusTone.border }}>
                    {formatValue(selectedApplication.status)}
                  </div>
                  <p style={styles.helperText}>
                    All fields are shown in the multi-section form below. Use step buttons or Previous/Next to navigate.
                  </p>
                </>
              ) : (
                <div style={styles.notice}>No investor application is currently linked to your account.</div>
              )}
            </div>

            <div style={{ ...styles.panel, ...styles.formPanel }}>
              <h3 style={styles.panelTitle}>Application Multi-Section View</h3>
              <p style={styles.panelSubtitle}>
                Same data as your application form structure, grouped by section.
              </p>

              <div style={styles.stepperWrap}>
                {statusSteps.map((step, index) => {
                  const isActive = index === stepIndex
                  const isDone = index < stepIndex
                  return (
                    <button
                      key={step.label}
                      type="button"
                      onClick={() => setStepIndex(index)}
                      style={{
                        ...styles.stepBtn,
                        ...(isActive ? styles.stepBtnActive : {}),
                        ...(isDone ? styles.stepBtnDone : {}),
                      }}
                    >
                      <span style={styles.stepIcon}>{step.icon}</span>
                      <span style={styles.stepTextWrap}>
                        <strong style={styles.stepLabel}>{step.label}</strong>
                        <span style={styles.stepDescription}>{step.description}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <div style={styles.detailList}>
                {visibleEntries.length > 0 ? (
                  visibleEntries.map(([key, value]) => (
                    <DetailRow key={key} fieldKey={key} label={formatFieldLabel(key)} value={value} />
                  ))
                ) : (
                  <div style={styles.notice}>No application record selected.</div>
                )}
              </div>

              <div style={styles.stepActions}>
                <button
                  type="button"
                  style={{ ...styles.navStepBtn, ...(stepIndex === 0 ? styles.navStepBtnDisabled : {}) }}
                  onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                  disabled={stepIndex === 0}
                >
                  Previous
                </button>
                <button
                  type="button"
                  style={{ ...styles.navStepBtn, ...(stepIndex === statusSteps.length - 1 ? styles.navStepBtnDisabled : {}) }}
                  onClick={() => setStepIndex((current) => Math.min(statusSteps.length - 1, current + 1))}
                  disabled={stepIndex === statusSteps.length - 1}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </InvestorLayout>
  )
}

function DetailRow({ fieldKey, label, value }: { fieldKey: string; label: string; value: unknown }) {
  const textValue = toText(value)
  const isDocumentField = documentFieldKeys.has(fieldKey)
  const hasDocument = isDocumentField && textValue.trim().length > 0

  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      {hasDocument ? (
        <a
          href={getDocumentHref(textValue)}
          target="_blank"
          rel="noreferrer"
          style={styles.documentLink}
        >
          {getDocumentName(textValue)}
        </a>
      ) : (
        <strong style={styles.detailValue}>{formatValue(value)}</strong>
      )}
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  headerBlock: {
    marginBottom: 20,
  },
  kicker: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: BRAND_YELLOW,
  },
  title: {
    margin: '8px 0 8px',
    fontSize: 28,
    lineHeight: 1.1,
    color: BRAND_DARK,
  },
  description: {
    margin: 0,
    maxWidth: 760,
    color: '#365463',
    lineHeight: 1.7,
  },
  stackLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 16,
  },
  panel: {
    borderRadius: 18,
    border: '1px solid rgba(255,236,0,0.28)',
    background: 'linear-gradient(160deg, #023341 0%, #034756 100%)',
    padding: 20,
    boxShadow: '0 14px 28px rgba(2,51,65,0.18)',
  },
  formPanel: {
    width: '100%',
    background: '#ffffff',
    border: '1px solid rgba(2,51,65,0.12)',
    boxShadow: '0 10px 30px rgba(2,51,65,0.08)',
  },
  panelTitle: {
    margin: '0 0 14px',
    fontSize: 18,
    color: BRAND_YELLOW,
  },
  panelSubtitle: {
    margin: '0 0 12px',
    color: '#486575',
    fontSize: 13,
    lineHeight: 1.5,
  },
  helperText: {
    margin: 0,
    color: 'rgba(229,240,248,0.82)',
    fontSize: 13,
    lineHeight: 1.6,
  },
  stepperWrap: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 8,
    marginBottom: 12,
  },
  stepBtn: {
    border: '1px solid #d9e4ec',
    background: '#ffffff',
    borderRadius: 12,
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    textAlign: 'left',
  },
  stepBtnActive: {
    border: `1px solid ${BRAND_YELLOW}`,
    background: 'rgba(255,236,0,0.18)',
    boxShadow: '0 0 0 1px rgba(255,236,0,0.2)',
  },
  stepBtnDone: {
    border: '1px solid #d9e4ec',
    background: '#ffffff',
  },
  stepIcon: {
    color: BRAND_YELLOW,
    fontSize: 14,
    flexShrink: 0,
  },
  stepTextWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0,
  },
  stepLabel: {
    color: BRAND_DARK,
    fontSize: 13,
  },
  stepDescription: {
    color: '#60798a',
    fontSize: 11,
    lineHeight: 1.35,
  },
  stepActions: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
  },
  navStepBtn: {
    border: `1px solid ${BRAND_DARK}`,
    background: BRAND_DARK,
    color: '#ffffff',
    borderRadius: 10,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  navStepBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  label: {
    display: 'block',
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: BRAND_YELLOW,
  },
  select: {
    width: '100%',
    borderRadius: 12,
    border: '1.5px solid rgba(255,236,0,0.42)',
    padding: '11px 14px',
    background: 'rgba(255,255,255,0.08)',
    color: '#f8fbff',
    outline: 'none',
    marginBottom: 16,
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: 999,
    border: '1px solid transparent',
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  detailList: {
    display: 'grid',
    gap: 10,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    padding: '10px 12px',
    borderRadius: 12,
    background: '#ffffff',
    border: '1px solid #e4edf4',
  },
  detailLabel: {
    color: '#5f7484',
    fontSize: 13,
  },
  detailValue: {
    color: '#173949',
    fontSize: 13,
    textAlign: 'right',
    wordBreak: 'break-word',
    maxWidth: '60%',
  },
  documentLink: {
    color: BRAND_DARK,
    fontSize: 13,
    fontWeight: 700,
    textDecoration: 'underline',
    textUnderlineOffset: 2,
    maxWidth: '60%',
    textAlign: 'right',
    wordBreak: 'break-word',
  },
  notice: {
    borderRadius: 14,
    padding: '12px 14px',
    border: '1px solid rgba(255,236,0,0.34)',
    background: 'rgba(255,236,0,0.12)',
    color: BRAND_DARK,
    fontWeight: 600,
  },
  errorNotice: {
    border: '1px solid rgba(190, 24, 93, 0.28)',
    background: '#fff1f2',
    color: '#9f1239',
    marginBottom: 16,
  },
}