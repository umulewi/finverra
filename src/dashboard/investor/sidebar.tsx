import type { CSSProperties, ReactElement } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
	label: string
	icon: () => ReactElement
}

type NavSection = {
	title: string
	items: NavItem[]
}

type InvestorSidebarProps = {
	email?: string
	activeNav: string
	onNavigate: (label: string) => void
	onLogout: () => void
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DashIcon(): ReactElement {
	return (
		<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
			<circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
		</svg>
	)
}
function PipeIcon(): ReactElement {
	return (
		<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
			<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
		</svg>
	)
}
function PortIcon(): ReactElement {
	return (
		<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
			<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
		</svg>
	)
}
function LoginIcon(): ReactElement {
	return (
		<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
			<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
		</svg>
	)
}
function RegIcon(): ReactElement {
	return (
		<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
			<rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" />
		</svg>
	)
}
function DocIcon(): ReactElement {
	return (
		<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<polyline points="14,2 14,8 20,8" />
			<line x1="16" y1="13" x2="8" y2="13" />
			<line x1="16" y1="17" x2="8" y2="17" />
		</svg>
	)
}
function MsgIcon(): ReactElement {
	return (
		<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
			<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
		</svg>
	)
}
function RepIcon(): ReactElement {
	return (
		<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
			<line x1="18" y1="20" x2="18" y2="10" />
			<line x1="12" y1="20" x2="12" y2="4" />
			<line x1="6" y1="20" x2="6" y2="14" />
		</svg>
	)
}
function BellIcon(): ReactElement {
	return (
		<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
			<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
			<path d="M13.73 21a2 2 0 0 1-3.46 0" />
		</svg>
	)
}
function SetIcon(): ReactElement {
	return (
		<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
		</svg>
	)
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const navSections: NavSection[] = [
	{
		title: 'Core',
		items: [
			{ label: 'Dashboard', icon: DashIcon },
			{ label: 'Edit Profile', icon: SetIcon },
			{ label: 'Pipeline', icon: PipeIcon },
			{ label: 'Portfolio', icon: PortIcon },
		],
	},
	{
		title: 'Account',
		items: [
			{ label: 'Login', icon: LoginIcon },
			{ label: 'Register', icon: RegIcon },
		],
	},
	{
		title: 'Utilities',
		items: [
			{ label: 'Documents', icon: DocIcon },
			{ label: 'Messages', icon: MsgIcon },
			{ label: 'Reports', icon: RepIcon },
		],
	},
	{
		title: 'Support',
		items: [
			{ label: 'Notifications', icon: BellIcon },
			{ label: 'Settings', icon: SetIcon },
		],
	},
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function InvestorSidebar({ email: _email, activeNav, onNavigate, onLogout }: InvestorSidebarProps): ReactElement {
	return (
		<aside style={styles.sidebar}>
			<div style={styles.sidebarBrand}>
				<div style={styles.brandLogo}>
					<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
						<path d="M14 2L26 8v12L14 26 2 20V8z" fill="#E6A817" opacity="0.15" stroke="#E6A817" strokeWidth="1.5" />
						<path d="M14 7l8 4.5V17L14 21.5 6 17v-5.5z" fill="#E6A817" opacity="0.4" />
						<path d="M14 12l4 2.5V17L14 19.5 10 17v-2.5z" fill="#0EA5A0" />
					</svg>
					<div>
						<span style={styles.brandName}>Finverra</span>
						<span style={styles.brandTag}>Finance With Trust</span>
					</div>
				</div>

				
			</div>

			<nav style={styles.navScroll}>
				{navSections.map((section) => (
					<div key={section.title} style={styles.navSection}>
						<span style={styles.navSectionTitle}>{section.title}</span>
						{section.items.map((item) => {
							const Icon = item.icon
							const isActive = activeNav === item.label
							return (
								<button
									key={item.label}
									type="button"
									style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
									onClick={() => onNavigate(item.label)}
								>
									<span style={{ ...styles.navIcon, ...(isActive ? styles.navIconActive : {}) }}>
										<Icon />
									</span>
									<span style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.76)', fontWeight: isActive ? 700 : 500 }}>
										{item.label}
									</span>
								</button>
							)
						})}
					</div>
				))}
			</nav>

			{/* Footer */}
			<div style={styles.sidebarFooter}>
				
				<button type="button" style={styles.logoutBtn} onClick={onLogout}>
					Logout
				</button>
			</div>
		</aside>
	)
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, CSSProperties> = {
	sidebar: {
		width: 280,
		height: '100%',
		background: 'linear-gradient(180deg, #0d2345 0%, #11315f 52%, #0b2444 100%)',
		borderRight: '1px solid rgba(255, 255, 255, 0.08)',
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden',
		boxShadow: '28px 0 60px rgba(15, 30, 53, 0.18)',
	},
	sidebarBrand: {
		padding: '22px 20px 18px',
		borderBottom: '1px solid rgba(255,255,255,0.08)',
	},
	brandLogo: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
	},
	brandName: {
		fontSize: 18,
		fontWeight: 700,
		color: '#ffffff',
		letterSpacing: 0.5,
	},
	brandTag: {
		display: 'block',
		fontSize: 11,
		textTransform: 'uppercase',
		letterSpacing: 1.4,
		color: 'rgba(255,255,255,0.56)',
		marginTop: 4,
	},
	highlightCard: {
		marginTop: 18,
		padding: '16px 15px',
		borderRadius: 18,
		background: 'linear-gradient(160deg, rgba(230, 168, 23, 0.18), rgba(14, 165, 160, 0.14))',
		border: '1px solid rgba(255, 209, 102, 0.24)',
		boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
	},
	highlightLabel: {
		display: 'block',
		fontSize: 11,
		textTransform: 'uppercase',
		letterSpacing: 1.3,
		color: '#ffd166',
		fontWeight: 700,
	},
	highlightValue: {
		display: 'block',
		fontSize: 15,
		fontWeight: 700,
		color: '#ffffff',
		marginTop: 8,
	},
	highlightCopy: {
		fontSize: 12,
		lineHeight: 1.6,
		color: 'rgba(255,255,255,0.72)',
		margin: '8px 0 0',
	},
	navScroll: {
		flex: 1,
		overflowY: 'auto',
		padding: '14px 0 10px',
	},
	navSection: {
		marginBottom: 10,
		padding: '0 12px',
	},
	navSectionTitle: {
		display: 'block',
		fontSize: 11,
		fontWeight: 600,
		color: 'rgba(255,255,255,0.42)',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		padding: '10px 8px 6px',
	},
	navItem: {
		display: 'flex',
		alignItems: 'center',
		gap: 12,
		width: '100%',
		padding: '12px 12px',
		background: 'transparent',
		border: '1px solid transparent',
		borderRadius: 14,
		cursor: 'pointer',
		fontSize: 14,
		textAlign: 'left',
		transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
	},
	navItemActive: {
		background: 'linear-gradient(135deg, rgba(230, 168, 23, 0.22), rgba(14, 165, 160, 0.18))',
		border: '1px solid rgba(255, 209, 102, 0.18)',
		transform: 'translateX(2px)',
	},
	navIcon: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: 36,
		height: 36,
		borderRadius: 12,
		background: 'rgba(255,255,255,0.08)',
		color: '#ffd166',
		flexShrink: 0,
	},
	navIconActive: {
		background: 'rgba(255,255,255,0.16)',
		color: '#ffffff',
	},
	sidebarFooter: {
		padding: '16px',
		borderTop: '1px solid rgba(255,255,255,0.08)',
		display: 'flex',
		flexDirection: 'column',
		gap: 12,
	},
	userCard: {
		display: 'flex',
		flexDirection: 'column',
		gap: 4,
		padding: '14px 16px',
		borderRadius: 16,
		background: 'rgba(255,255,255,0.06)',
		border: '1px solid rgba(255,255,255,0.08)',
	},
	userLabel: {
		fontSize: 11,
		color: 'rgba(255,255,255,0.54)',
		textTransform: 'uppercase',
		letterSpacing: 1.2,
	},
	userEmail: {
		fontSize: 13,
		color: '#ffffff',
		fontWeight: 600,
	},
	miniStatGrid: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: 8,
	},
	miniStat: {
		background: 'rgba(255,255,255,0.06)',
		borderRadius: 14,
		padding: '10px 12px',
		border: '1px solid rgba(255,255,255,0.08)',
		display: 'flex',
		flexDirection: 'column',
		gap: 2,
	},
	miniStatLabel: {
		fontSize: 11,
		color: 'rgba(255,255,255,0.54)',
	},
	miniStatValue: {
		fontSize: 16,
		fontWeight: 700,
		color: '#ffffff',
	},
	logoutBtn: {
		width: '100%',
		padding: '11px',
		background: 'linear-gradient(135deg, rgba(230, 168, 23, 0.14), rgba(255,255,255,0.06))',
		border: '1px solid rgba(255, 209, 102, 0.2)',
		borderRadius: 14,
		fontSize: 13,
		color: '#ffffff',
		fontWeight: 700,
		cursor: 'pointer',
		textAlign: 'center',
	},
}