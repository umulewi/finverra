import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import EntrepreneurShell from './EntrepreneurShell'

const applicationSteps = [
  {
    step: '01',
    title: 'Complete your profile',
    description: 'Add your personal and identification details so your account is ready for review.',
    cta: 'Complete Profile',
    to: '/dashboard/entrepreneur/profile',
  },
  {
    step: '02',
    title: 'Add business information',
    description: 'Share your company setup, sector, location, and operating details.',
    cta: 'Business Information',
    to: '/dashboard/entrepreneur/BusinessInfo',
  },
  {
    step: '03',
    title: 'Send your application',
    description: 'Create your application info and submit the full package for support.',
    cta: 'Create Application Info',
    to: '/dashboard/entrepreneur/ApplicationInfo',
  },
]

const summaryCards = [
  {
    title: 'Business Profile',
    description: 'Keep your company profile, traction, and milestones updated for investor visibility.',
  },
  {
    title: 'Fundraising Pipeline',
    description: 'Track active opportunities, next actions, and conversations with potential investors.',
  },
  {
    title: 'Readiness Score',
    description: 'Prepare documents and metrics so your venture is ready for due diligence.',
  },
]

export default function EntrepreneurDashboard() {
  const [isTablet, setIsTablet] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 960 : false)
  const [isPhone, setIsPhone] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 640 : false)

  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth <= 960)
      setIsPhone(window.innerWidth <= 640)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <EntrepreneurShell
      title="Entrepreneur Dashboard"
      subtitle=""
      showHero={false}
    >
      <section style={{ ...styles.heroGrid, ...(isTablet ? styles.heroGridTablet : {}) }}>
        <article style={{ ...styles.heroCard, ...(isPhone ? styles.heroCardPhone : {}) }}>
          <span style={styles.heroKicker}>Application journey</span>
          <h3 style={styles.heroTitle}>Build a complete investor-ready application</h3>
          <p style={styles.heroCopy}>
            Finish your profile, add business details, then create and send your application in one guided flow.
          </p>

          <div style={{ ...styles.buttonRow, ...(isPhone ? styles.buttonRowPhone : {}) }}>
            <Link
              to="/dashboard/entrepreneur/ApplicationInfo"
              style={{ ...styles.primaryBtn, ...styles.buttonLink, ...(isPhone ? styles.buttonLinkPhone : {}) }}
            >
              Create Application Info
            </Link>
            <Link
              to="/dashboard/entrepreneur/profile"
              style={{ ...styles.secondaryBtn, ...styles.buttonLink, ...(isPhone ? styles.buttonLinkPhone : {}) }}
            >
              Complete Profile
            </Link>
          </div>

          <div style={styles.badgeRow}>
            <span style={styles.badge}>Profile first</span>
            <span style={styles.badge}>Business info next</span>
            <span style={styles.badge}>Submit last</span>
          </div>
        </article>

        <article style={{ ...styles.sideCard, ...(isPhone ? styles.sideCardPhone : {}) }}>
          <span style={styles.heroKicker}>What happens next</span>
          <h3 style={styles.sideTitle}>A simple 3-step path</h3>
          <p style={styles.sideCopy}>
            Follow the order below so your application is complete, clear, and ready for review.
          </p>

          <div style={styles.miniSteps}>
            {applicationSteps.map((item) => (
              <div key={item.step} style={styles.miniStepItem}>
                <span style={styles.miniStepNumber}>{item.step}</span>
                <div>
                  <p style={styles.miniStepTitle}>{item.title}</p>
                  <p style={styles.miniStepCopy}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={{ ...styles.stepsSection, ...(isPhone ? styles.stepsSectionPhone : {}) }}>
        <div style={styles.sectionHeading}>
          <span style={styles.heroKicker}>Follow the flow</span>
          <h3 style={styles.sectionTitle}>From profile to submission</h3>
          <p style={styles.sectionCopy}>
            Each step below opens the right page so you can complete your application in the right order.
          </p>
        </div>

        <div style={{ ...styles.stepsGrid, ...(isPhone ? styles.stepsGridPhone : {}) }}>
          {applicationSteps.map((step, index) => (
            <article key={step.step} style={{ ...styles.stepCard, ...(isPhone ? styles.stepCardPhone : {}) }}>
              <div style={styles.stepTopRow}>
                <span style={styles.stepIndex}>{step.step}</span>
                <span style={styles.stepFlow}>{index === 0 ? 'Start here' : index === 1 ? 'Continue' : 'Final step'}</span>
              </div>
              <h4 style={styles.stepTitle}>{step.title}</h4>
              <p style={styles.stepDescription}>{step.description}</p>
              <Link to={step.to} style={{ ...styles.stepLink, ...styles.buttonLink, ...(isPhone ? styles.stepLinkPhone : {}) }}>
                {step.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section style={{ ...styles.grid, ...(isPhone ? styles.gridPhone : {}) }}>
        {summaryCards.map((card) => (
          <article key={card.title} style={{ ...styles.card, ...(isPhone ? styles.cardPhone : {}) }}>
            <span style={styles.kicker}>Active Area</span>
            <h3 style={styles.cardTitle}>{card.title}</h3>
            <p style={styles.cardCopy}>{card.description}</p>
          </article>
        ))}
      </section>
    </EntrepreneurShell>
  )
}

const styles: Record<string, CSSProperties> = {
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.85fr)',
    gap: 18,
    marginBottom: 18,
  },
  heroGridTablet: {
    gridTemplateColumns: '1fr',
  },
  heroCard: {
    borderRadius: 28,
    padding: 28,
    background: 'linear-gradient(135deg, rgba(2, 51, 65, 0.98), rgba(2, 83, 104, 0.96))',
    color: '#ffffff',
    boxShadow: '0 28px 60px rgba(2, 49, 62, 0.24)',
    position: 'relative',
    overflow: 'hidden',
  },
  heroCardPhone: {
    borderRadius: 20,
    padding: 18,
  },
  sideCard: {
    borderRadius: 28,
    padding: 24,
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
    border: '1px solid rgba(15, 30, 53, 0.08)',
    boxShadow: '0 18px 36px rgba(15, 45, 92, 0.08)',
  },
  sideCardPhone: {
    borderRadius: 20,
    padding: 18,
  },
  heroKicker: {
    display: 'inline-block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#ffd166',
    fontWeight: 700,
  },
  heroTitle: {
    margin: '10px 0 0',
    fontSize: 'clamp(1.7rem, 3vw, 2.5rem)',
    lineHeight: 1.12,
    maxWidth: 560,
  },
  heroCopy: {
    margin: '14px 0 0',
    color: 'rgba(255,255,255,0.84)',
    lineHeight: 1.7,
    maxWidth: 620,
  },
  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 22,
  },
  buttonRowPhone: {
    flexDirection: 'column',
  },
  buttonLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    padding: '0 18px',
    borderRadius: 999,
    textDecoration: 'none',
    fontWeight: 700,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
  },
  buttonLinkPhone: {
    width: '100%',
  },
  primaryBtn: {
    background: '#ffec00',
    color: '#08202a',
    boxShadow: '0 14px 28px rgba(255, 236, 0, 0.28)',
  },
  secondaryBtn: {
    background: 'rgba(255,255,255,0.12)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.16)',
  },
  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22,
  },
  badge: {
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: 600,
  },
  sideTitle: {
    margin: '10px 0 0',
    fontSize: 22,
    color: '#0f1e35',
  },
  sideCopy: {
    margin: '10px 0 0',
    color: '#4e5c73',
    lineHeight: 1.65,
  },
  miniSteps: {
    display: 'grid',
    gap: 14,
    marginTop: 18,
  },
  miniStepItem: {
    display: 'grid',
    gridTemplateColumns: '42px minmax(0, 1fr)',
    gap: 12,
    alignItems: 'start',
    padding: 14,
    borderRadius: 18,
    background: '#ffffff',
    border: '1px solid rgba(15, 30, 53, 0.08)',
  },
  miniStepNumber: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, #01262f 0%, #023341 100%)',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: 12,
  },
  miniStepTitle: {
    margin: 0,
    color: '#0f1e35',
    fontWeight: 700,
  },
  miniStepCopy: {
    margin: '4px 0 0',
    color: '#5d6b7f',
    fontSize: 13,
    lineHeight: 1.55,
  },
  stepsSection: {
    marginBottom: 18,
  },
  stepsSectionPhone: {
    marginBottom: 14,
  },
  sectionHeading: {
    marginBottom: 14,
  },
  sectionTitle: {
    margin: '8px 0 0',
    fontSize: 'clamp(1.35rem, 2.2vw, 2rem)',
    color: '#0f1e35',
  },
  sectionCopy: {
    margin: '10px 0 0',
    color: '#516074',
    lineHeight: 1.65,
    maxWidth: 760,
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
  },
  stepsGridPhone: {
    gridTemplateColumns: '1fr',
    gap: 12,
  },
  stepCard: {
    borderRadius: 24,
    padding: 22,
    background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)',
    border: '1px solid rgba(15, 30, 53, 0.08)',
    boxShadow: '0 16px 30px rgba(15, 45, 92, 0.06)',
  },
  stepCardPhone: {
    borderRadius: 18,
    padding: 16,
  },
  stepTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepIndex: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, #023341 0%, #04617a 100%)',
    color: '#ffffff',
    fontWeight: 800,
  },
  stepFlow: {
    fontSize: 12,
    color: '#c8910e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 700,
  },
  stepTitle: {
    margin: '14px 0 0',
    fontSize: 18,
    color: '#0f1e35',
  },
  stepDescription: {
    margin: '10px 0 0',
    color: '#516074',
    lineHeight: 1.65,
  },
  stepLink: {
    marginTop: 16,
    width: 'fit-content',
    background: 'linear-gradient(135deg, #01262f 0%, #023341 100%)',
    color: '#ffffff',
    boxShadow: '0 12px 24px rgba(2, 49, 62, 0.18)',
  },
  stepLinkPhone: {
    width: '100%',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  gridPhone: {
    gap: 12,
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(15, 30, 53, 0.08)',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 14px 28px rgba(15, 45, 92, 0.07)',
  },
  cardPhone: {
    borderRadius: 16,
    padding: 16,
  },
  kicker: {
    display: 'inline-block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#c8910e',
    fontWeight: 700,
  },
  cardTitle: {
    margin: '10px 0 0',
    fontSize: 18,
    color: '#0f1e35',
    lineHeight: 1.3,
  },
  cardCopy: {
    margin: '10px 0 0',
    fontSize: 14,
    color: '#4e5c73',
    lineHeight: 1.6,
  },
}