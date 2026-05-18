import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import EntrepreneurShell from './EntrepreneurShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'
// name fetch moved inline to also retrieve entrepreneur id

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
  url?: string
  success?: number
  authkey?: string
  tid?: string
  refid?: string
  retcode?: number
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

const XENTRIPAY_URL = 'https://test.xentripay.com/api/collections/initiate'
const XENTRIPAY_STATUS_URL = 'https://test.xentripay.com/api/collections/status'
const XENTRIPAY_KEY = 'c41b09fbdf3c4bbf8ae70cf87ea4a710'
const XENTRIPAY_ADDHOOK_URL = buildApiUrl('/payments/addhook')
const FIXED_CONTACT_NUMBER = '0788763046'
const PAYMENT_STATUS_TIMEOUT_SECONDS = 240
const PAYMENT_STATUS_POLL_INTERVAL_MS = 1000

function buildMsisdn(input: string): string {
  const s = (input || '').trim()
  if (!s) return ''
  // keep only digits
  const digits = s.replace(/\D+/g, '')
  if (!digits) return ''
  // if user already entered country-prefix '250', don't double-prefix
  if (digits.startsWith('250')) return digits
  // allow numbers starting with '0' (strip it) and prefix with '250'
  if (digits.startsWith('0')) return '250' + digits.slice(1)
  // fallback: prefix with '250'
  return '250' + digits
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function fetchPaymentStatus(referenceId: string): Promise<XentripayStatusResult> {
  if (!referenceId) {
    return {
      ok: false,
      httpStatus: 0,
      payload: null,
      errorText: '',
    }
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
  const [isApproved, setIsApproved] = useState(false)
  const [msisdn, setMsisdn] = useState('')
  const [amount, setAmount] = useState('100')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [gatewayResponse, setGatewayResponse] = useState<XentripaySuccessResponse | null>(null)
  const [paymentRefId, setPaymentRefId] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [paymentStatusUpdatedAt, setPaymentStatusUpdatedAt] = useState('')
  const [paymentStatusHttpStatus, setPaymentStatusHttpStatus] = useState<number | null>(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(0)

  useEffect(() => {
    let mounted = true

    async function loadName() {
      try {
        if (!session?.email) return
        const token = resolveToken(session?.payload)

        const response = await fetch(buildApiUrl(`/entrepreneur/name-by-email/${encodeURIComponent(session.email)}`), {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload || typeof payload !== 'object') {
          return
        }

        const entrepreneur = (payload as { entrepreneur?: { id?: unknown; approved?: unknown; first_name?: unknown; last_name?: unknown } }).entrepreneur
        const firstName = typeof entrepreneur?.first_name === 'string' ? entrepreneur.first_name.trim() : ''
        const lastName = typeof entrepreneur?.last_name === 'string' ? entrepreneur.last_name.trim() : ''
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
        const approved = typeof entrepreneur?.approved === 'string' && entrepreneur.approved.trim().toLowerCase() === 'yes'

        if (!mounted) return
        setDisplayName(fullName || 'Entrepreneur')
        setIsApproved(approved)
        if (approved) {
          setShowPaymentForm(false)
        }
        if (entrepreneur && (typeof entrepreneur.id === 'number' || typeof entrepreneur.id === 'string')) {
          setEntrepreneurId(entrepreneur.id as number | string)
        }
      } finally {
        if (mounted) setLoadingName(false)
      }
    }

    void loadName()

    return () => {
      mounted = false
    }
  }, [session])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isApproved) {
      setError('You have already been approved.')
      setSuccess('You have already been approved. Payment is not required.')
      return
    }

    setError(null)
    setSuccess(null)
    setGatewayResponse(null)
    setPaymentRefId('')
    setPaymentStatus('')
    setPaymentStatusUpdatedAt('')
    setPaymentStatusHttpStatus(null)

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
          (body && typeof body === 'object' && 'message' in body && typeof (body as { message?: unknown }).message === 'string'
            ? (body as { message: string }).message
            : null) ?? 'Payment initiation failed.'
        throw new Error(message)
      }

      const gateway = (body && typeof body === 'object' ? body : null) as XentripaySuccessResponse | null
      setGatewayResponse(gateway)
      setSuccess(gateway?.reply ?? 'Payment initiated successfully! Waiting for payment confirmation...')

      const referenceId = gateway?.refid?.trim() ?? ''
      if (referenceId) {
        setPaymentRefId(referenceId)
        setPaymentStatus('PENDING')
        setPaymentStatusUpdatedAt('')
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
          const attempts = Math.max(1, Math.ceil(PAYMENT_STATUS_TIMEOUT_SECONDS / (PAYMENT_STATUS_POLL_INTERVAL_MS / 1000)))

          for (let attempt = 0; attempt < attempts; attempt += 1) {
            if (pollingTimedOut) {
              break
            }

            const statusResult = await fetchPaymentStatus(referenceId)
            if (pollingTimedOut) {
              break
            }

            const statusPayload = statusResult.payload
            const status = typeof statusPayload?.status === 'string' ? statusPayload.status.trim().toUpperCase() : ''
            setPaymentStatusHttpStatus(statusResult.httpStatus)
            setPaymentStatus(status || 'PENDING')
            setPaymentStatusUpdatedAt(statusPayload?.updatedAt ?? '')
            console.log('Xentripay status response:', statusResult)

            if (!statusResult.ok) {
              setError(`Status request failed (${statusResult.httpStatus}). ${statusResult.errorText || 'No response body.'}`)
              break
            }

            if (status === 'SUCCESS') {
              if (!entrepreneurId) {
                setError('Payment confirmed, but entrepreneur id was not found.')
                break
              }

              const approveResp = await fetch(buildApiUrl(`/entrepreneur/approve/${encodeURIComponent(String(entrepreneurId))}`), {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({}),
              })

              console.log('Approve response status:', approveResp.status)

              if (!approveResp.ok) {
                const approveBody = await approveResp.json().catch(() => null)
                const msg = approveBody && typeof approveBody === 'object' && 'message' in approveBody
                  ? (approveBody as { message?: unknown }).message
                  : 'Approval failed.'
                setError(String(msg ?? 'Approval failed.'))
                break
              }

              setSuccess('Payment confirmed. We sent the approval email successfully.')
              break
            }

            if (status === 'FAILED') {
              setError('Payment failed. We did not send the approval email.')
              break
            }

            if (!status) {
              setPaymentStatus('PENDING')
            }

            if (attempt < attempts - 1) {
              await wait(PAYMENT_STATUS_POLL_INTERVAL_MS)
            }
          }

          if (pollingTimedOut) {
            setPaymentStatus('PENDING')
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

  return (
    <EntrepreneurShell title="Payments" subtitle="Complete Payment" showHero={false}>
      <section style={styles.pageShell}>
        <style>{`@keyframes finverraSpin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.modalCard}>
          <div style={styles.modalHeader}>
            <div>
              <p style={styles.kicker}>Payments</p>
              <h2 style={styles.title}>Complete Payment</h2>
              <p style={styles.description}>Only Phone number is required. User details are auto-filled from your account.</p>
            </div>
          </div>

          <div style={styles.howItWorksSection}>
            
            <div style={styles.stepsGrid}>
              <StepCard step="STEP 1"  text='Click " Unlock  Access" button' />
              <StepCard step="STEP 2"  text='Enter your MoMo number (07XXXXXXXX)' />
              <StepCard step="STEP 3"  text='Confirm payment with your MoMo PIN' />
              <StepCard step="STEP 4"  text="Instant access within 60 seconds" />
            </div>

            <div style={styles.howItWorksFooter}>
              <p style={styles.footerText}> Unlock  Access when you're ready to continue.</p>
            </div>

            {isApproved ? (
              <div style={styles.approvedBox}>
                <p style={styles.approvedText}>You have already been approved. Payment form is no longer required.</p>
              </div>
            ) : (
              <div style={styles.actionRow}>
                <button type="button" style={styles.unlockButton} onClick={() => setShowPaymentForm(true)}>
                   Unlock  Access
                </button>
              </div>
            )}
          </div>
        </div>

        {showPaymentForm && !isApproved ? (
          <div style={styles.overlay}>
            <div style={styles.popupCard}>
              <div style={styles.popupHeader}>
                <div>
                  <p style={styles.popupEyebrow}>Complete Payment</p>
                  <h3 style={styles.popupTitle}>Complete Payment</h3>
                </div>
                <button type="button" style={styles.closeButton} onClick={() => setShowPaymentForm(false)} aria-label="Close payment form">
                  ×
                </button>
              </div>

              <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.formContainer}>
                  <Field label="Email" value={session?.email ?? ''} readOnly />
                  <Field label=" Names" value={loadingName ? 'Loading...' : displayName} readOnly />
                  {/* Entrepreneur ID intentionally hidden */}

                  <label style={styles.label}>
                    <span style={styles.labelText}>Amount (RWF)</span>
                    <input
                      style={styles.input}
                      type="number"
                      placeholder="e.g. 100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required readOnly
                    />
                  </label>
                  <label style={styles.label}>
                    <span style={styles.labelText}>Phone Number</span>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder="e.g. 0781681561"
                      value={msisdn}
                      onChange={(e) => setMsisdn(e.target.value)}
                      required
                    />
                  </label>
                </div>

                {error ? <p style={styles.error}>{error}</p> : null}
                {success ? <p style={styles.success}>{success}</p> : null}
                {checkingPayment ? (
                  <div style={styles.waitBox}>
                    <div style={styles.spinner} />
                    <p style={styles.waitText}>Waiting for payment confirmation... {countdownSeconds}s</p>
                  </div>
                ) : null}
                {/* Payment status and gateway response hidden for security/privacy */}

                <div style={styles.actionRow}>
                  <button type="submit" style={styles.button} disabled={submitting}>
                    {submitting ? 'Processing...' : 'Pay now'}
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

function Field({ label, value, readOnly = false }: { label: string; value: string; readOnly?: boolean }) {
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
    background: 'linear-gradient(180deg,  #023341 0%,  #023341 100%)',
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
  headerBlock: {
    textAlign: 'center',
    marginBottom: 24,
  },
  howItWorksSection: {
    padding: '16px 24px 8px',
    background: 'linear-gradient(180deg, #fff7fb 0%, #ffffff 100%)',
  },
  howItWorksIntro: {
    display: 'grid',
    gap: 14,
    marginBottom: 20,
  },
  sectionEyebrow: {
    margin: 0,
    color: '#6798a0',
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  howItWorksLeadCard: {
    borderRadius: 18,
    background: 'linear-gradient(135deg,  #023341 0%,  #023341 100%)',
    padding: '18px 20px',
    color: '#fff',
    
  },
  premiumChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.24)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  howItWorksLeadText: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.6,
    fontWeight: 600,
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
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    background: 'rgba(255, 94, 167, 0.12)',
    flexShrink: 0,
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
  statusBox: {
    display: 'grid',
    gap: 6,
    width: '100%',
    maxWidth: 560,
    padding: '12px 14px',
    borderRadius: 14,
    background: '#f6f9fb',
    border: '1px solid rgba(15, 30, 53, 0.08)',
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
    textTransform: 'uppercase',
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

  // Fields
  fieldsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 20px',
    marginBottom: 20,
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: {
    display: 'grid',
    gap: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    color: '#3e4654',
  },
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

  // Amount row with badge
  amountRow: { display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 20 },
  currencyBadge: {
    background: '#023341',
    color: '#023341',
   fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    padding: '0 12px',
    height: 44,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
  },

  // Submit
  button: {
    width: 'fit-content',
    minWidth: 220,
    height: 56,
    borderRadius: 16,
    border: 'none',
    background: 'linear-gradient(180deg,  #023341 0%,  #023341 100%)',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.5px',
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    marginTop: 10,
    alignSelf: 'center',
    boxShadow: '0 12px 26px rgba(239, 134, 181, 0.35)',
  },
  actionRow: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 4,
  },
  overlay: {
    position: 'fixed',
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
    overflowY: 'auto',
    borderRadius: 28,
    background: '#ffffff',
    boxShadow: '0 28px 80px rgba(15, 45, 92, 0.28)',
    border: '1px solid rgba(15, 30, 53, 0.08)',
  },
  popupHeader: {
    background: 'linear-gradient(180deg,  #023341 0%,  #023341 100%)',
    padding: '22px 26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    position: 'relative',
    textAlign: 'center',
  },
  popupEyebrow: {
    margin: 0,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '1.6px',
    textTransform: 'uppercase',
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
    position: 'absolute',
    right: 26,
    top: 22,
  },
  unlockButton: {
    width: 'fit-content',
    minWidth: 260,
    height: 56,
    borderRadius: 16,
    border: 'none',
    background: 'linear-gradient(180deg,  #023341 0%,  #023341 100%)',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 14px 30px rgba(239, 116, 178, 0.32)',
  },
}
