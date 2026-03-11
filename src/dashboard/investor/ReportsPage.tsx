import InvestorLayout, { investorCardStyle } from './InvestorLayout'

export default function ReportsPage() {
  return (
    <InvestorLayout>
      <section style={investorCardStyle}>
        <h2>Reports</h2>
        <p>Performance snapshots and investment analytics are shown here.</p>
      </section>
    </InvestorLayout>
  )
}