import InvestorLayout, { investorCardStyle } from './InvestorLayout'

export default function EditProfile() {
  return (
    <InvestorLayout>
      <section style={investorCardStyle}>
        <h2>Edit Profile</h2>
        <p>Update investor identity, organization details, and public profile information.</p>
      </section>
    </InvestorLayout>
  )
}
