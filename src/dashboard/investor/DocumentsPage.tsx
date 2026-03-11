import InvestorLayout, { investorCardStyle } from './InvestorLayout'

export default function DocumentsPage() {
  return (
    <InvestorLayout>
      <section style={investorCardStyle}>
        <h2>Documents</h2>
        <p>Central access to term sheets, legal files, and financial models.</p>
      </section>
    </InvestorLayout>
  )
}