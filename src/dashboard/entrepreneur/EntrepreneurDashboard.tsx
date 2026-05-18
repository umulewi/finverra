import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import EntrepreneurShell from './EntrepreneurShell'
import { getAuthSession } from '../authStorage'
import { fetchEntrepreneurDisplayName } from './header'

const quotes = [
  { text: "It always seems impossible until it's done.", author: 'Nelson Mandela' },
  { text: 'Think big. Start small. Act now.', author: 'Robin Sharma' },
  { text: "Don't be afraid to give up the good to go for the great.", author: 'John D. Rockefeller' },
  { text: 'The only limit to our realization of tomorrow is our doubts of today.', author: 'Franklin D. Roosevelt' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'Dream big. Start where you are. Use what you have.', author: 'Arthur Ashe' },
]

const AUTO_INTERVAL = 5000

export default function EntrepreneurDashboard() {
  const [isTablet, setIsTablet] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 960 : false)
  const [isPhone, setIsPhone] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 640 : false)
  const [greetingName, setGreetingName] = useState<string>('')
  const [greetingPrefix, setGreetingPrefix] = useState<string>('Good morning')

  // Quote carousel state
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [quoteProgress, setQuoteProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef<number | null>(null)

  const session = getAuthSession()

  function getGreetingPrefix() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Quote helpers
  function goQuote(n: number) {
    setQuoteIndex((n + quotes.length) % quotes.length)
    resetQuoteTimer()
  }

  function resetQuoteTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setQuoteProgress(0)
    startRef.current = null
    startQuoteProgress()
    timerRef.current = setInterval(() => {
      setQuoteIndex(i => (i + 1) % quotes.length)
      resetQuoteTimer()
    }, AUTO_INTERVAL)
  }

  function startQuoteProgress() {
    function step(ts: number) {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      setQuoteProgress(Math.min((elapsed / AUTO_INTERVAL) * 100, 100))
      if (elapsed < AUTO_INTERVAL) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }

  useEffect(() => {
    let isMounted = true

    async function loadName() {
      try {
        const token = typeof session?.payload === 'object' && session.payload !== null
          ? (() => {
              const payload = session.payload as { token?: unknown; accessToken?: unknown }
              if (typeof payload.token === 'string') return payload.token
              if (typeof payload.accessToken === 'string') return payload.accessToken
              return ''
            })()
          : ''

        const name = await fetchEntrepreneurDisplayName(session?.email ?? '', token)
        if (!isMounted) return
        setGreetingName(name || session?.email?.split('@')[0] || 'Entrepreneur')
        setGreetingPrefix(getGreetingPrefix())
      } catch {
        if (!isMounted) return
        setGreetingName(session?.email?.split('@')[0] || 'Entrepreneur')
        setGreetingPrefix(getGreetingPrefix())
      }
    }

    void loadName()
    return () => { isMounted = false }
  }, [session])

  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth <= 960)
      setIsPhone(window.innerWidth <= 640)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    resetQuoteTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <EntrepreneurShell title="Entrepreneur Dashboard" subtitle="" showHero={false}>

      {/* ── GREETING BANNER ── */}
      <section style={{ ...styles.banner, ...(isPhone ? styles.bannerPhone : {}) }}>
        <div style={styles.bannerLeft}>
          <div style={styles.greetingTag}>
            <span style={styles.greetingDot} />
            {greetingPrefix}, {greetingName}
          </div>
          <h1 style={styles.bannerTitle}>Grow your venture<br />with clarity</h1>
          <p style={styles.bannerSub}>
            Complete your profile, update business details, and prepare your application for investor review.
          </p>
          <div style={{ ...styles.bannerActions, ...(isPhone ? styles.bannerActionsPhone : {}) }}>
            <Link to="/dashboard/entrepreneur/ApplicationInfo" style={styles.btnPrimary}>
              Create Application ↗
            </Link>
            <Link to="/dashboard/entrepreneur/profile" style={styles.btnGhost}>
              Complete Profile
            </Link>
          </div>
        </div>

        <div style={styles.bannerRight}>
          <div style={styles.statBox}>
            <div>
              <div style={styles.statLabel}>Total Investment Value</div>
              <div style={styles.statValue}>RWF 2M+</div>
              <div style={styles.statHint}>Facilitated on platform</div>
            </div>
          </div>
          <div style={styles.statBox}>
            <div>
              <div style={styles.statLabel}>Active Investment</div>
              <div style={styles.statValue}>20+</div>
              <div style={styles.statHint}>Across sectors</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MOTIVATIONAL QUOTES ── */}
      <section style={styles.quotesSection}>
        <div style={{ ...styles.quotesProgressBar, width: `${quoteProgress}%` }} />

        <div style={styles.quotesTag}>
          <span style={styles.quotesTagDot} />
          Daily Inspiration
        </div>

        <div style={styles.quotesOverflow}>
          <div style={{ ...styles.quotesTrack, transform: `translateX(-${quoteIndex * 100}%)` }}>
            {quotes.map((q, i) => (
              <div key={i} style={styles.quoteSlide}>
                <p style={styles.quoteText}>"{q.text}"</p>
                <p style={styles.quoteAuthor}>
                  — <span style={styles.quoteAuthorName}>{q.author}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.quotesFooter}>
          <div style={styles.quotesDots}>
            {quotes.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to quote ${i + 1}`}
                onClick={() => goQuote(i)}
                style={{ ...styles.quotesDot, ...(i === quoteIndex ? styles.quotesDotActive : {}) }}
              />
            ))}
          </div>
          <div style={styles.quotesArrows}>
            <button aria-label="Previous quote" onClick={() => goQuote(quoteIndex - 1)} style={styles.quotesArrowBtn}>‹</button>
            <button aria-label="Next quote" onClick={() => goQuote(quoteIndex + 1)} style={styles.quotesArrowBtn}>›</button>
          </div>
        </div>
      </section>

      {/* ── APPLICATION JOURNEY ROW ── */}
      <section style={{ ...styles.heroRow, ...(isTablet ? styles.heroRowTablet : {}) }}>
        <article style={{ ...styles.heroCard, ...(isPhone ? styles.heroCardPhone : {}) }}>
          <span style={styles.kickerLight}>Application journey</span>
          <h3 style={styles.heroTitle}>Build a complete investor-ready application</h3>
          <p style={styles.heroCopy}>
            Finish your profile, add business details, then create and send your application in one guided flow.
          </p>
          <div style={{ ...styles.buttonRow, ...(isPhone ? styles.buttonRowPhone : {}) }}>
            <Link to="/dashboard/entrepreneur/ApplicationInfo" style={{ ...styles.btnPrimary, ...styles.buttonLink }}>
              Create Application Info ↗
            </Link>
            <Link to="/dashboard/entrepreneur/profile" style={{ ...styles.btnGhost, ...styles.buttonLink }}>
              Complete Profile
            </Link>
          </div>
        </article>

        <article style={{ ...styles.sideCard, ...(isPhone ? styles.sideCardPhone : {}) }}>
          <span style={styles.kicker}>What happens next</span>
          <h3 style={styles.sideTitle}>Application guidance</h3>
          <p style={styles.sideCopy}>
            Use the section below for the full onboarding requirements and the complete application
            process — from registration to approval and payment.
          </p>
        </article>
      </section>

      {/* ── SECTION HEADING ── */}
      <div style={styles.sectionHead}>
        <span style={styles.kicker}>For Entrepreneurs</span>
        <h2 style={styles.sectionTitle}>Begin your journey with confidence</h2>
        <p style={styles.sectionCopy}>
          A structured, guided process from account creation to approval and payment — designed to ensure
          clarity, efficiency, and professionalism at every stage.
        </p>
      </div>

      {/* ── CONTENT CARDS ── */}
      <section style={{ ...styles.cardsGrid, ...(isTablet ? styles.cardsGridTablet : {}) }}>

        {/* Required Information */}
        <article style={{ ...styles.card, ...(isPhone ? styles.cardPhone : {}) }}>
          <span style={styles.kicker}>Required Information</span>
          <h3 style={styles.cardTitle}>Prepare these details before you start</h3>
          <p style={styles.cardCopy}>
            Applicants are required to prepare the following for a seamless onboarding experience:
          </p>
          <ul style={styles.infoList}>
            {[
              'Application letter',
              'National ID or Passport',
              'Active email address',
              'Current residential address',
              'Active phone number',
              'Passport-size photograph (35mm × 45mm)',
            ].map((item) => (
              <li key={item} style={styles.infoListItem}>
                <span style={styles.liDot} />
                {item}
              </li>
            ))}
          </ul>
        </article>

        {/* Application Process */}
        <article style={{ ...styles.card, ...(isPhone ? styles.cardPhone : {}) }}>
          <span style={styles.kicker}>Application Process</span>
          <h3 style={styles.cardTitle}>Follow the guided 3-step process</h3>
          <p style={styles.cardCopy}>
            The application process keeps your submission clear, complete, and ready for review.
          </p>

          <div style={styles.processSteps}>
            <div style={styles.processStep}>
              <span style={styles.stepNum}>1</span>
              <div>
                <h4 style={styles.stepTitle}>Account Creation</h4>
                <p style={styles.stepCopy}>
                  Create your personal account by providing the required information. Preparing details
                  in advance ensures a smooth and efficient registration.
                </p>
              </div>
            </div>

            <div style={styles.processStep}>
              <span style={styles.stepNum}>2</span>
              <div>
                <h4 style={styles.stepTitle}>Complete Application Form</h4>
                <p style={styles.stepCopy}>
                  Complete your profile, start your application, and submit your business idea through
                  a structured and transparent process.
                </p>
                <div style={styles.noteBox}>
                  <strong style={styles.noteStrong}>Note</strong>
                  <ul style={styles.noteList}>
                    <li>Provide comprehensive information about your business. We may invite you for an interview or request additional details.</li>
                    <li>Upload all relevant documents: application letter, business plan, concept note, financial proposal, MoA, photos, and supporting materials.</li>
                    <li>Review all information carefully before submitting. Once submitted, applications cannot be modified or withdrawn.</li>
                  </ul>
                </div>
                <p style={{ ...styles.stepCopy, marginTop: 10 }}>
                  If applicants lack required documentation, a guided support session may be arranged upon request.
                </p>
              </div>
            </div>

            <div style={styles.processStep}>
              <span style={styles.stepNum}>3</span>
              <div>
                <h4 style={styles.stepTitle}>Evaluation, Approval & Payment</h4>
                <p style={styles.stepCopy}>
                  Following evaluation, applicants will be notified of the outcome. Successful applicants
                  proceed to payment via approved channels including Mobile Money. A confirmation receipt
                  is issued upon completion.
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

    </EntrepreneurShell>
  )
}

/* ─── STYLES ─────────────────────────────────────────────────────────────── */
const styles: Record<string, CSSProperties> = {

  /* BANNER */
  banner: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: 24,
    background: 'linear-gradient(130deg, #012631 0%, #023341 45%, #04617a 100%)',
    borderRadius: 24,
    padding: '32px 36px',
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerPhone: {
    gridTemplateColumns: '1fr',
    padding: '20px 18px',
  },
  bannerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  greetingTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999,
    padding: '5px 14px',
    width: 'fit-content',
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: '0.2px',
  },
  greetingDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#4ade80',
    flexShrink: 0,
    display: 'inline-block',
  },
  bannerTitle: {
    fontSize: 'clamp(1.7rem, 2.8vw, 2.5rem)',
    color: '#fff',
    lineHeight: 1.1,
    fontWeight: 800,
    margin: 0,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 1.65,
    maxWidth: 420,
    margin: 0,
  },
  bannerActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap' as const,
    marginTop: 6,
  },
  bannerActionsPhone: {
    flexDirection: 'column' as const,
  },
  bannerRight: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    justifyContent: 'center',
  },
  statBox: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontWeight: 700,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1.1,
    marginTop: 2,
  },
  statHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },

  /* QUOTES */
  quotesSection: {
    background: 'linear-gradient(130deg, #012631 0%, #023341 45%, #04617a 100%)',
    borderRadius: 24,
    padding: '28px 32px',
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  quotesProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    background: '#ffec00',
    opacity: 0.65,
    borderRadius: '0 0 24px 24px',
    transition: 'width 0.1s linear',
  },
  quotesTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999,
    padding: '5px 14px',
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: '1.2px',
    textTransform: 'uppercase' as const,
    marginBottom: 16,
  },
  quotesTagDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#ffec00',
    flexShrink: 0,
    display: 'inline-block',
  },
  quotesOverflow: {
    overflow: 'hidden',
  },
  quotesTrack: {
    display: 'flex',
    transition: 'transform 0.45s cubic-bezier(.4,0,.2,1)',
  },
  quoteSlide: {
    minWidth: '100%',
    boxSizing: 'border-box' as const,
  },
  quoteText: {
    fontSize: 'clamp(1.05rem, 2.2vw, 1.4rem)',
    color: '#fff',
    fontStyle: 'italic' as const,
    fontWeight: 500,
    lineHeight: 1.5,
    margin: '0 0 12px',
  },
  quoteAuthor: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: 600,
    margin: 0,
    letterSpacing: '0.3px',
  },
  quoteAuthorName: {
    color: '#ffec00',
  },
  quotesFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  quotesDots: {
    display: 'flex',
    gap: 7,
  },
  quotesDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    transition: 'background .25s, transform .25s',
    flexShrink: 0,
  },
  quotesDotActive: {
    background: '#ffec00',
    transform: 'scale(1.35)',
  },
  quotesArrows: {
    display: 'flex',
    gap: 8,
  },
  quotesArrowBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '50%',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    fontSize: 20,
    lineHeight: 1,
    padding: 0,
    transition: 'background .2s',
  },

  /* BUTTONS */
  btnPrimary: {
    background: '#ffec00',
    color: '#07202a',
    padding: '10px 20px',
    borderRadius: 999,
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 13,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  btnGhost: {
    background: 'rgba(255,255,255,0.10)',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 999,
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 13,
    border: '1px solid rgba(255,255,255,0.14)',
    display: 'inline-flex',
    alignItems: 'center',
  },
  buttonLink: {
    minHeight: 44,
    justifyContent: 'center',
  },

  /* HERO ROW */
  heroRow: {
    display: 'grid',
    gridTemplateColumns: '1.35fr 0.85fr',
    gap: 16,
    marginBottom: 20,
  },
  heroRowTablet: {
    gridTemplateColumns: '1fr',
  },
  heroCard: {
    background: 'linear-gradient(135deg, rgba(2,51,65,0.98), rgba(2,83,104,0.96))',
    borderRadius: 20,
    padding: 28,
    color: '#fff',
    boxShadow: '0 20px 48px rgba(2,49,62,0.2)',
  },
  heroCardPhone: {
    padding: 18,
    borderRadius: 16,
  },
  kickerLight: {
    display: 'inline-block',
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: '1.2px',
    color: '#ffd166',
    fontWeight: 700,
  },
  heroTitle: {
    fontSize: 'clamp(1.15rem, 2vw, 1.55rem)',
    color: '#fff',
    marginTop: 8,
    lineHeight: 1.2,
    fontWeight: 700,
  },
  heroCopy: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 1.65,
    marginTop: 8,
  },
  buttonRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap' as const,
    marginTop: 18,
  },
  buttonRowPhone: {
    flexDirection: 'column' as const,
  },
  sideCard: {
    background: '#fff',
    border: '1px solid rgba(15,30,53,0.08)',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 12px 28px rgba(15,45,92,0.07)',
  },
  sideCardPhone: {
    borderRadius: 16,
    padding: 18,
  },
  sideTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0f1e35',
    marginTop: 8,
  },
  sideCopy: {
    fontSize: 14,
    color: '#4e5c73',
    lineHeight: 1.65,
    marginTop: 8,
  },

  /* SECTION HEADING */
  sectionHead: {
    marginBottom: 16,
  },
  kicker: {
    display: 'inline-block',
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: '1.3px',
    color: '#c8910e',
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: 'clamp(1.25rem, 2vw, 1.7rem)',
    color: '#0f1e35',
    marginTop: 6,
    fontWeight: 700,
  },
  sectionCopy: {
    color: '#516074',
    lineHeight: 1.7,
    marginTop: 8,
    maxWidth: 680,
    fontSize: 14,
  },

  /* CARDS GRID */
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 16,
    marginBottom: 16,
  },
  cardsGridTablet: {
    gridTemplateColumns: '1fr',
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(15,30,53,0.08)',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 8px 24px rgba(15,45,92,0.06)',
  },
  cardPhone: {
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#0f1e35',
    marginTop: 8,
    lineHeight: 1.3,
  },
  cardCopy: {
    fontSize: 14,
    color: '#3d4f66',
    lineHeight: 1.65,
    marginTop: 8,
  },

  /* INFO LIST */
  infoList: {
    listStyle: 'none',
    marginTop: 16,
    display: 'grid',
    gap: 8,
    padding: 0,
  },
  infoListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    color: '#0f1e35',
    fontWeight: 500,
    padding: '10px 14px',
    borderRadius: 10,
    background: '#f7fafd',
    border: '1px solid rgba(15,30,53,0.08)',
  },
  liDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#04617a',
    flexShrink: 0,
    display: 'inline-block',
  },

  /* PROCESS STEPS */
  processSteps: {
    display: 'grid',
    gap: 12,
    marginTop: 16,
  },
  processStep: {
    display: 'grid',
    gridTemplateColumns: '44px 1fr',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    background: '#f7fafd',
    border: '1px solid rgba(15,30,53,0.08)',
    alignItems: 'start',
  },
  stepNum: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #023341, #04617a)',
    color: '#fff',
    fontWeight: 800,
    fontSize: 16,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f1e35',
    marginBottom: 6,
    margin: '0 0 6px',
  },
  stepCopy: {
    fontSize: 13,
    color: '#4e5c73',
    lineHeight: 1.65,
    margin: 0,
  },
  noteBox: {
    marginTop: 10,
    padding: '12px 14px',
    borderRadius: 10,
    background: '#fff7e6',
    border: '1px solid rgba(200,145,14,0.2)',
    color: '#5c4300',
    fontSize: 13,
    lineHeight: 1.6,
  },
  noteStrong: {
    display: 'block',
    marginBottom: 6,
    fontWeight: 700,
    color: '#4a3200',
  },
  noteList: {
    paddingLeft: 16,
    display: 'grid',
    gap: 6,
    marginTop: 6,
  },
}