import InvestorLayout, { investorCardStyle } from './InvestorLayout'

export default function PipelinePage() {
  return (
    <InvestorLayout>
      <section style={investorCardStyle}>
        <h2>Pipeline</h2>
        <p>Deal screening, due diligence, and stage movement live here.</p>
      </section>
    </InvestorLayout>
  )
}