import InvestorLayout, { investorCardStyle } from './InvestorLayout'

export default function SettingsPage() {
  return (
    <InvestorLayout>
      <section style={investorCardStyle}>
        <h2>Settings</h2>
        <p>Manage profile preferences, security options, and account controls.</p>
      </section>
    </InvestorLayout>
  )
}