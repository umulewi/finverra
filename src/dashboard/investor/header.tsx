import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

type InvestorHeaderProps = {
	onToggleSidebar: () => void
	searchVal: string
	onSearchChange: (val: string) => void
	onLogout: () => void
}

export async function fetchInvestorDisplayName(email: string, token = '') {
	if (!email) {
		return ''
	}

	const response = await fetch(buildApiUrl(`/investors/name-by-email/${encodeURIComponent(email)}`), {
		headers: {
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	})

	const payload = await response.json().catch(() => null)
	if (!response.ok || !payload || typeof payload !== 'object') {
		return ''
	}

	const investor = (payload as { investor?: { first_name?: unknown; last_name?: unknown } }).investor
	const firstName = typeof investor?.first_name === 'string' ? investor.first_name.trim() : ''
	const lastName = typeof investor?.last_name === 'string' ? investor.last_name.trim() : ''

	return [firstName, lastName].filter(Boolean).join(' ').trim()
}

export default function InvestorHeader({
	onToggleSidebar,
	searchVal: _searchVal,
	onSearchChange: _onSearchChange,
	onLogout,
}: InvestorHeaderProps) {
	const navigate = useNavigate()
	const session = getAuthSession()
	const menuRef = useRef<HTMLDivElement>(null)
	const [menuOpen, setMenuOpen] = useState(false)
	const [viewportWidth, setViewportWidth] = useState<number>(window.innerWidth)
	const [investorName, setInvestorName] = useState('Finverra')
	const [avatarInitials, setAvatarInitials] = useState('IV')

	const email = session?.email ?? ''

	function resolveToken() {
		if (!session) return ''
		if (typeof session.payload === 'string') return session.payload
		if (typeof session.payload === 'object' && session.payload !== null) {
			const p = session.payload as any
			if (typeof p.token === 'string') return p.token
			if (typeof p.accessToken === 'string') return p.accessToken
			if (typeof p.access_token === 'string') return p.access_token
			if (typeof p.jwt === 'string') return p.jwt
		}
		return ''
	}

	function getInitials(fullName: string) {
		const parts = fullName
			.split(' ')
			.map((part) => part.trim())
			.filter(Boolean)

		if (parts.length === 0) return 'IV'
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
		return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
	}

	useEffect(() => {
		if (!email) {
			return
		}

		let isMounted = true

		async function loadInvestorName() {
			try {
				const token = resolveToken()
				const response = await fetch(buildApiUrl(`/investors/name-by-email/${encodeURIComponent(email)}`), {
					headers: {
						...(token ? { Authorization: `Bearer ${token}` } : {}),
					},
				})

				const payload = await response.json().catch(() => null)
				if (!response.ok || !payload || typeof payload !== 'object') {
					return
				}

				const investor = (payload as { investor?: { first_name?: unknown; last_name?: unknown } }).investor
				const firstName = typeof investor?.first_name === 'string' ? investor.first_name.trim() : ''
				const lastName = typeof investor?.last_name === 'string' ? investor.last_name.trim() : ''
				const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

				if (!isMounted || !fullName) {
					return
				}

				setInvestorName(fullName)
				setAvatarInitials(getInitials(fullName))
			} catch {
				// Keep the default label when the API is unavailable.
			}
		}

		void loadInvestorName()

		return () => {
			isMounted = false
		}
	}, [email])

	useEffect(() => {
		const handleResize = () => setViewportWidth(window.innerWidth)
		window.addEventListener('resize', handleResize)
		handleResize()
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	useEffect(() => {
		function handleOutsideClick(event: MouseEvent) {
			if (!menuRef.current?.contains(event.target as Node)) {
				setMenuOpen(false)
			}
		}

		function handleEscape(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setMenuOpen(false)
			}
		}

		document.addEventListener('mousedown', handleOutsideClick)
		document.addEventListener('keydown', handleEscape)

		return () => {
			document.removeEventListener('mousedown', handleOutsideClick)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [])

	const isPhone = viewportWidth <= 640
	const isTablet = viewportWidth <= 960

	const topbarStyle: CSSProperties = {
		...styles.topbar,
		padding: isPhone ? '10px 12px' : isTablet ? '14px 16px' : '18px 24px',
		borderRadius: isPhone ? 14 : isTablet ? 18 : 24,
		gap: isPhone ? 8 : 12,
	}

	const topbarRightStyle: CSSProperties = {
		...styles.topbarRight,
		gap: isPhone ? 6 : 10,
	}

	const hamburgerStyle: CSSProperties = {
		...styles.hamburger,
		padding: isPhone ? 8 : 10,
		borderRadius: isPhone ? 10 : 14,
	}

	const avatarWrapStyle: CSSProperties = {
		...styles.avatarWrap,
		padding: isPhone ? '4px 6px 4px 4px' : '6px 8px 6px 6px',
		borderRadius: isPhone ? 12 : 18,
	}

	const avatarStyle: CSSProperties = {
		...styles.avatar,
		width: isPhone ? 32 : 38,
		height: isPhone ? 32 : 38,
		fontSize: isPhone ? 11 : 13,
	}

	const avatarMetaStyle: CSSProperties = {
		...styles.avatarMeta,
		display: isPhone ? 'none' : 'flex',
	}

	return (
		<header style={topbarStyle}>
			<div style={styles.topbarLeft}>
				<button type="button" style={hamburgerStyle} onClick={onToggleSidebar} aria-label="Toggle menu">
					<svg width="18" height="18" fill="none" stroke="#023341" strokeWidth="2" viewBox="0 0 24 24">
						<line x1="3" y1="6" x2="21" y2="6" />
						<line x1="3" y1="12" x2="21" y2="12" />
						<line x1="3" y1="18" x2="21" y2="18" />
					</svg>
				</button>

				

				
			</div>

			<div style={topbarRightStyle}>
				
				

				<div style={styles.profileWrap} ref={menuRef}>
					<button
						type="button"
						style={avatarWrapStyle}
						onClick={() => setMenuOpen((open) => !open)}
						aria-haspopup="menu"
						aria-expanded={menuOpen}
						aria-label="Open investor menu"
					>
						<div style={avatarStyle}>{avatarInitials}</div>
						<div style={avatarMetaStyle}>
							<span style={styles.avatarRole}>Investor</span>
							<strong style={styles.avatarName}>{investorName}</strong>
						</div>
						<span style={styles.menuChevron}>▾</span>
					</button>

					{menuOpen ? (
						<div style={styles.dropdown} role="menu" aria-label="Investor account menu">
							<button
								type="button"
								style={styles.dropdownItem}
								onClick={() => {
									setMenuOpen(false)
									navigate('/dashboard/investor/change-password')
								}}
							>
								Change Password
							</button>
							<button
								type="button"
								style={{ ...styles.dropdownItem, ...styles.dropdownItemDanger }}
								onClick={() => {
									setMenuOpen(false)
									onLogout()
								}}
							>
								Logout
							</button>
						</div>
					) : null}
				</div>
			</div>
		</header>
	)
}

const styles: Record<string, CSSProperties> = {
	topbar: {
		position: 'sticky',
		top: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '18px 24px',
		background: 'rgba(255,255,255,0.78)',
		backdropFilter: 'blur(18px)',
		border: '1px solid rgba(2, 51, 65, 0.12)',
		borderRadius: 24,
		boxShadow: '0 8px 18px rgba(2, 51, 65, 0.1)',
		zIndex: 50,
	},
	topbarLeft: {
		display: 'flex',
		alignItems: 'center',
		gap: 16,
		minWidth: 0,
	},
	hamburger: {
		background: 'linear-gradient(135deg, #fffde0, #ffffff)',
		border: '1px solid rgba(255, 236, 0, 0.34)',
		cursor: 'pointer',
		padding: 10,
		borderRadius: 14,
		display: 'flex',
		alignItems: 'center',
	},
	welcomeBlock: {
		display: 'flex',
		flexDirection: 'column',
		gap: 2,
	},
	welcomeKicker: {
		fontSize: 11,
		textTransform: 'uppercase',
		letterSpacing: 1.4,
		color: '#c8910e',
		fontWeight: 700,
	},
	welcomeTitle: {
		fontSize: 15,
		color: '#0f1e35',
		fontWeight: 700,
	},
	searchBox: {
		display: 'flex',
		alignItems: 'center',
		border: '1px solid rgba(15, 30, 53, 0.1)',
		borderRadius: 16,
		padding: '10px 14px',
		minWidth: 260,
		background: '#ffffff',
		boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
	},
	searchInput: {
		border: 'none',
		outline: 'none',
		fontSize: 13,
		color: '#4a5568',
		background: 'transparent',
		width: '100%',
	},
	topbarRight: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
	},
	profileWrap: {
		position: 'relative',
	},
	infoChip: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'flex-start',
		padding: '10px 14px',
		borderRadius: 16,
		border: '1px solid rgba(14, 165, 160, 0.14)',
		background: 'linear-gradient(135deg, rgba(14, 165, 160, 0.12), rgba(255,255,255,0.96))',
	},
	infoChipLabel: {
		fontSize: 10,
		textTransform: 'uppercase',
		letterSpacing: 1.2,
		color: '#0ea5a0',
		fontWeight: 700,
	},
	infoChipValue: {
		fontSize: 14,
		color: '#0f1e35',
		marginTop: 4,
	},
	iconBtn: {
		background: '#ffffff',
		border: '1px solid rgba(15, 30, 53, 0.08)',
		cursor: 'pointer',
		padding: 10,
		borderRadius: 14,
		display: 'flex',
		alignItems: 'center',
		position: 'relative',
		boxShadow: '0 10px 24px rgba(15, 45, 92, 0.06)',
	},
	badge: {
		position: 'absolute',
		top: -4,
		right: -4,
		background: 'linear-gradient(135deg, #e6a817, #c8910e)',
		color: '#fff',
		fontSize: 10,
		fontWeight: 700,
		borderRadius: '50%',
		width: 16,
		height: 16,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	avatarWrap: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
		padding: '6px 8px 6px 6px',
		borderRadius: 18,
		background: '#ffffff',
		border: '1px solid rgba(2, 51, 65, 0.12)',
		boxShadow: '0 4px 12px rgba(2, 51, 65, 0.08)',
		cursor: 'pointer',
	},
	avatar: {
		width: 38,
		height: 38,
		borderRadius: '50%',
		background: 'linear-gradient(135deg, #023341, #045666)',
		color: '#fff',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: 13,
		fontWeight: 600,
	},
	avatarMeta: {
		display: 'flex',
		flexDirection: 'column',
		gap: 2,
	},
	avatarRole: {
		fontSize: 11,
		textTransform: 'uppercase',
		letterSpacing: 1.2,
		color: '#8a96a8',
		fontWeight: 700,
	},
	avatarName: {
		fontSize: 13,
		color: '#023341',
	},
	menuChevron: {
		fontSize: 12,
		color: '#66808b',
		marginLeft: 4,
	},
	dropdown: {
		position: 'absolute',
		top: 'calc(100% + 8px)',
		right: 0,
		minWidth: 180,
		borderRadius: 12,
		border: '1px solid rgba(2, 51, 65, 0.12)',
		background: '#ffffff',
		boxShadow: '0 18px 32px rgba(2,51,65,0.14)',
		overflow: 'hidden',
		zIndex: 100,
	},
	dropdownItem: {
		width: '100%',
		border: 'none',
		borderBottom: '1px solid rgba(2, 51, 65, 0.08)',
		background: '#ffffff',
		color: '#023341',
		textAlign: 'left',
		padding: '10px 12px',
		fontSize: 13,
		fontWeight: 600,
		cursor: 'pointer',
	},
	dropdownItemDanger: {
		borderBottom: 'none',
		color: '#a61d24',
		background: 'rgba(220,38,38,0.05)',
	},
}