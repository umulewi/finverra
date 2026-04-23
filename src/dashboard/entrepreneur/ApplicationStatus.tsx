import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'
import EntrepreneurShell from './EntrepreneurShell'

const BRAND_DARK = '#023341'
const BRAND_YELLOW = '#ffec00'

type EntrepreneurApplicationRecord = Record<string, unknown> & {
  id?: number | string
  users_id?: number | string
  status?: string
}

type StatusStep = {
  label: string
  fields: string[]
}

const preferredFieldOrder = [
  'id',
  'users_id',
  'status',
  'first_name',
  'last_name',
  'email',
  'telephone',
  'support_needed',
  'urgency_level',
  'problem_faced',
  'experience',
  'opportunity',
  'how_it_works',
  'what_makes_unique',
  'target_customers',
  'customer_location',
  'customer_numbers',
  'competitors',
  'competitive_advantages',
  'business_idea',
  'monthly_revenue',
  'growth_trend',
  'key_achievement',
  'amount_requested',
  'preferred_type',
  'funds_be_used',
  'expected_impacts',
  'financial_record',
  'can_repay_loan',
  'existing_loan',
  'method_used',
  'main_risk',
  'current_challenges',
  'handle_challenges',
  'what_do_you_want',
  'preferred_support',
  'business_plan',
  'pitch_deck',
  'financial_records',
  'registration_certificate',
  'photo_of_business',
  'information_is_true',
  'agree_to_share_my_data',
] as const

const allowedFieldKeys = new Set<string>(preferredFieldOrder)

const steps: StatusStep[] = [
  {
    label: 'Profile',
    fields: ['status', 'first_name', 'last_name', 'email', 'telephone'],
  },
  {
    label: 'Business',
    fields: ['support_needed', 'urgency_level', 'problem_faced', 'experience', 'opportunity', 'business_idea'],
  },
  {
    label: 'Market',
    fields: ['product_offers', 'how_it_works', 'what_makes_unique', 'target_customers', 'customer_location', 'customer_numbers'],
  },
  {
    label: 'Competition',
    fields: ['competitors', 'competitive_advantages', 'growth_trend', 'key_achievement', 'monthly_revenue'],
  },
  {
    label: 'Funding',
    fields: ['amount_requested', 'preferred_type', 'funds_be_used', 'expected_impacts', 'financial_record', 'can_repay_loan', 'existing_loan', 'method_used'],
  },
  {
    label: 'Support & Docs',
    fields: ['main_risk', 'current_challenges', 'handle_challenges', 'what_do_you_want', 'preferred_support', 'business_plan', 'pitch_deck', 'financial_records', 'registration_certificate', 'photo_of_business', 'information_is_true', 'agree_to_share_my_data'],
  },
]

const documentFieldKeys = new Set<string>([
  'business_plan',
  'pitch_deck',
  'financial_records',
  'registration_certificate',
  'photo_of_business',
])

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

function getDocumentHref(value: string) {
  if (!value.trim()) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return buildApiUrl(value)
}

function getDocumentName(value: string) {
  const parts = value.split('/')
  return parts[parts.length - 1] || 'View document'
}

export default function EntrepreneurApplicationStatus() {
  const session = getAuthSession()
  const email = session?.email ?? ''

  const [application, setApplication] = useState<EntrepreneurApplicationRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!email) {
      setError('No authenticated entrepreneur email found. Please login again.')
      return
    }

    let mounted = true

    async function resolveUserIdAndLoad() {
      setIsLoading(true)
      setError(null)

      try {
        const userRes = await fetch(buildApiUrl(`/entrepreneurs/${encodeURIComponent(email)}`), {
          headers: authHeader(),
        })
        const userPayload = await parseResponseBody(userRes)

        if (!userRes.ok) {
          throw new Error(getErrorMessage(userPayload, 'Failed to resolve entrepreneur account.'))
        }

        const resolvedUsersId = toNumber((userPayload as { users_id?: unknown })?.users_id)
        if (resolvedUsersId == null) {
          throw new Error('Invalid users_id returned by the server.')
        }

        const appRes = await fetch(buildApiUrl(`/entrepreneurs/application-foam/${resolvedUsersId}`), {
          headers: authHeader(),
        })
        const appPayload = await parseResponseBody(appRes)

        if (!appRes.ok) {
          throw new Error(getErrorMessage(appPayload, 'Failed to load application status.'))
        }

        const row = appPayload && typeof appPayload === 'object' && 'application' in appPayload
          ? (appPayload as { application?: unknown }).application
          : appPayload && typeof appPayload === 'object' && 'data' in appPayload
            ? (appPayload as { data?: unknown }).data
            : appPayload

        if (!row || typeof row !== 'object') {
          throw new Error('Invalid application payload returned by the server.')
        }

        if (mounted) {
          setApplication(row as EntrepreneurApplicationRecord)
          setStepIndex(0)
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load application status.')
          setApplication(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void resolveUserIdAndLoad()

    return () => {
      mounted = false
    }
  }, [email])

  const orderedEntries = useMemo(() => {
    if (!application) return [] as Array<[string, unknown]>

    const entries = Object.entries(application).filter(([key]) => allowedFieldKeys.has(key))
    const orderMap = new Map<string, number>(preferredFieldOrder.map((key, index) => [key, index]))

    return entries.sort(([a], [b]) => {
      const aRank = orderMap.get(a) ?? Number.MAX_SAFE_INTEGER
      const bRank = orderMap.get(b) ?? Number.MAX_SAFE_INTEGER
      if (aRank !== bRank) return aRank - bRank
      return a.localeCompare(b)
    })
  }, [application])

  const visibleEntries = useMemo(() => {
    const currentStep = steps[stepIndex] ?? steps[0]
    const entriesByKey = new Map(orderedEntries)
    return currentStep.fields
      .filter((key) => entriesByKey.has(key))
      .map((key) => [key, entriesByKey.get(key)] as [string, unknown])
  }, [orderedEntries, stepIndex])

  const status = toText(application?.status) || 'Not available'

  return (
    <EntrepreneurShell
      title="Application Status"
      subtitle={session?.email ? `Logged in as ${session.email}` : 'Review your submitted application details.'}
      showHero={false}
    >
      <section style={styles.page}>
        <div style={styles.topCard}>
          <p style={styles.kicker}>Entrepreneur Application</p>
          <h3 style={styles.title}>Application Status</h3>
          <p style={styles.sub}>Status and submitted application fields from your saved application foam.</p>
          <div style={styles.statusWrap}>
            <span style={styles.statusLabel}>Current status</span>
            <span style={styles.statusPill}>{status}</span>
          </div>
          
        </div>

        {isLoading ? <div style={styles.notice}>Loading application status...</div> : null}
        {error ? <div style={{ ...styles.notice, ...styles.errorNotice }}>{error}</div> : null}

        {!isLoading && !error ? (
          <div style={styles.formCard}>
            <div style={styles.stepperWrap}>
              {steps.map((step, index) => {
                const isActive = index === stepIndex
                return (
                  <button
                    key={step.label}
                    type="button"
                    style={{ ...styles.stepBtn, ...(isActive ? styles.stepBtnActive : {}) }}
                    onClick={() => setStepIndex(index)}
                  >
                    {step.label}
                  </button>
                )
              })}
            </div>

            <div style={styles.listWrap}>
              {visibleEntries.length > 0 ? (
                visibleEntries.map(([key, value]) => (
                  <DetailRow key={key} fieldKey={key} label={formatFieldLabel(key)} value={value} />
                ))
              ) : (
                <div style={styles.notice}>No application data found for this step.</div>
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
                style={{ ...styles.navStepBtn, ...(stepIndex === steps.length - 1 ? styles.navStepBtnDisabled : {}) }}
                onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
                disabled={stepIndex === steps.length - 1}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </EntrepreneurShell>
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
        <a href={getDocumentHref(textValue)} target="_blank" rel="noreferrer" style={styles.documentLink}>
          {getDocumentName(textValue)}
        </a>
      ) : (
        <strong style={styles.detailValue}>{formatValue(value)}</strong>
      )}
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: 'grid',
    gap: 16,
  },
  topCard: {
    borderRadius: 18,
    border: '1px solid rgba(255,236,0,0.28)',
    background: 'linear-gradient(160deg, #023341 0%, #034756 100%)',
    padding: 20,
    boxShadow: '0 14px 28px rgba(2,51,65,0.18)',
  },
  kicker: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: BRAND_YELLOW,
  },
  title: {
    margin: '8px 0 6px',
    fontSize: 24,
    color: '#ffffff',
  },
  sub: {
    margin: 0,
    color: 'rgba(230,242,251,0.88)',
    lineHeight: 1.6,
  },
  helper: {
    margin: '10px 0 0',
    color: 'rgba(230,242,251,0.82)',
    fontSize: 12,
  },
  statusWrap: {
    marginTop: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusLabel: {
    color: 'rgba(230,242,251,0.86)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    borderRadius: 999,
    border: '1px solid rgba(255,236,0,0.65)',
    background: 'rgba(255,236,0,0.2)',
    color: BRAND_DARK,
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  formCard: {
    borderRadius: 18,
    border: '1px solid rgba(2,51,65,0.12)',
    background: '#ffffff',
    padding: 20,
    boxShadow: '0 10px 30px rgba(2,51,65,0.08)',
  },
  stepperWrap: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: 8,
    marginBottom: 12,
  },
  stepBtn: {
    border: '1px solid #d9e4ec',
    background: '#ffffff',
    borderRadius: 10,
    padding: '9px 10px',
    color: BRAND_DARK,
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
  },
  stepBtnActive: {
    border: `1px solid ${BRAND_YELLOW}`,
    background: 'rgba(255,236,0,0.18)',
    boxShadow: '0 0 0 1px rgba(255,236,0,0.2)',
  },
  listWrap: {
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
  },
}
