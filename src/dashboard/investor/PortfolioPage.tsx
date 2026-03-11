import InvestorLayout, { investorCardStyle } from './InvestorLayout'

export default function PortfolioPage() {
  return (
    <InvestorLayout>
      <section style={investorCardStyle}>
        <h2>Portfolio</h2>
        <p>Track portfolio performance, milestones, and governance updates.</p>
      </section>
    </InvestorLayout>
  )
}