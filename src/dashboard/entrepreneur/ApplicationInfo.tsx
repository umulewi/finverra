import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'
import EntrepreneurShell from './EntrepreneurShell'

type ApplicationForm = {
  support_needed: string
  urgency_level: string
  industry_sector: string
  problem_faced: string
  experience: string
  opportunity: string
  product_offers: string
  how_it_works: string
  what_makes_unique: string
  target_customers: string
  customer_location: string
  customer_numbers: string
  competitors: string
  competitive_advantages: string
  business_idea: string
  monthly_revenue: string
  growth_trend: string
  key_achievement: string
  amount_requested: string
  preferred_type: string
  funds_be_used: string
  expected_impacts: string
  financial_record: string
  can_repay_loan: string
  existing_loan: string
  method_used: string
  main_risk: string
  current_challenges: string
  handle_challenges: string
  what_do_you_want: string
  preferred_support: string
  information_is_true: boolean
  agree_to_share_my_data: boolean
}

type ExistingFiles = {
  business_plan: string
  pitch_deck: string
  financial_records: string
  registration_certificate: string
  photo_of_business: string
}

const initialForm: ApplicationForm = {
  support_needed: '',
  urgency_level: '',
  industry_sector: '',
  problem_faced: '',
  experience: '',
  opportunity: '',
  product_offers: '',
  how_it_works: '',
  what_makes_unique: '',
  target_customers: '',
  customer_location: '',
  customer_numbers: '',
  competitors: '',
  competitive_advantages: '',
  business_idea: '',
  monthly_revenue: '',
  growth_trend: '',
  key_achievement: '',
  amount_requested: '',
  preferred_type: '',
  funds_be_used: '',
  expected_impacts: '',
  financial_record: '',
  can_repay_loan: '',
  existing_loan: '',
  method_used: '',
  main_risk: '',
  current_challenges: '',
  handle_challenges: '',
  what_do_you_want: '',
  preferred_support: '',
  information_is_true: false,
  agree_to_share_my_data: false,
}

const initialFiles: ExistingFiles = {
  business_plan: '',
  pitch_deck: '',
  financial_records: '',
  registration_certificate: '',
  photo_of_business: '',
}

type BusinessSnapshot = {
  business_name: string
  establishment_year: string
  business_sector: string
}

const initialBusinessSnapshot: BusinessSnapshot = {
  business_name: '',
  establishment_year: '',
  business_sector: '',
}

function toText(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function toBool(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const n = value.toLowerCase().trim()
    return n === '1' || n === 'true' || n === 'yes'
  }
  return false
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) return response.json()
  const text = await response.text()
  try { return JSON.parse(text) } catch { return text }
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') return payload.message
  return fallbackMessage
}

function authHeader(): HeadersInit {
  const session = getAuthSession()
  if (!session || typeof session.payload !== 'object' || session.payload === null) return {}
  const payload = session.payload as { token?: unknown; accessToken?: unknown }
  const tokenValue = typeof payload.token === 'string' ? payload.token
    : typeof payload.accessToken === 'string' ? payload.accessToken : ''
  return tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}
}

// ─── Step Definitions ────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Vision',    icon: '◈', description: 'Business overview & stage' },
  { label: 'Market',    icon: '◉', description: 'Problem, product & market fit' },
  { label: 'Traction',  icon: '◆', description: 'Funding & financial capacity' },
  { label: 'Support',   icon: '◇', description: 'Risk & FinVerra support' },
  { label: 'Submit',    icon: '✦', description: 'Docs & declaration' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span style={s.label}>{children}</span>
}

function Field({ children, full }: { children: React.ReactNode; full?: boolean }) {
  return <div style={full ? s.fieldFull : s.field}>{children}</div>
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{
        ...s.input,
        ...(focused ? s.inputFocused : {}),
        ...(props.readOnly ? s.inputMuted : {}),
        ...(props.style ?? {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        {...props}
        style={{
          ...s.input,
          ...s.select,
          ...(focused ? s.inputFocused : {}),
          ...(props.style ?? {}),
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <span style={s.selectArrow}>▾</span>
    </div>
  )
}

function StyledTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      {...props}
      style={{
        ...s.textarea,
        ...(focused ? s.inputFocused : {}),
        ...(props.style ?? {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function SectionCard({
  badge,
  title,
  subtitle,
  children,
}: {
  badge: string | number
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div style={s.sectionCard}>
      <div style={s.sectionHeader}>
        <span style={s.badge}>{badge}</span>
        <div>
          <h4 style={s.sectionTitle}>{title}</h4>
          {subtitle && <p style={s.sectionSub}>{subtitle}</p>}
        </div>
      </div>
      <div style={s.grid}>{children}</div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ApplicationInfo() {
  const session = getAuthSession()
  const [form, setForm] = useState<ApplicationForm>(initialForm)
  const [existingFiles, setExistingFiles] = useState<ExistingFiles>(initialFiles)
  const [businessSnapshot, setBusinessSnapshot] = useState<BusinessSnapshot>(initialBusinessSnapshot)
  const [businessPlanFile, setBusinessPlanFile] = useState<File | null>(null)
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null)
  const [financialRecordsFile, setFinancialRecordsFile] = useState<File | null>(null)
  const [registrationCertificateFile, setRegistrationCertificateFile] = useState<File | null>(null)
  const [photoOfBusinessFile, setPhotoOfBusinessFile] = useState<File | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [hasExistingApplication, setHasExistingApplication] = useState<boolean | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isLoadingApplication, setIsLoadingApplication] = useState(false)
  const [isLoadingBusinessSnapshot, setIsLoadingBusinessSnapshot] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)

  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === STEPS.length - 1
  const progressPct = Math.round(((stepIndex + 1) / STEPS.length) * 100)

  const email = useMemo(
    () => (session && typeof session.email === 'string' ? session.email : ''),
    [session],
  )

  function set<K extends keyof ApplicationForm>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm(prev => ({ ...prev, [key]: val }))
    }
  }

  function isEmpty(value: string) {
    return value.trim().length === 0
  }

  function getMissingFieldsForStep(step: number) {
    const missing: string[] = []
    const requireText = (key: keyof ApplicationForm, label: string) => {
      if (typeof form[key] === 'string' && isEmpty(form[key] as string)) {
        missing.push(label)
      }
    }

    if (step === 0) {
      requireText('support_needed', 'Type of support needed')
      requireText('urgency_level', 'Urgency level')
      requireText('industry_sector', 'Industry / Sector')
      requireText('experience', 'Business stage')
      requireText('business_idea', 'One-line business pitch')
    }

    if (step === 1) {
      requireText('problem_faced', 'Problem your business solves')
      requireText('target_customers', 'Who experiences this problem')
      requireText('opportunity', 'Why this opportunity is important now')
      requireText('product_offers', 'Product/service offered')
      requireText('how_it_works', 'How it works')
      requireText('what_makes_unique', 'Unique value (USP)')
    }

    if (step === 2) {
      requireText('customer_location', 'Customer location')
      requireText('customer_numbers', 'Customer count')
      requireText('competitors', 'Main competitors')
      requireText('competitive_advantages', 'Competitive advantage')
      requireText('monthly_revenue', 'Monthly revenue')
      requireText('growth_trend', 'Growth trend')
      requireText('key_achievement', 'Key achievement')
    }

    if (step === 3) {
      requireText('amount_requested', 'Amount requested')
      requireText('preferred_type', 'Preferred funding type')
      requireText('funds_be_used', 'How funds will be used')
      requireText('expected_impacts', 'Expected impact')
      requireText('financial_record', 'Financial records availability')
      requireText('can_repay_loan', 'Loan repayment ability')
      requireText('existing_loan', 'Existing loans/debts')
      requireText('method_used', 'Bank/mobile money used')
    }

    if (step === 4) {
      requireText('main_risk', 'Main risk')
      requireText('current_challenges', 'Current challenges')
      requireText('handle_challenges', 'How you handle challenges')
      requireText('what_do_you_want', 'Requested support from FinVerra')
      requireText('preferred_support', 'Preferred support format')

      if (!businessPlanFile && !existingFiles.business_plan) missing.push('Business Plan file')
      if (!pitchDeckFile && !existingFiles.pitch_deck) missing.push('Pitch Deck file')
      if (!financialRecordsFile && !existingFiles.financial_records) missing.push('Financial Records file')
      if (!registrationCertificateFile && !existingFiles.registration_certificate) missing.push('Registration Certificate file')
      if (!photoOfBusinessFile && !existingFiles.photo_of_business) missing.push('Photo of Business file')

      if (!form.information_is_true) missing.push('Declaration: information is true')
      if (!form.agree_to_share_my_data) missing.push('Declaration: agree to share data')
    }

    return missing
  }

  function setMissingFieldsError(missing: string[]) {
    const preview = missing.slice(0, 4).join(', ')
    const suffix = missing.length > 4 ? `, +${missing.length - 4} more` : ''
    setError(`Please complete required fields: ${preview}${suffix}.`)
  }

  function findFirstIncompleteStep(maxStepInclusive = STEPS.length - 1) {
    for (let i = 0; i <= maxStepInclusive; i += 1) {
      if (getMissingFieldsForStep(i).length > 0) {
        return i
      }
    }

    return -1
  }

  function goToStep(targetStep: number) {
    if (targetStep <= stepIndex) {
      setStepIndex(targetStep)
      return
    }

    const firstIncomplete = findFirstIncompleteStep(targetStep - 1)
    if (firstIncomplete >= 0) {
      const missing = getMissingFieldsForStep(firstIncomplete)
      setStepIndex(firstIncomplete)
      setMissingFieldsError(missing)
      return
    }

    setError(null)
    setStepIndex(targetStep)
  }

  function handleNextStep() {
    const missing = getMissingFieldsForStep(stepIndex)
    if (missing.length > 0) {
      setMissingFieldsError(missing)
      return
    }

    setError(null)
    setStepIndex(p => Math.min(p + 1, STEPS.length - 1))
  }

  useEffect(() => {
    if (!email) {
      setError('No authenticated entrepreneur email found. Please login again.')
      setIsLoadingUser(false)
      return
    }
    let mounted = true
    async function resolveUserId() {
      setIsLoadingUser(true); setError(null)
      try {
        const res = await fetch(buildApiUrl(`/entrepreneurs/${encodeURIComponent(email)}`), { headers: authHeader() })
        const payload = await parseResponseBody(res)
        if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to resolve user id.'))
        const id = Number(payload?.users_id)
        if (!Number.isFinite(id)) throw new Error('Invalid users_id returned by the server.')
        if (mounted) setUserId(id)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to resolve user id.')
      } finally {
        if (mounted) setIsLoadingUser(false)
      }
    }
    void resolveUserId()
    return () => { mounted = false }
  }, [email])

  useEffect(() => {
    if (!userId) return
    let mounted = true
    async function loadExistingApplication() {
      setIsLoadingApplication(true)
      try {
        const res = await fetch(buildApiUrl(`/entrepreneurs/application-foam/${userId}`), { headers: authHeader() })
        const payload = await parseResponseBody(res)
        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) {
              setHasExistingApplication(false)
            }
            return
          }
          throw new Error(getErrorMessage(payload, 'Failed to fetch application info.'))
        }
        const d = payload?.data
        if (mounted) {
          setHasExistingApplication(true)
          setForm({
            support_needed: toText(d?.support_needed), urgency_level: toText(d?.urgency_level),
            industry_sector: toText(d?.industry_sector),
            problem_faced: toText(d?.problem_faced), experience: toText(d?.experience),
            opportunity: toText(d?.opportunity), product_offers: toText(d?.product_offers),
            how_it_works: toText(d?.how_it_works), what_makes_unique: toText(d?.what_makes_unique),
            target_customers: toText(d?.target_customers), customer_location: toText(d?.customer_location),
            customer_numbers: toText(d?.customer_numbers), competitors: toText(d?.competitors),
            competitive_advantages: toText(d?.competitive_advantages), business_idea: toText(d?.business_idea),
            monthly_revenue: toText(d?.monthly_revenue), growth_trend: toText(d?.growth_trend),
            key_achievement: toText(d?.key_achievement), amount_requested: toText(d?.amount_requested),
            preferred_type: toText(d?.preferred_type), funds_be_used: toText(d?.funds_be_used),
            expected_impacts: toText(d?.expected_impacts), financial_record: toText(d?.financial_record),
            can_repay_loan: toText(d?.can_repay_loan), existing_loan: toText(d?.existing_loan),
            method_used: toText(d?.method_used), main_risk: toText(d?.main_risk),
            current_challenges: toText(d?.current_challenges), handle_challenges: toText(d?.handle_challenges),
            what_do_you_want: toText(d?.what_do_you_want), preferred_support: toText(d?.preferred_support),
            information_is_true: toBool(d?.information_is_true), agree_to_share_my_data: toBool(d?.agree_to_share_my_data),
          })
          setExistingFiles({
            business_plan: toText(d?.business_plan), pitch_deck: toText(d?.pitch_deck),
            financial_records: toText(d?.financial_records), registration_certificate: toText(d?.registration_certificate),
            photo_of_business: toText(d?.photo_of_business),
          })
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch application info.')
      } finally {
        if (mounted) setIsLoadingApplication(false)
      }
    }
    void loadExistingApplication()
    return () => { mounted = false }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    let mounted = true

    async function loadBusinessSnapshot() {
      setIsLoadingBusinessSnapshot(true)

      try {
        const res = await fetch(buildApiUrl(`/entrepreneurs/business-info/${userId}`), { headers: authHeader() })
        const payload = await parseResponseBody(res)

        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) {
              setBusinessSnapshot(initialBusinessSnapshot)
              setForm((prev) => ({ ...prev, industry_sector: '' }))
            }
            return
          }

          throw new Error(getErrorMessage(payload, 'Failed to fetch business snapshot.'))
        }

        const data = payload?.data
        if (mounted) {
          const fetchedSector = toText(data?.business_sector)
          setBusinessSnapshot({
            business_name: toText(data?.business_name),
            establishment_year: toText(data?.establishment_year),
            business_sector: fetchedSector,
          })
          setForm((prev) => ({ ...prev, industry_sector: fetchedSector }))
        }
      } catch (err) {
        if (mounted) {
          setBusinessSnapshot(initialBusinessSnapshot)
          setForm((prev) => ({ ...prev, industry_sector: '' }))
        }
      } finally {
        if (mounted) {
          setIsLoadingBusinessSnapshot(false)
        }
      }
    }

    void loadBusinessSnapshot()

    return () => {
      mounted = false
    }
  }, [userId])

  function createRequestBody() {
    const body = new FormData()
    body.append('users_id', String(userId ?? ''))
    Object.entries(form).forEach(([k, v]) => {
      if (typeof v === 'boolean') body.append(k, v ? '1' : '0')
      else body.append(k, v)
    })
    if (businessPlanFile) body.append('business_plan', businessPlanFile)
    if (pitchDeckFile) body.append('pitch_deck', pitchDeckFile)
    if (financialRecordsFile) body.append('financial_records', financialRecordsFile)
    if (registrationCertificateFile) body.append('registration_certificate', registrationCertificateFile)
    if (photoOfBusinessFile) body.append('photo_of_business', photoOfBusinessFile)
    return body
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userId) { setError('Unable to submit because users_id is missing.'); return }

    const firstIncomplete = findFirstIncompleteStep()
    if (firstIncomplete >= 0) {
      const missing = getMissingFieldsForStep(firstIncomplete)
      setStepIndex(firstIncomplete)
      setMissingFieldsError(missing)
      return
    }

    setIsSubmitting(true); setError(null); setSuccess(null)
    try {
      if (hasExistingApplication === false) {
        const res = await fetch(buildApiUrl('/entrepreneurs/application-foam'), { method: 'POST', headers: authHeader(), body: createRequestBody() })
        const payload = await parseResponseBody(res)
        if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to create application.'))
        setHasExistingApplication(true)
        setSuccess(getErrorMessage(payload, 'Application created successfully.'))
        return
      }
      const res = await fetch(buildApiUrl(`/entrepreneurs/application-foam/${userId}`), { method: 'PUT', headers: authHeader(), body: createRequestBody() })
      const payload = await parseResponseBody(res)
      if (!res.ok) throw new Error(getErrorMessage(payload, 'Failed to update application.'))
      setSuccess(getErrorMessage(payload, 'Application updated successfully.'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save application.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <EntrepreneurShell
      title="Investment Application"
      subtitle={session?.email ? `Logged in as ${session.email}` : 'Submit your investment application.'}
      showHero={false}
    >
      <style>{injectStyles}</style>

      {error ? (
        <div
          style={s.errorModalBackdrop}
          role="presentation"
          onClick={() => setError(null)}
        >
          <div
            style={s.errorModal}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="application-error-title"
            aria-describedby="application-error-message"
            onClick={(event) => event.stopPropagation()}
          >
            <div style={s.errorModalBadge}>Error</div>
            <h3 id="application-error-title" style={s.errorModalTitle}>Something needs attention</h3>
            <p id="application-error-message" style={s.errorModalText}>{error}</p>
            <div style={s.errorModalActions}>
              <button type="button" style={s.errorModalButton} onClick={() => setError(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <form style={s.formShell} onSubmit={handleSubmit}>

        {/* ── Step Navigator ─────────────────────────────────────────── */}
        <div style={s.stepper}>
          <div style={s.stepperInner}>
            {STEPS.map((step, idx) => {
              const active = idx === stepIndex
              const done = idx < stepIndex
              return (
                <button
                  key={step.label}
                  type="button"
                  style={{
                    ...s.stepBtn,
                    ...(active ? s.stepBtnActive : {}),
                    ...(done ? s.stepBtnDone : {}),
                  }}
                  onClick={() => goToStep(idx)}
                  className="step-btn"
                >
                  <span style={{ ...s.stepIcon, ...(active ? s.stepIconActive : {}), ...(done ? s.stepIconDone : {}) }}>
                    {done ? '✓' : step.icon}
                  </span>
                  <span style={s.stepLabel}>{step.label}</span>
                </button>
              )
            })}
          </div>
          <div style={s.progressRail}>
            <div style={{ ...s.progressBar, width: `${progressPct}%` }} />
          </div>
          <p style={s.stepMeta}>
            Step {stepIndex + 1} of {STEPS.length} — <strong>{STEPS[stepIndex].description}</strong>
          </p>
        </div>

        {success ? <div style={{ ...s.notice, ...s.noticeSuccess }}>{success}</div> : null}

        {/* ── STEP 0: Vision ──────────────────────────────────────────── */}
        {stepIndex === 0 && (
          <>
            <SectionCard badge="01" title="Application Overview" subtitle="Define the type of support you need and your timeline.">
              <Field full>
                <FieldLabel>Type of Support Needed</FieldLabel>
                <StyledSelect value={form.support_needed} onChange={set('support_needed')}>
                  <option value="">Select support type</option>
                  <option>Funding</option>
                  <option>Investment</option>
                  <option>Grant</option>
                  <option>Advisory / Mentorship</option>
                </StyledSelect>
              </Field>
              <Field>
                <FieldLabel>Urgency Level</FieldLabel>
                <StyledSelect value={form.urgency_level} onChange={set('urgency_level')}>
                  <option value="">Select urgency</option>
                  <option>Immediate (0–1 month)</option>
                  <option>Short-term (1–3 months)</option>
                  <option>Long-term (3+ months)</option>
                </StyledSelect>
              </Field>
            </SectionCard>

            <SectionCard badge="02" title="Business Snapshot" subtitle="High-level information about your venture.">
              <Field>
                <FieldLabel>Business Name</FieldLabel>
                <StyledInput
                  value={isLoadingBusinessSnapshot ? 'Loading business info...' : businessSnapshot.business_name}
                  placeholder="Business name will appear here"
                  readOnly
                />
              </Field>
              <Field>
                <FieldLabel>Establishment Year</FieldLabel>
                <StyledInput
                  value={isLoadingBusinessSnapshot ? 'Loading business info...' : businessSnapshot.establishment_year}
                  placeholder="Establishment year will appear here"
                  readOnly
                />
              </Field>
              <Field>
                <FieldLabel>Industry / Sector</FieldLabel>
                <StyledInput
                  value={isLoadingBusinessSnapshot ? 'Loading business info...' : businessSnapshot.business_sector}
                  placeholder="Business sector will appear here"
                  readOnly
                />
              </Field>
              <Field>
                <FieldLabel>Business Stage</FieldLabel>
                <StyledSelect value={form.experience} onChange={set('experience')}>
                  <option value="">Select stage</option>
                  <option>Idea</option>
                  <option>Startup</option>
                  <option>Growth</option>
                  <option>Established</option>
                </StyledSelect>
              </Field>
              <Field full>
                <FieldLabel>One-line Business Pitch</FieldLabel>
                <StyledTextarea rows={2} value={form.business_idea} onChange={set('business_idea')} placeholder="Describe your business in a single compelling sentence…" />
              </Field>
            </SectionCard>
          </>
        )}

        {/* ── STEP 1: Market ──────────────────────────────────────────── */}
        {stepIndex === 1 && (
          <>
            <SectionCard badge="03" title="Problem & Opportunity" subtitle="Articulate the market gap your business addresses.">
              <Field full>
                <FieldLabel>What problem does your business solve?</FieldLabel>
                <StyledTextarea rows={3} value={form.problem_faced} onChange={set('problem_faced')} placeholder="Describe the core problem clearly…" />
              </Field>
              <Field full>
                <FieldLabel>Who experiences this problem?</FieldLabel>
                <StyledTextarea rows={3} value={form.target_customers} onChange={set('target_customers')} placeholder="Define your target audience…" />
              </Field>
              <Field full>
                <FieldLabel>Why is this opportunity important now?</FieldLabel>
                <StyledTextarea rows={3} value={form.opportunity} onChange={set('opportunity')} placeholder="Timing, market trends, urgency…" />
              </Field>
            </SectionCard>

            <SectionCard badge="04" title="Product / Service Details" subtitle="What you offer and what sets you apart.">
              <Field full>
                <FieldLabel>What product or service do you offer?</FieldLabel>
                <StyledTextarea rows={3} value={form.product_offers} onChange={set('product_offers')} placeholder="Describe your core offering…" />
              </Field>
              <Field full>
                <FieldLabel>How does it work?</FieldLabel>
                <StyledTextarea rows={3} value={form.how_it_works} onChange={set('how_it_works')} placeholder="Explain the mechanism or process…" />
              </Field>
              <Field full>
                <FieldLabel>What makes it unique (USP)?</FieldLabel>
                <StyledTextarea rows={3} value={form.what_makes_unique} onChange={set('what_makes_unique')} placeholder="Your competitive differentiator…" />
              </Field>
            </SectionCard>
          </>
        )}

        {/* ── STEP 2: Traction ────────────────────────────────────────── */}
        {stepIndex === 2 && (
          <>
            <SectionCard badge="05" title="Market Information" subtitle="Customer base and competitive landscape.">
              <Field>
                <FieldLabel>Target Customers</FieldLabel>
                <StyledInput value={form.target_customers} onChange={set('target_customers')} placeholder="e.g. SMEs, rural farmers…" />
              </Field>
              <Field>
                <FieldLabel>Customer Location</FieldLabel>
                <StyledInput value={form.customer_location} onChange={set('customer_location')} placeholder="City, region, country…" />
              </Field>
              <Field>
                <FieldLabel>Customer Count (approx.)</FieldLabel>
                <StyledInput value={form.customer_numbers} onChange={set('customer_numbers')} placeholder="e.g. 500 active users" />
              </Field>
              <Field>
                <FieldLabel>Main Competitors</FieldLabel>
                <StyledInput value={form.competitors} onChange={set('competitors')} placeholder="Who else solves this?" />
              </Field>
              <Field full>
                <FieldLabel>Your Competitive Advantage</FieldLabel>
                <StyledTextarea rows={3} value={form.competitive_advantages} onChange={set('competitive_advantages')} placeholder="Why customers choose you over competitors…" />
              </Field>
            </SectionCard>

            <SectionCard badge="06" title="Traction & Performance" subtitle="If business is under 20 days old, select 'N/A' where applicable.">
              <Field>
                <FieldLabel>Monthly Revenue</FieldLabel>
                <StyledInput value={form.monthly_revenue} onChange={set('monthly_revenue')} placeholder="e.g. RWF 500,000" />
              </Field>
              <Field>
                <FieldLabel>Growth Trend</FieldLabel>
                <StyledSelect value={form.growth_trend} onChange={set('growth_trend')}>
                  <option value="">Select trend</option>
                  <option>Increasing</option>
                  <option>Stable</option>
                  <option>Declining</option>
                </StyledSelect>
              </Field>
              <Field full>
                <FieldLabel>Key Achievement</FieldLabel>
                <StyledSelect value={form.key_achievement} onChange={set('key_achievement')}>
                  <option value="">Select achievement</option>
                  <option>Sales growth</option>
                  <option>Partnerships</option>
                  <option>Awards</option>
                  <option>Others</option>
                </StyledSelect>
              </Field>
            </SectionCard>
          </>
        )}

        {/* ── STEP 3: Support ─────────────────────────────────────────── */}
        {stepIndex === 3 && (
          <>
            <SectionCard badge="07" title="Funding Request" subtitle="Tell us how much you need and what for.">
              <Field>
                <FieldLabel>Amount Requested</FieldLabel>
                <StyledInput value={form.amount_requested} onChange={set('amount_requested')} placeholder="e.g. RWF 2,000,000" />
              </Field>
              <Field>
                <FieldLabel>Preferred Type</FieldLabel>
                <StyledSelect value={form.preferred_type} onChange={set('preferred_type')}>
                  <option value="">Select type</option>
                  <option>Loan</option>
                  <option>Equity Investment</option>
                  <option>Grant</option>
                  <option>Business advisory</option>
                </StyledSelect>
              </Field>
              <Field full>
                <FieldLabel>How will the funds be used?</FieldLabel>
                <StyledSelect value={form.funds_be_used} onChange={set('funds_be_used')}>
                  <option value="">Select usage</option>
                  <option>Equipment</option>
                  <option>Inventory</option>
                  <option>Marketing</option>
                  <option>Staff</option>
                  <option>Operations</option>
                  <option>Other</option>
                </StyledSelect>
              </Field>
              <Field full>
                <FieldLabel>Expected Impact (Revenue %, Jobs created)</FieldLabel>
                <StyledTextarea rows={3} value={form.expected_impacts} onChange={set('expected_impacts')} placeholder="Describe projected outcomes…" />
              </Field>
            </SectionCard>

            <SectionCard badge="08" title="Financial Capacity" subtitle="Help us understand your financial health.">
              <Field>
                <FieldLabel>Do you have financial records?</FieldLabel>
                <StyledSelect value={form.financial_record} onChange={set('financial_record')}>
                  <option value="">Select</option>
                  <option>Yes</option>
                  <option>No</option>
                </StyledSelect>
              </Field>
              <Field>
                <FieldLabel>Can you repay a loan?</FieldLabel>
                <StyledSelect value={form.can_repay_loan} onChange={set('can_repay_loan')}>
                  <option value="">Select</option>
                  <option>Yes</option>
                  <option>No</option>
                  <option>Not sure</option>
                </StyledSelect>
              </Field>
              <Field full>
                <FieldLabel>Existing loans or debts</FieldLabel>
                <StyledTextarea rows={2} value={form.existing_loan} onChange={set('existing_loan')} placeholder="Describe any outstanding obligations…" />
              </Field>
              <Field full>
                <FieldLabel>Bank / Mobile Money used</FieldLabel>
                <StyledTextarea rows={2} value={form.method_used} onChange={set('method_used')} placeholder="e.g. Bank of Kigali, MTN MoMo…" />
              </Field>
            </SectionCard>
          </>
        )}

        {/* ── STEP 4: Submit ──────────────────────────────────────────── */}
        {stepIndex === 4 && (
          <>
            <SectionCard badge="09" title="Risk & Challenges" subtitle="Transparency builds trust with investors.">
              <Field>
                <FieldLabel>Main Risk</FieldLabel>
                <StyledInput value={form.main_risk} onChange={set('main_risk')} placeholder="Your biggest business risk…" />
              </Field>
              <Field full>
                <FieldLabel>Current Challenges</FieldLabel>
                <StyledSelect value={form.current_challenges} onChange={set('current_challenges')}>
                  <option value="">Select challenge</option>
                  <option>Finance</option>
                  <option>Market access</option>
                  <option>Skills</option>
                  <option>Operations</option>
                </StyledSelect>
              </Field>
              <Field full>
                <FieldLabel>How are you handling them?</FieldLabel>
                <StyledTextarea rows={3} value={form.handle_challenges} onChange={set('handle_challenges')} placeholder="Describe your mitigation strategies…" />
              </Field>
            </SectionCard>

            <SectionCard badge="10" title="Support Needed from FinVerra" subtitle="What would you like us to do for you?">
              <Field full>
                <FieldLabel>What exactly do you want from FinVerra?</FieldLabel>
                <StyledSelect value={form.what_do_you_want} onChange={set('what_do_you_want')}>
                  <option value="">Select request</option>
                  <option>Funding connection</option>
                  <option>Business advisory</option>
                  <option>Investor matching</option>
                  <option>Training</option>
                </StyledSelect>
              </Field>
              <Field full>
                <FieldLabel>Preferred support format</FieldLabel>
                <StyledSelect value={form.preferred_support} onChange={set('preferred_support')}>
                  <option value="">Select format</option>
                  <option>Online</option>
                  <option>Physical meetings</option>
                  <option>Both</option>
                </StyledSelect>
              </Field>
            </SectionCard>

            {/* Documents */}
            <div style={s.sectionCard}>
              <div style={s.sectionHeader}>
                <span style={s.badge}>11</span>
                <div>
                  <h4 style={s.sectionTitle}>Documents Upload</h4>
                  {hasExistingApplication === false && (
                    <p style={s.warningBanner}>⚠ First-time submission requires all 5 files.</p>
                  )}
                </div>
              </div>
              <div style={s.docsGrid}>
                {([
                  { label: 'Business Plan', existing: existingFiles.business_plan, onChange: (f: File | null) => setBusinessPlanFile(f) },
                  { label: 'Pitch Deck', existing: existingFiles.pitch_deck, onChange: (f: File | null) => setPitchDeckFile(f) },
                  { label: 'Financial Records', existing: existingFiles.financial_records, onChange: (f: File | null) => setFinancialRecordsFile(f) },
                  { label: 'Registration Certificate', existing: existingFiles.registration_certificate, onChange: (f: File | null) => setRegistrationCertificateFile(f) },
                  { label: 'Photo of Business', existing: existingFiles.photo_of_business, onChange: (f: File | null) => setPhotoOfBusinessFile(f) },
                ] as const).map(({ label, existing, onChange }) => (
                  <DocUploadCard
                    key={label}
                    label={label}
                    existingUrl={existing}
                    onChange={onChange}
                  />
                ))}
              </div>
            </div>

            {/* Declaration */}
            <div style={s.sectionCard}>
              <div style={s.sectionHeader}>
                <span style={s.badge}>12</span>
                <div><h4 style={s.sectionTitle}>Declaration</h4></div>
              </div>
              <div style={s.checkboxGroup}>
                <CheckboxItem
                  checked={form.information_is_true}
                  onChange={(checked) => setForm(p => ({ ...p, information_is_true: checked }))}
                  label="I confirm all information provided is true and accurate to the best of my knowledge."
                />
                <CheckboxItem
                  checked={form.agree_to_share_my_data}
                  onChange={(checked) => setForm(p => ({ ...p, agree_to_share_my_data: checked }))}
                  label="I agree to share my data with FinVerra and authorised partners for evaluation purposes."
                />
              </div>
            </div>
          </>
        )}

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <div style={s.navRow}>
          <button
            type="button"
            style={{ ...s.btnSecondary, ...(isFirstStep ? s.btnDisabled : {}) }}
            onClick={() => setStepIndex(p => Math.max(p - 1, 0))}
            disabled={isFirstStep}
          >
            ← Previous
          </button>
          {!isLastStep ? (
            <button
              type="button"
              style={s.btnPrimary}
              onClick={handleNextStep}
            >
              Next Step →
            </button>
          ) : (
            <button
              style={{ ...s.btnPrimary, ...s.btnSubmit }}
              type="submit"
              disabled={isSubmitting || isLoadingUser || isLoadingApplication || !userId}
            >
              {isSubmitting ? 'Saving…' : hasExistingApplication === false ? 'Create Application' : 'Update Application'}
            </button>
          )}
        </div>
      </form>
    </EntrepreneurShell>
  )
}

// ─── Doc Upload Card ──────────────────────────────────────────────────────────
function DocUploadCard({
  label,
  existingUrl,
  onChange,
}: {
  label: string
  existingUrl: string
  onChange: (f: File | null) => void
}) {
  const [fileName, setFileName] = useState<string | null>(null)
  return (
    <div style={s.docCard}>
      <div style={s.docLabel}>{label}</div>
      <label style={s.docUploadArea} className="doc-upload-area">
        <input
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            onChange(f)
            setFileName(f?.name ?? null)
          }}
        />
        <span style={s.docUploadIcon}>{fileName ? '✓' : '↑'}</span>
        <span style={s.docUploadText}>
          {fileName ? fileName : 'Click to upload'}
        </span>
      </label>
      {existingUrl && (
        <a style={s.docCurrentLink} href={existingUrl} target="_blank" rel="noreferrer">
          View current file →
        </a>
      )}
    </div>
  )
}

// ─── Checkbox Item ────────────────────────────────────────────────────────────
function CheckboxItem({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label style={s.checkboxRow} className="checkbox-row">
      <span style={{ ...s.checkboxBox, ...(checked ? s.checkboxBoxChecked : {}) }}>
        {checked && <span style={s.checkboxTick}>✓</span>}
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ display: 'none' }}
        />
      </span>
      <span style={s.checkboxText}>{label}</span>
    </label>
  )
}

// ─── Injected CSS ─────────────────────────────────────────────────────────────
const injectStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; }

  .step-btn { transition: all 0.18s ease; }
  .step-btn:hover { transform: translateY(-1px); }

  .doc-upload-area:hover {
    border-color: #2563EB !important;
    background: #EFF6FF !important;
  }

  .checkbox-row:hover .checkbox-box-inner { border-color: #2563EB; }

  input::placeholder, textarea::placeholder {
    color: #94A3B8;
    font-style: italic;
  }

  select option { color: #0F172A; }
`

// ─── Styles ───────────────────────────────────────────────────────────────────
const BASE_FONT = "'Sora', sans-serif"
const MONO_FONT = "'DM Mono', monospace"

const s: Record<string, CSSProperties> = {
  errorModalBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 80,
    background: 'rgba(15, 23, 42, 0.58)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorModal: {
    width: 'min(100%, 520px)',
    borderRadius: 20,
    background: '#FFFFFF',
    border: '1px solid rgba(239, 68, 68, 0.16)',
    boxShadow: '0 28px 80px rgba(15,23,42,0.28)',
    padding: '24px 22px 20px',
    textAlign: 'center',
    fontFamily: BASE_FONT,
  },
  errorModalBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 12px',
    borderRadius: 999,
    background: '#FEF2F2',
    color: '#B91C1C',
    border: '1px solid #FECACA',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
  },
  errorModalTitle: {
    margin: '0 0 10px',
    color: '#0F172A',
    fontSize: 20,
  },
  errorModalText: {
    margin: 0,
    color: '#475569',
    fontSize: 14,
    lineHeight: 1.7,
  },
  errorModalActions: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 18,
  },
  errorModalButton: {
    border: 'none',
    borderRadius: 12,
    padding: '10px 18px',
    cursor: 'pointer',
    fontWeight: 700,
    color: '#FFFFFF',
    background: 'linear-gradient(140deg, #0F2D5C, #1A4080)',
  },
  notice: {
    border: '1px solid',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    fontFamily: BASE_FONT,
    fontWeight: 600,
  },
  noticeError: {
    background: '#FFF1F2',
    borderColor: '#FECDD3',
    color: '#BE123C',
  },
  noticeSuccess: {
    background: '#F0FDF4',
    borderColor: '#BBF7D0',
    color: '#15803D',
  },
  formShell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    fontFamily: BASE_FONT,
  },

  // Stepper
  stepper: {
    background: '#0F172A',
    borderRadius: 20,
    padding: '20px 24px 18px',
    boxShadow: '0 20px 40px rgba(15,23,42,0.18)',
  },
  stepperInner: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 6,
    marginBottom: 16,
  },
  stepBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '10px 6px',
    cursor: 'pointer',
    color: '#64748B',
  },
  stepBtnActive: {
    background: 'rgba(37,99,235,0.2)',
    border: '1px solid rgba(59,130,246,0.5)',
    color: '#93C5FD',
  },
  stepBtnDone: {
    background: 'rgba(22,163,74,0.15)',
    border: '1px solid rgba(34,197,94,0.3)',
    color: '#86EFAC',
  },
  stepIcon: {
    fontSize: 16,
    lineHeight: 1,
    fontFamily: MONO_FONT,
  },
  stepIconActive: { color: '#60A5FA' },
  stepIconDone: { color: '#4ADE80' },
  stepLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  progressRail: {
    height: 3,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #3B82F6, #06B6D4)',
    transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)',
  },
  stepMeta: {
    margin: 0,
    color: '#475569',
    fontSize: 12,
    fontFamily: MONO_FONT,
  },

  // Section cards
  sectionCard: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #E2E8F0',
    padding: '24px 24px 20px',
    boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)',
  },
  sectionHeader: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    background: '#0F172A',
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: MONO_FONT,
    flexShrink: 0,
    marginTop: 2,
  },
  sectionTitle: {
    margin: '0 0 3px',
    fontSize: 16,
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: -0.3,
    fontFamily: BASE_FONT,
  },
  sectionSub: {
    margin: 0,
    fontSize: 13,
    color: '#64748B',
    fontFamily: BASE_FONT,
  },
  warningBanner: {
    margin: '4px 0 0',
    fontSize: 12,
    fontWeight: 600,
    color: '#92400E',
    background: '#FFFBEB',
    border: '1px solid #FDE68A',
    borderRadius: 8,
    padding: '6px 10px',
    display: 'inline-block',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  fieldFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
    gridColumn: '1 / -1',
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: '#374151',
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
    fontFamily: BASE_FONT,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 10,
    fontSize: 14,
    color: '#0F172A',
    background: '#FAFAFA',
    fontFamily: BASE_FONT,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  inputFocused: {
    borderColor: '#3B82F6',
    background: '#FFFFFF',
    boxShadow: '0 0 0 3px rgba(59,130,246,0.12)',
  },
  inputMuted: {
    background: '#F1F5F9',
    color: '#94A3B8',
    cursor: 'not-allowed',
  },
  select: {
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    paddingRight: 36,
    cursor: 'pointer',
  },
  selectArrow: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94A3B8',
    pointerEvents: 'none',
    fontSize: 14,
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 10,
    fontSize: 14,
    color: '#0F172A',
    background: '#FAFAFA',
    fontFamily: BASE_FONT,
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: 90,
    lineHeight: 1.6,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },

  // Documents
  docsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },
  docCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  docLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#374151',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    fontFamily: BASE_FONT,
  },
  docUploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '16px 8px',
    border: '1.5px dashed #CBD5E1',
    borderRadius: 10,
    background: '#F8FAFC',
    cursor: 'pointer',
    transition: 'all 0.15s',
    minHeight: 80,
  },
  docUploadIcon: {
    fontSize: 20,
    color: '#3B82F6',
  },
  docUploadText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: MONO_FONT,
    textAlign: 'center' as const,
  },
  docCurrentLink: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: 600,
    textDecoration: 'none',
    fontFamily: BASE_FONT,
  },

  // Checkboxes
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    cursor: 'pointer',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    border: '2px solid #CBD5E1',
    background: '#FFFFFF',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
    transition: 'all 0.15s',
  },
  checkboxBoxChecked: {
    background: '#0F172A',
    borderColor: '#0F172A',
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1,
  },
  checkboxText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 1.5,
    fontFamily: BASE_FONT,
  },

  // Navigation
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  btnSecondary: {
    padding: '11px 20px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 10,
    background: '#FFFFFF',
    color: '#374151',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: BASE_FONT,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  btnPrimary: {
    padding: '11px 24px',
    border: 'none',
    borderRadius: 10,
    background: '#0F172A',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: BASE_FONT,
    cursor: 'pointer',
    letterSpacing: 0.2,
    transition: 'all 0.15s',
  },
  btnSubmit: {
    background: 'linear-gradient(135deg, #1D4ED8, #0EA5E9)',
    boxShadow: '0 4px 14px rgba(29,78,216,0.35)',
  },
}