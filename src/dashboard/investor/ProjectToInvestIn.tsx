import { useState, type ChangeEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import InvestorLayout, { investorCardStyle } from './InvestorLayout'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

// ─── Types ───────────────────────────────────────────────────────────────────
type Project = {
  id: number
  title: string
  description: string
  category?: string | null
  funding_needed?: string | null
  business_stage?: string | null
  location?: string | null
  expected_roi?: string | null
  image?: string
}
type NdaOption = 'yes' | 'no' | 'custom'

type InvestmentApplicationPayload = {
  project_id: number
  amount: string
  shares: string
  equity_percentage: string
  investment_type: string
  timeline: string
  conditions_text: string
  nda: string
  nda_action: string
  documents: string[]
  attachment?: File | null
}

interface InvestmentInterestModalProps {
  project: Project
  onClose: () => void
  onSubmit: (payload: InvestmentApplicationPayload) => Promise<void>
}

function resolveTokenFromPayload(payload: unknown): string {
  if (typeof payload === 'string') return payload
  if (!payload || typeof payload !== 'object') return ''

  const source = payload as Record<string, unknown>
  const direct = source.token ?? source.accessToken ?? source.access_token ?? source.jwt
  if (typeof direct === 'string' && direct.trim()) return direct

  const nestedCandidates = [source.data, source.result, source.auth, source.session, source.user]
  for (const candidate of nestedCandidates) {
    if (!candidate || typeof candidate !== 'object') continue
    const node = candidate as Record<string, unknown>
    const nested = node.token ?? node.accessToken ?? node.access_token ?? node.jwt
    if (typeof nested === 'string' && nested.trim()) return nested
  }

  return ''
}

function displayProjectField(value?: string | null) {
  return value && value.trim() ? value : 'N/A'
}
function PaymentPrompt({ onClose, onGoToPayments }: { onClose: () => void; onGoToPayments: () => void }) {
  return (
    <>
      <style>{`
        .fv-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15, 30, 53, 0.55);
          backdrop-filter: blur(6px);
          animation: fv-fade-in 0.25s ease;
        }
        @keyframes fv-fade-in { from { opacity: 0 } to { opacity: 1 } }

        .fv-payment-modal {
          width: min(480px, 100%);
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 24px 70px rgba(15, 30, 53, 0.24);
          border: 1px solid rgba(15, 30, 53, 0.08);
          padding: 34px 28px 28px;
          text-align: center;
          animation: fv-slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        @keyframes fv-slide-up { from { opacity:0; transform: translate(-50%, calc(-50% + 40px)) scale(0.97) } to { opacity:1; transform: translate(-50%, -50%) } }

        .fv-payment-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 10px 18px;
          background: #fff5f5;
          border: 1px solid #ffd7d7;
          color: #b42318;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.1px;
          text-transform: uppercase;
        }

        .fv-payment-title {
          margin: 18px 0 0;
          font-size: 20px;
          color: #0f1e35;
          font-weight: 700;
        }

        .fv-payment-text {
          margin: 18px auto 0;
          max-width: 520px;
          color: #5f6f83;
          font-size: 14px;
          line-height: 1.6;
        }

        .fv-payment-actions {
          margin-top: 24px;
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .fv-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 42px;
          padding: 0 20px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
          letter-spacing: 0.01em;
        }

        .fv-btn-primary {
          background: linear-gradient(135deg, #023341, #034353);
          color: #ffec00;
          box-shadow: 0 4px 14px rgba(2, 51, 65, 0.3);
        }
        .fv-btn-primary:hover {
          box-shadow: 0 6px 20px rgba(2, 51, 65, 0.4);
          transform: translateY(-1px);
        }
        .fv-btn-primary:active { transform: translateY(0); }
      `}</style>

      <div className="fv-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="fv-payment-modal" onClick={(e) => e.stopPropagation()}>
          <div className="fv-payment-badge">Payment Required</div>
          <h3 className="fv-payment-title">You must pay to access this form</h3>
          <p className="fv-payment-text">
            Please complete your payment to unlock the investment application form.
          </p>
          <div className="fv-payment-actions">
            <button type="button" className="fv-btn fv-btn-primary" onClick={onGoToPayments}>
              Go to Payments
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Amount & Shares' },
  { id: 2, label: 'Investment Type' },
  { id: 3, label: 'Timeline' },
  { id: 4, label: 'Conditions' },
  { id: 5, label: 'Due Diligence' },
  { id: 6, label: 'Final Action' },
]

const INVESTMENT_TYPES = [
  { value: 'Equity',           label: 'Equity',           desc: 'Ownership stake in the company' },
  { value: 'Debt',             label: 'Debt / Loan',      desc: 'Fixed repayment with interest' },
  { value: 'Convertible Note', label: 'Convertible Note', desc: 'Loan that converts to equity later' },
  { value: 'Revenue Sharing',  label: 'Revenue Sharing',  desc: 'Percentage of revenue until target reached' },
  { value: 'SAFE',             label: 'SAFE',             desc: 'Simple agreement for future equity' },
  { value: 'Grant / Donation', label: 'Grant / Donation', desc: 'Non-repayable funding contribution' },
]

const TIMELINE_OPTIONS = [
  { value: 'Immediately',  label: 'Immediately' },
  { value: '1–3 months',  label: '1–3 months' },
  { value: '3–6 months',  label: '3–6 months' },
  { value: '6–12 months', label: '6–12 months' },
  { value: '1–2 years',   label: '1–2 years' },
  { value: 'Flexible',    label: 'Flexible' },
]

const DOCUMENTS = [
  'Business Plan',
  'Financial Statements',
  'Cap Table',
  'Term Sheet',
  'Pitch Deck',
  'Legal Documents',
]

// ─── Modal Component ──────────────────────────────────────────────────────────
function InvestmentInterestModal({ project, onClose, onSubmit }: InvestmentInterestModalProps) {
  const [step, setStep]                       = useState(1)
  const [animating, setAnimating]             = useState(false)
  const [amount, setAmount]                   = useState('')
  const [shares, setShares]                   = useState('')
  const [investmentType, setInvestmentType]   = useState('')
  const [timeline, setTimeline]               = useState('')
  const [conditions, setConditions]           = useState('')
  const [nda, setNda]                         = useState<NdaOption>('no')
  const [ndaCustom, setNdaCustom]             = useState('')
  const [ndaAction, setNdaAction]             = useState<'upload' | 'meeting' | ''>('')
  const [documentsWanted, setDocumentsWanted] = useState<string[]>([])
  const [uploadFile, setUploadFile]           = useState<File | null>(null)
  const [submitting, setSubmitting]           = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  function getValidationError(): { message: string; step: number } | null {
    if (!amount.trim() || Number(amount) <= 0) return { message: 'Amount is required.', step: 1 }
    if (!shares.trim() || Number(shares) <= 0 || Number(shares) > 100) return { message: 'Shares Requested is required and must be between 1 and 100.', step: 1 }
    if (!investmentType) return { message: 'Investment Type is required.', step: 2 }
    if (!timeline) return { message: 'Investment Timeline is required.', step: 3 }
    if (!conditions.trim()) return { message: 'Your Conditions is required.', step: 4 }
    if (!nda) return { message: 'NDA choice is required.', step: 5 }
    if (nda === 'custom' && !ndaCustom.trim()) return { message: 'Custom NDA details are required.', step: 5 }
    if (!ndaAction) return { message: 'NDA Signing Preference is required.', step: 5 }
    if (!documentsWanted.length) return { message: 'At least one document is required.', step: 5 }
    if (ndaAction === 'upload' && !uploadFile) return { message: 'Signed NDA file is required when you choose self-upload.', step: 5 }
    return null
  }

  function getStepValidationError(currentStep: number): string | null {
    if (currentStep === 1) {
      if (!amount.trim() || Number(amount) <= 0) return 'Amount is required.'
      if (!shares.trim() || Number(shares) <= 0 || Number(shares) > 100) return 'Shares Requested is required and must be between 1 and 100.'
      return null
    }

    if (currentStep === 2) {
      return investmentType ? null : 'Investment Type is required.'
    }

    if (currentStep === 3) {
      return timeline ? null : 'Investment Timeline is required.'
    }

    if (currentStep === 4) {
      return conditions.trim() ? null : 'Your Conditions is required.'
    }

    if (currentStep === 5) {
      if (!nda) return 'NDA choice is required.'
      if (nda === 'custom' && !ndaCustom.trim()) return 'Custom NDA details are required.'
      if (!ndaAction) return 'NDA Signing Preference is required.'
      if (!documentsWanted.length) return 'At least one document is required.'
      if (ndaAction === 'upload' && !uploadFile) return 'Signed NDA file is required when you choose self-upload.'
    }

    return null
  }

  function goToStep(next: number) {
    setAnimating(true)
    setTimeout(() => {
      setStep(next)
      setAnimating(false)
    }, 180)
  }

  function toggleDocument(doc: string) {
    setDocumentsWanted(prev =>
      prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
    )
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    setUploadFile(e.target.files?.[0] ?? null)
  }

  async function handleSubmit() {
    const validationError = getValidationError()
    if (validationError) {
      setStep(validationError.step)
      alert(validationError.message)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        project_id: project.id,
        amount,
        shares,
        equity_percentage: shares,
        investment_type: investmentType,
        timeline,
        conditions_text: conditions,
        nda: nda === 'custom' ? ndaCustom : nda,
        nda_action: ndaAction,
        documents: documentsWanted,
        attachment: uploadFile,
      })
      setShowSuccessPopup(true)
    } catch (err: any) {
      alert('Error: ' + (err?.message ?? 'unknown'))
    } finally {
      setSubmitting(false)
    }
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100
  const stepValidationError = getStepValidationError(step)

  return (
    <>
      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        .fv-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(15, 30, 53, 0.55);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: fv-fade-in 0.25s ease;
        }
        @keyframes fv-fade-in { from { opacity: 0 } to { opacity: 1 } }

        .fv-payment-modal {
          width: min(480px, 100%);
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 24px 70px rgba(15, 30, 53, 0.24);
          border: 1px solid rgba(15, 30, 53, 0.08);
          padding: 34px 28px 28px;
          text-align: center;
          animation: fv-slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }

        .fv-payment-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 10px 18px;
          background: #fff5f5;
          border: 1px solid #ffd7d7;
          color: #b42318;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.1px;
          text-transform: uppercase;
        }

        .fv-payment-title {
          margin: 18px 0 0;
          font-size: 20px;
          color: #0f1e35;
          font-weight: 700;
        }

        .fv-payment-text {
          margin: 18px auto 0;
          max-width: 520px;
          color: #5f6f83;
          font-size: 14px;
          line-height: 1.6;
        }

        .fv-payment-actions {
          margin-top: 24px;
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .fv-modal {
          width: 100%; max-width: 740px;
          max-height: 92vh;
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 32px 80px rgba(8,20,40,0.28), 0 0 0 1px rgba(11,99,184,0.08);
          font-family: 'DM Sans', sans-serif;
          animation: fv-slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes fv-slide-up { from { opacity:0; transform:translateY(40px) scale(0.97) } to { opacity:1; transform:none } }

        /* ── Header ── */
        .fv-header {
          background: linear-gradient(135deg, #023341 0%, #034353 100%);
          padding: 24px 28px 20px;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .fv-header::before {
          content: '';
          position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .fv-header-top { display: flex; align-items: flex-start; justify-content: space-between; position: relative; }
        .fv-brand { display: flex; align-items: center; gap: 10px; }
        .fv-brand-mark {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .fv-brand-text { color: #fff; }
        .fv-brand-name { font-family: 'DM Serif Display', serif; font-size: 17px; letter-spacing: 0.01em; display: block; }
        .fv-brand-tagline { font-size: 11px; opacity: 0.65; letter-spacing: 0.05em; text-transform: uppercase; }
        .fv-close-btn {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff; font-size: 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .fv-close-btn:hover { background: rgba(255,255,255,0.22); }

        .fv-header-title {
          margin-top: 16px; position: relative;
          color: rgba(255,255,255,0.7); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 500;
        }
        .fv-header-project {
          font-family: 'DM Serif Display', serif;
          font-size: 22px; color: #fff; margin: 4px 0 16px;
          line-height: 1.2;
        }

        /* ── Progress ── */
        .fv-progress-track {
          height: 3px; background: rgba(255,255,255,0.15); border-radius: 2px;
          margin-bottom: 14px; position: relative; overflow: hidden;
        }
        .fv-progress-fill {
          height: 100%; background: #ffd557; border-radius: 2px;
          transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        .fv-steps { display: flex; gap: 0; position: relative; }
        .fv-step-pill {
          flex: 1; display: flex; align-items: center; gap: 5px;
          font-size: 10px; color: rgba(255,255,255,0.5); font-weight: 500;
          letter-spacing: 0.03em; text-transform: uppercase;
          cursor: pointer; padding: 2px 0; transition: color 0.2s;
          white-space: nowrap; overflow: hidden;
        }
        .fv-step-pill.active { color: #ffd557; }
        .fv-step-pill.done { color: rgba(255,255,255,0.75); }
        .fv-step-dot {
          width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
          background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; transition: all 0.2s;
        }
        .fv-step-pill.active .fv-step-dot { background: #ffd557; border-color: #ffd557; color: #0b3b6b; }
        .fv-step-pill.done .fv-step-dot { background: rgba(255,255,255,0.85); border-color: rgba(255,255,255,0.85); color: #023341; }

        /* ── Body ── */
        .fv-body {
          flex: 1; overflow-y: auto; padding: 28px 28px 0;
          scroll-behavior: smooth;
        }
        .fv-body::-webkit-scrollbar { width: 4px; }
        .fv-body::-webkit-scrollbar-track { background: transparent; }
        .fv-body::-webkit-scrollbar-thumb { background: #d0ddef; border-radius: 2px; }

        .fv-step-content {
          transition: opacity 0.2s, transform 0.2s;
        }
        .fv-step-content.animating { opacity: 0; transform: translateY(8px); }

        .fv-step-header { margin-bottom: 20px; }
        .fv-step-num {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(2, 51, 65, 0.1); color: #023341;
          font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 4px 10px; border-radius: 20px;
          margin-bottom: 8px;
        }
        .fv-step-title {
          font-family: 'DM Serif Display', serif;
          font-size: 20px; color: #023341; margin: 0 0 4px;
        }
        .fv-step-desc { font-size: 13px; color: #556; margin: 0; }

        /* ── Form Elements ── */
        .fv-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 520px) { .fv-row { grid-template-columns: 1fr; } }

        .fv-field { display: flex; flex-direction: column; gap: 6px; }
        .fv-label { font-size: 12px; font-weight: 600; color: #374151; letter-spacing: 0.03em; text-transform: uppercase; }
        .fv-input {
          height: 44px; border: 1.5px solid #e2e8f0; border-radius: 10px;
          padding: 0 14px; font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #0f1e35; background: #fafbfc; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%; box-sizing: border-box;
        }
        .fv-input:focus { border-color: #023341; box-shadow: 0 0 0 3px rgba(2, 51, 65, 0.1); background: #fff; }
        .fv-input-prefix {
          position: relative;
        }
        .fv-input-prefix .fv-prefix {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          font-size: 13px; font-weight: 600; color: #6b7a94;
        }
        .fv-input-prefix .fv-input { padding-left: 52px; }

        .fv-textarea {
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          padding: 12px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #0f1e35; background: #fafbfc; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          resize: vertical; min-height: 100px; width: 100%; box-sizing: border-box;
          line-height: 1.5;
        }
        .fv-textarea:focus { border-color: #023341; box-shadow: 0 0 0 3px rgba(2, 51, 65, 0.1); background: #fff; }
        .fv-textarea::placeholder { color: #9aabb8; }

        /* ── Investment Type Cards ── */
        .fv-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 520px) { .fv-type-grid { grid-template-columns: 1fr; } }
        .fv-type-card {
          border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px;
          cursor: pointer; transition: all 0.15s; background: #fafbfc;
          display: flex; align-items: flex-start; gap: 10px;
        }
        .fv-type-card:hover { border-color: #ffec00; background: rgba(255, 236, 0, 0.04); }
        .fv-type-card.selected { border-color: #023341; background: rgba(2, 51, 65, 0.05); box-shadow: 0 0 0 3px rgba(2, 51, 65, 0.08); }
        .fv-type-radio {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid #c8d6e5; background: #fff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px; transition: border-color 0.15s;
        }
        .fv-type-card.selected .fv-type-radio { border-color: #023341; }
        .fv-type-radio-dot { width: 8px; height: 8px; border-radius: 50%; background: #023341; opacity: 0; transition: opacity 0.15s; }
        .fv-type-card.selected .fv-type-radio-dot { opacity: 1; }
        .fv-type-label { font-size: 13px; font-weight: 600; color: #0f1e35; display: block; }
        .fv-type-desc { font-size: 11.5px; color: #6b7a94; margin-top: 2px; line-height: 1.4; }

        /* ── Timeline ── */
        .fv-timeline-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        @media (max-width: 480px) { .fv-timeline-grid { grid-template-columns: 1fr; } }
        .fv-timeline-card {
          border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px 12px;
          cursor: pointer; text-align: center; transition: all 0.15s; background: #fafbfc;
        }
        .fv-timeline-card:hover { border-color: #ffec00; background: rgba(255, 236, 0, 0.04); }
        .fv-timeline-card.selected { border-color: #023341; background: rgba(2, 51, 65, 0.05); box-shadow: 0 0 0 3px rgba(2, 51, 65, 0.08); }
        .fv-timeline-icon { font-size: 26px; display: block; margin-bottom: 8px; }
        .fv-timeline-label { font-size: 12.5px; font-weight: 600; color: #0f1e35; }

        /* ── NDA / Checkbox ── */
        .fv-radio-group { display: flex; gap: 12px; flex-wrap: wrap; }
        .fv-radio-pill {
          display: flex; align-items: center; gap: 7px;
          border: 1.5px solid #e2e8f0; border-radius: 30px;
          padding: 7px 14px; cursor: pointer; transition: all 0.15s; background: #fafbfc;
          font-size: 13px; font-weight: 500; color: #374151;
        }
        .fv-radio-pill:hover { border-color: #ffec00; }
        .fv-radio-pill.selected { border-color: #023341; background: rgba(2, 51, 65, 0.05); color: #023341; }
        .fv-radio-pip {
          width: 14px; height: 14px; border-radius: 50%; border: 2px solid #c8d6e5;
          background: #fff; display: flex; align-items: center; justify-content: center;
          transition: border-color 0.15s;
        }
        .fv-radio-pill.selected .fv-radio-pip { border-color: #023341; }
        .fv-radio-pip-dot { width: 6px; height: 6px; border-radius: 50%; background: #023341; opacity: 0; transition: opacity 0.15s; }
        .fv-radio-pill.selected .fv-radio-pip-dot { opacity: 1; }

        .fv-check-list { display: flex; flex-direction: column; gap: 8px; }
        .fv-check-item {
          display: flex; align-items: center; gap: 10px;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          padding: 11px 14px; cursor: pointer; transition: all 0.15s; background: #fafbfc;
          font-size: 13px; font-weight: 500; color: #374151;
        }
        .fv-check-item:hover { border-color: #ffec00; background: rgba(255, 236, 0, 0.04); }
        .fv-check-item.checked { border-color: #023341; background: rgba(2, 51, 65, 0.05); color: #023341; }
        .fv-checkbox {
          width: 18px; height: 18px; border-radius: 5px; border: 2px solid #c8d6e5;
          background: #fff; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.15s; font-size: 11px; color: #fff;
        }
        .fv-check-item.checked .fv-checkbox { background: #023341; border-color: #023341; }

        /* ── File Upload ── */
        .fv-file-zone {
          border: 2px dashed #c8d6e5; border-radius: 12px; padding: 24px;
          text-align: center; cursor: pointer; transition: all 0.15s; background: #fafbfc;
          position: relative;
        }
        .fv-file-zone:hover { border-color: #023341; background: rgba(2, 51, 65, 0.05); }
        .fv-file-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; }
        .fv-file-icon { font-size: 28px; display: block; margin-bottom: 8px; }
        .fv-file-text { font-size: 13px; color: #556; }
        .fv-file-text strong { color: #023341; }
        .fv-file-selected { font-size: 12px; color: #059669; margin-top: 6px; font-weight: 500; }

        /* ── Divider ── */
        .fv-divider { height: 1px; background: #edf2f7; margin: 20px 0; }

        /* ── Footer ── */
        .fv-footer {
          padding: 16px 28px 24px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          flex-shrink: 0; border-top: 1px solid #edf2f7;
          background: #fff;
        }
        .fv-footer-left { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #9aabb8; }

        .fv-btn {
          display: inline-flex; align-items: center; gap: 7px;
          height: 42px; padding: 0 20px; border-radius: 10px;
          font-size: 13.5px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; border: none; transition: all 0.15s;
          letter-spacing: 0.01em;
        }
        .fv-btn-ghost {
          background: transparent; color: #6b7a94;
          border: 1.5px solid #e2e8f0;
        }
        .fv-btn-ghost:hover { background: #f5f7fa; border-color: #c8d6e5; }
        .fv-btn-primary {
          background: linear-gradient(135deg, #023341, #034353);
          color: #ffec00; box-shadow: 0 4px 14px rgba(2, 51, 65, 0.3);
        }
        .fv-btn-primary:hover { box-shadow: 0 6px 20px rgba(2, 51, 65, 0.4); transform: translateY(-1px); }
        .fv-btn-primary:active { transform: translateY(0); }
        .fv-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .fv-btn-success {
          background: linear-gradient(135deg, #023341, #034353);
          color: #ffec00; box-shadow: 0 4px 14px rgba(2, 51, 65, 0.3);
        }
        .fv-btn-success:hover { box-shadow: 0 6px 20px rgba(2, 51, 65, 0.4); transform: translateY(-1px); }
        .fv-btn-success:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .fv-btn-row { display: flex; gap: 8px; }

        /* ── Action toggle (final step) ── */
        .fv-note-box {
          margin-top: 4px;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid rgba(2, 51, 65, 0.12);
          background: linear-gradient(180deg, rgba(2, 51, 65, 0.04), rgba(2, 51, 65, 0.02));
          color: #24364a;
          font-size: 13px;
          line-height: 1.5;
        }

        /* ── Summary badge ── */
        .fv-summary { background: rgba(2, 51, 65, 0.04); border: 1px solid rgba(2, 51, 65, 0.1); border-radius: 12px; padding: 16px; margin-top: 16px; }
        .fv-summary-title { font-size: 11px; font-weight: 700; color: #023341; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px; }
        .fv-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        @media (max-width: 460px) { .fv-summary-grid { grid-template-columns: 1fr; } }
        .fv-summary-item { font-size: 12.5px; }
        .fv-summary-key { color: #556; display: block; }
        .fv-summary-val { color: #023341; font-weight: 600; display: block; }

        .fv-section-label {
          font-size: 11px; font-weight: 700; color: #023341; text-transform: uppercase; letter-spacing: 0.07em;
          margin: 18px 0 10px;
        }
        .fv-hint { font-size: 12px; color: #9aabb8; margin-top: 5px; }
      `}</style>

      <div className="fv-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="fv-modal">

          {/* ── Header ── */}
          <div className="fv-header">
            <div className="fv-header-top">
              <div className="fv-brand">
                <div className="fv-brand-mark">🏦</div>
                <div className="fv-brand-text">
                  <span className="fv-brand-name">Finverra</span>
                  <span className="fv-brand-tagline">Finance with Trust</span>
                </div>
              </div>
              <button className="fv-close-btn" onClick={onClose} aria-label="Close">✕</button>
            </div>

            <div className="fv-header-title">Investment Interest Form</div>
            <div className="fv-header-project">{project.title}</div>

            {/* Progress */}
            <div className="fv-progress-track">
              <div className="fv-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="fv-steps">
              {STEPS.map(s => (
                <div
                  key={s.id}
                  className={`fv-step-pill ${step === s.id ? 'active' : step > s.id ? 'done' : ''}`}
                  onClick={() => s.id < step && goToStep(s.id)}
                  title={s.label}
                >
                  <div className="fv-step-dot">
                    {step > s.id ? '✓' : s.id}
                  </div>
                  <span style={{ display: step === s.id ? 'block' : 'none' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="fv-body">
            <div className={`fv-step-content ${animating ? 'animating' : ''}`}>

              {/* STEP 1: Amount & Shares */}
              {step === 1 && (
                <>
                  <div className="fv-step-header">
                    <div className="fv-step-num">💰 Step 1</div>
                    <h2 className="fv-step-title">Investment Amount & Shares *</h2>
                    <p className="fv-step-desc">Define how much you'd like to invest and the equity stake you're seeking.</p>
                  </div>
                  <div className="fv-row">
                    <div className="fv-field">
                      <label className="fv-label">Amount (RWF) *</label>
                      <div className="fv-input-prefix">
                        <span className="fv-prefix">RWF</span>
                        <input
                          className="fv-input"
                          type="number"
                          placeholder="e.g. 5,000,000"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="fv-field">
                      <label className="fv-label">Shares Requested (%) *</label>
                      <div className="fv-input-prefix">
                        <span className="fv-prefix">%</span>
                        <input
                          className="fv-input"
                          type="number"
                          min="0" max="100"
                          placeholder="e.g. 15"
                          value={shares}
                          onChange={e => setShares(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 2: Investment Type */}
              {step === 2 && (
                <>
                  <div className="fv-step-header">
                    <div className="fv-step-num">📊 Step 2</div>
                    <h2 className="fv-step-title">Investment Type *</h2>
                    <p className="fv-step-desc">Select the structure that best matches your investment strategy.</p>
                  </div>
                  <div className="fv-type-grid">
                    {INVESTMENT_TYPES.map(t => (
                      <div
                        key={t.value}
                        className={`fv-type-card ${investmentType === t.value ? 'selected' : ''}`}
                        onClick={() => setInvestmentType(t.value)}
                      >
                        <div className="fv-type-radio">
                          <div className="fv-type-radio-dot" />
                        </div>
                        <div>
                          <span className="fv-type-label">{t.label}</span>
                          <div className="fv-type-desc">{t.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* STEP 3: Timeline */}
              {step === 3 && (
                <>
                  <div className="fv-step-header">
                    <div className="fv-step-num">📅 Step 3</div>
                    <h2 className="fv-step-title">Investment Timeline *</h2>
                    <p className="fv-step-desc">When are you ready to proceed with this investment?</p>
                  </div>
                  <div className="fv-timeline-grid">
                    {TIMELINE_OPTIONS.map(t => (
                      <div
                        key={t.value}
                        className={`fv-timeline-card ${timeline === t.value ? 'selected' : ''}`}
                        onClick={() => setTimeline(t.value)}
                      >
                        <div className="fv-timeline-label">{t.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* STEP 4: Conditions */}
              {step === 4 && (
                <>
                  <div className="fv-step-header">
                    <div className="fv-step-num">📋 Step 4</div>
                    <h2 className="fv-step-title">Key Conditions & Expectations *</h2>
                    <p className="fv-step-desc">Share any specific requirements you have for this investment.</p>
                  </div>
                  <div className="fv-field">
                    <label className="fv-label">Your Conditions *</label>
                    <textarea
                      className="fv-textarea"
                      placeholder="e.g. Quarterly reporting required, Board seat required, Co-investment only, Operate on site…"
                      value={conditions}
                      onChange={e => setConditions(e.target.value)}
                    />
                    <div className="fv-hint">This field is required.</div>
                  </div>
                </>
              )}

              {/* STEP 5: Due Diligence */}
              {step === 5 && (
                <>
                  <div className="fv-step-header">
                    <div className="fv-step-num">🔍 Step 5</div>
                    <h2 className="fv-step-title">Due Diligence Readiness</h2>
                    <p className="fv-step-desc">Configure your NDA preferences and the documents you require.</p>
                  </div>

                  <div className="fv-section-label">Non-Disclosure Agreement (NDA) *</div>
                  <div className="fv-radio-group">
                    {(['yes', 'no', 'custom'] as NdaOption[]).map(opt => (
                      <div
                        key={opt}
                        className={`fv-radio-pill ${nda === opt ? 'selected' : ''}`}
                        onClick={() => setNda(opt)}
                      >
                        <div className="fv-radio-pip"><div className="fv-radio-pip-dot" /></div>
                        {opt === 'yes' ? "Yes — I'll sign" : opt === 'no' ? 'No NDA needed' : 'Custom arrangement'}
                      </div>
                    ))}
                  </div>
                  {nda === 'custom' && (
                    <input
                      className="fv-input"
                      style={{ marginTop: 10 }}
                      placeholder="Describe your custom NDA arrangement…"
                      value={ndaCustom}
                      onChange={e => setNdaCustom(e.target.value)}
                      required
                    />
                  )}

                  <div className="fv-section-label" style={{ marginTop: 20 }}>Documents Required *</div>
                  <div className="fv-check-list">
                    {DOCUMENTS.map(doc => (
                      <div
                        key={doc}
                        className={`fv-check-item ${documentsWanted.includes(doc) ? 'checked' : ''}`}
                        onClick={() => toggleDocument(doc)}
                      >
                        <div className="fv-checkbox">{documentsWanted.includes(doc) ? '✓' : ''}</div>
                        {doc}
                      </div>
                    ))}
                  </div>

                  <div className="fv-section-label" style={{ marginTop: 20 }}>NDA Signing Preference *</div>
                  <div className="fv-radio-group">
                    <div
                      className={`fv-radio-pill ${ndaAction === 'upload' ? 'selected' : ''}`}
                      onClick={() => setNdaAction('upload')}
                    >
                      <div className="fv-radio-pip"><div className="fv-radio-pip-dot" /></div>
                      Sign & Self-Upload
                    </div>
                    <div
                      className={`fv-radio-pill ${ndaAction === 'meeting' ? 'selected' : ''}`}
                      onClick={() => setNdaAction('meeting')}
                    >
                      <div className="fv-radio-pip"><div className="fv-radio-pip-dot" /></div>
                      Schedule Office Meeting
                    </div>
                  </div>

                  {ndaAction === 'upload' && (
                    <>
                      <div className="fv-section-label" style={{ marginTop: 16 }}>Upload Signed NDA *</div>
                      <div className="fv-file-zone">
                        <input type="file" onChange={onFileChange} accept=".pdf,.doc,.docx" required />
                        <span className="fv-file-icon">📎</span>
                        <div className="fv-file-text">
                          <strong>Click to browse</strong> or drag & drop your signed NDA
                        </div>
                        <div className="fv-file-text" style={{ marginTop: 4 }}>PDF, DOC, DOCX accepted</div>
                        {uploadFile && <div className="fv-file-selected">✓ {uploadFile.name}</div>}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* STEP 6: Final Action */}
              {step === 6 && (
                <>
                  <div className="fv-step-header">
                    <div className="fv-step-num">🚀 Step 6</div>
                    <h2 className="fv-step-title">Final Action</h2>
                    <p className="fv-step-desc">Review your application and choose how to proceed.</p>
                  </div>

                  {/* Summary */}
                  <div className="fv-summary">
                    <div className="fv-summary-title">Application Summary</div>
                    <div className="fv-summary-grid">
                      {amount && (
                        <div className="fv-summary-item">
                          <span className="fv-summary-key">Investment Amount</span>
                          <span className="fv-summary-val">RWF {Number(amount).toLocaleString()}</span>
                        </div>
                      )}
                      {shares && (
                        <div className="fv-summary-item">
                          <span className="fv-summary-key">Shares Requested</span>
                          <span className="fv-summary-val">{shares}%</span>
                        </div>
                      )}
                      {investmentType && (
                        <div className="fv-summary-item">
                          <span className="fv-summary-key">Type</span>
                          <span className="fv-summary-val">{investmentType}</span>
                        </div>
                      )}
                      {timeline && (
                        <div className="fv-summary-item">
                          <span className="fv-summary-key">Timeline</span>
                          <span className="fv-summary-val">{timeline}</span>
                        </div>
                      )}
                      <div className="fv-summary-item">
                        <span className="fv-summary-key">NDA</span>
                        <span className="fv-summary-val">
                          {nda === 'custom' ? ndaCustom || 'Custom' : nda === 'yes' ? 'Will sign' : 'Not required'}
                        </span>
                      </div>
                      {documentsWanted.length > 0 && (
                        <div className="fv-summary-item" style={{ gridColumn: '1/-1' }}>
                          <span className="fv-summary-key">Documents Requested</span>
                          <span className="fv-summary-val">{documentsWanted.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="fv-section-label" style={{ marginTop: 20 }}>How would you like to proceed?</div>
                  <div className="fv-note-box">
                    Submit now to send your interest form for review.
                  </div>
                </>
              )}

            </div>
            <div style={{ height: 24 }} />
          </div>

          {/* ── Footer ── */}
          <div className="fv-footer">
            <div className="fv-footer-left">
              Step {step} of {STEPS.length}
            </div>
            <div className="fv-btn-row">
              {step > 1 && (
                <button className="fv-btn fv-btn-ghost" onClick={() => goToStep(step - 1)}>
                  ← Back
                </button>
              )}
              {step < STEPS.length ? (
                <button
                  className="fv-btn fv-btn-primary"
                  onClick={() => {
                    if (stepValidationError) return
                    goToStep(step + 1)
                  }}
                  disabled={!!stepValidationError}
                  title={stepValidationError ?? 'Continue'}
                >
                  Continue →
                </button>
              ) : (
                <button
                  className="fv-btn fv-btn-success"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                {submitting ? 'Submitting…' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>

            {showSuccessPopup ? (
              <div className="fv-overlay">
                <div className="fv-payment-modal" style={{ maxWidth: 560 }}>
                  <div className="fv-payment-badge" style={{ background: '#ecfdf3', borderColor: '#bbf7d0', color: '#166534' }}>
                    Success
                  </div>
                  <h3 className="fv-payment-title" style={{ color: '#023341', fontSize: 22 }}>
                    Investment application submitted successfully!
                  </h3>
                  <p className="fv-payment-text" style={{ color: '#5f6f83' }}>
                    We will review your application and contact you shortly.
                  </p>
                  <div className="fv-payment-actions">
                    <button
                      type="button"
                      className="fv-btn fv-btn-primary"
                      onClick={() => {
                        setShowSuccessPopup(false)
                        onClose()
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

        </div>
      </div>
    </>
  )
}

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function ProjectToInvestIn() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Project | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [investorId, setInvestorId] = useState<string>('')
  const [appliedProjects, setAppliedProjects] = useState<Record<string, boolean>>({})
  const [approvalStatus, setApprovalStatus] = useState<string>('')
  const [, setApprovalLoading] = useState(false)
  const [, setApprovalError] = useState<string>('')
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false)
  const isApproved = approvalStatus.trim().toLowerCase() === 'yes'
// `displayApprovalStatus` removed because it's unused; rely on `isApproved` where needed

  useEffect(() => {
    let mounted = true
    setLoading(true)
    void fetch(buildApiUrl('/admin/projects'))
      .then(r => r.json())
      .then((data) => {
        if (!mounted) return
        const sourceProjects = Array.isArray(data)
          ? data
          : data?.projects && Array.isArray(data.projects)
            ? data.projects
            : []

        setProjects(sourceProjects.map((project: Project) => ({
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category ?? null,
          funding_needed: project.funding_needed ?? null,
          business_stage: project.business_stage ?? null,
          location: project.location ?? null,
          expected_roi: project.expected_roi ?? null,
          image: project.image,
        })))
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const session = getAuthSession()
    if (session && typeof session.payload === 'object' && session.payload !== null) {
      const payload = session.payload as any
      const resolvedId = payload.users_id ?? payload.user?.users_id ?? payload.id ?? payload.user?.id ?? ''
      setUserId(String(resolvedId))
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setApprovalStatus('')
      setApprovalError('')
      setAppliedProjects({})
      return
    }

    // load investor_id for display
    void (async () => {
      try {
        const session = getAuthSession()
        const token = session ? resolveTokenFromPayload(session.payload) || window.localStorage.getItem('token') || '' : ''
        if (!token) return
        const res = await fetch(buildApiUrl(`/investors_id/${encodeURIComponent(String(userId))}`), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        if (data && (data.investor_id || data.investorId || data.investor)) {
          setInvestorId(String(data.investor_id ?? data.investorId ?? data.investor))
        }
      } catch { /* ignore */ }
    })()

    let mounted = true

    async function loadApprovalStatus() {
      setApprovalLoading(true)
      setApprovalError('')

      try {
        const session = getAuthSession()
        const token = session ? resolveTokenFromPayload(session.payload) || window.localStorage.getItem('token') || '' : ''

        if (!token) {
          throw new Error('No authentication token found for approval lookup.')
        }

        const response = await fetch(buildApiUrl(`/investor/approved/${encodeURIComponent(userId)}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(payload?.message || 'Failed to fetch investor approval status.')
        }

        if (mounted) {
          setApprovalStatus(typeof payload?.approved === 'string' ? payload.approved : '')
        }
      } catch (error) {
        if (mounted) {
          setApprovalStatus('')
          setApprovalError(error instanceof Error ? error.message : 'Failed to fetch investor approval status.')
        }
      } finally {
        if (mounted) {
          setApprovalLoading(false)
        }
      }
    }

    void loadApprovalStatus()

    return () => {
      mounted = false
    }
  }, [userId])

  useEffect(() => {
    if (!investorId || projects.length === 0) {
      setAppliedProjects({})
      return
    }

    let mounted = true

    async function loadAppliedProjects() {
      try {
        const session = getAuthSession()
        const token = session ? resolveTokenFromPayload(session.payload) || window.localStorage.getItem('token') || '' : ''
        if (!token) return

        const results = await Promise.all(
          projects.map(async (project) => {
            const response = await fetch(
              buildApiUrl(`/investor/check_application/${encodeURIComponent(investorId)}/${encodeURIComponent(String(project.id))}`),
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )

            const payload = await response.json().catch(() => ({}))
            return [String(project.id), Boolean(response.ok && payload?.exists)] as const
          })
        )

        if (!mounted) return
        setAppliedProjects(Object.fromEntries(results))
      } catch {
        if (!mounted) return
        setAppliedProjects({})
      }
    }

    void loadAppliedProjects()

    return () => {
      mounted = false
    }
  }, [investorId, projects])

  async function handleFormSubmit(payload: InvestmentApplicationPayload) {
    if (!selected) return
    try {
      const session = getAuthSession()

      if (!session) throw new Error('Session not found. Please log in again.')

      const token = resolveTokenFromPayload(session.payload) || window.localStorage.getItem('token') || ''

      if (!token) {
        console.error('Token extraction failed. Session payload:', session.payload)
        throw new Error(
          'No authentication token found. Login response contains user info but no token. '
          + 'Please update backend /login to return token (or accessToken), then log in again.'
        )
      }

      const sessionPayload = session.payload as any
      const loggedInUserId =
        typeof sessionPayload === 'object' && sessionPayload !== null
          ? sessionPayload.user?.id ?? sessionPayload.user?.users_id ?? sessionPayload.id ?? sessionPayload.users_id
          : undefined

      if (!loggedInUserId) {
        throw new Error('No logged-in user id found in session. Please log in again.')
      }

      const investorLookupRes = await fetch(buildApiUrl(`/investors_id/${encodeURIComponent(String(loggedInUserId))}`), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!investorLookupRes.ok) {
        const investorLookupText = await investorLookupRes.text().catch(() => '')
        throw new Error(investorLookupText || 'Unable to resolve investor_id for the logged-in user.')
      }

      const investorLookupData = await investorLookupRes.json()
      const investorId = investorLookupData?.investor_id

      if (!investorId) {
        throw new Error('No investor_id returned from /investors_id/:id')
      }

      const formData = new FormData()
      formData.append('project_id', String(payload.project_id))
      formData.append('investor_id', String(investorId))
      formData.append('amount', payload.amount)
      formData.append('shares', payload.shares)
      formData.append('equity_percentage', payload.equity_percentage)
      formData.append('investment_type', payload.investment_type)
      formData.append('timeline', payload.timeline)
      formData.append('conditions', payload.conditions_text)
      formData.append('conditions_text', payload.conditions_text)
      formData.append('nda', payload.nda)
      formData.append('nda_action', payload.nda_action)
      formData.append('documents', JSON.stringify(payload.documents))
      if (payload.attachment) {
        formData.append('attachment', payload.attachment)
      }

      const res = await fetch(buildApiUrl(`/admin/projects/${selected.id}/apply`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        try {
          const errJson = JSON.parse(txt)
          throw new Error(errJson?.message || txt || 'Failed to submit investment')
        } catch {
          throw new Error(txt || 'Failed to submit investment')
        }
      }

      // success handled by the modal UI; do not show a second alert here
      return
    } catch (err: any) {
      alert('❌ Error: ' + (err?.message ?? 'Unknown error'))
      throw err
    }
  }

  function handleProjectAccess(project: Project) {
    if (isApproved) {
      setShowPaymentPrompt(false)
      setSelected(project)
      return
    }

    setSelected(null)
    setShowPaymentPrompt(true)
  }

  return (
    <InvestorLayout>
      <section style={investorCardStyle}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: '#b07a00' }}>
            Investment Opportunities
          </p>
          <h2 style={{ margin: '8px 0 8px', fontSize: 28, lineHeight: 1.1, color: '#023341', fontWeight: 700 }}>
            Projects to Invest In
          </h2>
          
          
        </div>

        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7a94' }}>
            <p>Loading projects…</p>
          </div>
        ) : !isApproved ? (
          <PaymentPrompt
            onClose={() => setShowPaymentPrompt(false)}
            onGoToPayments={() => navigate('/dashboard/investor/payments')}
          />
        ) : projects.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7a94' }}>
            <p>No projects available at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 24 }}>
            {projects.map(project => (
              (() => {
                const hasApplied = Boolean(appliedProjects[String(project.id)])

                return (
              <article
                key={project.id}
                style={{ border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', background: '#fff', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 8px 16px rgba(15,30,53,0.08)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'none'
                  el.style.boxShadow = 'none'
                }}
              >
                {project.image && (
                  <div style={{ overflow: 'hidden', height: 160 }}>
                    <img
                      src={buildApiUrl(project.image)}
                      alt={project.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
                <div style={{ padding: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f1e35', marginBottom: 8 }}>
                    {project.title}
                  </h3>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: 999, background: 'rgba(2,51,65,0.08)', color: '#023341', border: '1px solid rgba(2,51,65,0.12)', fontSize: 11, fontWeight: 700, letterSpacing: 0.08, textTransform: 'uppercase' }}>
                      {displayProjectField(project.category)}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: 999, background: 'rgba(255,236,0,0.18)', color: '#5c4300', border: '1px solid rgba(255,236,0,0.34)', fontSize: 11, fontWeight: 700, letterSpacing: 0.08, textTransform: 'uppercase' }}>
                      {displayProjectField(project.business_stage)}
                    </span>
                  </div>
                  
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7a94', lineHeight: 1.5, marginBottom: 14 }}>
                    {project.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, padding: 12, marginBottom: 14, borderRadius: 14, background: 'linear-gradient(180deg, rgba(2,51,65,0.04), rgba(255,255,255,0.94))', border: '1px solid rgba(5,56,77,0.08)' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.08, color: '#6b7a94' }}>Funding</p>
                      <strong style={{ display: 'block', fontSize: 12, color: '#0f1e35', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayProjectField(project.funding_needed)}</strong>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.08, color: '#6b7a94' }}>Location</p>
                      <strong style={{ display: 'block', fontSize: 12, color: '#0f1e35', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayProjectField(project.location)}</strong>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.08, color: '#6b7a94' }}>ROI</p>
                      <strong style={{ display: 'block', fontSize: 12, color: '#0f1e35', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayProjectField(project.expected_roi)}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!hasApplied) handleProjectAccess(project)
                    }}
                    disabled={hasApplied}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: hasApplied ? '#e8f5ee' : '#023341',
                      color: hasApplied ? '#1a5c36' : '#ffec00',
                      border: 'none',
                      fontWeight: 600,
                      cursor: hasApplied ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (hasApplied) return
                      (e.currentTarget as HTMLButtonElement).style.background = '#034353'
                    }}
                    onMouseLeave={e => {
                      if (hasApplied) return
                      (e.currentTarget as HTMLButtonElement).style.background = '#023341'
                    }}
                  >
                    {hasApplied ? 'You applied' : 'Submit Interest'}
                  </button>
                </div>
              </article>
                )
              })()
            ))}
          </div>
        )}
      </section>

      {showPaymentPrompt && !selected && (
        <PaymentPrompt
          onClose={() => setShowPaymentPrompt(false)}
          onGoToPayments={() => navigate('/dashboard/investor/payments')}
        />
      )}

      {selected && (
        <InvestmentInterestModal
          project={selected}
          onClose={() => setSelected(null)}
          onSubmit={handleFormSubmit}
        />
      )}
    </InvestorLayout>
  )
}