import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { buildApiUrl } from '../../config/api'
import { clearAuthSession, getAuthSession } from '../authStorage'
import { fetchInvestorDisplayName } from './header'
import InvestorHeader from './header'
import InvestorSidebar from './sidebar'

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
	navy:    '#0B1E2D',
	navy2:   '#112233',
	slate:   '#1E3448',
	mid:     '#2D4A62',
	muted:   '#6B8CA8',
	subtle:  '#A8BFD0',
	ghost:   '#D4E2EC',
	pale:    '#EEF4F8',
	white:   '#FFFFFF',
	accent:  '#E8C547',
	accent2: '#F0D870',
	text1:   '#0B1E2D',
	text2:   '#3A5570',
	text3:   '#6B8CA8',
	green:   '#1F8A5E',
	greenBg: '#E8F7F0',
	blue:    '#2D6CC0',
	blueBg:  '#EBF3FF',
	amber:   '#B8720D',
	amberBg: '#FDF3E3',
	purple:  '#6B3FA0',
	purpleBg:'#F0EBF8',
	red:     '#C0392B',
	redBg:   '#FDECEA',
} as const

// ─── Nav config ───────────────────────────────────────────────────────────────
const navPathByLabel: Record<string, string> = {
	Dashboard:       '/dashboard/investor',
	'My Profile':    '/dashboard/investor/edit-profile',
	'Edit Profile':  '/dashboard/investor/edit-profile',
	'Application Form': '/dashboard/investor/application-form',
	'My Application':'/dashboard/investor/application-form',
	'Application Status': '/dashboard/investor/application-status',
	'Service Fees':  '/dashboard/investor/service-fees',
	'Project to Invest in': '/dashboard/investor/project-to-invest',
	'Project I have applied in': '/dashboard/investor/applied-projects',
	Payment: '/dashboard/investor/payments',
	Pipeline:        '/dashboard/investor/pipeline',
	Portfolio:       '/dashboard/investor/portfolio',
	Login:           '/dashboard/investor/login',
	Register:        '/dashboard/investor/signup',
	Documents:       '/dashboard/investor/documents',
	Messages:        '/dashboard/investor/messages',
	Reports:         '/dashboard/investor/reports',
	Notifications:   '/dashboard/investor/notifications',
	Settings:        '/dashboard/investor/settings',
}
const labelByPath: Record<string, string> = Object.fromEntries(
	Object.entries(navPathByLabel).map(([l, p]) => [p, l]),
)

// ─── Static data ──────────────────────────────────────────────────────────────
type Metric = { id: string; badge: string; value: string; title: string; sub: string; delta: string; fill: number; iconBg: string; iconColor: string }
const metrics = [
	{ value: '50+',title: 'Entrepreneurs',      sub: 'Active founders across Rwanda',  fill: 78, iconBg: C.blueBg,   iconColor: C.blue   },



	{ value: '12+',    title: 'Verified Investors', sub: 'Currently engaging deals',         delta: '+3 Q',  fill: 55, iconBg: C.greenBg,  iconColor: C.green  },


	{ id: 'ap', badge: 'AP', value: '20+',    title: 'Active Projects',    sub: 'In support pipeline',              delta: '+5 new',fill: 62, iconBg: C.amberBg,  iconColor: C.amber  },
	{ id: 'cf', badge: 'CF', value: 'RWF 2M', title: 'Capital Facilitated',sub: 'Total funding volume',             delta: '↑ YoY', fill: 85, iconBg: C.purpleBg, iconColor: C.purple },
] as Metric[]

const quickSteps = [
	{ step: '01', title: 'Complete profile',    to: '/dashboard/investor/edit-profile'      },
	{ step: '02', title: 'Submit application',  to: '/dashboard/investor/application-form'  },
	{ step: '03', title: 'Check status',        to: '/dashboard/investor/application-status'},
	{ step: '04', title: 'Make payment',        to: '/dashboard/investor/payments'          },
	{ step: '05', title: 'Apply for project',   to: '/dashboard/investor/pipeline'          },
]

// removed: meetingTypes and recentDeals (panels were removed from UI)

const FALLBACK_PARTNERS = [
	{ id: 1, image: '/patners/rdb.png',              url: 'https://www.rdb.rw/',                    label: 'RDB' },
	{ id: 2, image: '/patners/bk.jpg',               url: 'https://bk.rw/',                         label: 'BK'  },
	{ id: 3, image: '/patners/brd.png',              url: 'https://www.brd.rw/',                    label: 'BRD' },
	{ id: 4, image: '/patners/im.png',               url: 'https://www.imbankgroup.com/rwanda/',    label: 'IMB' },
	{ id: 5, image: '/patners/Equity_Group_Logo.png',url: 'https://equitygroupholdings.com/rw/',   label: 'EQT' },
	{ id: 6, image: '/patners/africa50.jpg',         url: 'https://www.africa50.com/',              label: 'A50' },
]

type PartnerApiItem = { id: number; image: string; url: string }

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InvestorDashboardPage() {
	const navigate  = useNavigate()
	const location  = useLocation()
	const session   = getAuthSession()

	const [sidebarOpen,    setSidebarOpen]    = useState(true)
	const [viewportWidth,  setViewportWidth]  = useState(window.innerWidth)
	const [searchVal,      setSearchVal]      = useState('')
	const [activeNav,      setActiveNav]      = useState('Dashboard')
	const [greetingName,   setGreetingName]   = useState('Investor')
	const [greetingPrefix, setGreetingPrefix] = useState('Good morning')
	const [trustedPartners,setTrustedPartners]= useState<PartnerApiItem[]>(FALLBACK_PARTNERS)
	const partnersRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		setActiveNav(labelByPath[location.pathname] ?? 'Dashboard')
	}, [location.pathname])

	useEffect(() => {
		const onResize = () => {
			setViewportWidth(window.innerWidth)
			if (window.innerWidth <= 960) setSidebarOpen(false)
		}
		window.addEventListener('resize', onResize)
		onResize()
		return () => window.removeEventListener('resize', onResize)
	}, [])

	useEffect(() => {
		let mounted = true
		async function load() {
			try {
				const token = typeof session?.payload === 'object' && session.payload !== null
					? (() => {
						const p = session.payload as { token?: unknown; accessToken?: unknown }
						return typeof p.token === 'string' ? p.token
							 : typeof p.accessToken === 'string' ? p.accessToken : ''
					})() : ''
				const fullName = await fetchInvestorDisplayName(session?.email ?? '', token)
				if (!mounted) return
				const h = new Date().getHours()
				setGreetingPrefix(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')
				setGreetingName(fullName || 'Investor')
			} catch {
				if (!mounted) return
				const h = new Date().getHours()
				setGreetingPrefix(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')
			}
		}
		void load()
		return () => { mounted = false }
	}, [session])

	useEffect(() => {
		let mounted = true
		async function loadPartners() {
			try {
				const res = await fetch(buildApiUrl('/admin/partners'))
				const payload = await res.json().catch(() => null)
				if (!res.ok || !Array.isArray(payload?.partners)) return
				if (mounted && payload.partners.length > 0) setTrustedPartners(payload.partners)
			} catch { /* keep fallback */ }
		}
		void loadPartners()
		return () => { mounted = false }
	}, [])

	const handleLogout = () => {
		clearAuthSession()
		navigate('/dashboard/investor/login', { replace: true })
	}

	const isPhone  = viewportWidth <= 640
	const isTablet = viewportWidth <= 992

	const scrollPartners = (dir: number) => {
		if (!partnersRef.current) return
		partnersRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' })
	}

	return (
		<main style={s.root}>
			{/* ── Sidebar ─────────────────────────────────────────────────── */}
			<div style={{ ...s.sidebarWrapper, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
				<InvestorSidebar
					email={session?.email}
					activeNav={activeNav}
					onNavigate={(label) => {
						setActiveNav(label)
						const p = navPathByLabel[label]
						if (p) navigate(p)
						if (window.innerWidth <= 960) setSidebarOpen(false)
					}}
					onLogout={handleLogout}
				/>
			</div>

			{sidebarOpen && (
				<button type="button" style={s.overlay} aria-label="Close menu" onClick={() => setSidebarOpen(false)} />
			)}

			{/* ── Main ────────────────────────────────────────────────────── */}
			<div style={{ ...s.main, marginLeft: sidebarOpen && viewportWidth > 960 ? 280 : 0 }}>
				<InvestorHeader
					onToggleSidebar={() => setSidebarOpen(o => !o)}
					searchVal={searchVal}
					onSearchChange={setSearchVal}
					onLogout={handleLogout}
				/>

				<div style={{
					...s.body,
					padding: isPhone ? '16px 14px' : isTablet ? '22px 18px' : '28px 32px',
				}}>

					{/* ── Hero ──────────────────────────────────────────────── */}
					<section style={{
						...s.hero,
						gridTemplateColumns: isPhone ? '1fr' : isTablet ? '1fr' : '1fr auto',
						padding: isPhone ? '24px 22px' : isTablet ? '30px 28px' : '36px 40px',
					}}>
						<div style={s.heroBg1} />
						<div style={s.heroBg2} />

						<div style={{ position: 'relative', zIndex: 1 }}>
							<div style={s.heroEyebrow}>
								<span style={s.heroEyebrowDot} />
								Finance With Trust
							</div>
							<h1 style={{ ...s.heroH1, fontSize: isPhone ? 28 : isTablet ? 32 : 36 }}>
								{greetingPrefix},<br />
								<em style={s.heroEm}>{greetingName}</em>
							</h1>
							<p style={s.heroCopy}>
								Rwanda's premier investment platform — connecting capital with Africa's most promising ventures. Your deal flow, live and curated.
							</p>
						</div>

						<div style={{ ...s.heroStats, width: isPhone ? '100%' : 'auto', zIndex: 1 }}>
							<div style={s.heroStatBox}>
								<span style={s.heroStatLabel}>Total Facilitated</span>
								<span style={{ ...s.heroStatValue, color: C.accent }}>RWF 2M+</span>
								<span style={s.heroStatSub}>Growing year over year</span>
							</div>
							<div style={s.heroStatBox}>
								<span style={s.heroStatLabel}>Active Projects</span>
								<span style={s.heroStatValue}>20+</span>
								<span style={s.heroStatSub}>Ready for investment</span>
							</div>
						</div>
					</section>

					{/* ── Quick Steps ───────────────────────────────────────── */}
					<section style={s.stepsSection}>
						<p style={s.sectionEyebrow}>Application Steps</p>
						<div style={{
							display: 'grid',
							gridTemplateColumns: isPhone ? '1fr' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
							gap: 8,
						}}>
							{quickSteps.map(step => (
								<button
									key={step.step}
									type="button"
									onClick={() => navigate(step.to)}
									style={s.stepBtn}
									onMouseEnter={e => {
										const el = e.currentTarget
										el.style.borderColor = C.subtle
										el.style.boxShadow   = '0 4px 12px rgba(11,30,45,0.08)'
										el.style.transform   = 'translateY(-1px)'
									}}
									onMouseLeave={e => {
										const el = e.currentTarget
										el.style.borderColor = C.ghost
										el.style.boxShadow   = 'none'
										el.style.transform   = 'none'
									}}
								>
									<div style={s.stepNum}>{step.step}</div>
									<span style={s.stepLabel}>{step.title}</span>
								</button>
							))}
						</div>
					</section>

					{/* ── Metrics ───────────────────────────────────────────── */}
					<section style={s.metricsSection}>
						<div style={{
							display: 'grid',
							gridTemplateColumns: isPhone ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
							gap: 12,
						}}>
							{metrics.map(m => (
								<article key={m.id} style={s.metricCard}>
									<div style={s.metricTop}>
										<div style={{ ...s.metricIcon, background: m.iconBg, color: m.iconColor }}>
											{m.badge}
										</div>
										<span style={s.metricDelta}>{m.delta}</span>
									</div>
									<div style={s.metricValue}>{m.value}</div>
									<div style={s.metricTitle}>{m.title}</div>
									<div style={s.metricSub}>{m.sub}</div>
									<div style={s.metricBar}>
										<div style={{ ...s.metricBarFill, width: `${m.fill}%` }} />
									</div>
								</article>
							))}
						</div>
					</section>

					{/* ── Bottom Row ────────────────────────────────────────── */}
					<div style={{
						...s.bottomRow,
						gridTemplateColumns: isPhone ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1.2fr',
					}}>

						{/* Partners (full-width, horizontal scroller) */}
						<div style={{ ...s.panel, gridColumn: '1 / -1' }}>
							<div style={s.panelHeader}>
								<div>
									<h3 style={s.panelTitle}>Trusted Partners</h3>
									<p style={s.panelSub}>Platform registry · {trustedPartners.length} partners</p>
								</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<button type="button" aria-label="Scroll left" onClick={() => scrollPartners(-1)} style={s.scrollBtn}>{'‹'}</button>
									<span style={s.panelBadge}>Verified</span>
									<button type="button" aria-label="Scroll right" onClick={() => scrollPartners(1)} style={s.scrollBtn}>{'›'}</button>
								</div>
							</div>
							<div ref={partnersRef} style={{
								display: 'flex',
								flexDirection: 'row',
								gap: 8,
								overflowX: 'auto',
								paddingBottom: 6,
								WebkitOverflowScrolling: 'touch',
								scrollSnapType: 'x mandatory',
								scrollBehavior: 'smooth',
							}}>
								{trustedPartners.map(partner => (
									<a
										key={partner.id}
										href={partner.url}
										target="_blank"
										rel="noopener noreferrer"
										style={{ ...s.partnerTile, flex: '0 0 auto', minWidth: 140, scrollSnapAlign: 'start' }}
										aria-label="Visit partner website"
									>
										<img
											src={buildApiUrl(partner.image)}
											alt="Partner logo"
											style={s.partnerLogo}
											loading="lazy"
											decoding="async"
											onError={e => {
												const img = e.currentTarget
												img.style.display = 'none'
												const fallback = img.nextElementSibling as HTMLElement | null
												if (fallback) fallback.style.display = 'flex'
											}}
										/>
										<span style={{ ...s.partnerFallback, display: 'none' }}>
											{(partner as PartnerApiItem & { label?: string }).label ?? '?'}
										</span>
									</a>
								))}
							</div>
						</div>

						{/* Advisory */}

					</div>

					{/* ── Footer ────────────────────────────────────────────── */}
					<div style={{
						...s.footer,
						flexDirection: isPhone ? 'column' : 'row',
						gap: isPhone ? 4 : 0,
					}}>
						<span style={s.footerText}>Finverra · Rwanda Investment Intelligence Platform</span>
						<span style={s.footerText}>Data refreshed in real-time · api.finverra.co</span>
					</div>
				</div>
			</div>

			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
				@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
				@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
			`}</style>
		</main>
	)
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, CSSProperties> = {
	root: {
		display:    'flex',
		minHeight:  '100vh',
		background: C.pale,
		fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
		fontSize:   14,
		color:      C.text1,
		position:   'relative',
	},

	// ── Layout
	sidebarWrapper: {
		position:   'fixed',
		top:        0,
		left:       0,
		bottom:     0,
		width:      280,
		zIndex:     100,
		transition: 'transform 0.26s cubic-bezier(0.4,0,0.2,1)',
	},
	overlay: {
		position:   'fixed',
		inset:      0,
		background: 'rgba(9,23,44,0.2)',
		backdropFilter: 'blur(1.5px)',
		zIndex:     99,
		border:     'none',
		cursor:     'default',
	},
	main: {
		flex:       1,
		transition: 'margin-left 0.24s cubic-bezier(0.4,0,0.2,1)',
		minHeight:  '100vh',
		display:    'flex',
		flexDirection: 'column',
	},
	body: {
		padding:  '28px 32px',
		maxWidth: 1360,
		width:    '100%',
		animation:'fadeUp 0.4s ease both',
	},

	// ── Hero
	hero: {
		display:        'grid',
		gridTemplateColumns: '1fr auto',
		gap:            24,
		padding:        '36px 40px',
		borderRadius:   20,
		background:     C.navy,
		border:         `1px solid rgba(255,255,255,0.05)`,
		marginBottom:   20,
		position:       'relative',
		overflow:       'hidden',
		alignItems:     'center',
	},
	heroBg1: {
		position:     'absolute',
		top:          -60,
		right:        -40,
		width:        320,
		height:       320,
		borderRadius: '50%',
		background:   'radial-gradient(circle, rgba(232,197,71,0.07) 0%, transparent 70%)',
		pointerEvents:'none',
	},
	heroBg2: {
		position:     'absolute',
		bottom:       -80,
		left:         60,
		width:        200,
		height:       200,
		borderRadius: '50%',
		background:   'radial-gradient(circle, rgba(29,74,120,0.6) 0%, transparent 70%)',
		pointerEvents:'none',
	},
	heroEyebrow: {
		display:      'inline-flex',
		alignItems:   'center',
		gap:          7,
		fontSize:     11,
		fontWeight:   600,
		letterSpacing:'1.1px',
		textTransform:'uppercase',
		color:        C.accent,
		marginBottom: 14,
	},
	heroEyebrowDot: {
		width:        5,
		height:       5,
		borderRadius: '50%',
		background:   C.accent,
		opacity:      0.8,
		animation:    'pulse 2s infinite',
	},
	heroH1: {
		fontFamily:  "'Sora', sans-serif",
		fontSize:    36,
		fontWeight:  400,
		color:       C.white,
		lineHeight:  1.15,
		letterSpacing: '-0.5px',
		margin:      '0 0 12px',
	},
	heroEm: {
		fontStyle:  'normal',
		fontWeight: 800,
		color:      C.accent2,
	},
	heroCopy: {
		fontSize:   14,
		color:      'rgba(255,255,255,0.5)',
		lineHeight: 1.7,
		maxWidth:   420,
		fontWeight: 300,
		margin:     0,
	},
	heroStats: {
		display:       'flex',
		flexDirection: 'column',
		gap:           12,
		position:      'relative',
	},
	heroStatBox: {
		background:   'rgba(255,255,255,0.05)',
		border:       '1px solid rgba(255,255,255,0.08)',
		borderRadius: 14,
		padding:      '18px 22px',
		minWidth:     168,
	},
	heroStatLabel: {
		display:       'block',
		fontSize:      10,
		fontWeight:    600,
		letterSpacing: '1.1px',
		textTransform: 'uppercase',
		color:         'rgba(255,255,255,0.35)',
		marginBottom:  8,
	},
	heroStatValue: {
		display:      'block',
		fontFamily:   "'Sora', sans-serif",
		fontSize:     28,
		color:        C.white,
		lineHeight:   1,
		letterSpacing:'-0.5px',
		marginBottom: 4,
	},
	heroStatSub: {
		display:    'block',
		fontSize:   11,
		color:      'rgba(255,255,255,0.3)',
		fontWeight: 400,
	},

	// ── Steps
	stepsSection: {
		marginBottom: 20,
		padding:      '18px 20px',
		borderRadius: 16,
		background:   C.white,
		border:       `1px solid ${C.ghost}`,
	},
	sectionEyebrow: {
		margin:        '0 0 12px',
		fontSize:      10,
		fontWeight:    700,
		letterSpacing: '1.4px',
		textTransform: 'uppercase',
		color:         C.muted,
	},
	stepBtn: {
		display:      'flex',
		alignItems:   'center',
		gap:          10,
		padding:      '12px 14px',
		borderRadius: 10,
		background:   C.pale,
		border:       `1px solid ${C.ghost}`,
		cursor:       'pointer',
		textAlign:    'left',
		width:        '100%',
		transition:   'all 0.18s',
	},
	stepNum: {
		width:       28,
		height:      28,
		borderRadius:7,
		background:  C.white,
		border:      `1px solid ${C.ghost}`,
		display:     'flex',
		alignItems:  'center',
		justifyContent:'center',
		fontSize:    11,
		fontWeight:  700,
		color:       C.muted,
		flexShrink:  0,
	},
	stepLabel: {
		fontSize:   12,
		fontWeight: 600,
		color:      C.text1,
	},

	// ── Metrics
	metricsSection: {
		marginBottom: 20,
	},
	metricCard: {
		background:   C.white,
		border:       `1px solid ${C.ghost}`,
		borderRadius: 16,
		padding:      '22px',
		position:     'relative',
		overflow:     'hidden',
		transition:   'transform 0.2s, box-shadow 0.2s',
	},
	metricTop: {
		display:        'flex',
		justifyContent: 'space-between',
		alignItems:     'flex-start',
		marginBottom:   16,
	},
	metricIcon: {
		width:       36,
		height:      36,
		borderRadius:10,
		display:     'flex',
		alignItems:  'center',
		justifyContent:'center',
		fontSize:    12,
		fontWeight:  800,
		flexShrink:  0,
	},
	metricDelta: {
		fontSize:    11,
		fontWeight:  600,
		padding:     '4px 9px',
		borderRadius:999,
		background:  C.greenBg,
		color:       C.green,
	},
	metricValue: {
		fontFamily:   "'Sora', sans-serif",
		fontSize:     32,
		fontWeight:   400,
		color:        C.navy,
		letterSpacing:'-0.5px',
		lineHeight:   1,
		marginBottom: 4,
	},
	metricTitle: {
		fontSize:     13,
		fontWeight:   500,
		color:        C.text2,
		marginBottom: 2,
	},
	metricSub: {
		fontSize:     11,
		color:        C.text3,
		lineHeight:   1.4,
		marginBottom: 14,
	},
	metricBar: {
		position:     'absolute',
		bottom:       0,
		left:         0,
		right:        0,
		height:       2,
		background:   C.ghost,
	},
	metricBarFill: {
		height:     '100%',
		background: `linear-gradient(90deg, ${C.accent}, ${C.accent2})`,
	},

	// ── Bottom row
	bottomRow: {
		display:             'grid',
		gridTemplateColumns: '1fr 1fr 1.2fr',
		gap:                 14,
		marginBottom:        20,
	},
	panel: {
		padding:      22,
		borderRadius: 16,
		background:   C.white,
		border:       `1px solid ${C.ghost}`,
	},
	panelHeader: {
		display:        'flex',
		alignItems:     'flex-start',
		justifyContent: 'space-between',
		marginBottom:   16,
	},
	panelTitle: {
		margin:     0,
		fontFamily: "'Sora', sans-serif",
		fontSize:   14,
		fontWeight: 700,
		color:      C.navy,
	},
	panelSub: {
		margin:     '2px 0 0',
		fontSize:   11,
		color:      C.text3,
	},
	panelBadge: {
		fontSize:     10,
		fontWeight:   600,
		letterSpacing:'0.5px',
		padding:      '4px 9px',
		borderRadius: 6,
		background:   C.pale,
		color:        C.muted,
		border:       `1px solid ${C.ghost}`,
		flexShrink:   0,
	},

	// Partners
	partnerTile: {
		background:     C.pale,
		border:         `1px solid ${C.ghost}`,
		borderRadius:   10,
		padding:        '12px 8px',
		display:        'flex',
		alignItems:     'center',
		justifyContent: 'center',
		minHeight:      52,
		minWidth:       140,
		flex:           '0 0 auto',
		textDecoration: 'none',
		transition:     'border-color 0.15s',
	},
	scrollBtn: {
		appearance: 'none',
		border: 'none',
		background: 'rgba(11,30,45,0.06)',
		width: 34,
		height: 34,
		borderRadius: 8,
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		cursor: 'pointer',
		fontSize: 18,
		color: C.text1,
	},
	partnerLogo: {
		maxWidth:   '100%',
		maxHeight:  38,
		objectFit:  'contain',
		display:    'block',
	},
	partnerFallback: {
		fontSize:   10,
		fontWeight: 700,
		color:      C.muted,
		letterSpacing:'0.5px',
	},

	// Shared list styles
	listStack: {
		display:       'flex',
		flexDirection: 'column',
		gap:           7,
	},
	meetItem: {
		display:     'flex',
		alignItems:  'center',
		gap:         10,
		padding:     '10px 12px',
		borderRadius:10,
		border:      `1px solid ${C.ghost}`,
		background:  C.pale,
	},
	meetBadge: {
		width:       28,
		height:      28,
		borderRadius:7,
		display:     'flex',
		alignItems:  'center',
		justifyContent:'center',
		fontSize:    10,
		fontWeight:  800,
		flexShrink:  0,
	},
	meetLabel: {
		flex:       1,
		fontSize:   12,
		fontWeight: 500,
		color:      C.text2,
	},
	statusPill: {
		fontSize:    11,
		fontWeight:  600,
		padding:     '3px 9px',
		borderRadius:999,
		flexShrink:  0,
	},
	dealRow: {
		display:     'flex',
		alignItems:  'center',
		gap:         11,
		padding:     '10px 12px',
		borderRadius:10,
		border:      `1px solid ${C.ghost}`,
		background:  C.pale,
	},
	dealAvatar: {
		width:       34,
		height:      34,
		borderRadius:9,
		display:     'flex',
		alignItems:  'center',
		justifyContent:'center',
		fontSize:    11,
		fontWeight:  800,
		flexShrink:  0,
	},
	dealInfo: {
		flex:          1,
		display:       'flex',
		flexDirection: 'column',
		gap:           2,
	},
	dealName: {
		fontSize:   12,
		fontWeight: 600,
		color:      C.navy,
	},
	dealMeta: {
		fontSize: 10,
		color:    C.text3,
	},
	dealRight: {
		display:       'flex',
		flexDirection: 'column',
		alignItems:    'flex-end',
		gap:           3,
	},
	dealAmount: {
		fontSize:   12,
		fontWeight: 700,
		color:      C.navy,
	},

	// ── Footer
	footer: {
		display:        'flex',
		justifyContent: 'space-between',
		alignItems:     'center',
		padding:        '14px 0',
		borderTop:      `1px solid ${C.ghost}`,
	},
	footerText: {
		fontSize:   11,
		color:      C.subtle,
		fontWeight: 400,
	},
}