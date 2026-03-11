import InvestorLayout, { investorCardStyle } from './InvestorLayout'

export default function MessagesPage() {
  return (
    <InvestorLayout>
      <section style={investorCardStyle}>
        <h2>Messages</h2>
        <p>Conversation center for founders, advisors, and internal teams.</p>
      </section>
    </InvestorLayout>
  )
}