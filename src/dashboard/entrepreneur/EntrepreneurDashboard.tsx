import type { CSSProperties } from 'react'
import { getAuthSession } from '../authStorage'
import EntrepreneurShell from './EntrepreneurShell'

const summaryCards = [
  {
    title: 'Business Profile',
    description: 'Keep your company profile, traction, and milestones updated for investor visibility.',
  },
  {
    title: 'Fundraising Pipeline',
    description: 'Track active opportunities, next actions, and conversations with potential investors.',
  },
  {
    title: 'Readiness Score',
    description: 'Prepare documents and metrics so your venture is ready for due diligence.',
  },
]

export default function EntrepreneurDashboard() {
  const session = getAuthSession()

  return (
    <EntrepreneurShell
      title="Entrepreneur Dashboard"
      subtitle={
        session?.email
          ? `${session.email} is signed in to manage venture growth and investor readiness.`
          : 'Manage your venture growth and investor readiness from one workspace.'
      }
    >
      <section style={styles.grid}>
        {summaryCards.map((card) => (
          <article key={card.title} style={styles.card}>
            <span style={styles.kicker}>Active Area</span>
            <h3 style={styles.cardTitle}>{card.title}</h3>
            <p style={styles.cardCopy}>{card.description}</p>
          </article>
        ))}
      </section>
    </EntrepreneurShell>
  )
}

const styles: Record<string, CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(15, 30, 53, 0.08)',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 14px 28px rgba(15, 45, 92, 0.07)',
  },
  kicker: {
    display: 'inline-block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#c8910e',
    fontWeight: 700,
  },
  cardTitle: {
    margin: '10px 0 0',
    fontSize: 18,
    color: '#0f1e35',
    lineHeight: 1.3,
  },
  cardCopy: {
    margin: '10px 0 0',
    fontSize: 14,
    color: '#4e5c73',
    lineHeight: 1.6,
  },
}