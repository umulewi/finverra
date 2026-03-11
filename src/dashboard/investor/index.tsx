import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { clearAuthSession, getAuthSession } from '../authStorage'
import InvestorHeader from './header'
import InvestorSidebar from './sidebar'

// ─── Types ────────────────────────────────────────────────────────────────────

type Trend = 'up' | 'down' | 'neutral'

type Metric = {
	label: string
	value: string
	change: string
	trend: Trend
	color: string
}

type PipelineItem = {
	company: string
	stage: string
	sector: string
	checkIn: string
	avatar: string
}

const navPathByLabel: Record<string, string> = {
	Dashboard: '/dashboard/investor',
	'Edit Profile': '/edit-profile',
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

const metrics: Metric[] = [
	{ label: 'Live Opportunities', value: '18', change: '+5 new this week', trend: 'up', color: '#0F2D5C' },
	{ label: 'Shortlisted Deals', value: '6', change: '+2 pending review', trend: 'up', color: '#0EA5A0' },
	{ label: 'Portfolio Companies', value: '9', change: 'Across 4 sectors', trend: 'neutral', color: '#E6A817' },
	{ label: 'Capital Under Review', value: 'RWF 480M', change: '12 day avg cycle', trend: 'neutral', color: '#1A4080' },
]

const pipelineItems: PipelineItem[] = [
	{ company: 'AgriNova Ltd', stage: 'Due diligence', sector: 'Agritech', checkIn: 'Today', avatar: 'AG' },
	{ company: 'PayBridge Africa', stage: 'Term sheet', sector: 'Fintech', checkIn: 'Tomorrow', avatar: 'PB' },
	{ company: 'MediChain Labs', stage: 'Initial review', sector: 'Healthtech', checkIn: 'Friday', avatar: 'MC' },
	{ company: 'LogiRoute Inc', stage: 'Screening', sector: 'Logistics', checkIn: 'Next Mon', avatar: 'LR' },
]

const stageColors: Record<string, { bg: string; text: string }> = {
	'Term sheet':     { bg: '#f6ffed', text: '#52c41a' },
	'Due diligence':  { bg: '#e6f7ff', text: '#1890ff' },
	'Initial review': { bg: '#fffbe6', text: '#faad14' },
	'Screening':      { bg: '#f9f0ff', text: '#722ed1' },
}

const avatarColors = [
	{ bg: '#e6f7ff', text: '#1890ff' },
	{ bg: '#f6ffed', text: '#52c41a' },
	{ bg: '#fff7e6', text: '#faad14' },
	{ bg: '#f9f0ff', text: '#722ed1' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SparkBars({ color }: { color: string }) {
	const heights = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100]
	return (
		<svg width="80" height="40" viewBox="0 0 80 40">
			{heights.map((h, i) => (
				<rect
					key={i}
					x={i * 7}
					y={40 - h * 0.36}
					width="5"
					height={h * 0.36}
					rx="1"
					fill={color}
					opacity={i === heights.length - 1 ? 1 : 0.35}
				/>
			))}
		</svg>
	)
}

function AreaChart() {
	const points1 = '0,84 20,78 40,56 60,64 80,58 100,46 120,52 140,44 160,38 180,48 200,40 220,46 240,36'
	const points2 = '0,92 20,88 40,68 60,76 80,72 100,62 120,66 140,58 160,54 180,60 200,52 220,56 240,50'
	return (
		<svg viewBox="0 0 240 100" preserveAspectRatio="none" style={{ width: '100%', height: '160px' }}>
			<defs>
				<linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#0F2D5C" stopOpacity="0.45" />
					<stop offset="100%" stopColor="#0F2D5C" stopOpacity="0.04" />
				</linearGradient>
				<linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#0EA5A0" stopOpacity="0.24" />
					<stop offset="100%" stopColor="#0EA5A0" stopOpacity="0.03" />
				</linearGradient>
			</defs>
			<polygon points={`${points1} 240,100 0,100`} fill="url(#grad1)" />
			<polyline points={points1} fill="none" stroke="#0F2D5C" strokeWidth="2.5" />
			<polygon points={`${points2} 240,100 0,100`} fill="url(#grad2)" />
			<polyline points={points2} fill="none" stroke="#0EA5A0" strokeWidth="1.6" strokeDasharray="4 2" />
		</svg>
	)
}

function IncomeChart() {
	const bars = [55, 80, 45, 65, 35, 70, 90, 50, 75, 60, 85, 95]
	return (
		<svg viewBox="0 0 120 80" style={{ width: '100%', height: '120px' }}>
			{bars.map((h, i) => (
				<rect
					key={i}
					x={i * 11}
					y={80 - h * 0.75}
					width="8"
					height={h * 0.75}
					rx="3"
					fill={i === bars.length - 1 ? '#E6A817' : '#cfe6db'}
				/>
			))}
		</svg>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvestorDashboardPage() {
	const navigate = useNavigate()
	const location = useLocation()
	const session = getAuthSession()

	const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)
	const [searchVal, setSearchVal] = useState<string>('')
	const [activeNav, setActiveNav] = useState<string>('Dashboard')
	const [visitorTab, setVisitorTab] = useState<string>('Month')

	useEffect(() => {
		setActiveNav(labelByPath[location.pathname] ?? 'Dashboard')
	}, [location.pathname])

	useEffect(() => {
		const handleResize = () => {
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

	return (
		<main style={styles.root}>
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

						if (targetPath) {
							navigate(targetPath)
						}

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
				marginLeft: sidebarOpen ? '280px' : '0',
			}}>
				<InvestorHeader
					onToggleSidebar={() => setSidebarOpen((o) => !o)}
					searchVal={searchVal}
					onSearchChange={setSearchVal}
				/>

				<div style={styles.body}>
					<section style={styles.heroBanner}>
						<div style={styles.heroContent}>
							<span style={styles.heroKicker}>Finverra Investor Suite</span>
							<h2 style={styles.pageTitle}>A sharper view of opportunities, capital, and portfolio momentum</h2>
							<p style={styles.heroCopy}>
								Track your pipeline with more confidence, surface the strongest ventures faster, and keep portfolio governance visible from one brand-aligned workspace.
							</p>
						</div>
						<div style={styles.heroStatsRail}>
							<div style={styles.heroStatCard}>
								<span style={styles.heroStatLabel}>Conversion pace</span>
								<strong style={styles.heroStatValue}>68%</strong>
							</div>
							<div style={styles.heroStatCardAlt}>
								<span style={styles.heroStatLabel}>Investor confidence</span>
								<strong style={styles.heroStatValue}>High</strong>
							</div>
						</div>
					</section>

					<div style={styles.metricGrid}>
						{metrics.map((m) => (
							<div key={m.label} style={styles.metricCard}>
								<div style={styles.metricTop}>
									<span style={styles.metricLabel}>{m.label}</span>
									<SparkBars color={m.color} />
								</div>
								<div style={styles.metricValue}>{m.value}</div>
								<div>
									<span style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: 4,
										background: m.trend === 'up' ? 'rgba(14,165,160,0.12)' : m.trend === 'neutral' ? 'rgba(230,168,23,0.12)' : 'rgba(255,77,79,0.1)',
										color: m.trend === 'up' ? '#0EA5A0' : m.trend === 'neutral' ? '#C8910E' : '#ff4d4f',
										padding: '4px 10px',
										borderRadius: 999,
										fontSize: 12,
										fontWeight: 700,
									}}>
										{m.trend === 'up' ? '↑' : m.trend === 'neutral' ? '→' : '↓'} {m.change}
									</span>
								</div>
							</div>
						))}
					</div>

					<div style={styles.chartsRow}>
						<div style={{ ...styles.card, flex: 2 }}>
							<div style={styles.cardHeader}>
								<h3 style={styles.cardTitle}>Unique Visitor</h3>
								<div style={styles.tabGroup}>
									{(['Month', 'Week'] as const).map((t) => (
										<button
											key={t}
											type="button"
											style={{ ...styles.tabBtn, ...(visitorTab === t ? styles.tabBtnActive : {}) }}
											onClick={() => setVisitorTab(t)}
										>
											{t}
										</button>
									))}
								</div>
							</div>
							<div style={{ padding: '0 8px' }}>
								<AreaChart />
							</div>
						</div>

						<div style={{ ...styles.card, flex: 1 }}>
							<div style={styles.cardHeader}>
								<h3 style={styles.cardTitle}>Income Overview</h3>
							</div>
							<div style={{ padding: '0 16px 16px' }}>
								<p style={styles.incomeSubtitle}>This Week Statistics</p>
								<p style={styles.incomeValue}>RWF 7.65M</p>
								<IncomeChart />
								<div style={styles.incomeLegend}>
									<span style={{ ...styles.legendDot, background: '#cfe6db' }} /> Previous weeks
									<span style={{ ...styles.legendDot, background: '#E6A817', marginLeft: 16 }} /> This week
								</div>
							</div>
						</div>
					</div>

					<div style={styles.chartsRow}>
						<div style={{ ...styles.card, flex: 2 }}>
							<div style={styles.cardHeader}>
								<h3 style={styles.cardTitle}>Deal Pipeline</h3>
								<span style={styles.viewAll}>View All →</span>
							</div>
							<table style={styles.table}>
								<thead>
									<tr>
										{['Company', 'Stage', 'Sector', 'Next Check-in'].map((h) => (
											<th key={h} style={styles.th}>{h}</th>
										))}
									</tr>
								</thead>
								<tbody>
									{pipelineItems.map((item, i) => {
										const stage = stageColors[item.stage] ?? { bg: '#f5f5f5', text: '#595959' }
										const av = avatarColors[i % avatarColors.length]
										return (
											<tr key={item.company} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
												<td style={styles.td}>
													<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
														<div style={{ ...styles.tableAvatar, background: av.bg, color: av.text }}>
															{item.avatar}
														</div>
														<strong style={{ fontSize: 13 }}>{item.company}</strong>
													</div>
												</td>
												<td style={styles.td}>
													<span style={{
														padding: '2px 10px',
														borderRadius: 20,
														fontSize: 12,
														background: stage.bg,
														color: stage.text,
														fontWeight: 500,
													}}>
														{item.stage}
													</span>
												</td>
												<td style={styles.td}>
													<span style={{ color: '#595959', fontSize: 13 }}>{item.sector}</span>
												</td>
												<td style={styles.td}>
													<span style={{ color: '#8c8c8c', fontSize: 13 }}>{item.checkIn}</span>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>

						<div style={{ ...styles.card, flex: 1 }}>
							<div style={styles.cardHeader}>
								<h3 style={styles.cardTitle}>Portfolio Health</h3>
							</div>
							<div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
								{[
									{ label: 'Active Monitoring', val: '9 companies', pct: 90, color: '#0F2D5C' },
									{ label: 'Board Meetings Due', val: '2 this week', pct: 40, color: '#E6A817' },
									{ label: 'Reports Uploaded', val: '3 fresh reports', pct: 60, color: '#0EA5A0' },
									{ label: 'Pending Feedback', val: '3 founders', pct: 30, color: '#1A4080' },
								].map((s) => (
									<div key={s.label}>
										<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
											<span style={{ fontSize: 12, color: '#4a5568' }}>{s.label}</span>
											<span style={{ fontSize: 12, color: '#0f1e35', fontWeight: 700 }}>{s.val}</span>
										</div>
										<div style={{ height: 8, background: '#edf2f8', borderRadius: 999 }}>
											<div style={{ height: 6, width: `${s.pct}%`, background: s.color, borderRadius: 4 }} />
										</div>
									</div>
								))}

								<div style={{ marginTop: 8, padding: '14px', background: 'linear-gradient(135deg, rgba(230,168,23,0.14), rgba(14,165,160,0.1))', borderRadius: 16, borderLeft: '3px solid #E6A817' }}>
									<p style={{ fontSize: 12, color: '#0F2D5C', fontWeight: 700, margin: 0 }}>Market Snapshot</p>
									<p style={{ fontSize: 12, color: '#4a5568', margin: '4px 0 0' }}>
										Strong flow in agritech, logistics & embedded finance this month.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, CSSProperties> = {
	root: {
		display: 'flex',
		minHeight: '100vh',
		background: 'radial-gradient(circle at top left, rgba(230,168,23,0.14), transparent 26%), linear-gradient(180deg, #f7f9fc 0%, #edf2f8 100%)',
		fontFamily: "'DM Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
		fontSize: 14,
		color: '#0f1e35',
		position: 'relative',
	},
	sidebarWrapper: {
		position: 'fixed',
		top: 0,
		left: 0,
		bottom: 0,
		width: 280,
		zIndex: 100,
		transition: 'transform 0.24s ease',
	},
	overlay: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(9, 23, 44, 0.4)',
		zIndex: 99,
		border: 'none',
		cursor: 'default',
	},
	main: {
		flex: 1,
		transition: 'margin-left 0.2s ease',
		minHeight: '100vh',
		display: 'flex',
		flexDirection: 'column',
	},
	body: {
		padding: '24px',
		maxWidth: 1280,
		width: '100%',
	},
	heroBanner: {
		display: 'grid',
		gridTemplateColumns: '1.6fr 0.8fr',
		gap: 18,
		padding: '28px',
		marginBottom: 20,
		borderRadius: 28,
		background: 'linear-gradient(135deg, #0f2d5c 0%, #1a4080 58%, #0ea5a0 100%)',
		boxShadow: '0 24px 60px rgba(15, 45, 92, 0.2)',
		position: 'relative',
		overflow: 'hidden',
	},
	heroContent: {
		position: 'relative',
		zIndex: 1,
	},
	heroKicker: {
		display: 'inline-flex',
		padding: '6px 12px',
		borderRadius: 999,
		background: 'rgba(255,255,255,0.14)',
		color: '#ffd166',
		fontSize: 12,
		fontWeight: 700,
		letterSpacing: 1.2,
		textTransform: 'uppercase',
	},
	pageTitle: {
		fontFamily: "'Sora', 'DM Sans', sans-serif",
		fontSize: 34,
		fontWeight: 800,
		lineHeight: 1.14,
		color: '#ffffff',
		margin: '16px 0 0',
		maxWidth: 720,
	},
	heroCopy: {
		margin: '14px 0 0',
		maxWidth: 620,
		fontSize: 15,
		lineHeight: 1.75,
		color: 'rgba(255,255,255,0.82)',
	},
	heroStatsRail: {
		display: 'grid',
		gap: 14,
		alignContent: 'center',
		position: 'relative',
		zIndex: 1,
	},
	heroStatCard: {
		padding: '18px 18px 16px',
		borderRadius: 22,
		background: 'rgba(255,255,255,0.12)',
		border: '1px solid rgba(255,255,255,0.14)',
		backdropFilter: 'blur(10px)',
	},
	heroStatCardAlt: {
		padding: '18px 18px 16px',
		borderRadius: 22,
		background: 'rgba(230,168,23,0.16)',
		border: '1px solid rgba(255,209,102,0.18)',
	},
	heroStatLabel: {
		display: 'block',
		fontSize: 11,
		textTransform: 'uppercase',
		letterSpacing: 1.2,
		color: 'rgba(255,255,255,0.72)',
		fontWeight: 700,
	},
	heroStatValue: {
		display: 'block',
		fontSize: 26,
		fontWeight: 800,
		color: '#ffffff',
		marginTop: 8,
	},
	metricGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(4, 1fr)',
		gap: 16,
		marginBottom: 20,
	},
	metricCard: {
		background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,249,252,0.95))',
		borderRadius: 22,
		padding: '20px 20px 16px',
		boxShadow: '0 18px 36px rgba(15, 45, 92, 0.08)',
		border: '1px solid rgba(15, 30, 53, 0.08)',
	},
	metricTop: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 8,
	},
	metricLabel: {
		fontSize: 13,
		color: '#8a96a8',
		fontWeight: 500,
		lineHeight: 1.4,
		maxWidth: 100,
	},
	metricValue: {
		fontSize: 26,
		fontWeight: 700,
		color: '#0f1e35',
		marginBottom: 10,
		letterSpacing: -0.5,
	},
	chartsRow: {
		display: 'flex',
		gap: 16,
		marginBottom: 20,
		alignItems: 'stretch',
	},
	card: {
		background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))',
		borderRadius: 24,
		border: '1px solid rgba(15, 30, 53, 0.08)',
		boxShadow: '0 20px 40px rgba(15,45,92,0.08)',
		overflow: 'hidden',
	},
	cardHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: '16px 20px 12px',
		borderBottom: '1px solid rgba(15, 30, 53, 0.06)',
	},
	cardTitle: {
		fontSize: 15,
		fontWeight: 700,
		color: '#0f1e35',
		margin: 0,
	},
	tabGroup: {
		display: 'flex',
		gap: 4,
		background: '#edf2f8',
		borderRadius: 999,
		padding: 3,
	},
	tabBtn: {
		padding: '6px 14px',
		border: 'none',
		background: 'transparent',
		borderRadius: 999,
		fontSize: 12,
		color: '#8a96a8',
		cursor: 'pointer',
		fontWeight: 600,
	},
	tabBtnActive: {
		background: 'linear-gradient(135deg, #ffffff, #fff8e6)',
		color: '#0f1e35',
		fontWeight: 700,
		boxShadow: '0 8px 18px rgba(15,45,92,0.08)',
	},
	incomeSubtitle: {
		fontSize: 12,
		color: '#8a96a8',
		margin: '8px 0 2px',
	},
	incomeValue: {
		fontSize: 24,
		fontWeight: 700,
		color: '#0f1e35',
		margin: '0 0 12px',
	},
	incomeLegend: {
		display: 'flex',
		alignItems: 'center',
		fontSize: 11,
		color: '#8a96a8',
		marginTop: 6,
	},
	legendDot: {
		display: 'inline-block',
		width: 10,
		height: 10,
		borderRadius: 2,
		marginRight: 5,
	},
	table: {
		width: '100%',
		borderCollapse: 'collapse',
	},
	th: {
		padding: '10px 16px',
		textAlign: 'left',
		fontSize: 12,
		color: '#8a96a8',
		fontWeight: 700,
		borderBottom: '1px solid rgba(15, 30, 53, 0.06)',
		background: '#f8fafc',
	},
	td: {
		padding: '12px 16px',
		borderBottom: '1px solid rgba(15, 30, 53, 0.04)',
		verticalAlign: 'middle',
	},
	tableAvatar: {
		width: 32,
		height: 32,
		borderRadius: 6,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: 11,
		fontWeight: 700,
		flexShrink: 0,
	},
	viewAll: {
		fontSize: 12,
		color: '#0ea5a0',
		cursor: 'pointer',
		fontWeight: 700,
	},
}