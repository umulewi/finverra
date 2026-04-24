import { Link } from 'react-router-dom'
import { Footer, Navbar } from '../App'
import './HowItWorksPage.css'

type RequirementItem = {
  label: string
}

type StepSection = {
  title: string
  description?: string
  items?: string[]
  note?: string
}

type RoleFlow = {
  role: string
  intro: string
  requirements: RequirementItem[]
  steps: StepSection[]
}

const processFlows: RoleFlow[] = [
  {
    role: 'For Entrepreneurs',
    intro: 'Launch your application with clear guidance from account setup to approval and payment.',
    requirements: [
      { label: 'National ID or Passport' },
      { label: 'Active email address' },
      { label: 'Current residential address' },
      { label: 'Active phone number' },
      { label: 'Passport-size photo (35mm x 45mm)' },
    ],
    steps: [
      {
        title: 'Step 1: Create an Account',
        description:
          'Register on our platform by creating your personal account. Prepare the required details in advance for a smooth onboarding process.',
      },
      {
        title: 'Step 2: Submit Your Application',
        description: 'Complete your profile and submit information about your business or idea for evaluation.',
        items: [
          'Complete Application Form: Share your business or project details. Our team may invite you for an interview or request additional information.',
          'Upload Supporting Documents: Application letter, business registration (if available), business plan, concept note, financial proposal, Memorandum of Association, and any additional supporting documents.',
          'Review and Submit: Confirm all details before submission. Once submitted, applications cannot be edited or deleted.',
        ],
        note: 'If documents are not available, you may request a guided interview for support (additional service fees may apply).',
      },
      {
        title: 'Step 3: Approval and Payment',
        description:
          'After evaluation, you will receive the decision. Approved applicants proceed with payment through MTN MoMo or Airtel Money, and a confirmation receipt is sent by email.',
      },
    ],
  },
  {
    role: 'For Investors',
    intro: 'Set up your investor profile and get connected to curated opportunities in a secure process.',
    requirements: [
      { label: 'National ID or Passport' },
      { label: 'Active email address' },
      { label: 'Current address' },
      { label: 'Active phone number' },
      { label: 'Passport photo (optional) and ID/Passport copy' },
    ],
    steps: [
      {
        title: 'Step 1: Create an Account',
        description:
          'Register with your basic details and identity documents. You may also visit our office at La Bonne Adresse Building, KN 2 Roundabout, Kigali, for assisted onboarding.',
      },
      {
        title: 'Step 2: Submit Investment Profile',
        items: [
          'Complete Investor Form: Provide your investment interests, preferences, and objectives.',
          'Review and Submit: Verify all details before final submission. Once submitted, the application cannot be modified.',
        ],
      },
      {
        title: 'Step 3: Approval and Payment',
        description:
          'Following review, our team will contact you with the outcome. If approved, payment is completed via MTN MoMo or Airtel Money, then confirmation is sent to your email.',
      },
    ],
  },
]

export default function HowItWorksPage() {
  return (
    <main className="how-it-works-page">
      <Navbar />

      <section className="flow-hero">
        <div className="flow-hero-bg" aria-hidden="true" />
        <div className="container flow-hero-content">
          <p className="flow-eyebrow">Guided Journey</p>
          <h1>How It Works</h1>
          <p>
            A transparent path for entrepreneurs and investors, from registration to approval and payment.
            Every step is structured to keep your process secure, simple, and professional.
          </p>
          <div className="flow-hero-actions">
            <Link to="/dashboard" className="flow-btn flow-btn-primary">Start Your Application</Link>
            <Link to="/" className="flow-btn flow-btn-secondary">Back to Home</Link>
          </div>
        </div>
      </section>

      <section className="flow-track section">
        <div className="container flow-grid">
          {processFlows.map((flow) => (
            <article className="flow-card" key={flow.role}>
              <header className="flow-card-head">
                <h2>{flow.role}</h2>
                <p>{flow.intro}</p>
              </header>

              <div className="flow-requirements">
                <h3>Required Details</h3>
                <ul>
                  {flow.requirements.map((req) => (
                    <li key={req.label}>{req.label}</li>
                  ))}
                </ul>
              </div>

              <div className="flow-steps" aria-label={`${flow.role} process steps`}>
                {flow.steps.map((step, index) => (
                  <section className="flow-step" key={step.title}>
                    <span className="flow-step-number">{index + 1}</span>
                    <div>
                      <h4>{step.title}</h4>
                      {step.description ? <p>{step.description}</p> : null}
                      {step.items ? (
                        <ul>
                          {step.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : null}
                      {step.note ? <p className="flow-note">{step.note}</p> : null}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="flow-cta section">
        <div className="container flow-cta-inner">
          <h2>Need Support Before Submitting?</h2>
          <p>
            Our team can guide you through the required documents and process details so you can submit with confidence.
          </p>
          <Link to="/dashboard" className="flow-btn flow-btn-primary">Talk to Our Team</Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
