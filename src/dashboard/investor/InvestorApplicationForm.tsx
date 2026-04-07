import { useEffect, useState, type CSSProperties, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'
import InvestorLayout from './InvestorLayout'

type BasicInfo = {
  email: string
  first_name: string
  last_name: string
  telephone: string
}

type InvestorApplicationForm = {
  investor_type: string
  residence_country: string
  investment_budget: string
  investment_size: string
  how_many_business_you_can_invest: string
  type_of_investment: string
  sectors_do_you_prefer: string
  where_do_you_want_to_invest: string
  stage_do_you_prefer: string
  risk_level: string
  return_type: string
  expected_roi: string
  investment_duration: string
  what_do_you_look_in_business: string
  minimum_requirements: string
  how_involved_do_you_want: string
  have_you_invested_before: string
  number_of_investments: string
  invested_sector: string
  success_stories: string
  preferred_contact: string
  availability: string
  confirm_the_information_is_accurate: boolean
  i_agree_to_terms: boolean
  i_consent_to_be_matched_with_entrepreneurs: boolean
}

type ExistingFiles = {
  company_registration: string
  proof_of_funds: string
  kyc: string
}

const initialForm: InvestorApplicationForm = {
  investor_type: '',
  residence_country: '',
  investment_budget: '',
  investment_size: '',
  how_many_business_you_can_invest: '',
  type_of_investment: '',
  sectors_do_you_prefer: '',
  where_do_you_want_to_invest: '',
  stage_do_you_prefer: '',
  risk_level: '',
  return_type: '',
  expected_roi: '',
  investment_duration: '',
  what_do_you_look_in_business: '',
  minimum_requirements: '',
  how_involved_do_you_want: '',
  have_you_invested_before: '',
  number_of_investments: '',
  invested_sector: '',
  success_stories: '',
  preferred_contact: '',
  availability: '',
  confirm_the_information_is_accurate: false,
  i_agree_to_terms: false,
  i_consent_to_be_matched_with_entrepreneurs: false,
}

const initialFiles: ExistingFiles = {
  company_registration: '',
  proof_of_funds: '',
  kyc: '',
}

const STEPS = [
  { label: 'Profile', icon: '◈', description: 'Basic investor information' },
  { label: 'Capacity', icon: '◉', description: 'Investment budget and size' },
  { label: 'Preference', icon: '◆', description: 'Investment type & sectors' },
  { label: 'Risk & Returns', icon: '◇', description: 'Risk level and expected outcomes' },
  { label: 'Experience', icon: '◊', description: 'Past investment history' },
  { label: 'Docs & Verify', icon: '✦', description: 'Documents and compliance' },
]

function toText(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function toBool(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'yes'
  }
  return false
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

function fileLabel(pathValue: string) {
  if (!pathValue) return ''
  const segments = pathValue.split('/')
  return segments[segments.length - 1] ?? pathValue
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span style={s.label}>{children}</span>
}

function Field({ children, full }: { children: ReactNode; full?: boolean }) {
  return <div style={full ? s.fieldFull : s.field}>{children}</div>
}

function SectionCard({
  badge,
  title,
  subtitle,
  children,
  gridStyle,
}: {
  badge: string | number
  title: string
  subtitle?: string
  children: ReactNode
  gridStyle?: CSSProperties
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
      <div style={gridStyle ?? s.grid}>{children}</div>
    </div>
  )
}

function CheckboxOption({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label style={s.checkboxOption}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={s.checkboxInput}
      />
      <span>{label}</span>
    </label>
  )
}

export default function ApplicationFoam() {
  const session = getAuthSession()
  const email = session?.email ?? ''

  const [viewportWidth, setViewportWidth] = useState<number>(window.innerWidth)

  const [userId, setUserId] = useState<number | null>(null)
  const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null)
  const [applicationId, setApplicationId] = useState<number | null>(null)
  const [hasExistingApplication, setHasExistingApplication] = useState<boolean | null>(null)

  const [form, setForm] = useState<InvestorApplicationForm>(initialForm)
  const [existingFiles, setExistingFiles] = useState<ExistingFiles>(initialFiles)

  const [companyRegistrationFile, setCompanyRegistrationFile] = useState<File | null>(null)
  const [proofOfFundsFile, setProofOfFundsFile] = useState<File | null>(null)
  const [kycFile, setKycFile] = useState<File | null>(null)

  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [isLoadingBasicInfo, setIsLoadingBasicInfo] = useState(false)
  const [isLoadingApplication, setIsLoadingApplication] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)

  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === STEPS.length - 1
  const progressPct = Math.round(((stepIndex + 1) / STEPS.length) * 100)

  const isPhone = viewportWidth <= 640
  const isTablet = viewportWidth <= 960

  const responsivePageStyle: CSSProperties = {
    ...s.page,
    maxWidth: isPhone ? '100%' : 1000,
    paddingLeft: isPhone ? 12 : 20,
    paddingRight: isPhone ? 12 : 20,
    gap: isPhone ? 16 : 24,
  }

  const responsiveGridStyle: CSSProperties = {
    ...s.grid,
    gridTemplateColumns: isPhone
      ? '1fr'
      : isTablet
        ? 'repeat(2, minmax(0, 1fr))'
        : 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: isPhone ? 12 : 16,
  }

  const responsiveCardStyle: CSSProperties = {
    ...s.sectionCard,
    padding: isPhone ? 14 : isTablet ? 18 : 24,
    borderRadius: isPhone ? 14 : 16,
  }

  const responsiveHeaderStyle: CSSProperties = {
    ...s.sectionHeader,
    flexDirection: isPhone ? 'column' : 'row',
    alignItems: isPhone ? 'flex-start' : 'flex-start',
    gap: isPhone ? 10 : 14,
    marginBottom: isPhone ? 14 : 20,
  }

  const responsiveStepperInnerStyle: CSSProperties = {
    ...s.stepperInner,
    gridTemplateColumns: isPhone ? 'repeat(2, minmax(0, 1fr))' : isTablet ? 'repeat(3, minmax(0, 1fr))' : 'repeat(6, 1fr)',
    gap: isPhone ? 8 : 6,
  }

  const responsiveStepBtnStyle: CSSProperties = {
    ...s.stepBtn,
    padding: isPhone ? '9px 8px' : '10px 6px',
    borderRadius: isPhone ? 10 : 12,
  }

  const responsiveLabelStyle: CSSProperties = {
    ...s.label,
    fontSize: isPhone ? 11 : 12,
  }

  const responsiveInputStyle: CSSProperties = {
    ...s.input,
    minHeight: isPhone ? 42 : undefined,
    fontSize: isPhone ? 14 : 14,
    width: '100%',
  }

  const responsiveTextAreaStyle: CSSProperties = {
    ...s.textarea,
    minHeight: isPhone ? 84 : 90,
  }

  const responsiveNavRowStyle: CSSProperties = {
    ...s.navRow,
    flexDirection: isPhone ? 'column' : 'row',
    alignItems: isPhone ? 'stretch' : 'center',
  }

  const responsiveButtonBase: CSSProperties = {
    width: isPhone ? '100%' : 'auto',
    justifySelf: isPhone ? 'stretch' : 'auto',
  }

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Resolve user ID from email
  useEffect(() => {
    if (!email) {
      setError('No authenticated investor email was found. Please login again.')
      return
    }

    let mounted = true

    async function resolveUserId() {
      setIsLoadingUser(true)
      setError(null)
      try {
        const userRes = await fetch(buildApiUrl(`/investors/${encodeURIComponent(email)}`), {
          headers: authHeader(),
        })
        const userPayload = await parseResponseBody(userRes)
        if (!userRes.ok) {
          throw new Error(getErrorMessage(userPayload, 'Failed to fetch investor user id.'))
        }

        const resolvedUserId = Number((userPayload as { users_id?: unknown })?.users_id)
        if (!Number.isFinite(resolvedUserId)) {
          throw new Error('Invalid users_id returned by the server.')
        }

        if (mounted) {
          setUserId(resolvedUserId)
        }
      } catch (resolveError) {
        if (mounted) {
          setError(resolveError instanceof Error ? resolveError.message : 'Failed to resolve users_id.')
        }
      } finally {
        if (mounted) {
          setIsLoadingUser(false)
        }
      }
    }

    void resolveUserId()

    return () => {
      mounted = false
    }
  }, [email])

  // Load basic investor info
  useEffect(() => {
    if (!userId) return

    let mounted = true

    async function loadBasicInfo() {
      setIsLoadingBasicInfo(true)
      try {
        const response = await fetch(buildApiUrl(`/investors/select_basic/${userId}`), {
          headers: authHeader(),
        })
        const payload = await parseResponseBody(response)

        if (!response.ok) {
          throw new Error(getErrorMessage(payload, 'Failed to fetch basic investor info.'))
        }

        const records = Array.isArray(payload) ? payload : [payload]
        const record = records[0]

        if (mounted && record) {
          setBasicInfo({
            email: toText(record.email),
            first_name: toText(record.first_name),
            last_name: toText(record.last_name),
            telephone: toText(record.telephone),
          })
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load basic investor info.')
        }
      } finally {
        if (mounted) {
          setIsLoadingBasicInfo(false)
        }
      }
    }

    void loadBasicInfo()

    return () => {
      mounted = false
    }
  }, [userId])

  // Load existing application
  useEffect(() => {
    if (!userId) return

    let mounted = true

    async function loadExistingApplication() {
      setIsLoadingApplication(true)
      try {
        const response = await fetch(buildApiUrl(`/investor_application/${userId}`), {
          headers: authHeader(),
        })
        const payload = await parseResponseBody(response)

        if (!response.ok) {
          if (response.status === 404) {
            if (mounted) {
              setHasExistingApplication(false)
              setApplicationId(null)
            }
            return
          }
          throw new Error(getErrorMessage(payload, 'Failed to fetch investor application.'))
        }

        const record = payload && typeof payload === 'object' && 'data' in payload
          ? (payload as { data?: unknown }).data
          : payload

        if (!record || typeof record !== 'object') {
          throw new Error('Invalid application payload returned by the server.')
        }

        const row = record as Record<string, unknown>
        const resolvedApplicationId = Number(row.id)

        if (mounted) {
          setHasExistingApplication(true)
          setApplicationId(Number.isFinite(resolvedApplicationId) ? resolvedApplicationId : null)
          setForm({
            investor_type: toText(row.investor_type),
            residence_country: toText(row.residence_country),
            investment_budget: toText(row.investment_budget),
            investment_size: toText(row.investment_size),
            how_many_business_you_can_invest: toText(row.how_many_business_you_can_invest),
            type_of_investment: toText(row.type_of_investment),
            sectors_do_you_prefer: toText(row.sectors_do_you_prefer),
            where_do_you_want_to_invest: toText(row.where_do_you_want_to_invest),
            stage_do_you_prefer: toText(row.stage_do_you_prefer),
            risk_level: toText(row.risk_level),
            return_type: toText(row.return_type),
            expected_roi: toText(row.expected_roi),
            investment_duration: toText(row.investment_duration),
            what_do_you_look_in_business: toText(row.what_do_you_look_in_business),
            minimum_requirements: toText(row.minimum_requirements),
            how_involved_do_you_want: toText(row.how_involved_do_you_want),
            have_you_invested_before: toText(row.have_you_invested_before),
            number_of_investments: toText(row.number_of_investments),
            invested_sector: toText(row.invested_sector),
            success_stories: toText(row.success_stories),
            preferred_contact: toText(row.preferred_contact),
            availability: toText(row.availability),
            confirm_the_information_is_accurate: toBool(row.confirm_the_information_is_accurate),
            i_agree_to_terms: toBool(row.i_agree_to_terms),
            i_consent_to_be_matched_with_entrepreneurs: toBool(row.i_consent_to_be_matched_with_entrepreneurs),
          })
          setExistingFiles({
            company_registration: toText(row.company_registration),
            proof_of_funds: toText(row.proof_of_funds),
            kyc: toText(row.kyc),
          })
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load investor application.')
          setHasExistingApplication(false)
          setApplicationId(null)
        }
      } finally {
        if (mounted) {
          setIsLoadingApplication(false)
        }
      }
    }

    void loadExistingApplication()

    return () => {
      mounted = false
    }
  }, [userId])

  const handleTextChange = (key: keyof InvestorApplicationForm) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleBooleanChange = (key: keyof InvestorApplicationForm) => (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked
    setForm((prev) => ({ ...prev, [key]: checked }))
  }

  function buildRequestBody() {
    const body = new FormData()
    body.append('users_id', String(userId ?? ''))
    body.append('investor_type', form.investor_type)
    body.append('residence_country', form.residence_country)
    body.append('investment_budget', form.investment_budget)
    body.append('investment_size', form.investment_size)
    body.append('how_many_business_you_can_invest', form.how_many_business_you_can_invest)
    body.append('type_of_investment', form.type_of_investment)
    body.append('sectors_do_you_prefer', form.sectors_do_you_prefer)
    body.append('where_do_you_want_to_invest', form.where_do_you_want_to_invest)
    body.append('stage_do_you_prefer', form.stage_do_you_prefer)
    body.append('risk_level', form.risk_level)
    body.append('return_type', form.return_type)
    body.append('expected_roi', form.expected_roi)
    body.append('investment_duration', form.investment_duration)
    body.append('what_do_you_look_in_business', form.what_do_you_look_in_business)
    body.append('minimum_requirements', form.minimum_requirements)
    body.append('how_involved_do_you_want', form.how_involved_do_you_want)
    body.append('have_you_invested_before', form.have_you_invested_before)
    body.append('number_of_investments', form.number_of_investments)
    body.append('invested_sector', form.invested_sector)
    body.append('success_stories', form.success_stories)
    body.append('preferred_contact', form.preferred_contact)
    body.append('availability', form.availability)
    body.append('confirm_the_information_is_accurate', form.confirm_the_information_is_accurate ? '1' : '0')
    body.append('i_agree_to_terms', form.i_agree_to_terms ? '1' : '0')
    body.append('i_consent_to_be_matched_with_entrepreneurs', form.i_consent_to_be_matched_with_entrepreneurs ? '1' : '0')

    if (companyRegistrationFile) body.append('company_registration', companyRegistrationFile)
    if (proofOfFundsFile) body.append('proof_of_funds', proofOfFundsFile)
    if (kycFile) body.append('kyc', kycFile)

    return body
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId) {
      setError('Unable to submit because users_id is missing. Reload and try again.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const method = hasExistingApplication ? 'PUT' : 'POST'
      const targetId = hasExistingApplication ? (applicationId ?? userId) : null
      const endpoint = targetId
        ? buildApiUrl(`/investor_application/${targetId}`)
        : buildApiUrl('/investor_application')

      const response = await fetch(endpoint, {
        method,
        headers: authHeader(),
        body: buildRequestBody(),
      })
      const payload = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, `Failed to ${hasExistingApplication ? 'update' : 'create'} application.`))
      }

      const insertedIdRaw = payload && typeof payload === 'object' && 'id' in payload
        ? (payload as { id?: unknown }).id
        : null
      const insertedId = Number(insertedIdRaw)

      setHasExistingApplication(true)
      if (Number.isFinite(insertedId)) {
        setApplicationId(insertedId)
      }

      setCompanyRegistrationFile(null)
      setProofOfFundsFile(null)
      setKycFile(null)

      setSuccess(hasExistingApplication ? 'Application updated successfully.' : 'Application created successfully.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit application.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    const targetId = applicationId ?? userId
    if (!targetId) {
      setError('Application id is missing, so delete cannot proceed.')
      return
    }

    setIsDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(buildApiUrl(`/investor_application/${targetId}`), {
        method: 'DELETE',
        headers: authHeader(),
      })
      const payload = await parseResponseBody(response)

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Failed to delete investor application.'))
      }

      setForm(initialForm)
      setExistingFiles(initialFiles)
      setCompanyRegistrationFile(null)
      setProofOfFundsFile(null)
      setKycFile(null)
      setApplicationId(null)
      setHasExistingApplication(false)
      setSuccess('Application deleted successfully.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete investor application.')
    } finally {
      setIsDeleting(false)
    }
  }

  const fullName = basicInfo ? `${basicInfo.first_name} ${basicInfo.last_name}`.trim() : ''
  const isBusy = isLoadingUser || isLoadingBasicInfo || isLoadingApplication

  function getMissingFieldsForStep(step: number) {
    const missing: string[] = []

    if (step === 0) {
      // Profile
      if (!form.investor_type) missing.push('Investor Type')
      if (!form.residence_country) missing.push('Country of Residence')
    }

    if (step === 1) {
      // Capacity
      if (!form.investment_budget) missing.push('Investment Budget')
      if (!form.investment_size) missing.push('Investment Size per Deal')
      if (!form.how_many_business_you_can_invest) missing.push('How Many Businesses per Period')
    }

    if (step === 2) {
      // Preference
      if (!form.type_of_investment) missing.push('Investment Type')
      if (!form.sectors_do_you_prefer) missing.push('Preferred Sectors')
      if (!form.where_do_you_want_to_invest) missing.push('Geographic Preference')
      if (!form.stage_do_you_prefer) missing.push('Business Stage Preference')
    }

    if (step === 3) {
      // Risk & Returns
      if (!form.risk_level) missing.push('Risk Level')
      if (!form.return_type) missing.push('Expected Return Type')
      if (!form.expected_roi) missing.push('Expected ROI')
      if (!form.investment_duration) missing.push('Investment Duration')
      if (!form.what_do_you_look_in_business) missing.push('What You Look For in Business')
      if (!form.how_involved_do_you_want) missing.push('Involvement Level')
    }

    if (step === 4) {
      // Experience
      if (!form.have_you_invested_before) missing.push('Have You Invested Before')
      if (form.have_you_invested_before === 'Yes') {
        if (!form.number_of_investments) missing.push('Number of Past Investments')
        if (!form.invested_sector) missing.push('Previously Invested Sectors')
      }
    }

    if (step === 5) {
      // Docs & Verify
      if (!form.preferred_contact) missing.push('Preferred Contact Method')
      if (!form.availability) missing.push('Availability')
      if (!form.confirm_the_information_is_accurate) missing.push('Confirmation - Information is Accurate')
      if (!form.i_agree_to_terms) missing.push('Agreement - Terms and Conditions')
      if (!form.i_consent_to_be_matched_with_entrepreneurs) missing.push('Consent - Entrepreneur Matching')
    }

    return missing
  }

  function handleStepChange(targetStep: number) {
    const missing = getMissingFieldsForStep(stepIndex)
    if (missing.length > 0) {
      setError(`Please complete required fields in this step:\n\n• ${missing.join('\n• ')}`)
      return
    }
    setStepIndex(targetStep)
  }

  function handleNextStep() {
    const missing = getMissingFieldsForStep(stepIndex)
    if (missing.length > 0) {
      setError(`Please complete required fields:\n\n• ${missing.join('\n• ')}`)
      return
    }
    setError(null)
    setStepIndex((p) => Math.min(p + 1, STEPS.length - 1))
  }

  return (
    <InvestorLayout>
      <div style={responsivePageStyle}>
        <div style={s.heroSection}>
          <h1 style={{ ...s.pageTitle, fontSize: isPhone ? 24 : isTablet ? 28 : 32 }}>Investor Application</h1>
          <p style={{ ...s.pageSubtitle, fontSize: isPhone ? 14 : 15 }}>
            Complete your investment profile to connect with high-growth opportunities matched to your investment criteria.
          </p>
        </div>

        {isBusy ? <div style={s.infoCard}>Loading application data...</div> : null}
        {success ? <div style={{ ...s.infoCard, ...s.successCard }}>{success}</div> : null}

        {/* Error Modal */}
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
              aria-labelledby="error-title"
              aria-describedby="error-message"
              onClick={(event) => event.stopPropagation()}
            >
              <div style={s.errorModalBadge}>⚠ Required Fields</div>
              <h3 id="error-title" style={s.errorModalTitle}>Please complete required fields</h3>
              <p id="error-message" style={s.errorModalText}>{error}</p>
              <div style={s.errorModalActions}>
                <button type="button" style={s.errorModalButton} onClick={() => setError(null)}>
                  OK, I'll fill them in
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <style>{injectStyles}</style>

        <form style={s.formShell} onSubmit={handleSubmit}>
          {/* ── Stepper ──────────────────────────────────────────────────────── */}
          <div style={s.stepper}>
            <div style={responsiveStepperInnerStyle}>
              {STEPS.map((step, idx) => {
                const active = idx === stepIndex
                const done = idx < stepIndex
                return (
                  <button
                    key={step.label}
                    type="button"
                    style={{
                      ...responsiveStepBtnStyle,
                      ...(active ? s.stepBtnActive : {}),
                      ...(done ? s.stepBtnDone : {}),
                    }}
                    onClick={() => handleStepChange(idx)}
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

          {/* ── STEP 0: Profile ──────────────────────────────────────────── */}
          {stepIndex === 0 && (
            <>
              <SectionCard gridStyle={responsiveGridStyle} badge="01" title="Investor Profile" subtitle="Your basic information (auto-filled).">
                <Field>
                  <FieldLabel>Full Name / Company Name</FieldLabel>
                  <input
                    value={fullName || basicInfo?.email || ''}
                    readOnly
                    style={{ ...responsiveInputStyle, ...s.inputMuted }}
                  />
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <input
                    value={basicInfo?.email || email || ''}
                    readOnly
                    style={{ ...responsiveInputStyle, ...s.inputMuted }}
                  />
                </Field>
                <Field>
                  <FieldLabel>Contact Number</FieldLabel>
                  <input
                    value={basicInfo?.telephone || ''}
                    readOnly
                    style={{ ...responsiveInputStyle, ...s.inputMuted }}
                  />
                </Field>
              </SectionCard>

              <SectionCard gridStyle={responsiveGridStyle} badge="02" title="Investor Type" subtitle="Select your investor category.">
                <Field full>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Individual"
                      checked={form.investor_type === 'Individual'}
                      onChange={() => setForm((prev) => ({ ...prev, investor_type: 'Individual' }))}
                    />
                    <CheckboxOption
                      label="Company"
                      checked={form.investor_type === 'Company'}
                      onChange={() => setForm((prev) => ({ ...prev, investor_type: 'Company' }))}
                    />
                    <CheckboxOption
                      label="Investment Firm"
                      checked={form.investor_type === 'Investment Firm'}
                      onChange={() => setForm((prev) => ({ ...prev, investor_type: 'Investment Firm' }))}
                    />
                    <CheckboxOption
                      label="Angel Investor"
                      checked={form.investor_type === 'Angel Investor'}
                      onChange={() => setForm((prev) => ({ ...prev, investor_type: 'Angel Investor' }))}
                    />
                  </div>
                </Field>
              </SectionCard>

              <SectionCard gridStyle={responsiveGridStyle} badge="03" title="Location" subtitle="Where are you based.">
                <Field full>
                  <FieldLabel>Country of Residence</FieldLabel>
                  <input
                    value={form.residence_country}
                    onChange={handleTextChange('residence_country')}
                    placeholder="Enter your country"
                    style={s.input}
                  />
                </Field>
              </SectionCard>
            </>
          )}

          {/* ── STEP 1: Capacity ──────────────────────────────────────────── */}
          {stepIndex === 1 && (
            <>
              <SectionCard gridStyle={responsiveGridStyle} badge="04" title="Investment Budget" subtitle="Your total investment capacity.">
                <Field full>
                  <FieldLabel>Available Investment Budget</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Under 10,000,000 RWF"
                      checked={form.investment_budget === 'Under 10,000,000 RWF'}
                      onChange={() => setForm((prev) => ({ ...prev, investment_budget: 'Under 10,000,000 RWF' }))}
                    />
                    <CheckboxOption
                      label="RWF 10,000,000 – RWF 50,000,000"
                      checked={form.investment_budget === 'RWF 10,000,000 – RWF 50,000,000'}
                      onChange={() => setForm((prev) => ({ ...prev, investment_budget: 'RWF 10,000,000 – RWF 50,000,000' }))}
                    />
                    <CheckboxOption
                      label="RWF 50,000,000 – RWF 100,000,000"
                      checked={form.investment_budget === 'RWF 50,000,000 – RWF 100,000,000'}
                      onChange={() => setForm((prev) => ({ ...prev, investment_budget: 'RWF 50,000,000 – RWF 100,000,000' }))}
                    />
                    <CheckboxOption
                      label="RWF 100,000,000+"
                      checked={form.investment_budget === 'RWF 100,000,000+'}
                      onChange={() => setForm((prev) => ({ ...prev, investment_budget: 'RWF 100,000,000+' }))}
                    />
                  </div>
                </Field>
              </SectionCard>

              <SectionCard gridStyle={responsiveGridStyle} badge="05" title="Investment Size per Deal" subtitle="Your typical investment amount.">
                <Field full>
                  <FieldLabel>Preferred Investment Size</FieldLabel>
                  <input
                    value={form.investment_size}
                    onChange={handleTextChange('investment_size')}
                    placeholder="Example: 5,000,000 RWF"
                    style={s.input}
                  />
                </Field>
              </SectionCard>

              <SectionCard gridStyle={responsiveGridStyle} badge="06" title="Deal Frequency" subtitle="How many businesses can you invest in.">
                <Field full>
                  <FieldLabel>Businesses per Investment Period</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="1"
                      checked={form.how_many_business_you_can_invest === '1'}
                      onChange={() => setForm((prev) => ({ ...prev, how_many_business_you_can_invest: '1' }))}
                    />
                    <CheckboxOption
                      label="2–5"
                      checked={form.how_many_business_you_can_invest === '2–5'}
                      onChange={() => setForm((prev) => ({ ...prev, how_many_business_you_can_invest: '2–5' }))}
                    />
                    <CheckboxOption
                      label="5+"
                      checked={form.how_many_business_you_can_invest === '5+'}
                      onChange={() => setForm((prev) => ({ ...prev, how_many_business_you_can_invest: '5+' }))}
                    />
                  </div>
                </Field>
              </SectionCard>
            </>
          )}

          {/* ── STEP 2: Preference ───────────────────────────────────────── */}
          {stepIndex === 2 && (
            <>
              <SectionCard gridStyle={responsiveGridStyle} badge="07" title="Investment Type" subtitle="What type of returns are you looking for.">
                <Field full>
                  <FieldLabel>Preferred Investment Method</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Equity (ownership shares)"
                      checked={form.type_of_investment === 'Equity'}
                      onChange={() => setForm((prev) => ({ ...prev, type_of_investment: 'Equity' }))}
                    />
                    <CheckboxOption
                      label="Loan (interest-based return)"
                      checked={form.type_of_investment === 'Loan'}
                      onChange={() => setForm((prev) => ({ ...prev, type_of_investment: 'Loan' }))}
                    />
                    <CheckboxOption
                      label="Grant / Impact funding"
                      checked={form.type_of_investment === 'Grant'}
                      onChange={() => setForm((prev) => ({ ...prev, type_of_investment: 'Grant' }))}
                    />
                    <CheckboxOption
                      label="Revenue-sharing"
                      checked={form.type_of_investment === 'Revenue-sharing'}
                      onChange={() => setForm((prev) => ({ ...prev, type_of_investment: 'Revenue-sharing' }))}
                    />
                  </div>
                </Field>
              </SectionCard>

              <SectionCard gridStyle={responsiveGridStyle} badge="08" title="Sector Interest" subtitle="Industries you prefer to invest in.">
                <Field full>
                  <FieldLabel>Preferred Sectors</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Agriculture"
                      checked={form.sectors_do_you_prefer.includes('Agriculture')}
                      onChange={(checked) => {
                        const sectors = checked
                          ? form.sectors_do_you_prefer ? `${form.sectors_do_you_prefer}, Agriculture` : 'Agriculture'
                          : form.sectors_do_you_prefer.replace(', Agriculture', '').replace('Agriculture', '')
                        setForm((prev) => ({ ...prev, sectors_do_you_prefer: sectors }))
                      }}
                    />
                    <CheckboxOption
                      label="Technology"
                      checked={form.sectors_do_you_prefer.includes('Technology')}
                      onChange={(checked) => {
                        const sectors = checked
                          ? form.sectors_do_you_prefer ? `${form.sectors_do_you_prefer}, Technology` : 'Technology'
                          : form.sectors_do_you_prefer.replace(', Technology', '').replace('Technology', '')
                        setForm((prev) => ({ ...prev, sectors_do_you_prefer: sectors }))
                      }}
                    />
                    <CheckboxOption
                      label="Retail"
                      checked={form.sectors_do_you_prefer.includes('Retail')}
                      onChange={(checked) => {
                        const sectors = checked
                          ? form.sectors_do_you_prefer ? `${form.sectors_do_you_prefer}, Retail` : 'Retail'
                          : form.sectors_do_you_prefer.replace(', Retail', '').replace('Retail', '')
                        setForm((prev) => ({ ...prev, sectors_do_you_prefer: sectors }))
                      }}
                    />
                    <CheckboxOption
                      label="Manufacturing"
                      checked={form.sectors_do_you_prefer.includes('Manufacturing')}
                      onChange={(checked) => {
                        const sectors = checked
                          ? form.sectors_do_you_prefer ? `${form.sectors_do_you_prefer}, Manufacturing` : 'Manufacturing'
                          : form.sectors_do_you_prefer.replace(', Manufacturing', '').replace('Manufacturing', '')
                        setForm((prev) => ({ ...prev, sectors_do_you_prefer: sectors }))
                      }}
                    />
                    <CheckboxOption
                      label="Services"
                      checked={form.sectors_do_you_prefer.includes('Services')}
                      onChange={(checked) => {
                        const sectors = checked
                          ? form.sectors_do_you_prefer ? `${form.sectors_do_you_prefer}, Services` : 'Services'
                          : form.sectors_do_you_prefer.replace(', Services', '').replace('Services', '')
                        setForm((prev) => ({ ...prev, sectors_do_you_prefer: sectors }))
                      }}
                    />
                  </div>
                </Field>
                <Field full>
                  <FieldLabel>Other Sectors (optional)</FieldLabel>
                  <input
                    value={form.sectors_do_you_prefer.split(',').find((s) => !['Agriculture', 'Technology', 'Retail', 'Manufacturing', 'Services'].includes(s.trim())) || ''}
                    placeholder="List any other sectors..."
                    style={s.input}
                  />
                </Field>
              </SectionCard>

              <SectionCard gridStyle={responsiveGridStyle} badge="09" title="Geographic Preference" subtitle="Where you want to invest.">
                <Field full>
                  <FieldLabel>Preferred Investment Regions</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Rwanda"
                      checked={form.where_do_you_want_to_invest === 'Rwanda'}
                      onChange={() => setForm((prev) => ({ ...prev, where_do_you_want_to_invest: 'Rwanda' }))}
                    />
                    <CheckboxOption
                      label="East Africa"
                      checked={form.where_do_you_want_to_invest === 'East Africa'}
                      onChange={() => setForm((prev) => ({ ...prev, where_do_you_want_to_invest: 'East Africa' }))}
                    />
                    <CheckboxOption
                      label="Africa-wide"
                      checked={form.where_do_you_want_to_invest === 'Africa-wide'}
                      onChange={() => setForm((prev) => ({ ...prev, where_do_you_want_to_invest: 'Africa-wide' }))}
                    />
                    <CheckboxOption
                      label="Global"
                      checked={form.where_do_you_want_to_invest === 'Global'}
                      onChange={() => setForm((prev) => ({ ...prev, where_do_you_want_to_invest: 'Global' }))}
                    />
                  </div>
                </Field>
              </SectionCard>

              <SectionCard gridStyle={responsiveGridStyle} badge="10" title="Business Stage" subtitle="What growth stage interests you.">
                <Field full>
                  <FieldLabel>Preferred Business Stage</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Idea Stage"
                      checked={form.stage_do_you_prefer === 'Idea Stage'}
                      onChange={() => setForm((prev) => ({ ...prev, stage_do_you_prefer: 'Idea Stage' }))}
                    />
                    <CheckboxOption
                      label="Startup"
                      checked={form.stage_do_you_prefer === 'Startup'}
                      onChange={() => setForm((prev) => ({ ...prev, stage_do_you_prefer: 'Startup' }))}
                    />
                    <CheckboxOption
                      label="Growth"
                      checked={form.stage_do_you_prefer === 'Growth'}
                      onChange={() => setForm((prev) => ({ ...prev, stage_do_you_prefer: 'Growth' }))}
                    />
                    <CheckboxOption
                      label="Established"
                      checked={form.stage_do_you_prefer === 'Established'}
                      onChange={() => setForm((prev) => ({ ...prev, stage_do_you_prefer: 'Established' }))}
                    />
                  </div>
                </Field>
              </SectionCard>
            </>
          )}

          {/* ── STEP 3: Risk & Returns ───────────────────────────────────– */}
          {stepIndex === 3 && (
            <>
              <SectionCard gridStyle={responsiveGridStyle} badge="11" title="Risk Appetite" subtitle="Your comfort level with investment risk.">
                <Field full>
                  <FieldLabel>Risk Level</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Low (safe, stable businesses)"
                      checked={form.risk_level === 'Low'}
                      onChange={() => setForm((prev) => ({ ...prev, risk_level: 'Low' }))}
                    />
                    <CheckboxOption
                      label="Medium (growing businesses)"
                      checked={form.risk_level === 'Medium'}
                      onChange={() => setForm((prev) => ({ ...prev, risk_level: 'Medium' }))}
                    />
                    <CheckboxOption
                      label="High (startups, high risk/high return)"
                      checked={form.risk_level === 'High'}
                      onChange={() => setForm((prev) => ({ ...prev, risk_level: 'High' }))}
                    />
                  </div>
                </Field>
              </SectionCard>

              <SectionCard gridStyle={responsiveGridStyle} badge="12" title="Expected Returns" subtitle="Your return expectations.">
                <Field full>
                  <FieldLabel>Expected Return Type</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Fixed interest"
                      checked={form.return_type === 'Fixed interest'}
                      onChange={() => setForm((prev) => ({ ...prev, return_type: 'Fixed interest' }))}
                    />
                    <CheckboxOption
                      label="Profit share"
                      checked={form.return_type === 'Profit share'}
                      onChange={() => setForm((prev) => ({ ...prev, return_type: 'Profit share' }))}
                    />
                    <CheckboxOption
                      label="Equity growth"
                      checked={form.return_type === 'Equity growth'}
                      onChange={() => setForm((prev) => ({ ...prev, return_type: 'Equity growth' }))}
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Expected ROI (% or range)</FieldLabel>
                  <input
                    value={form.expected_roi}
                    onChange={handleTextChange('expected_roi')}
                    placeholder="Example: 15% - 20% per year"
                    style={s.input}
                  />
                </Field>

                <Field full>
                  <FieldLabel>Preferred Investment Duration</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Short-term (0–1 year)"
                      checked={form.investment_duration === 'Short-term (0–1 year)'}
                      onChange={() => setForm((prev) => ({ ...prev, investment_duration: 'Short-term (0–1 year)' }))}
                    />
                    <CheckboxOption
                      label="Medium-term (1–3 years)"
                      checked={form.investment_duration === 'Medium-term (1–3 years)'}
                      onChange={() => setForm((prev) => ({ ...prev, investment_duration: 'Medium-term (1–3 years)' }))}
                    />
                    <CheckboxOption
                      label="Long-term (3+ years)"
                      checked={form.investment_duration === 'Long-term (3+ years)'}
                      onChange={() => setForm((prev) => ({ ...prev, investment_duration: 'Long-term (3+ years)' }))}
                    />
                  </div>
                </Field>
              </SectionCard>

              <SectionCard gridStyle={responsiveGridStyle} badge="13" title="Investment Criteria" subtitle="What makes a business attractive to you.">
                <Field full>
                  <FieldLabel>What do you look for in a business?</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Strong financial records"
                      checked={form.what_do_you_look_in_business.includes('Strong financial')}
                      onChange={(checked) => {
                        const value = checked
                          ? form.what_do_you_look_in_business ? `${form.what_do_you_look_in_business}, Strong financial records` : 'Strong financial records'
                          : form.what_do_you_look_in_business.replace(', Strong financial records', '').replace('Strong financial records', '')
                        setForm((prev) => ({ ...prev, what_do_you_look_in_business: value }))
                      }}
                    />
                    <CheckboxOption
                      label="Experienced team"
                      checked={form.what_do_you_look_in_business.includes('Experienced team')}
                      onChange={(checked) => {
                        const value = checked
                          ? form.what_do_you_look_in_business ? `${form.what_do_you_look_in_business}, Experienced team` : 'Experienced team'
                          : form.what_do_you_look_in_business.replace(', Experienced team', '').replace('Experienced team', '')
                        setForm((prev) => ({ ...prev, what_do_you_look_in_business: value }))
                      }}
                    />
                    <CheckboxOption
                      label="High growth potential"
                      checked={form.what_do_you_look_in_business.includes('High growth')}
                      onChange={(checked) => {
                        const value = checked
                          ? form.what_do_you_look_in_business ? `${form.what_do_you_look_in_business}, High growth potential` : 'High growth potential'
                          : form.what_do_you_look_in_business.replace(', High growth potential', '').replace('High growth potential', '')
                        setForm((prev) => ({ ...prev, what_do_you_look_in_business: value }))
                      }}
                    />
                    <CheckboxOption
                      label="Social impact"
                      checked={form.what_do_you_look_in_business.includes('Social impact')}
                      onChange={(checked) => {
                        const value = checked
                          ? form.what_do_you_look_in_business ? `${form.what_do_you_look_in_business}, Social impact` : 'Social impact'
                          : form.what_do_you_look_in_business.replace(', Social impact', '').replace('Social impact', '')
                        setForm((prev) => ({ ...prev, what_do_you_look_in_business: value }))
                      }}
                    />
                  </div>
                </Field>

                <Field full>
                  <FieldLabel>Minimum Requirements (optional)</FieldLabel>
                  <textarea
                    value={form.minimum_requirements}
                    onChange={handleTextChange('minimum_requirements')}
                    placeholder="E.g., minimum revenue floor, team size, financial audits..."
                    style={s.textarea}
                  />
                </Field>
              </SectionCard>

              <SectionCard gridStyle={responsiveGridStyle} badge="14" title="Involvement Level" subtitle="How hands-on do you want to be.">
                <Field full>
                  <FieldLabel>Your Investment Involvement Style</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Passive (just invest)"
                      checked={form.how_involved_do_you_want === 'Passive'}
                      onChange={() => setForm((prev) => ({ ...prev, how_involved_do_you_want: 'Passive' }))}
                    />
                    <CheckboxOption
                      label="Advisory role"
                      checked={form.how_involved_do_you_want === 'Advisory'}
                      onChange={() => setForm((prev) => ({ ...prev, how_involved_do_you_want: 'Advisory' }))}
                    />
                    <CheckboxOption
                      label="Active involvement"
                      checked={form.how_involved_do_you_want === 'Active'}
                      onChange={() => setForm((prev) => ({ ...prev, how_involved_do_you_want: 'Active' }))}
                    />
                  </div>
                </Field>
              </SectionCard>
            </>
          )}

          {/* ── STEP 4: Experience ──────────────────────────────────────── */}
          {stepIndex === 4 && (
            <>
              <SectionCard gridStyle={responsiveGridStyle} badge="15" title="Investment Experience" subtitle="Your track record as an investor.">
                <Field full>
                  <FieldLabel>Have you invested before?</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Yes"
                      checked={form.have_you_invested_before === 'Yes'}
                      onChange={() => setForm((prev) => ({ ...prev, have_you_invested_before: 'Yes' }))}
                    />
                    <CheckboxOption
                      label="No"
                      checked={form.have_you_invested_before === 'No'}
                      onChange={() => setForm((prev) => ({ ...prev, have_you_invested_before: 'No' }))}
                    />
                  </div>
                </Field>

                {form.have_you_invested_before === 'Yes' && (
                  <>
                    <Field>
                      <FieldLabel>Number of Past Investments</FieldLabel>
                      <input
                        value={form.number_of_investments}
                        onChange={handleTextChange('number_of_investments')}
                        placeholder="Example: 12"
                        style={s.input}
                      />
                    </Field>

                    <Field full>
                      <FieldLabel>Previously Invested Sectors</FieldLabel>
                      <input
                        value={form.invested_sector}
                        onChange={handleTextChange('invested_sector')}
                        placeholder="E.g., Tech, Agriculture, Retail..."
                        style={s.input}
                      />
                    </Field>

                    <Field full>
                      <FieldLabel>Success Stories (optional)</FieldLabel>
                      <textarea
                        value={form.success_stories}
                        onChange={handleTextChange('success_stories')}
                        placeholder="Share notable exits, returns, or outcomes from your investments..."
                        style={s.textarea}
                      />
                    </Field>
                  </>
                )}
              </SectionCard>
            </>
          )}

          {/* ── STEP 5: Docs & Verify ────────────────────────────────────– */}
          {stepIndex === 5 && (
            <>
              <SectionCard gridStyle={responsiveGridStyle} badge="16" title="Verification & Compliance" subtitle="Upload required documents for verification.">
                <Field full>
                  <FieldLabel>Company Registration / ID</FieldLabel>
                  <label style={s.uploadRow}>
                    <span style={s.uploadLabel}>Company Registration or Government ID</span>
                    <input
                      type="file"
                      onChange={(event) => setCompanyRegistrationFile(event.target.files?.[0] ?? null)}
                      style={s.fileInput}
                    />
                    {existingFiles.company_registration ? (
                      <small style={s.fileHint}>Current: {fileLabel(existingFiles.company_registration)}</small>
                    ) : null}
                  </label>
                </Field>

                <Field full>
                  <FieldLabel>Proof of Funds</FieldLabel>
                  <label style={s.uploadRow}>
                    <span style={s.uploadLabel}>Bank Balance Confirmation or Bank Statement</span>
                    <input
                      type="file"
                      onChange={(event) => setProofOfFundsFile(event.target.files?.[0] ?? null)}
                      style={s.fileInput}
                    />
                    {existingFiles.proof_of_funds ? (
                      <small style={s.fileHint}>Current: {fileLabel(existingFiles.proof_of_funds)}</small>
                    ) : null}
                  </label>
                </Field>

                <Field full>
                  <FieldLabel>KYC Verification</FieldLabel>
                  <label style={s.uploadRow}>
                    <span style={s.uploadLabel}>KYC Document (Know Your Customer Verification)</span>
                    <input
                      type="file"
                      onChange={(event) => setKycFile(event.target.files?.[0] ?? null)}
                      style={s.fileInput}
                    />
                    {existingFiles.kyc ? (
                      <small style={s.fileHint}>Current: {fileLabel(existingFiles.kyc)}</small>
                    ) : null}
                  </label>
                </Field>
              </SectionCard>

              <SectionCard gridStyle={responsiveGridStyle} badge="17" title="Communication" subtitle="How we can reach you.">
                <Field>
                  <FieldLabel>Preferred Contact Method</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Email"
                      checked={form.preferred_contact === 'Email'}
                      onChange={() => setForm((prev) => ({ ...prev, preferred_contact: 'Email' }))}
                    />
                    <CheckboxOption
                      label="Phone call"
                      checked={form.preferred_contact === 'Phone call'}
                      onChange={() => setForm((prev) => ({ ...prev, preferred_contact: 'Phone call' }))}
                    />
                    <CheckboxOption
                      label="WhatsApp"
                      checked={form.preferred_contact === 'WhatsApp'}
                      onChange={() => setForm((prev) => ({ ...prev, preferred_contact: 'WhatsApp' }))}
                    />
                  </div>
                </Field>

                <Field full>
                  <FieldLabel>Availability</FieldLabel>
                  <div style={s.checkboxGroup}>
                    <CheckboxOption
                      label="Weekdays"
                      checked={form.availability === 'Weekdays'}
                      onChange={() => setForm((prev) => ({ ...prev, availability: 'Weekdays' }))}
                    />
                    <CheckboxOption
                      label="Weekends"
                      checked={form.availability === 'Weekends'}
                      onChange={() => setForm((prev) => ({ ...prev, availability: 'Weekends' }))}
                    />
                  </div>
                </Field>
              </SectionCard>

              <SectionCard gridStyle={responsiveGridStyle} badge="18" title="Declaration" subtitle="Confirm your details and consent.">
                <Field full>
                  <div style={s.checkboxGroup}>
                    <label style={s.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={form.confirm_the_information_is_accurate}
                        onChange={handleBooleanChange('confirm_the_information_is_accurate')}
                        style={s.checkboxInput}
                      />
                      <span>I confirm the information provided is accurate.</span>
                    </label>
                    <label style={s.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={form.i_agree_to_terms}
                        onChange={handleBooleanChange('i_agree_to_terms')}
                        style={s.checkboxInput}
                      />
                      <span>I agree to FinVerra's terms and conditions.</span>
                    </label>
                    <label style={s.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={form.i_consent_to_be_matched_with_entrepreneurs}
                        onChange={handleBooleanChange('i_consent_to_be_matched_with_entrepreneurs')}
                        style={s.checkboxInput}
                      />
                      <span>I consent to be matched with entrepreneurs on the platform.</span>
                    </label>
                  </div>
                </Field>
              </SectionCard>
            </>
          )}

          {/* ── Navigation ──────────────────────────────────────────────── */}
          <div style={s.navRow}>
            <button
              type="button"
              style={{ ...s.btnSecondary, ...responsiveButtonBase, ...(isFirstStep ? s.btnDisabled : {}) }}
              onClick={() => setStepIndex((p) => Math.max(p - 1, 0))}
              disabled={isFirstStep}
            >
              ← Previous
            </button>
            {!isLastStep ? (
              <button
                type="button"
                style={{ ...s.btnPrimary, ...responsiveButtonBase }}
                onClick={handleNextStep}
              >
                Next Step →
              </button>
            ) : (
              <>
                <button
                  style={{ ...s.btnPrimary, ...s.btnSubmit, ...responsiveButtonBase }}
                  type="submit"
                  disabled={isSaving || isBusy || !userId}
                >
                  {isSaving ? 'Saving…' : hasExistingApplication === false ? 'Create Application' : 'Update Application'}
                </button>
                {hasExistingApplication ? (
                  <button
                    type="button"
                    style={{ ...s.btnDanger, ...responsiveButtonBase }}
                    onClick={() => void handleDelete()}
                    disabled={isBusy || isDeleting}
                  >
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </form>
      </div>
    </InvestorLayout>
  )
}

const injectStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  input::placeholder, textarea::placeholder { color: #94A3B8; font-style: italic; }
  select option { color: #0F172A; }
`

const s: Record<string, CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    maxWidth: 1000,
    margin: '0 auto',
    paddingLeft: 20,
    paddingRight: 20,
  },
  heroSection: {
    marginBottom: 8,
  },
  pageTitle: {
    margin: 0,
    fontSize: 32,
    fontWeight: 800,
    color: '#0f1e35',
  },
  pageSubtitle: {
    marginTop: 12,
    color: '#4f5f78',
    fontSize: 15,
  },
  infoCard: {
    borderRadius: 12,
    padding: '12px 14px',
    border: '1px solid rgba(15,45,92,0.1)',
    background: '#f3f8ff',
    color: '#0f2d5c',
    fontWeight: 600,
  },
  errorCard: {
    border: '1px solid rgba(190, 24, 93, 0.28)',
    background: '#fff1f2',
    color: '#9f1239',
  },
  successCard: {
    border: '1px solid rgba(21, 128, 61, 0.26)',
    background: '#ecfdf3',
    color: '#166534',
  },

  // Error Modal
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
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  errorModalTitle: {
    margin: '0 0 10px',
    color: '#0F172A',
    fontSize: 20,
    fontWeight: 700,
  },
  errorModalText: {
    margin: 0,
    color: '#475569',
    fontSize: 14,
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
    textAlign: 'left',
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

  formShell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
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
    gridTemplateColumns: 'repeat(6, 1fr)',
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
  },
  stepIconActive: { color: '#60A5FA' },
  stepIconDone: { color: '#4ADE80' },
  stepLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
  },

  // Section Cards
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
    flexShrink: 0,
    marginTop: 2,
  },
  sectionTitle: {
    margin: '0 0 3px',
    fontSize: 16,
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionSub: {
    margin: 0,
    fontSize: 13,
    color: '#64748B',
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
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 10,
    fontSize: 14,
    color: '#0F172A',
    background: '#FAFAFA',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  inputMuted: {
    background: '#F1F5F9',
    color: '#94A3B8',
    cursor: 'not-allowed',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 10,
    fontSize: 14,
    color: '#0F172A',
    background: '#FAFAFA',
    outline: 'none',
    resize: 'vertical',
    minHeight: 90,
    lineHeight: 1.6,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
  },

  // Checkboxes
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  checkboxOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: '#1f2e47',
  },
  checkboxInput: {
    width: 18,
    height: 18,
    cursor: 'pointer',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    cursor: 'pointer',
    fontSize: 13,
    color: '#374151',
    lineHeight: 1.5,
  },

  // Files
  uploadRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    border: '1px solid #d9e3f1',
    borderRadius: 10,
    padding: 12,
    background: '#f8fbff',
  },
  uploadLabel: {
    fontWeight: 700,
    color: '#16233a',
    fontSize: 13,
  },
  fileInput: {
    fontSize: 13,
  },
  fileHint: {
    color: '#4b5f80',
  },

  // Navigation
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    gap: 10,
  },
  btnSecondary: {
    padding: '11px 20px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 10,
    background: '#FFFFFF',
    color: '#374151',
    fontSize: 14,
    fontWeight: 600,
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
    cursor: 'pointer',
    letterSpacing: 0.2,
    transition: 'all 0.15s',
  },
  btnSubmit: {
    background: 'linear-gradient(135deg, #1D4ED8, #0EA5E9)',
    boxShadow: '0 4px 14px rgba(29,78,216,0.35)',
  },
  btnDanger: {
    padding: '11px 20px',
    border: 'none',
    borderRadius: 10,
    background: '#b91c1c',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
}