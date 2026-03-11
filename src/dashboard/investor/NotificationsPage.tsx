import InvestorLayout, { investorCardStyle } from './InvestorLayout'

export default function NotificationsPage() {
  return (
    <InvestorLayout>
      <section style={investorCardStyle}>
        <h2>Notifications</h2>
        <p>Get all updates on actions, deadlines, and portfolio events.</p>
      </section>
    </InvestorLayout>
  )
}