import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAvailableRoles } from './dashboardApi'
import type { RoleOption } from './roles'

/* ── Keyframe / font injection ─────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
  
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #021f29;
  }
  
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseDot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.3; transform: scale(0.7); }
  }
  
  /* Responsive media queries */
  @media (min-width: 769px) {
    [data-dashboard-main] {
      grid-template-columns: 340px 1fr !important;
    }
    [data-dashboard-section] {
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: flex-start !important;
      text-align: left !important;
      padding: 72px 80px !important;
    }
    [data-dashboard-h1] {
      text-align: left !important;
      max-width: 500px !important;
    }
    [data-dashboard-p] {
      text-align: left !important;
      max-width: 420px !important;
    }
    [data-role-cards] {
      margin: 0 !important;
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
      gap: 16px !important;
      max-width: 560px !important;
    }
  }
  
  @media (max-width: 768px) {
    [data-dashboard-main] {
      grid-template-columns: 1fr !important;
      min-height: 100vh !important;
      width: 100vw !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    [data-dashboard-aside] {
      display: none !important;
      width: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
    }
    [data-dashboard-section] {
      width: 100% !important;
      min-height: 100vh !important;
      padding: 40px 20px !important;
      margin: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      text-align: center !important;
      overflow: hidden !important;
    }
    [data-dashboard-h1] {
      font-size: 24px !important;
      text-align: center !important;
    }
    [data-dashboard-p] {
      font-size: 12px !important;
      text-align: center !important;
      width: 100% !important;
    }
    [data-role-cards] {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
      width: 100% !important;
      max-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
    }
  }
  
  @media (max-width: 480px) {
    [data-dashboard-main] {
      grid-template-columns: 1fr !important;
      width: 100vw !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #021f29 !important;
    }
    [data-dashboard-section] {
      width: 100% !important;
      height: 100vh !important;
      padding: 24px 16px !important;
      margin: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      text-align: center !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    }
    [data-dashboard-h1] {
      font-size: 20px !important;
      margin-bottom: 8px !important;
      text-align: center !important;
    }
    [data-dashboard-p] {
      font-size: 11px !important;
      text-align: center !important;
      width: 100% !important;
    }
    [data-role-card] {
      min-height: 160px !important;
      padding: 20px 18px !important;
      width: 100% !important;
      margin: 0 auto !important;
    }
    [data-role-cards] {
      width: 100% !important;
      padding: 0 !important;
      margin: 0 auto !important;
      grid-template-columns: 1fr !important;
    }
  }
`

function useGlobalStyles(css: string) {
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = css
    document.head.appendChild(el)
    return () => { document.head.removeChild(el) }
  }, [css])
}

/* ── FadeIn wrapper ────────────────────────────────────────── */
function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
}) {
  return (
    <div style={{ animation: `fadeSlideUp 0.6s ${delay}s cubic-bezier(0.4,0,0.2,1) both`, ...style }}>
      {children}
    </div>
  )
}

/* ── Role card ─────────────────────────────────────────────── */
const ROLE_META: Record<string, { descriptor: string; tag: string }> = {
  entrepreneur: { descriptor: '',  tag: 'Entrepreneur' },
  investor:     { descriptor: '', tag: 'Investor'     },
}

function RoleCard({ role, index }: { role: RoleOption; index: number }) {
  const [hovered, setHovered] = useState(false)
  const meta = ROLE_META[role.slug] ?? { descriptor: role.name, tag: role.name }
  const num  = String(index + 1).padStart(2, '0')

  return (
    <Link
      to={`/dashboard/${role.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:       'relative',
        display:        'flex',
        flexDirection:  'column',
        gap:            '20px',
        minHeight:      '190px',
        padding:        '28px 26px',
        background:     hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border:         `1px solid ${hovered ? 'rgba(255,236,0,0.25)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius:   '18px',
        textDecoration: 'none',
        overflow:       'hidden',
        transform:      hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition:     'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        animation:      `fadeSlideUp 0.6s ${0.35 + index * 0.1}s cubic-bezier(0.4,0,0.2,1) both`,
      }}
      data-role-card
    >
      {/* radial top glow */}
      <span aria-hidden style={{
        position:   'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,236,0,0.1) 0%, transparent 65%)',
        opacity:    hovered ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }} />

      {/* shimmer line */}
      <span aria-hidden style={{
        position:   'absolute', bottom: 0, left: '10%', right: '10%',
        height:     '1px',
        background: 'linear-gradient(90deg, transparent, #ffec00, transparent)',
        transform:  hovered ? 'scaleX(1)' : 'scaleX(0)',
        transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
      }} />

      {/* top row: tag + number */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontSize:      '9px', fontWeight: 600,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color:         'rgba(255,236,0,0.55)',
        }}>
          {meta.tag}
        </span>
        <span style={{
          fontFamily: "'Sora', sans-serif",
          fontSize:   '13px', fontStyle: 'italic',
          color:      'rgba(255,255,255,0.15)',
        }}>
          {num}
        </span>
      </div>

      {/* descriptor */}
      <p style={{
        fontFamily:  "'Sora', sans-serif",
        fontSize:    '22px', fontWeight: 700,
        color:       '#ffffff',
        lineHeight:  1.2,
        whiteSpace:  'pre-line',
      }}>
        {meta.descriptor}
      </p>

      {/* CTA */}
      <div style={{
        marginTop:     'auto',
        display:       'flex', alignItems: 'center', gap: '6px',
        fontSize:      '11.5px', fontWeight: 500,
        letterSpacing: '0.03em',
        color:         hovered ? '#ffec00' : 'rgba(255,255,255,0.35)',
        transition:    'color 0.3s',
      }}>
        Continue as {role.name}
        <span style={{
          color:      '#ffec00',
          opacity:    hovered ? 1 : 0,
          transform:  hovered ? 'translateX(0)' : 'translateX(-6px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}>
          →
        </span>
      </div>
    </Link>
  )
}

/* ── Page ──────────────────────────────────────────────────── */
export default function DashboardChoice() {
  useGlobalStyles(GLOBAL_CSS)

  const [roles, setRoles]               = useState<RoleOption[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [backHovered, setBackHovered]   = useState(false)

  useEffect(() => {
    let isMounted = true
    const loadRoles = async () => {
      try {
        const nextRoles = await fetchAvailableRoles()
        if (!isMounted) return
        const visibleRoles = nextRoles.filter((r) => r.slug !== 'admin')
        setRoles(visibleRoles)
        setErrorMessage(
          visibleRoles.length === 0
            ? 'No supported roles are available from the server yet.'
            : ''
        )
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load roles right now.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    void loadRoles()
    return () => { isMounted = false }
  }, [])

  const asideRoles = [
    { num: '01', title: 'Entrepreneur', body: 'Build your profile, publish opportunities, and connect with investment partners at scale.' },
    { num: '02', title: 'Investor',     body: 'Review curated ventures, manage your pipeline, and follow portfolio activity in real time.' },
  ]

  return (
    <main style={{
      minHeight:   '100vh',
      display:     'grid',
      gridTemplateColumns: '340px 1fr',
      fontFamily:  "'Sora', sans-serif",
      background:  '#021f29',
      width: '100%',
      margin: 0,
      padding: 0,
    }} data-dashboard-main>

      {/* ── Aside ──────────────────────────────────────────── */}
      <aside style={{
        position:     'sticky', top: 0, height: '100vh',
        padding:      '44px 36px',
        display:      'flex', flexDirection: 'column',
        background:   '#ffffff',
        borderRight:  '1px solid rgba(2,51,65,0.1)',
        overflow:     'hidden',
      }} data-dashboard-aside>
        {/* subtle corner glow */}
        <span aria-hidden style={{
          position:   'absolute', bottom: 0, right: 0,
          width:      '180px', height: '180px',
          background: 'radial-gradient(circle, rgba(255,236,0,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <FadeIn delay={0}>
          <p style={{
            fontSize:      '9px', fontWeight: 600,
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color:         '#023341', marginBottom: '36px',
          }}>
            Platform access
          </p>
        </FadeIn>

        {asideRoles.map(({ num, title, body }, i) => (
          <FadeIn key={title} delay={0.1 + i * 0.1} style={{
            padding:      '24px 0',
            borderTop:    '1px solid rgba(2,51,65,0.1)',
            borderBottom: i === asideRoles.length - 1 ? '1px solid rgba(2,51,65,0.1)' : undefined,
          }}>
            <span style={{
              fontFamily: "'Sora', sans-serif",
              fontSize:   '11px', fontStyle: 'italic',
              color:      '#c4a800', display: 'block', marginBottom: '6px',
            }}>
              {num}
            </span>
            <h2 style={{
              fontFamily:   "'Sora', sans-serif",
              fontSize:     '24px', fontWeight: 700,
              color:        '#021f29', lineHeight: 1.15, marginBottom: '8px',
            }}>
              {title}
            </h2>
            <p style={{
              fontSize: '12.5px', fontWeight: 300,
              lineHeight: 1.7, color: '#4a6370', maxWidth: '230px',
            }}>
              {body}
            </p>
          </FadeIn>
        ))}

        <div style={{ flexGrow: 1 }} />

        <FadeIn delay={0.35}>
          {/* live status dot */}
          {!isLoading && !errorMessage && (
            <div style={{
              display:     'flex', alignItems: 'center', gap: '8px',
              fontSize:    '12px', color: '#7a9aab', marginBottom: '20px',
            }}>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background:  '#c4a800', display: 'inline-block',
                animation:   'pulseDot 2s ease-in-out infinite',
              }} />
              {roles.length} role{roles.length !== 1 ? 's' : ''} available
            </div>
          )}

          <Link
            to="/"
            onMouseEnter={() => setBackHovered(true)}
            onMouseLeave={() => setBackHovered(false)}
            style={{
              display:    'inline-flex', alignItems: 'center', gap: '6px',
              fontSize:   '11px', fontWeight: 500, letterSpacing: '0.08em',
              color:      backHovered ? '#021f29' : '#8fa8b2',
              textDecoration: 'none',
              transition: 'color 0.25s ease',
            }}
          >
            <span style={{
              transform:  backHovered ? 'translateX(-4px)' : 'translateX(0)',
              transition: 'transform 0.25s ease',
            }}>
              ←
            </span>
            Back to home
          </Link>
        </FadeIn>
      </aside>

      {/* ── Main ───────────────────────────────────────────── */}
      <section style={{
        padding:        '72px 80px',
        display:        'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems:     'flex-start',
        position:       'relative',
        backgroundImage: `
          radial-gradient(ellipse 60% 50% at 85% -10%, rgba(255,236,0,0.05) 0%, transparent 65%),
          radial-gradient(ellipse 40% 40% at 10% 90%,  rgba(255,236,0,0.03) 0%, transparent 55%)
        `,
      }} data-dashboard-section>

        <FadeIn delay={0.1}>
          <p style={{
            fontSize:      '9px', fontWeight: 600,
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color:         'rgba(255,236,0,0.6)', marginBottom: '10px',
            textAlign:     'left',
          }}>
            Select your role
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize:   '36px', fontWeight: 700,
            color:      '#ffffff', lineHeight: 1.15, marginBottom: '12px',
            textAlign:  'left',
          }} data-dashboard-h1>
            How will you<br />
            <span style={{ color: '#ffec00' }}>use the platform?</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p style={{
            fontSize:    '13px', fontWeight: 300,
            color:       'rgba(255,255,255,0.45)',
            lineHeight:  1.65, maxWidth: '320px', marginBottom: '40px',
            textAlign:   'left',
          }} data-dashboard-p>
            Choose a role to access your personalised dashboard. You can switch roles later from settings.
          </p>
        </FadeIn>

        {/* loading state */}
        {isLoading && (
          <div style={{
            display:      'inline-flex', alignItems: 'center', gap: '10px',
            padding:      '14px 22px',
            background:   'rgba(255,255,255,0.04)',
            border:       '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            fontSize:     '13px', color: 'rgba(255,255,255,0.6)',
            animation:    'fadeSlideUp 0.5s 0.3s ease both',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#ffec00', display: 'inline-block',
              animation: 'pulseDot 1.6s ease-in-out infinite',
            }} />
            Loading available roles…
          </div>
        )}

        {/* error state */}
        {!isLoading && errorMessage && (
          <div style={{
            display:      'inline-flex', alignItems: 'center', gap: '10px',
            padding:      '14px 22px',
            background:   'rgba(255,255,255,0.04)',
            border:       '1px solid rgba(255,236,0,0.2)',
            borderRadius: '14px',
            fontSize:     '13px', color: '#ffec00',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#ffec00', display: 'inline-block',
            }} />
            {errorMessage}
          </div>
        )}

        {/* role cards */}
        {!isLoading && !errorMessage && (
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap:                 '16px',
            maxWidth:            '560px',
            width:               '100%',
          }} data-role-cards>
            {roles.map((role, i) => (
              <RoleCard key={role.id} role={role} index={i} />
            ))}
          </div>
        )}

        {/* footer strip */}
        {!isLoading && !errorMessage && (
          <FadeIn delay={0.5}>
            <div style={{
              width: '32px', height: '1px',
              background: 'rgba(255,236,0,0.3)',
              margin: '28px 0 12px',
            }} />
            <p style={{
              fontSize:      '11px',
              color:         'rgba(255,255,255,0.2)',
              letterSpacing: '0.04em',
              textAlign:     'left',
            }}>
              Your session is secure · Role switching available in settings
            </p>
          </FadeIn>
        )}
      </section>
    </main>
  )
}