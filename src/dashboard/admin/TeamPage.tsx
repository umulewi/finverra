import type { CSSProperties } from 'react'
import AdminShell from './AdminShell'

export default function TeamPage() {
  return (
    <AdminShell
      title="Team Management"
      subtitle="Maintain leadership profiles, roles, and support contacts that represent Finverra to the public."
    >
      <article style={styles.card}>
        <p style={styles.label}>Team</p>
        <h3 style={styles.heading}>People and Roles</h3>
        <p style={styles.copy}>Keep team member details accurate and aligned with the current organization structure and responsibilities.</p>
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
