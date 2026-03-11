import { Link, useNavigate } from 'react-router-dom'
import './Dashboard.css'
import { clearAuthSession, getAuthSession } from './authStorage'
import type { RoleSlug } from './roles'
import { getRoleDefinition } from './roles'

type RoleDashboardLayoutProps = {
  role: RoleSlug
}

export default function RoleDashboardLayout({ role }: RoleDashboardLayoutProps) {
  const navigate = useNavigate()
  const session = getAuthSession()
  const roleDefinition = getRoleDefinition(role)

  const handleLogout = () => {
    clearAuthSession()
    navigate(`/dashboard/${role}/login`, { replace: true })
  }

  return (
    <main className="dashboard-page">
      <div className="account-layout dashboard-layout">
        <aside className="account-aside dashboard-aside">
          <p className="aside-brand">FINVERRA</p>
          <h1>{roleDefinition.dashboardHeading}</h1>
          <p>{roleDefinition.dashboardDescription}</p>
          <div className="aside-points">
            {roleDefinition.highlights.map((highlight) => (
              <span key={highlight}>{highlight}</span>
            ))}
          </div>
          <Link to="/dashboard" className="aside-link">Switch Role</Link>
        </aside>

        <section className="account-main dashboard-main">
          <p className="dashboard-eyebrow">Signed In</p>
          <h2 className="account-title">Welcome to the {roleDefinition.name} workspace</h2>
          <p className="dashboard-subtitle">
            {session?.email ? `${session.email} is currently authenticated as ${roleDefinition.name}.` : roleDefinition.dashboardDescription}
          </p>

          <div className="dashboard-summary-grid">
            {roleDefinition.highlights.map((highlight) => (
              <article key={highlight} className="dashboard-summary-card">
                <span className="summary-label">Active Area</span>
                <h3>{highlight}</h3>
                <p>
                  This section is ready for the dedicated {roleDefinition.name.toLowerCase()} dashboard modules you add next.
                </p>
              </article>
            ))}
          </div>

          <div className="auth-links-row dashboard-actions-row">
            <Link to="/">Back to Home</Link>
            <button type="button" className="secondary-action" onClick={handleLogout}>Logout</button>
          </div>
        </section>
      </div>
    </main>
  )
}