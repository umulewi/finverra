import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import AdminShell from './AdminShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'

/* ─── Brand tokens ─────────────────────────────────────────────────── */
const BRAND = {
  dark:    '#023341',
  yellow:  '#ffec00',
  mid:     '#0a5c72',
  light:   '#1a8fa8',
  pale:    '#d0eef4',
  surface: '#f4f9fb',
  border:  '#dce8ec',
  muted:   '#5c7f8a',
  white:   '#ffffff',
}

const CHART_PALETTE = [
  BRAND.dark, BRAND.mid, BRAND.light, '#2db3cc',
  '#42c9dc', '#6ed8e7', '#a3e8f0', '#d4f4f9',
]

/* ─── Types ────────────────────────────────────────────────────────── */
interface DashboardStats {
  entrepreneurs: number
  entrepreneur_applications: number
  investors: number
  investor_applications: number
  services: number
  events: number
  partners: number
  team_members: number
}

/* ─── Auth helper ──────────────────────────────────────────────────── */
function authHeader(): HeadersInit {
  const session = getAuthSession()
  return session
    ? { Authorization: `Bearer ${(session.payload as { token?: string })?.token ?? ''}` }
    : {}
}

/* ─── Tooltip customisation ────────────────────────────────────────── */
function BrandTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={styles.tooltipBox}>
      <p style={styles.tooltipLabel}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ ...styles.tooltipVal, color: p.color === BRAND.yellow ? BRAND.yellow : '#e0f4f8' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

/* ─── Small stat row ────────────────────────────────────────────────── */
function StatRow({ label, value, badge }: { label: string; value: number; badge?: string }) {
  return (
    <div style={styles.statRow}>
      <span style={styles.statRowLabel}>
        {label}
        {badge && <span style={styles.badge}>{badge}</span>}
      </span>
      <span style={styles.statRowValue}>{value.toLocaleString()}</span>
    </div>
  )
}

/* ─── KPI Card ──────────────────────────────────────────────────────── */
interface KpiProps {
  label: string
  primary?: number
  left?: { label: string; value: number }
  right?: { label: string; value: number }
  accent?: string
}
function KpiCard({ label, primary, left, right, accent = BRAND.dark }: KpiProps) {
  return (
    <div style={{ ...styles.kpiCard, '--accent': accent } as CSSProperties}>
      <div style={{ ...styles.kpiAccentBar, background: accent }} />
      <p style={styles.kpiLabel}>{label.toUpperCase()}</p>
      {primary !== undefined && (
        <p style={{ ...styles.kpiValue, color: accent === BRAND.yellow ? BRAND.dark : BRAND.dark }}>
          {primary.toLocaleString()}
        </p>
      )}
      {left && right && (
        <div style={styles.kpiSplit}>
          <div style={styles.kpiSplitItem}>
            <p style={styles.kpiSplitLabel}>{left.label}</p>
            <p style={styles.kpiSplitValue}>{left.value.toLocaleString()}</p>
          </div>
          <div style={styles.kpiDivider} />
          <div style={styles.kpiSplitItem}>
            <p style={styles.kpiSplitLabel}>{right.label}</p>
            <p style={styles.kpiSplitValue}>{right.value.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Chart card wrapper ────────────────────────────────────────────── */
function ChartCard({ title, dot = BRAND.dark, children }: { title: string; dot?: string; children: React.ReactNode }) {
  return (
    <div style={styles.chartCard}>
      <div style={styles.chartHeader}>
        <span style={{ ...styles.chartDot, background: dot, border: dot === BRAND.yellow ? `1px solid ${BRAND.border}` : 'none' }} />
        <h3 style={styles.chartTitle}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main page                                                          */
/* ═══════════════════════════════════════════════════════════════════ */
export default function StatisticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [isTablet, setIsTablet] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 1024 : false)
  const [isPhone, setIsPhone] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 640 : false)

  useEffect(() => { loadStatistics() }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth <= 1024)
      setIsPhone(window.innerWidth <= 640)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  async function loadStatistics() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(buildApiUrl('/admin/dashboard/stats'), {
        headers: authHeader(),
        method: 'GET',
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      if (data.success && data.stats) {
        setStats(data.stats)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  /* ── Loading ─────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <AdminShell title="Dashboard Statistics" subtitle="Overview of all platform components">
        <div style={styles.loadingContainer}>
          <div style={styles.spinnerRing} />
          <p style={styles.loadingText}>Loading statistics…</p>
        </div>
      </AdminShell>
    )
  }

  /* ── Error ───────────────────────────────────────────────────────── */
  if (error || !stats) {
    return (
      <AdminShell title="Dashboard Statistics" subtitle="Overview of all platform components">
        <div style={styles.errorBox}>
          <div style={styles.errorIcon}>!</div>
          <p style={styles.errorText}>{error || 'No data available'}</p>
          <button onClick={loadStatistics} style={styles.retryBtn}>
            Retry
          </button>
        </div>
      </AdminShell>
    )
  }

  /* ── Chart data ──────────────────────────────────────────────────── */
  const allComponentsData = [
    { name: 'Entrepreneurs', value: stats.entrepreneurs },
    { name: 'Applications', value: stats.entrepreneur_applications },
    { name: 'Investors',    value: stats.investors },
    { name: 'Inv. Apps',    value: stats.investor_applications },
    { name: 'Services',     value: stats.services },
    { name: 'Events',       value: stats.events },
    { name: 'Partners',     value: stats.partners },
    { name: 'Team',         value: stats.team_members },
  ]

  const platformComponentsData = [
    { name: 'Services', value: stats.services },
    { name: 'Events',   value: stats.events },
    { name: 'Partners', value: stats.partners },
    { name: 'Team',     value: stats.team_members },
  ]

  const conversionData = [
    { name: 'Entrepreneurs', users: stats.entrepreneurs, applications: stats.entrepreneur_applications },
    { name: 'Investors',     users: stats.investors,     applications: stats.investor_applications },
  ]

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <AdminShell title="Dashboard Statistics" subtitle="Overview of all platform components">
      <div style={{ ...styles.page, ...(isPhone ? styles.pagePhone : {}) }}>

        {/* ── KPI row ── */}
        <div style={{ ...styles.kpiGrid, ...(isTablet ? styles.kpiGridTablet : {}), ...(isPhone ? styles.kpiGridPhone : {}) }}>
          <KpiCard
            label="Entrepreneurs"
            left={{ label: 'Active', value: stats.entrepreneurs }}
            right={{ label: 'Applications', value: stats.entrepreneur_applications }}
            accent={BRAND.yellow}
          />
          <KpiCard
            label="Investors"
            left={{ label: 'Active', value: stats.investors }}
            right={{ label: 'Applications', value: stats.investor_applications }}
            accent={BRAND.mid}
          />
        </div>

        {/* ── Charts 2×2 ── */}
        <div style={{ ...styles.chartsGrid, ...(isTablet ? styles.chartsGridTablet : {}) }}>

          {/* Bar — all components */}
          <ChartCard title="All components overview" dot={BRAND.dark}>
            <ResponsiveContainer width="100%" height={isPhone ? 220 : 260}>
              <BarChart data={allComponentsData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: BRAND.muted, fontSize: 11 }} axisLine={false} tickLine={false} angle={isPhone ? -20 : -35} textAnchor="end" height={isPhone ? 50 : 60} />
                <YAxis tick={{ fill: BRAND.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<BrandTooltip />} cursor={{ fill: 'rgba(2,51,65,0.04)' }} />
                <Bar dataKey="value" name="Count" fill={BRAND.dark} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Pie — distribution */}
          <ChartCard title="Component distribution" dot={BRAND.yellow}>
            <ResponsiveContainer width="100%" height={isPhone ? 200 : 220}>
              <PieChart>
                <Pie
                  data={platformComponentsData}
                  cx="50%" cy="50%"
                  innerRadius={isPhone ? 40 : 55}
                  outerRadius={isPhone ? 68 : 85}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(((percent ?? 0) * 100)).toFixed(0)}%`}
                >
                  {platformComponentsData.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<BrandTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom legend */}
            <div style={styles.pieLegend}>
              {platformComponentsData.map((item, i) => (
                <span key={i} style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: CHART_PALETTE[i] }} />
                  {item.name}
                </span>
              ))}
            </div>
          </ChartCard>

          {/* Line — users vs applications */}
          <ChartCard title="Users & applications ratio" dot={BRAND.light}>
            <ResponsiveContainer width="100%" height={isPhone ? 220 : 260}>
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: BRAND.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: BRAND.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<BrandTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: BRAND.muted, paddingTop: 8 }}
                  formatter={(value) => <span style={{ color: BRAND.muted }}>{value}</span>}
                />
                <Line
                  type="monotone" dataKey="users" name="Active users"
                  stroke={BRAND.dark} strokeWidth={2.5}
                  dot={{ fill: BRAND.dark, r: 5, strokeWidth: 0 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone" dataKey="applications" name="Applications"
                  stroke={BRAND.yellow} strokeWidth={2.5} strokeDasharray="5 3"
                  dot={{ fill: BRAND.yellow, r: 5, stroke: BRAND.dark, strokeWidth: 1 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Bar — ecosystem */}
          <ChartCard title="Platform ecosystem" dot={BRAND.mid}>
            <ResponsiveContainer width="100%" height={isPhone ? 220 : 260}>
              <BarChart data={platformComponentsData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: BRAND.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: BRAND.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<BrandTooltip />} cursor={{ fill: 'rgba(2,51,65,0.04)' }} />
                <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
                  {platformComponentsData.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

        {/* ── Bottom row: table + grouped bar ── */}
        <div style={{ ...styles.bottomRow, ...(isTablet ? styles.bottomRowTablet : {}) }}>

          {/* Detailed table */}
          <div style={{ ...styles.tableCard, ...(isPhone ? styles.cardPhone : {}) }}>
            <div style={styles.chartHeader}>
              <span style={{ ...styles.chartDot, background: BRAND.dark }} />
              <h3 style={styles.chartTitle}>Detailed statistics</h3>
            </div>
            <div>
              <StatRow label="Entrepreneurs"              value={stats.entrepreneurs} />
              <StatRow label="Entrepreneur applications"  value={stats.entrepreneur_applications} badge="apps" />
              <StatRow label="Investors"                  value={stats.investors} />
              <StatRow label="Investor applications"      value={stats.investor_applications} badge="apps" />
              <StatRow label="Services"                   value={stats.services} />
              <StatRow label="Events"                     value={stats.events} />
              <StatRow label="Partners"                   value={stats.partners} />
              <StatRow label="Team members"               value={stats.team_members} />
            </div>
          </div>

          {/* Grouped bar — conversion */}
          <ChartCard title="Conversion overview" dot={BRAND.yellow}>
            <ResponsiveContainer width="100%" height={isPhone ? 230 : 280}>
              <BarChart data={conversionData} barCategoryGap="30%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: BRAND.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: BRAND.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<BrandTooltip />} cursor={{ fill: 'rgba(2,51,65,0.04)' }} />
                <Bar dataKey="users"        name="Active users"  fill={BRAND.dark}   radius={[5, 5, 0, 0]} />
                <Bar dataKey="applications" name="Applications"  fill={BRAND.yellow} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={styles.pieLegend}>
              <span style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: BRAND.dark }} />
                Active users
              </span>
              <span style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: BRAND.yellow, border: `1px solid ${BRAND.border}` }} />
                Applications
              </span>
            </div>
          </ChartCard>

        </div>

      </div>
    </AdminShell>
  )
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Styles                                                             */
/* ═══════════════════════════════════════════════════════════════════ */
const styles: Record<string, CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
  },
  pagePhone: {
    gap: 14,
  },

  /* Top bar */
  topBar: {
    background: BRAND.dark,
    borderRadius: 14,
    padding: '18px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: BRAND.yellow,
    letterSpacing: '-0.2px',
  },
  topBarSub: {
    margin: '3px 0 0',
    fontSize: 13,
    color: 'rgba(255,236,0,0.5)',
  },
  refreshBtn: {
    background: BRAND.yellow,
    color: BRAND.dark,
    border: 'none',
    borderRadius: 8,
    padding: '9px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    letterSpacing: '0.1px',
    transition: 'opacity 0.2s',
  },

  /* KPI grid */
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(260px, 360px))',
    justifyContent: 'center',
    gap: 14,
  },
  kpiGridTablet: {
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  kpiGridPhone: {
    gridTemplateColumns: '1fr',
    gap: 10,
  },
  kpiCard: {
    background: BRAND.white,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 12,
    padding: '16px 18px',
    position: 'relative',
    overflow: 'hidden',
  },
  kpiAccentBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 3,
    borderRadius: '12px 12px 0 0',
  },
  kpiLabel: {
    margin: '6px 0 8px',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.8px',
    color: BRAND.muted,
  },
  kpiValue: {
    margin: 0,
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1,
    color: BRAND.dark,
  },
  kpiSplit: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    paddingTop: 10,
    borderTop: `1px solid ${BRAND.border}`,
  },
  kpiSplitItem: { flex: 1, textAlign: 'center' as const },
  kpiSplitLabel: { margin: 0, fontSize: 10, color: BRAND.muted, textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  kpiSplitValue: { margin: '4px 0 0', fontSize: 22, fontWeight: 600, color: BRAND.dark },
  kpiDivider: { width: 1, height: 36, background: BRAND.border, flexShrink: 0 },

  /* Charts */
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },
  chartsGridTablet: {
    gridTemplateColumns: '1fr',
    gap: 12,
  },
  chartCard: {
    background: BRAND.white,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 12,
    padding: '18px 20px',
  },
  chartHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  chartTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: BRAND.dark,
    letterSpacing: '-0.1px',
  },

  /* Pie legend */
  pieLegend: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px 16px',
    marginTop: 10,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    color: BRAND.muted,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    flexShrink: 0,
  },

  /* Bottom row */
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: 16,
  },
  bottomRowTablet: {
    gridTemplateColumns: '1fr',
    gap: 12,
  },
  tableCard: {
    background: BRAND.white,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 12,
    padding: '18px 20px',
  },
  cardPhone: {
    borderRadius: 10,
    padding: '14px 14px',
  },

  /* Stat rows */
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: `1px solid ${BRAND.border}`,
  },
  statRowLabel: {
    fontSize: 13,
    color: BRAND.muted,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: 700,
    color: BRAND.dark,
  },
  badge: {
    fontSize: 9,
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 20,
    background: `rgba(2,51,65,0.07)`,
    color: BRAND.dark,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },

  /* Tooltip */
  tooltipBox: {
    background: BRAND.dark,
    border: 'none',
    borderRadius: 8,
    padding: '10px 14px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
  },
  tooltipLabel: {
    margin: '0 0 4px',
    fontSize: 12,
    color: BRAND.yellow,
    fontWeight: 600,
  },
  tooltipVal: {
    margin: 0,
    fontSize: 13,
    color: '#e0f4f8',
  },

  /* Loading */
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 420,
    gap: 16,
  },
  spinnerRing: {
    width: 44,
    height: 44,
    border: `3px solid ${BRAND.pale}`,
    borderTop: `3px solid ${BRAND.dark}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: 14,
    color: BRAND.muted,
  },

  /* Error */
  errorBox: {
    background: '#fff8f8',
    border: '1px solid #fecaca',
    borderRadius: 12,
    padding: 32,
    textAlign: 'center',
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#fee2e2',
    color: '#dc2626',
    fontSize: 22,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
  },
  errorText: {
    margin: '0 0 16px',
    color: '#991b1b',
    fontSize: 14,
  },
  retryBtn: {
    padding: '9px 28px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
}