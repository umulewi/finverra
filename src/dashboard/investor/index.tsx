import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { clearAuthSession, getAuthSession } from '../authStorage'
import InvestorHeader from './header'
import InvestorSidebar from './sidebar'

const navPathByLabel: Record<string, string> = {
	Dashboard: '/dashboard/investor',
	'Edit Profile': '/dashboard/investor/edit-profile',
	Pipeline: '/dashboard/investor/pipeline',
	Portfolio: '/dashboard/investor/portfolio',
	Login: '/dashboard/investor/login',
	Register: '/dashboard/investor/signup',
	Documents: '/dashboard/investor/documents',
	Messages: '/dashboard/investor/messages',
	Reports: '/dashboard/investor/reports',
	Notifications: '/dashboard/investor/notifications',
	Settings: '/dashboard/investor/settings',
}

const labelByPath: Record<string, string> = Object.fromEntries(
	Object.entries(navPathByLabel).map(([label, path]) => [path, label]),
)

// ─── Data ─────────────────────────────────────────────────────────────────────

const platformSignals = [
	{
		label: 'Entrepreneurs on Platform',
		value: '50+',
		detail: 'Active founder community across Rwanda',
		tone: '#ffec00',
		icon: '🚀',
		delta: '+12% this month',
		positive: true,
	},
	{
		label: 'Verified Investors',
		value: '12+',
		detail: 'Verified investors currently engaging deals',
		tone: '#ffec00',
		icon: '💎',
		delta: '+3 this quarter',
		positive: true,
	},
	{
		label: 'Active Projects',
		value: '20+',
		detail: 'Projects in active support pipeline',
		tone: '#ffec00',
		icon: '📊',
		delta: '+5 new projects',
		positive: true,
	},
	{
		label: 'Capital Facilitated',
		value: 'RWF 2M+',
		detail: 'Total funding volume on Finverra ecosystem',
		tone: '#ffec00',
		icon: '🏦',
		delta: 'Growing YoY',
		positive: true,
	},
]

const trustedInstitutions = [
	{ name: 'RDB', abbr: 'RD' },
	{ name: 'Bank of Kigali', abbr: 'BK' },
	{ name: 'BRD', abbr: 'BR' },
	{ name: 'I&M Bank Rwanda', abbr: 'IM' },
	{ name: 'Equity Bank Rwanda', abbr: 'EQ' },
	{ name: 'Africa50', abbr: 'A5' },
]

const meetingTypes = [
	{ type: 'Business Consultation', icon: '🤝', available: true },
	{ type: 'Investment Discussion', icon: '💼', available: true },
	{ type: 'Project Evaluation', icon: '🔍', available: false },
	{ type: 'Partnership Meeting', icon: '🌍', available: true },
]

const recentDeals = [
	{ name: 'AgriTech Rwanda', sector: 'Agriculture', stage: 'Seed', amount: 'RWF 120K', status: 'Active', color: '#ffec00' },
	{ name: 'MobilePay Ltd', sector: 'Fintech', stage: 'Series A', amount: 'RWF 450K', status: 'Due Diligence', color: '#ffec00' },
	{ name: 'EduConnect', sector: 'EdTech', stage: 'Pre-Seed', amount: 'RWF 80K', status: 'Reviewing', color: '#ffec00' },
	{ name: 'CleanEnergy Co', sector: 'Energy', stage: 'Seed', amount: 'RWF 200K', status: 'Active', color: '#ffec00' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvestorDashboardPage() {
	const navigate = useNavigate()
	const location = useLocation()
	const session = getAuthSession()

	const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)
	const [viewportWidth, setViewportWidth] = useState<number>(window.innerWidth)
	const [searchVal, setSearchVal] = useState<string>('')
	const [activeNav, setActiveNav] = useState<string>('Dashboard')

	useEffect(() => {
		setActiveNav(labelByPath[location.pathname] ?? 'Dashboard')
	}, [location.pathname])

	useEffect(() => {
		const handleResize = () => {
			setViewportWidth(window.innerWidth)
			if (window.innerWidth <= 960) setSidebarOpen(false)
		}
		window.addEventListener('resize', handleResize)
		handleResize()
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	const handleLogout = () => {
		clearAuthSession()
		navigate('/dashboard/investor/login', { replace: true })
	}

	const hour = new Date().getHours()
	const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
	const isPhone = viewportWidth <= 640
	const isTablet = viewportWidth <= 992

	const bodyStyle: CSSProperties = {
		...styles.body,
		padding: isPhone ? '14px 12px 16px' : isTablet ? '20px 16px 18px' : '28px 28px 20px',
	}

	const heroBannerStyle: CSSProperties = {
		...styles.heroBanner,
		gridTemplateColumns: isPhone ? '1fr' : isTablet ? '1fr' : '1.4fr 0.6fr',
		padding: isPhone ? '20px 16px' : isTablet ? '26px 22px' : '36px 40px',
		gap: isPhone ? 14 : isTablet ? 18 : 24,
	}

	const sectionHeaderStyle: CSSProperties = {
		...styles.sectionHeader,
		flexDirection: isPhone ? 'column' : 'row',
		alignItems: isPhone ? 'flex-start' : 'flex-end',
		gap: isPhone ? 8 : 0,
	}

	const signalGridStyle: CSSProperties = {
		...styles.signalGrid,
		gridTemplateColumns: isPhone
			? '1fr'
			: isTablet
				? 'repeat(2, minmax(0, 1fr))'
				: 'repeat(auto-fit, minmax(220px, 1fr))',
	}

	const bottomRowStyle: CSSProperties = {
		...styles.bottomRow,
		gridTemplateColumns: isPhone ? '1fr' : isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, 1fr)',
	}

	const instGridStyle: CSSProperties = {
		...styles.instGrid,
		gridTemplateColumns: isPhone ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
	}

	const footerStripStyle: CSSProperties = {
		...styles.footerStrip,
		flexDirection: isPhone ? 'column' : 'row',
		alignItems: isPhone ? 'flex-start' : 'center',
		gap: isPhone ? 8 : 0,
	}

	return (
		<main style={styles.root}>
			{/* Ambient background effects */}
			<div style={styles.bgOrb1} />
			<div style={styles.bgOrb2} />
			<div style={styles.bgOrb3} />
			<div style={styles.bgGrid} />

			<div style={{
				...styles.sidebarWrapper,
				transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
			}}>
				<InvestorSidebar
					email={session?.email}
					activeNav={activeNav}
					onNavigate={(label) => {
						setActiveNav(label)
						const targetPath = navPathByLabel[label]
						if (targetPath) navigate(targetPath)
						if (window.innerWidth <= 960) setSidebarOpen(false)
					}}
					onLogout={handleLogout}
				/>
			</div>

			{sidebarOpen && (
				<button
					type="button"
					style={styles.overlay}
					aria-label="Close menu"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			<div style={{
				...styles.main,
				marginLeft: sidebarOpen && viewportWidth > 960 ? '280px' : '0',
			}}>
				<InvestorHeader
					onToggleSidebar={() => setSidebarOpen((o) => !o)}
					searchVal={searchVal}
					onSearchChange={setSearchVal}
				/>

				<div style={bodyStyle}>

					{/* ── Hero Welcome Banner ─────────────────────────────────── */}
					<section style={heroBannerStyle}>
						<div style={styles.heroShimmer} />
						<div style={styles.heroNoise} />

						<div style={styles.heroLeft}>
							<div style={styles.heroStatusPill}>
								<span style={styles.heroStatusDot} />
								<span>Live Market Intelligence</span>
							</div>
							<h1 style={{ ...styles.heroTitle, fontSize: isPhone ? 28 : isTablet ? 32 : 38 }}>
								{greeting},{' '}
								<span style={styles.heroNameAccent}>
									{session?.email?.split('@')[0] ?? 'Investor'}
								</span>
							</h1>
							<p style={{ ...styles.heroCopy, maxWidth: isPhone ? '100%' : 520 }}>
								Rwanda's premier investment intelligence platform — connecting capital with Africa's most promising ventures. Your deal flow, live and curated.
							</p>
							<div style={{ ...styles.heroActions, flexWrap: isPhone ? 'wrap' : 'nowrap' }}>
								<button type="button" style={styles.heroCTA}>
									Browse Pipeline →
								</button>
								<button type="button" style={styles.heroSecondary}>
									View Portfolio
								</button>
							</div>
						</div>

						<div style={{ ...styles.heroRight, width: isPhone ? '100%' : 'auto' }}>
							<div style={styles.heroStatBox}>
								<span style={styles.heroStatBoxLabel}>Total Deal Value</span>
								<span style={styles.heroStatBoxValue}>RWF 2M+</span>
								<span style={styles.heroStatBoxSub}>↑ Facilitated on platform</span>
							</div>
							<div style={{ ...styles.heroStatBox, background: 'rgba(255,236,0,0.13)', borderColor: 'rgba(255,236,0,0.28)' }}>
								<span style={styles.heroStatBoxLabel}>Active Deals</span>
								<span style={{ ...styles.heroStatBoxValue, color: '#ffec00' }}>20+</span>
								<span style={styles.heroStatBoxSub}>Across 6 sectors</span>
							</div>
						</div>
					</section>

					{/* ── Signal Cards ─────────────────────────────────────────── */}
					<section style={styles.signalSection}>
						<div style={sectionHeaderStyle}>
							<div>
								<p style={styles.sectionEyebrow}>PLATFORM INTELLIGENCE</p>
								<h2 style={styles.sectionTitle}>Ecosystem Snapshot</h2>
							</div>
							<span style={styles.syncBadge}>
								<span style={styles.syncDot} />
								Synced · api.finverra.co
							</span>
						</div>

						<div style={signalGridStyle}>
							{platformSignals.map((signal, i) => (
								<article key={signal.label} style={{
									...styles.signalCard,
									animationDelay: `${i * 80}ms`,
								}}>
									<div style={styles.signalCardGlow} />
									<div style={styles.signalCardTop}>
										<span style={styles.signalIcon}>{signal.icon}</span>
										<span style={{
											...styles.signalDelta,
											color: signal.positive ? '#ffec00' : '#ef5350',
											background: signal.positive ? 'rgba(255,236,0,0.12)' : 'rgba(239,83,80,0.12)',
										}}>
											{signal.delta}
										</span>
									</div>
									<strong style={{ ...styles.signalValue, color: signal.tone }}>
										{signal.value}
									</strong>
									<p style={styles.signalLabel}>{signal.label}</p>
									<p style={styles.signalDetail}>{signal.detail}</p>
									<div style={{ ...styles.signalBar, background: `linear-gradient(90deg, ${signal.tone}, transparent)` }} />
								</article>
							))}
						</div>
					</section>

					{/* ── Bottom Row: Institutions + Advisory + Deals ───────── */}
					<div style={bottomRowStyle}>

						{/* Trusted Institutions */}
						<div style={styles.panelCard}>
							<div style={styles.panelHeader}>
								<span style={styles.panelDot} />
								<h3 style={styles.panelTitle}>Trusted Institutions</h3>
							</div>
							<p style={styles.panelSub}>Financial partners supporting the ecosystem</p>
							<div style={instGridStyle}>
								{trustedInstitutions.map((inst) => (
									<div key={inst.name} style={styles.instTile}>
										<div style={styles.instAvatar}>{inst.abbr}</div>
										<span style={styles.instName}>{inst.name}</span>
									</div>
								))}
							</div>
						</div>

						{/* Advisory Access */}
						<div style={styles.panelCard}>
							<div style={styles.panelHeader}>
								<span style={{ ...styles.panelDot, background: '#ffec00' }} />
								<h3 style={styles.panelTitle}>Advisory Access</h3>
							</div>
							<p style={styles.panelSub}>Schedule a session with our expert network</p>
							<div style={styles.meetingList}>
								{meetingTypes.map((m) => (
									<div key={m.type} style={styles.meetingItem}>
										<span style={styles.meetingIcon}>{m.icon}</span>
										<span style={styles.meetingText}>{m.type}</span>
										<span style={{
											...styles.meetingStatus,
											color: m.available ? '#ffec00' : '#ef9a9a',
											background: m.available ? 'rgba(255,236,0,0.12)' : 'rgba(239,154,154,0.12)',
										}}>
											{m.available ? 'Available' : 'Booked'}
										</span>
									</div>
								))}
							</div>
						</div>

						{/* Recent Deals */}
						<div style={{ ...styles.panelCard, gridColumn: 'span 1' }}>
							<div style={styles.panelHeader}>
								<span style={{ ...styles.panelDot, background: '#ffec00' }} />
								<h3 style={styles.panelTitle}>Pipeline Highlights</h3>
							</div>
							<p style={styles.panelSub}>Latest deals matching your investment profile</p>
							<div style={styles.dealList}>
								{recentDeals.map((deal) => (
									<div
										key={deal.name}
										style={{
											...styles.dealRow,
											flexWrap: isPhone ? 'wrap' : 'nowrap',
											alignItems: isPhone ? 'flex-start' : 'center',
										}}
									>
										<div style={{ ...styles.dealAvatar, background: `${deal.color}22`, border: `1px solid ${deal.color}44` }}>
											<span style={{ color: deal.color, fontSize: 11, fontWeight: 800 }}>
												{deal.name.slice(0, 2).toUpperCase()}
											</span>
										</div>
										<div style={styles.dealInfo}>
											<span style={styles.dealName}>{deal.name}</span>
											<span style={styles.dealMeta}>{deal.sector} · {deal.stage}</span>
										</div>
										<div style={{ ...styles.dealRight, alignItems: isPhone ? 'flex-start' : 'flex-end' }}>
											<span style={styles.dealAmount}>{deal.amount}</span>
											<span style={{
												...styles.dealStatus,
												color: '#ffec00',
												background: 'rgba(255,236,0,0.1)',
											}}>{deal.status}</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* ── Footer strip ─────────────────────────────────────── */}
					<div style={footerStripStyle}>
						<span style={styles.footerText}>Finverra · Rwanda Investment Intelligence Platform</span>
						<span style={styles.footerText}>Data refreshed in real-time · api.finverra.co</span>
					</div>

				</div>
			</div>

			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

				@keyframes fadeSlideUp {
					from { opacity: 0; transform: translateY(18px); }
					to { opacity: 1; transform: translateY(0); }
				}
				@keyframes pulse {
					0%, 100% { opacity: 1; transform: scale(1); }
					50% { opacity: 0.6; transform: scale(0.9); }
				}
				@keyframes shimmer {
					0% { transform: translateX(-100%) skewX(-12deg); }
					100% { transform: translateX(200%) skewX(-12deg); }
				}
				@keyframes orbFloat {
					0%, 100% { transform: translate(0, 0) scale(1); }
					33% { transform: translate(20px, -30px) scale(1.04); }
					66% { transform: translate(-15px, 20px) scale(0.97); }
				}
				@keyframes dotPulse {
					0%, 100% { box-shadow: 0 0 0 0 rgba(255,236,0,0.5); }
					50% { box-shadow: 0 0 0 6px rgba(255,236,0,0); }
				}
			`}</style>
		</main>
	)
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, CSSProperties> = {
	root: {
		display: 'flex',
		minHeight: '100vh',
		background: '#FFFFFF',
		fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
		fontSize: 14,
		color: '#023341',
		position: 'relative',
		overflow: 'hidden',
	},

	// Ambient background
	bgOrb1: {
		display: 'none',
		position: 'fixed',
		top: '-15vh',
		left: '10vw',
		width: '55vw',
		height: '55vh',
		borderRadius: '50%',
		background: 'radial-gradient(circle, rgba(14,30,76,0.9) 0%, transparent 70%)',
		pointerEvents: 'none',
		zIndex: 0,
		animation: 'orbFloat 18s ease-in-out infinite',
	},
	bgOrb2: {
		display: 'none',
		position: 'fixed',
		bottom: '-10vh',
		right: '5vw',
		width: '45vw',
		height: '50vh',
		borderRadius: '50%',
		background: 'radial-gradient(circle, rgba(230,168,23,0.06) 0%, transparent 70%)',
		pointerEvents: 'none',
		zIndex: 0,
		animation: 'orbFloat 22s ease-in-out infinite reverse',
	},
	bgOrb3: {
		display: 'none',
		position: 'fixed',
		top: '40vh',
		left: '30vw',
		width: '40vw',
		height: '40vh',
		borderRadius: '50%',
		background: 'radial-gradient(circle, rgba(79,195,247,0.04) 0%, transparent 70%)',
		pointerEvents: 'none',
		zIndex: 0,
	},
	bgGrid: {
		display: 'none',
		position: 'fixed',
		inset: 0,
		backgroundImage: `
			linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)
		`,
		backgroundSize: '48px 48px',
		pointerEvents: 'none',
		zIndex: 0,
	},

	sidebarWrapper: {
		position: 'fixed',
		top: 0,
		left: 0,
		bottom: 0,
		width: 280,
		zIndex: 100,
		transition: 'transform 0.26s cubic-bezier(0.4,0,0.2,1)',
	},
	overlay: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(9,23,44,0.18)',
		backdropFilter: 'blur(1.5px)',
		zIndex: 99,
		border: 'none',
		cursor: 'default',
	},
	main: {
		flex: 1,
		transition: 'margin-left 0.24s cubic-bezier(0.4,0,0.2,1)',
		minHeight: '100vh',
		display: 'flex',
		flexDirection: 'column',
		position: 'relative',
		zIndex: 1,
	},
	body: {
		padding: '28px 28px 20px',
		maxWidth: 1320,
		width: '100%',
	},

	// ── Hero Banner ──────────────────────────────────────────────────────────────
	heroBanner: {
		display: 'grid',
		gridTemplateColumns: '1.4fr 0.6fr',
		gap: 24,
		padding: '36px 40px',
		borderRadius: 28,
		background: 'linear-gradient(135deg, #023341 0%, #034756 55%, #045666 100%)',
		border: '1px solid rgba(255,236,0,0.24)',
		boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset, 0 14px 30px rgba(2,51,65,0.2)',
		marginBottom: 24,
		position: 'relative',
		overflow: 'hidden',
		animation: 'fadeSlideUp 0.5s ease both',
	},
	heroShimmer: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '50%',
		height: '100%',
		background: 'linear-gradient(90deg, transparent, rgba(255,236,0,0.12), transparent)',
		animation: 'shimmer 4s ease-in-out infinite',
		pointerEvents: 'none',
	},
	heroNoise: {
		position: 'absolute',
		inset: 0,
		backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
		backgroundSize: '200px',
		opacity: 0.4,
		pointerEvents: 'none',
	},
	heroLeft: {
		position: 'relative',
		zIndex: 1,
	},
	heroStatusPill: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: 7,
		padding: '6px 14px',
		borderRadius: 999,
		background: 'rgba(255,236,0,0.12)',
		border: '1px solid rgba(255,236,0,0.28)',
		color: '#ffec00',
		fontSize: 12,
		fontWeight: 600,
		letterSpacing: 0.3,
		marginBottom: 20,
	},
	heroStatusDot: {
		width: 7,
		height: 7,
		borderRadius: '50%',
		background: '#ffec00',
		animation: 'pulse 2s ease-in-out infinite',
	},
	heroTitle: {
		fontFamily: "'Sora', sans-serif",
		fontSize: 38,
		fontWeight: 800,
		lineHeight: 1.12,
		color: '#F0F6FF',
		margin: '0 0 14px',
		letterSpacing: -0.8,
	},
	heroNameAccent: {
		background: 'linear-gradient(90deg, #ffec00, #fff799)',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
		backgroundClip: 'text',
	},
	heroCopy: {
		margin: '0 0 28px',
		fontSize: 15,
		lineHeight: 1.7,
		color: 'rgba(210,225,245,0.7)',
		maxWidth: 520,
	},
	heroActions: {
		display: 'flex',
		gap: 12,
		alignItems: 'center',
	},
	heroCTA: {
		padding: '12px 26px',
		borderRadius: 14,
		background: 'linear-gradient(135deg, #ffec00 0%, #e7d500 100%)',
		color: '#023341',
		fontWeight: 800,
		fontSize: 14,
		border: 'none',
		cursor: 'pointer',
		boxShadow: '0 6px 16px rgba(255,236,0,0.22)',
		letterSpacing: 0.2,
	},
	heroSecondary: {
		padding: '12px 24px',
		borderRadius: 14,
		background: 'rgba(255,255,255,0.07)',
		color: '#C8D8EE',
		fontWeight: 600,
		fontSize: 14,
		border: '1px solid rgba(255,255,255,0.1)',
		cursor: 'pointer',
		letterSpacing: 0.2,
	},
	heroRight: {
		position: 'relative',
		zIndex: 1,
		display: 'flex',
		flexDirection: 'column',
		gap: 14,
		justifyContent: 'center',
	},
	heroStatBox: {
		padding: '20px 22px',
		borderRadius: 18,
		background: 'rgba(255,255,255,0.06)',
		border: '1px solid rgba(255,255,255,0.1)',
		backdropFilter: 'blur(12px)',
	},
	heroStatBoxLabel: {
		display: 'block',
		fontSize: 11,
		fontWeight: 700,
		letterSpacing: 1.1,
		textTransform: 'uppercase',
		color: 'rgba(190,210,235,0.6)',
		marginBottom: 8,
	},
	heroStatBoxValue: {
		display: 'block',
		fontFamily: "'Sora', sans-serif",
		fontSize: 32,
		fontWeight: 800,
		color: '#F0F6FF',
		letterSpacing: -1,
		lineHeight: 1,
		marginBottom: 6,
	},
	heroStatBoxSub: {
		display: 'block',
		fontSize: 12,
		color: 'rgba(140,180,220,0.65)',
	},

	// ── Section common ───────────────────────────────────────────────────────────
	sectionHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		marginBottom: 18,
	},
	sectionEyebrow: {
		margin: 0,
		fontSize: 11,
		fontWeight: 800,
		letterSpacing: 1.4,
		textTransform: 'uppercase',
		color: '#ffec00',
		marginBottom: 4,
	},
	sectionTitle: {
		margin: 0,
		fontFamily: "'Sora', sans-serif",
		fontSize: 22,
		fontWeight: 700,
		color: '#EDF4FF',
		letterSpacing: -0.3,
	},
	syncBadge: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: 6,
		fontSize: 11,
		fontWeight: 600,
		color: 'rgba(140,180,220,0.7)',
		background: 'rgba(255,255,255,0.04)',
		border: '1px solid rgba(255,255,255,0.08)',
		padding: '6px 12px',
		borderRadius: 999,
	},
	syncDot: {
		width: 6,
		height: 6,
		borderRadius: '50%',
		background: '#ffec00',
		animation: 'dotPulse 2s ease infinite',
	},

	// ── Signal Cards ─────────────────────────────────────────────────────────────
	signalSection: {
		marginBottom: 24,
		animation: 'fadeSlideUp 0.5s 0.1s ease both',
	},
	signalGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
		gap: 14,
	},
	signalCard: {
		position: 'relative',
		padding: '20px 20px 16px',
		borderRadius: 20,
		background: 'linear-gradient(160deg, rgba(2,51,65,0.96) 0%, rgba(2,63,80,0.92) 100%)',
		border: '1px solid rgba(255,255,255,0.07)',
		boxShadow: '0 6px 18px rgba(2,51,65,0.16)',
		overflow: 'hidden',
		animation: 'fadeSlideUp 0.5s ease both',
		transition: 'transform 0.2s ease, box-shadow 0.2s ease',
	},
	signalCardGlow: {
		position: 'absolute',
		inset: 0,
		background: 'radial-gradient(circle at 80% 20%, rgba(255,236,0,0.12), transparent 60%)',
		pointerEvents: 'none',
	},
	signalCardTop: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	signalIcon: {
		fontSize: 22,
	},
	signalDelta: {
		fontSize: 11,
		fontWeight: 700,
		padding: '3px 9px',
		borderRadius: 999,
	},
	signalValue: {
		display: 'block',
		fontFamily: "'Sora', sans-serif",
		fontSize: 34,
		fontWeight: 800,
		lineHeight: 1,
		letterSpacing: -1,
		marginBottom: 6,
	},
	signalLabel: {
		margin: '0 0 4px',
		fontSize: 13,
		fontWeight: 600,
		color: '#A8BDD4',
	},
	signalDetail: {
		margin: 0,
		fontSize: 11.5,
		lineHeight: 1.5,
		color: 'rgba(140,175,210,0.6)',
	},
	signalBar: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		height: 2,
		width: '100%',
		opacity: 0.5,
	},

	// ── Bottom Row ───────────────────────────────────────────────────────────────
	bottomRow: {
		display: 'grid',
		gridTemplateColumns: 'repeat(3, 1fr)',
		gap: 14,
		marginBottom: 24,
		animation: 'fadeSlideUp 0.5s 0.2s ease both',
	},
	panelCard: {
		padding: '22px',
		borderRadius: 20,
		background: 'linear-gradient(160deg, rgba(2,51,65,0.96) 0%, rgba(2,63,80,0.92) 100%)',
		border: '1px solid rgba(255,255,255,0.07)',
		boxShadow: '0 6px 18px rgba(2,51,65,0.16)',
	},
	panelHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: 9,
		marginBottom: 4,
	},
	panelDot: {
		width: 8,
		height: 8,
		borderRadius: '50%',
		background: '#ffec00',
		flexShrink: 0,
	},
	panelTitle: {
		margin: 0,
		fontFamily: "'Sora', sans-serif",
		fontSize: 15,
		fontWeight: 700,
		color: '#EDF4FF',
	},
	panelSub: {
		margin: '0 0 16px',
		fontSize: 12,
		color: 'rgba(140,175,210,0.55)',
		paddingLeft: 17,
	},

	// Institutions
	instGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(3, 1fr)',
		gap: 10,
	},
	instTile: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		gap: 6,
		padding: '12px 8px',
		borderRadius: 12,
		background: 'rgba(255,255,255,0.04)',
		border: '1px solid rgba(255,255,255,0.07)',
		transition: 'background 0.2s',
	},
	instAvatar: {
		width: 38,
		height: 38,
		borderRadius: 10,
		background: 'linear-gradient(135deg, rgba(255,236,0,0.26), rgba(2,51,65,0.42))',
		border: '1px solid rgba(255,236,0,0.28)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: 11,
		fontWeight: 800,
		color: '#ffec00',
		letterSpacing: 0.5,
	},
	instName: {
		fontSize: 10,
		fontWeight: 600,
		color: 'rgba(180,205,230,0.7)',
		textAlign: 'center' as const,
	},

	// Advisory meeting list
	meetingList: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: 8,
	},
	meetingItem: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
		padding: '10px 12px',
		borderRadius: 12,
		background: 'rgba(255,255,255,0.035)',
		border: '1px solid rgba(255,255,255,0.06)',
	},
	meetingIcon: {
		fontSize: 16,
		flexShrink: 0,
	},
	meetingText: {
		flex: 1,
		fontSize: 13,
		fontWeight: 500,
		color: '#C5D8EE',
	},
	meetingStatus: {
		fontSize: 11,
		fontWeight: 700,
		padding: '3px 9px',
		borderRadius: 999,
	},

	// Pipeline deals
	dealList: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: 8,
	},
	dealRow: {
		display: 'flex',
		alignItems: 'center',
		gap: 12,
		padding: '10px 12px',
		borderRadius: 12,
		background: 'rgba(255,255,255,0.035)',
		border: '1px solid rgba(255,255,255,0.06)',
	},
	dealAvatar: {
		width: 36,
		height: 36,
		borderRadius: 10,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
	},
	dealInfo: {
		flex: 1,
		display: 'flex',
		flexDirection: 'column' as const,
		gap: 2,
	},
	dealName: {
		fontSize: 13,
		fontWeight: 600,
		color: '#D8E8F8',
	},
	dealMeta: {
		fontSize: 11,
		color: 'rgba(140,175,210,0.55)',
	},
	dealRight: {
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'flex-end',
		gap: 3,
	},
	dealAmount: {
		fontSize: 12,
		fontWeight: 700,
		color: '#ffec00',
	},
	dealStatus: {
		fontSize: 10,
		fontWeight: 700,
		padding: '2px 8px',
		borderRadius: 999,
	},

	// ── Footer ───────────────────────────────────────────────────────────────────
	footerStrip: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: '14px 0',
		borderTop: '1px solid rgba(255,255,255,0.06)',
	},
	footerText: {
		fontSize: 11,
		color: 'rgba(140,175,210,0.4)',
		fontWeight: 500,
		letterSpacing: 0.2,
	},
}