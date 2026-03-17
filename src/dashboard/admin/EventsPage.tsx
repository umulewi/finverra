import type { CSSProperties } from 'react'
import AdminShell from './AdminShell'

export default function EventsPage() {
  return (
    <AdminShell
      title="Events Management"
      subtitle="Plan timelines, publish announcements, and keep campaign events current for users and partners."
    >
      <article style={styles.card}>
        <p style={styles.label}>Events</p>
        <h3 style={styles.heading}>Campaign Calendar</h3>
        <p style={styles.copy}>Manage upcoming events, webinar content, and launch schedules with clear operational visibility.</p>
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
