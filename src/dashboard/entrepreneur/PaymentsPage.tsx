import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import EntrepreneurShell from './EntrepreneurShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

interface ServiceOption {
  label: string
  amount: number
  category: string
}

type ChargeRequestPayload = {
  email: string
  cname: string
  amount: number
  cnumber: string
  msisdn: string
  currency: string
  pmethod: string
  chargesIncluded: string
  url: string
}

type XentripaySuccessResponse = {
  reply?: string
  refid?: string
}

type XentripayStatusResponse = {
  customerRef?: string | null
  rid?: string
  status?: string
  updatedAt?: string
}

type XentripayStatusResult = {
  ok: boolean
  httpStatus: number
  payload: XentripayStatusResponse | null
  errorText: string
}

const XENTRIPAY_URL = 'https://xentripay.com/api/collections/initiate'
const XENTRIPAY_STATUS_URL = 'https://xentripay.com/api/collections/status'
const XENTRIPAY_KEY = '31bd6b8cbb59466eaa03a20735431109'
const XENTRIPAY_ADDHOOK_URL = buildApiUrl('/payments/addhook')
const FIXED_CONTACT_NUMBER = '0788763046'
const PAYMENT_STATUS_TIMEOUT_SECONDS = 240
const PAYMENT_STATUS_POLL_INTERVAL_MS = 1000

function buildMsisdn(input: string): string {
  const s = (input || '').trim()
  if (!s) return ''
  const digits = s.replace(/\D+/g, '')
  if (!digits) return ''
  if (digits.startsWith('250')) return digits
  if (digits.startsWith('0')) return '250' + digits.slice(1)
  return '250' + digits
}

function keepDigits(input: string): string {
  return input.replace(/\D+/g, '')
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function fetchPaymentStatus(referenceId: string): Promise<XentripayStatusResult> {
  if (!referenceId) {
    return { ok: false, httpStatus: 0, payload: null, errorText: '' }
  }
  const response = await fetch(`${XENTRIPAY_STATUS_URL}/${encodeURIComponent(referenceId)}`, {
    headers: {
      'X-XENTRIPAY-KEY': XENTRIPAY_KEY,
      Accept: 'application/json',
    },
  })
  const rawBody = await response.text().catch(() => '')
  let payload: unknown = null
  try {
    payload = rawBody ? JSON.parse(rawBody) : null
  } catch {
    payload = null
  }
  return {
    ok: response.ok,
    httpStatus: response.status,
    payload: payload && typeof payload === 'object' ? (payload as XentripayStatusResponse) : null,
    errorText: response.ok ? '' : rawBody,
  }
}

export default function PaymentsPage() {
  const session = getAuthSession()
  const [loadingName, setLoadingName] = useState(true)
  const [displayName, setDisplayName] = useState('Entrepreneur')
  const [entrepreneurId, setEntrepreneurId] = useState<number | string | null>(null)
  const [usersId, setUsersId] = useState<number | string | null>(null)
  const [msisdn, setMsisdn] = useState('')
  const [amount, setAmount] = useState('100')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(0)
  const [services, setServices] = useState<ServiceOption[]>([])
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null)
  const [loadingServices, setLoadingServices] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('All')

  function handleCancelPayment() {
    if (submitting || checkingPayment) return
    setShowPaymentForm(false)
    setError(null)
    setSuccess(null)
  }

  useEffect(() => {
    async function loadServices() {
      try {
        setLoadingServices(true)
        const token = (getAuthSession()?.payload as { token?: string } | undefined)?.token ?? ''
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` }

        const endpoints = [
          ['/admin/e_application_fees', 'e_application_fees'],
          ['/admin/e_business_management_fees', 'e_business_management_fees'],
          ['/admin/e_business_mentorship', 'e_business_mentorship'],
          ['/admin/e_internships', 'e_internships'],
          ['/admin/e_partner_business_management', 'e_partner_business_management'],
          ['/admin/e_posting_fees', 'e_posting_fees'],
          ['/admin/e_special_occusion', 'e_special_occusion'],
        ] as const

        const fetches = endpoints.map(([path]) => fetch(buildApiUrl(path), { headers }))
        const responses = await Promise.all(fetches)
        const bodies = await Promise.all(responses.map((r) => r.json()))

        const allServices: ServiceOption[] = []

        const appFees = bodies[0]?.e_application_fees ?? []
        appFees.forEach((fee: { Investment?: string; fees?: string }) => {
          if (fee.Investment && fee.fees) {
            allServices.push({
              label: `Application Fee - ${fee.Investment}`,
              amount: parseInt(fee.fees, 10) || 100,
              category: 'Application Fees',
            })
          }
        })

        const bizmgmt = bodies[1]?.e_business_management_fees ?? []
        bizmgmt.forEach((item: { duration?: string; amount?: string }) => {
          if (item.duration && item.amount) {
            allServices.push({
              label: `Business Management - ${item.duration}`,
              amount: parseInt(item.amount, 10) || 100,
              category: 'Business Management',
            })
          }
        })

        const mentorship = bodies[2]?.e_business_mentorship ?? []
        mentorship.forEach((item: { duration?: string; amount?: string }) => {
          if (item.duration && item.amount) {
            allServices.push({
              label: `Business Mentorship - ${item.duration}`,
              amount: parseInt(item.amount, 10) || 100,
              category: 'Business Mentorship',
            })
          }
        })

        const internships = bodies[3]?.e_internships ?? []
        internships.forEach((item: { details?: string; amount?: string }) => {
          if (item.details && item.amount) {
            allServices.push({
              label: `Internship - ${item.details}`,
              amount: parseInt(item.amount, 10) || 100,
              category: 'Internships',
            })
          }
        })

        const partnerBiz = bodies[4]?.e_partner_business_management ?? []
        partnerBiz.forEach((item: { duration?: string; amount?: string }) => {
          if (item.duration && item.amount) {
            allServices.push({
              label: `Partner Business Management - ${item.duration}`,
              amount: parseInt(item.amount, 10) || 100,
              category: 'Partner Business Management',
            })
          }
        })

        const posting = bodies[5]?.e_posting_fees ?? []
        posting.forEach((item: { duration?: string; amount?: string }) => {
          if (item.duration && item.amount) {
            allServices.push({
              label: `Platform Posting - ${item.duration}`,
              amount: parseInt(item.amount, 10) || 100,
              category: 'Platform Posting',
            })
          }
        })

        const special = bodies[6]?.e_special_occusion ?? []
        special.forEach((item: { details?: string; amount?: string }) => {
          if (item.details && item.amount) {
            allServices.push({
              label: `Special Occasion - ${item.details}`,
              amount: parseInt(item.amount, 10) || 100,
              category: 'Special Occasion',
            })
          }
        })

        setServices(allServices)
      } catch (err: any) {
        console.error('Failed to load services:', err?.message ?? 'Unknown error')
      } finally {
        setLoadingServices(false)
      }
    }

    void loadServices()
  }, [])

  function handleSelectService(service: ServiceOption) {
    setSelectedService(service)
    setAmount(service.amount.toString())
  }

  useEffect(() => {
    let mounted = true

    async function loadName() {
      try {
        if (!session?.email) return
        const token = resolveToken(session?.payload)

        const nameResponse = await fetch(
          buildApiUrl(`/entrepreneur/name-by-email/${encodeURIComponent(session.email)}`),
          { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
        )

        const namePayload = await nameResponse.json().catch(() => null)
        if (nameResponse.ok && namePayload && typeof namePayload === 'object') {
          const entrepreneurName = (
            namePayload as {
              entrepreneur?: {
                id?: unknown
                first_name?: unknown
                last_name?: unknown
              }
            }
          ).entrepreneur

          const firstName = typeof entrepreneurName?.first_name === 'string' ? entrepreneurName.first_name.trim() : ''
          const lastName = typeof entrepreneurName?.last_name === 'string' ? entrepreneurName.last_name.trim() : ''
          const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
          const entId = Number(entrepreneurName?.id)

          if (mounted) {
            setDisplayName(fullName || 'Entrepreneur')
            if (Number.isFinite(entId)) {
              setEntrepreneurId(entId)
            }
          }
        }

        const userResponse = await fetch(
          buildApiUrl(`/entrepreneurs/${encodeURIComponent(session.email)}`),
          { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
        )

        const userPayload = await userResponse.json().catch(() => null)
        if (!userResponse.ok || !userPayload || typeof userPayload !== 'object') return

        const resolvedUsersId = Number((userPayload as { users_id?: unknown })?.users_id)

        if (!mounted) return
        if (Number.isFinite(resolvedUsersId)) {
          setUsersId(resolvedUsersId)
        }
      } finally {
        if (mounted) setLoadingName(false)
      }
    }

    void loadName()
    return () => { mounted = false }
  }, [session])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)
    setSuccess(null)

    if (!msisdn.trim()) {
      setError('Please enter MSISDN.')
      return
    }

    const payload: ChargeRequestPayload = {
      email: session?.email ?? '',
      cname: displayName,
      amount: parseInt(amount, 10) || 100,
      cnumber: FIXED_CONTACT_NUMBER,
      msisdn: buildMsisdn(msisdn),
      currency: 'RWF',
      pmethod: 'momo',
      chargesIncluded: 'true',
      url: XENTRIPAY_ADDHOOK_URL,
    }

    if (!payload.email) {
      setError('No user email found in session. Please log in again.')
      return
    }

    setSubmitting(true)

    try {
      // Require the user to select a service card before initiating payment
      if (!selectedService) {
        setError('Please select a service to pay for.')
        setSubmitting(false)
        return
      }

      const response = await fetch(XENTRIPAY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XENTRIPAY-KEY': XENTRIPAY_KEY,
        },
        body: JSON.stringify(payload),
      })

      const body = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          (body &&
            typeof body === 'object' &&
            'message' in body &&
            typeof (body as { message?: unknown }).message === 'string'
            ? (body as { message: string }).message
            : null) ?? 'Payment initiation failed.'
        throw new Error(message)
      }

      const gateway = (body && typeof body === 'object' ? body : null) as XentripaySuccessResponse | null
      setSuccess(gateway?.reply ?? 'Payment initiated successfully! Waiting for payment confirmation...')

      const referenceId = gateway?.refid?.trim() ?? ''
      if (referenceId) {
        const token = resolveToken(session?.payload)
        setCheckingPayment(true)
        setCountdownSeconds(PAYMENT_STATUS_TIMEOUT_SECONDS)
        let pollingTimedOut = false
        let timeoutHandled = false

        const countdownTimer = window.setInterval(() => {
          setCountdownSeconds((current) => {
            const next = current > 0 ? current - 1 : 0
            if (next === 0 && !timeoutHandled) {
              pollingTimedOut = true
              timeoutHandled = true
              setCheckingPayment(false)
              setSubmitting(false)
              setError('Payment confirmation timed out. Please tap Pay now again to retry.')
            }
            return next
          })
        }, 1000)

        try {
          const attempts = Math.max(
            1,
            Math.ceil(PAYMENT_STATUS_TIMEOUT_SECONDS / (PAYMENT_STATUS_POLL_INTERVAL_MS / 1000))
          )

          for (let attempt = 0; attempt < attempts; attempt += 1) {
            if (pollingTimedOut) break

            const statusResult = await fetchPaymentStatus(referenceId)
            if (pollingTimedOut) break

            const statusPayload = statusResult.payload
            const status =
              typeof statusPayload?.status === 'string'
                ? statusPayload.status.trim().toUpperCase()
                : ''
            console.log('Xentripay status response:', statusResult)

            if (!statusResult.ok) {
              setError(
                `Status request failed (${statusResult.httpStatus}). ${statusResult.errorText || 'No response body.'}`
              )
              break
            }

            if (status === 'SUCCESS') {
              if (!usersId) {
                setError('Payment confirmed, but users_id was not found.')
                break
              }

              if (!entrepreneurId) {
                setError('Payment confirmed, but entrepreneur id was not found.')
                break
              }

              // Ensure a service was selected (we already check before initiation, but
              // double-check here to avoid recording ambiguous payments).
              if (!selectedService) {
                setError('Payment confirmed, but no service was selected.')
                break
              }
              const approveResp = await fetch(
                buildApiUrl(`/entrepreneur/approve/${encodeURIComponent(String(entrepreneurId))}`),

                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({}),
                }
              )

              console.log('Approve response status:', approveResp.status)

              if (!approveResp.ok) {
                const approveBody = await approveResp.json().catch(() => null)
                const msg =
                  approveBody &&
                  typeof approveBody === 'object' &&
                  'message' in approveBody
                    ? (approveBody as { message?: unknown }).message
                    : 'Approval failed.'
                setError(String(msg ?? 'Approval failed.'))
                break
              }

              const paymentResp = await fetch(buildApiUrl('/admin/entrepreneur_payments'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  users_id: usersId,
                  // Store the selected service label so the DB value matches the email text
                  payment_reason: String(selectedService.label),
                  amount: selectedService.amount,
                }),
              })

              if (!paymentResp.ok) {
                const paymentBody = await paymentResp.json().catch(() => null)
                const msg =
                  paymentBody &&
                  typeof paymentBody === 'object' &&
                  'message' in paymentBody
                    ? (paymentBody as { message?: unknown }).message
                    : 'Entrepreneur payment record failed.'
                setError(String(msg ?? 'Entrepreneur payment record failed.'))
                break
              }

              setSuccess('Payment confirmed. The payment record was saved successfully.')
              break
            }

            if (status === 'FAILED') {
              setError('Payment failed. We did not send the approval email.')
              break
            }

            if (attempt < attempts - 1) {
              await wait(PAYMENT_STATUS_POLL_INTERVAL_MS)
            }
          }
        } catch (err: any) {
          setError(err?.message ?? 'Unable to verify payment status.')
        } finally {
          window.clearInterval(countdownTimer)
          setCheckingPayment(false)
          setCountdownSeconds(0)
        }
      }
    } catch (err: any) {
      setError(err?.message ?? 'Payment initiation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category)))]
  const filteredServices =
    activeCategory === 'All' ? services : services.filter((s) => s.category === activeCategory)

  return (
    <EntrepreneurShell title="Payments" subtitle="Complete Payment" showHero={false}>
      <section style={styles.pageShell}>
        <style>{`@keyframes finverraSpin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.modalCard}>
          <div style={styles.modalHeader}>
            <div>
              <p style={styles.kicker}>Payments</p>
              <h2 style={styles.title}>Complete Payment</h2>
              <p style={styles.description}>
                Only Phone number is required. User details are auto-filled from your account.
              </p>
            </div>
          </div>

          <div style={styles.howItWorksSection}>
            <div style={styles.stepsGrid}>
              <StepCard step="STEP 1" text='Click "Unlock Access" button' />
              <StepCard step="STEP 2" text="Enter your MoMo number (07XXXXXXXX)" />
              <StepCard step="STEP 3" text="Confirm payment with your MoMo PIN" />
              <StepCard step="STEP 4" text="Instant access within 60 seconds" />
            </div>

            <div style={styles.howItWorksFooter}>
              <p style={styles.footerText}>Unlock Access when you're ready to continue.</p>
            </div>

            <div style={styles.actionRow}>
              <button
                type="button"
                style={styles.unlockButton}
                onClick={() => setShowPaymentForm(true)}
              >
                Unlock Access
              </button>
            </div>
          </div>
        </div>

        {showPaymentForm ? (
          <div style={styles.overlay}>
            <div style={styles.popupCard}>
              <div style={styles.popupHeader}>
                <div>
                  <p style={styles.popupEyebrow}>Complete Payment</p>
                  <h3 style={styles.popupTitle}>Complete Payment</h3>
                </div>
                <button
                  type="button"
                  style={styles.closeButton}
                  onClick={() => setShowPaymentForm(false)}
                  aria-label="Close payment form"
                >
                  ×
                </button>
              </div>

              <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.formContainer}>
                  <Field label="Email" value={session?.email ?? ''} readOnly />
                  <Field
                    label="Names"
                    value={loadingName ? 'Loading...' : displayName}
                    readOnly
                  />

                  {/* ── Service Selection ── */}
                  <div style={styles.serviceSelectionContainer}>
                    <label style={styles.label}>
                      <span style={styles.labelText}>Select Service to Pay For</span>
                    </label>

                    {loadingServices ? (
                      <p style={styles.loadingText}>Loading available services...</p>
                    ) : services.length === 0 ? (
                      <p style={styles.noServicesText}>No services available at this time.</p>
                    ) : (
                      <>
                        {/* Category Tabs */}
                        <div style={styles.tabRow}>
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              style={{
                                ...styles.tabBtn,
                                ...(activeCategory === cat ? styles.tabBtnActive : {}),
                              }}
                              onClick={() => setActiveCategory(cat)}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Card Grid */}
                        <div style={styles.servicesGrid}>
                          {filteredServices.map((service, index) => {
                            const isSelected =
                              selectedService?.label === service.label &&
                              selectedService?.amount === service.amount

                            return (
                              <button
                                key={`${service.label}-${service.amount}-${index}`}
                                type="button"
                                style={{
                                  ...styles.serviceCard,
                                  ...(isSelected ? styles.serviceCardSelected : {}),
                                }}
                                onClick={() => handleSelectService(service)}
                              >
                                <div style={styles.serviceCardContent}>
                                  <p style={styles.serviceLabel}>{service.label}</p>
                                  <p style={styles.serviceAmount}>
                                    {service.amount.toLocaleString()} RWF
                                  </p>
                                  <p style={styles.serviceCategory}>{service.category}</p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {selectedService && (
                    <div style={styles.selectedServiceBox}>
                      <p style={styles.selectedServiceText}>
                        <strong>Selected:</strong> {selectedService.label} —{' '}
                        {selectedService.amount.toLocaleString()} RWF
                      </p>
                    </div>
                  )}

                  

                  

                  <label style={styles.label}>
                    <span style={styles.labelText}>Amount (RWF)</span>
                    <input
                      style={styles.input}
                      type="number"
                      placeholder="e.g. 100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      readOnly
                    />
                  </label>

                  <label style={styles.label}>
                    <span style={styles.labelText}>Phone Number</span>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder="e.g. 0781681561"
                      value={msisdn}
                      onChange={(e) => setMsisdn(keepDigits(e.target.value))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="tel"
                      readOnly={submitting || checkingPayment}
                      required
                    />
                  </label>
                </div>

                {error ? <p style={styles.error}>{error}</p> : null}
                {success ? <p style={styles.success}>{success}</p> : null}

                {checkingPayment ? (
                  <div style={styles.waitBox}>
                    <div style={styles.spinner} />
                    <div>
                      <p style={styles.waitText}>
                        Waiting for payment confirmation... {countdownSeconds}s
                      </p>
                      <p style={styles.waitHint}>
                        If you do not see the OTP, check your pending transactions on *182*7*1# to
                        confirm.
                      </p>
                    </div>
                  </div>
                ) : null}

                <div style={styles.actionRow}>
                  <button type="submit" style={styles.button} disabled={submitting}>
                    {submitting ? 'Processing...' : 'Pay now'}
                  </button>
                  <button
                    type="button"
                    style={styles.cancelButton}
                    onClick={handleCancelPayment}
                    disabled={submitting || checkingPayment}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </section>
    </EntrepreneurShell>
  )
}

function Field({
  label,
  value,
  readOnly = false,
}: {
  label: string
  value: string
  readOnly?: boolean
}) {
  return (
    <label style={styles.label}>
      <span style={styles.labelText}>{label}</span>
      <input style={styles.input} type="text" value={value} readOnly={readOnly} />
    </label>
  )
}

function StepCard({ step, text }: { step: string; text: string }) {
  return (
    <div style={styles.stepCard}>
      <div>
        <p style={styles.stepLabel}>{step}</p>
        <p style={styles.stepText}>{text}</p>
      </div>
    </div>
  )
}

function resolveToken(payload: unknown): string {
  if (typeof payload === 'string') return payload
  if (!payload || typeof payload !== 'object') return ''
  const p = payload as Record<string, unknown>
  const direct = p.token ?? p.accessToken ?? p.access_token ?? p.jwt
  if (typeof direct === 'string') return direct
  const nested = p.data
  if (nested && typeof nested === 'object') {
    const d = nested as Record<string, unknown>
    const nestedToken = d.token ?? d.accessToken ?? d.access_token ?? d.jwt
    if (typeof nestedToken === 'string') return nestedToken
  }
  return ''
}

const styles: Record<string, CSSProperties> = {
  pageShell: {
    display: 'flex',
    justifyContent: 'center',
    padding: '12px 24px 16px',
  },
  modalCard: {
    width: 'min(820px, 100%)',
    borderRadius: 28,
    overflow: 'hidden',
    background: '#ffffff',
    boxShadow: '0 28px 80px rgba(15, 45, 92, 0.18)',
    border: '1px solid rgba(15, 30, 53, 0.08)',
  },
  modalHeader: {
    background: 'linear-gradient(180deg, #023341 0%, #023341 100%)',
    padding: '18px 28px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    padding: '30px 32px 34px',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 560,
    margin: '0 auto',
  },
  howItWorksSection: {
    padding: '16px 24px 8px',
    background: 'linear-gradient(180deg, #fff7fb 0%, #ffffff 100%)',
  },
  stepsGrid: {
    display: 'grid',
    gap: 10,
    marginTop: 4,
  },
  stepCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 14,
    background: '#ffffff',
    border: '1px solid rgba(15, 30, 53, 0.08)',
    boxShadow: '0 6px 16px rgba(15, 45, 92, 0.04)',
  },
  stepLabel: {
    margin: 0,
    color: '#79aeb4',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.8px',
  },
  stepText: {
    margin: '2px 0 0',
    color: '#24364a',
    fontSize: 14,
    lineHeight: 1.4,
  },
  howItWorksFooter: {
    marginTop: 8,
    padding: '10px 12px',
    borderRadius: 12,
    background: '#eef5f7',
    textAlign: 'center',
  },
  footerText: {
    margin: 0,
    color: '#6e8086',
    fontSize: 13,
    lineHeight: 1.4,
  },
  waitBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 560,
    padding: '12px 14px',
    borderRadius: 14,
    background: '#eef5f7',
    border: '1px solid rgba(15, 30, 53, 0.08)',
  },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: '3px solid rgba(2, 51, 65, 0.18)',
    borderTopColor: '#023341',
    animation: 'finverraSpin 1s linear infinite',
    flexShrink: 0,
  },
  waitText: {
    margin: 0,
    color: '#24364a',
    fontSize: 14,
    fontWeight: 600,
  },
  waitHint: {
    margin: '4px 0 0',
    color: '#6e8086',
    fontSize: 13,
    lineHeight: 1.45,
  },
  approvedBox: {
    marginTop: 8,
    padding: '12px 14px',
    borderRadius: 12,
    background: '#e8f7ee',
    border: '1px solid rgba(21, 128, 61, 0.25)',
    textAlign: 'center',
  },
  approvedText: {
    margin: 0,
    color: '#166534',
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.4,
  },
  kicker: {
    margin: 0,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '1.8px',
    textTransform: 'uppercase' as const,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 8,
  },
  title: {
    margin: 0,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 1.15,
  },
  description: {
    margin: '10px 0 0',
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    lineHeight: 1.6,
  },
  label: {
    display: 'grid',
    gap: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    color: '#3e4654',
  },
  labelText: {},
  input: {
    height: 60,
    borderRadius: 16,
    border: '1px solid #d9dee8',
    padding: '0 18px',
    fontSize: 16,
    color: '#18324d',
    background: '#f9fbfd',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
  },
  button: {
    width: 132,
    minWidth: 132,
    height: 56,
    borderRadius: 16,
    border: 'none',
    background: 'linear-gradient(180deg, #023341 0%, #023341 100%)',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.5px',
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    boxShadow: '0 12px 26px rgba(239, 134, 181, 0.35)',
  },
  actionRow: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 4,
  },
  cancelButton: {
    width: 132,
    minWidth: 132,
    height: 56,
    borderRadius: 16,
    border: '1px solid #d9dee8',
    background: '#f9fbfd',
    color: '#24364a',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.5px',
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(15, 30, 53, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 120,
    backdropFilter: 'blur(6px)',
  },
  popupCard: {
    width: 'min(760px, 100%)',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    borderRadius: 28,
    background: '#ffffff',
    boxShadow: '0 28px 80px rgba(15, 45, 92, 0.28)',
    border: '1px solid rgba(15, 30, 53, 0.08)',
  },
  popupHeader: {
    background: 'linear-gradient(180deg, #023341 0%, #023341 100%)',
    padding: '22px 26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    position: 'relative' as const,
    textAlign: 'center' as const,
  },
  popupEyebrow: {
    margin: 0,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '1.6px',
    textTransform: 'uppercase' as const,
    opacity: 0.9,
  },
  popupTitle: {
    margin: '6px 0 0',
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 1.1,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    border: 'none',
    background: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'absolute' as const,
    right: 26,
    top: 22,
  },
  unlockButton: {
    width: 'fit-content',
    minWidth: 260,
    height: 56,
    borderRadius: 16,
    border: 'none',
    background: 'linear-gradient(180deg, #023341 0%, #023341 100%)',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 14px 30px rgba(239, 116, 178, 0.32)',
  },

  // ── Service Selection ──
  serviceSelectionContainer: {
    width: '100%',
    marginBottom: 16,
  },
  tabRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 10,
    marginBottom: 14,
  },
  tabBtn: {
    padding: '6px 14px',
    borderRadius: 999,
    border: '1px solid #d9dee8',
    background: 'transparent',
    fontSize: 13,
    fontWeight: 500,
    color: '#6e8086',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  tabBtnActive: {
    background: '#ffffff',
    borderColor: '#023341',
    color: '#023341',
    fontWeight: 700,
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 10,
  },
  serviceCard: {
    padding: '14px 12px',
    borderRadius: 12,
    border: '1px solid #d9dee8',
    background: '#ffffff',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
  },
  serviceCardSelected: {
    border: '2px solid #000000',
    background: '#eef5f7',
    boxShadow: '0 4px 12px rgba(2, 51, 65, 0.12)',
  },
  serviceCardContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  serviceLabel: {
    margin: 0,
    fontWeight: 600,
    color: '#24364a',
    fontSize: 13,
    lineHeight: 1.3,
  },
  serviceAmount: {
    margin: 0,
    fontWeight: 700,
    color: '#023341',
    fontSize: 14,
  },
  serviceCategory: {
    margin: 0,
    color: '#6e8086',
    fontSize: 11,
    fontWeight: 500,
  },
  selectedServiceBox: {
    padding: '12px 14px',
    borderRadius: 12,
    background: '#e8f7ee',
    border: '1px solid rgba(21, 128, 61, 0.25)',
    marginBottom: 12,
  },
  selectedServiceText: {
    margin: 0,
    color: '#166534',
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  loadingText: {
    margin: 0,
    color: '#6e8086',
    fontSize: 14,
    fontStyle: 'italic' as const,
  },
  noServicesText: {
    margin: 0,
    color: '#d85656',
    fontSize: 14,
    fontStyle: 'italic' as const,
  },
  error: {
    margin: 0,
    color: '#d85656',
    fontSize: 14,
    width: '100%',
    maxWidth: 560,
  },
  success: {
    margin: 0,
    color: '#166534',
    fontSize: 14,
    width: '100%',
    maxWidth: 560,
  },
}