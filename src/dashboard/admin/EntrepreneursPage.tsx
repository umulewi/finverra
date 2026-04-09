import type { CSSProperties } from 'react'
import AdminShell from './AdminShell'

const metrics = [
  { label: 'Total Entrepreneurs', value: '0' },
  { label: 'Approved Profiles', value: '0' },
  { label: 'Needs Action', value: '0' },
]

export default function EntrepreneursPage() {
  return (
    <AdminShell
      title="Entrepreneurs"
      subtitle="Track entrepreneur profiles and monitor onboarding progress from a central workspace."
    >
      <section style={styles.grid}>
        {metrics.map((metric) => (
          <article key={metric.label} style={styles.card}>
            <p style={styles.metricLabel}>{metric.label}</p>
            <p style={styles.metricValue}>{metric.value}</p>
          </article>
        ))}
      </section>

      <section style={styles.panel}>
        <h3 style={styles.panelTitle}>Entrepreneur Directory</h3>
        <p style={styles.panelText}>
          Entrepreneur management UI is now mapped to navigation. Add API integration to display live records.
        </p>
      </section>
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  grid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e4eaf3',
    borderRadius: 14,
    padding: '16px 18px',
    boxShadow: '0 10px 25px rgba(15, 30, 53, 0.06)',
  },
  metricLabel: {
    margin: 0,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#4c6483',
    fontWeight: 700,
  },
  metricValue: {
    margin: '8px 0 0',
    fontSize: 26,
    color: '#0e2a4f',
    fontWeight: 800,
  },
  panel: {
    marginTop: 16,
    background: '#ffffff',
    border: '1px solid #e4eaf3',
    borderRadius: 14,
    padding: '20px',
  },
  panelTitle: {
    margin: 0,
    color: '#0e2a4f',
    fontSize: 18,
  },
  panelText: {
    margin: '10px 0 0',
    color: '#4c6483',
    lineHeight: 1.6,
  },
}
