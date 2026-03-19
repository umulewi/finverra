import type { CSSProperties } from 'react'

type InvestorHeaderProps = {
	onToggleSidebar: () => void
	searchVal: string
	onSearchChange: (val: string) => void
}

export default function InvestorHeader({ onToggleSidebar, searchVal: _searchVal, onSearchChange: _onSearchChange }: InvestorHeaderProps) {
	return (
		<header style={styles.topbar}>
			<div style={styles.topbarLeft}>
				<button type="button" style={styles.hamburger} onClick={onToggleSidebar} aria-label="Toggle menu">
					<svg width="18" height="18" fill="none" stroke="#0f1e35" strokeWidth="2" viewBox="0 0 24 24">
						<line x1="3" y1="6" x2="21" y2="6" />
						<line x1="3" y1="12" x2="21" y2="12" />
						<line x1="3" y1="18" x2="21" y2="18" />
					</svg>
				</button>

				

				
			</div>

			<div style={styles.topbarRight}>
				
				

				<div style={styles.avatarWrap}>
					<div style={styles.avatar}>IV</div>
					<div style={styles.avatarMeta}>
						<span style={styles.avatarRole}>Investor</span>
						<strong style={styles.avatarName}>Finverra</strong>
					</div>
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
		border: '1px solid rgba(15, 30, 53, 0.08)',
		borderRadius: 24,
		boxShadow: '0 18px 40px rgba(15, 45, 92, 0.08)',
		zIndex: 50,
	},
	topbarLeft: {
		display: 'flex',
		alignItems: 'center',
		gap: 16,
		minWidth: 0,
	},
	hamburger: {
		background: 'linear-gradient(135deg, #fff8e6, #ffffff)',
		border: '1px solid rgba(230, 168, 23, 0.22)',
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
		border: '1px solid rgba(15, 30, 53, 0.08)',
		boxShadow: '0 10px 24px rgba(15, 45, 92, 0.06)',
	},
	avatar: {
		width: 38,
		height: 38,
		borderRadius: '50%',
		background: 'linear-gradient(135deg, #0f2d5c, #1a4080)',
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
		color: '#0f1e35',
	},
}