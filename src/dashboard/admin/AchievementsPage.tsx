import type { CSSProperties } from 'react'
import AdminShell from './AdminShell'

export default function AchievementsPage() {
  return (
    <AdminShell
      title="Achievements Management"
      subtitle="Track milestones, publish outcomes, and present platform progress in a trusted format."
    >
      <article style={styles.card}>
        <p style={styles.label}>Achievements</p>
        <h3 style={styles.heading}>Performance Highlights</h3>
        <p style={styles.copy}>Use this page to manage public proof points, completed transactions, and ecosystem impact metrics.</p>
      </article>
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  card: {
    borderRadius: 20,
    border: '1px solid rgba(15, 30, 53, 0.1)',
    padding: 20,
    background: '#ffffff',
    boxShadow: '0 18px 36px rgba(15, 45, 92, 0.06)',
  },
  label: {
    margin: 0,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: 700,
    color: '#1a4080',
  },
  heading: {
    margin: '8px 0 0',
    color: '#0f1e35',
    fontSize: 20,
  },
  copy: {
    margin: '10px 0 0',
    color: '#516178',
    lineHeight: 1.7,
  },
}
