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

function SetIcon(): ReactElement {
	return (
		<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
		</svg>
	)
}

function FeeIcon(): ReactElement {
	return (
		<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
			<circle cx="12" cy="12" r="10" />
			<path d="M12 7v10" />
			<path d="M9 9.5h4a2.5 2.5 0 0 1 0 5h-4" />
		</svg>
	)
}

function CalendarIcon(): ReactElement {
	return (
		<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
			<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
			<path d="M16 2v4M8 2v4" />
			<path d="M3 10h18" />
		</svg>
	)
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const navSections: NavSection[] = [
	{
		title: 'Core',
		items: [
			{ label: 'Dashboard', icon: DashIcon },
			{ label: 'My Profile', icon: SetIcon },
	
			{ label: 'Application Form', icon: PipeIcon },
			{ label: 'Application Status', icon: FeeIcon },
			{ label: 'Project to Invest in', icon: FeeIcon },
			{ label: 'Project I have applied in', icon: FeeIcon },
			{ label: 'Payment', icon: FeeIcon },
			{ label: 'Book Appointment', icon: CalendarIcon },
			{ label: 'Service Fees', icon: FeeIcon },

		],
	},
	
		
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function InvestorSidebar({ email: _email, activeNav, onNavigate, onLogout }: InvestorSidebarProps): ReactElement {
	return (
		<aside style={styles.sidebar}>
			<div style={styles.sidebarBrand}>
				<div style={styles.brandLogo}>
					<img src="/logo-finverra-white.png" alt="Finverra" style={styles.brandImage} />
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
		width: '100%',
		maxWidth: 280,
		height: '100%',
		background: 'linear-gradient(180deg, #023341 0%, #023341 52%, #023341 100%)',
		borderRight: '1px solid rgba(255, 255, 255, 0.08)',
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden',
		boxShadow: '14px 0 28px rgba(2, 51, 65, 0.16)',
	},
	sidebarBrand: {
		padding: '12px 12px 10px',
		borderBottom: '1px solid rgba(255,255,255,0.08)',
	},
	brandLogo: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		minHeight: 64,
	},
	brandImage: {
		width: '92%',
		maxWidth: 240,
		height: 'auto',
		maxHeight: 72,
		objectFit: 'contain',
		flexShrink: 0,
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
		background: 'linear-gradient(135deg, rgba(255, 236, 0, 0.24), rgba(255, 236, 0, 0.14))',
		border: '1px solid rgba(255, 236, 0, 0.22)',
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
		color: '#ffec00',
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
		background: 'linear-gradient(135deg, rgba(255, 236, 0, 0.2), rgba(255,255,255,0.08))',
		border: '1px solid rgba(255, 236, 0, 0.3)',
		borderRadius: 14,
		fontSize: 13,
		color: '#023341',
		fontWeight: 700,
		cursor: 'pointer',
		textAlign: 'center',
	},
}