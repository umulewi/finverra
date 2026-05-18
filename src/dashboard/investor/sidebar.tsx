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
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
			<path d="M3 13h4v8H3zM10 7h4v14h-4zM17 3h4v18h-4z" />
		</svg>
	)
}

function ProfileIcon(): ReactElement {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
			<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
			<circle cx="12" cy="7" r="4" />
		</svg>
	)
}

function FileTextIcon(): ReactElement {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<path d="M14 2v6h6" />
			<path d="M8 13h8M8 17h8" />
		</svg>
	)
}

function ClipboardCheckIcon(): ReactElement {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
			<path d="M9 11l2 2 4-4" />
			<path d="M16 4h-1.5a2 2 0 0 0-3.9 0H9a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
		</svg>
	)
}

function BriefcaseIcon(): ReactElement {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
			<rect x="2" y="7" width="20" height="13" rx="2" ry="2" />
			<path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
		</svg>
	)
}

function FolderIcon(): ReactElement {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
			<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
		</svg>
	)
}

function CreditCardIcon(): ReactElement {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
			<rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
			<path d="M2 10h20" />
		</svg>
	)
}

function DollarIcon(): ReactElement {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
			<path d="M12 1v22" />
			<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H15a3.5 3.5 0 0 1 0 7H6" />
		</svg>
	)
}

function CalendarIcon(): ReactElement {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
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
			{ label: 'My Profile', icon: ProfileIcon },

			{ label: 'Application Form', icon: FileTextIcon },
			{ label: 'Application Status', icon: ClipboardCheckIcon },
			{ label: 'Project to Invest in', icon: BriefcaseIcon },
			{ label: 'Project I have applied in', icon: FolderIcon },
			{ label: 'Payment', icon: CreditCardIcon },
			{ label: 'Book Appointment', icon: CalendarIcon },
			{ label: 'Service Fees', icon: DollarIcon },

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