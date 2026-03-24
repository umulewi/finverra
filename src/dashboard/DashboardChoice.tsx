import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Dashboard.css'
import { fetchAvailableRoles } from './dashboardApi'
import type { RoleOption } from './roles'

export default function DashboardChoice() {
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadRoles = async () => {
      try {
        const nextRoles = await fetchAvailableRoles()

        if (!isMounted) {
          return
        }

        setRoles(nextRoles)
        setErrorMessage(nextRoles.length === 0 ? 'No supported roles are available from the server yet.' : '')
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(error instanceof Error ? error.message : 'Unable to load roles right now.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadRoles()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="dashboard-page">
      <div className="account-layout">
        <aside className="account-aside">
          <p className="aside-brand">FINVERRA</p>
          <h1>Finance With Trust</h1>
          <p>
            Secure access for investors and entrepreneurs in one platform.
            Choose your role and continue to your account.
          </p>
          <div className="aside-points">
            <span>Verified opportunities</span>
            <span>Secure collaboration</span>
            <span>Dedicated support</span>
          </div>
          <Link to="/" className="aside-link">Back to Home</Link>
        </aside>

        <section className="account-main">
          <p className="dashboard-eyebrow">Continue As</p>
          <h2 className="account-title">Choose your role to get started</h2>
          <p className="dashboard-subtitle">
            Roles are loaded from the backend at /select_role and each role opens its own dashboard page.
          </p>

          {isLoading ? <div className="dashboard-status-card">Loading available roles...</div> : null}
          {!isLoading && errorMessage ? <div className="dashboard-status-card error">{errorMessage}</div> : null}

          {!isLoading && !errorMessage ? (
            <div className="dashboard-role-grid">
              {roles.map((role) => (
                <Link to={`/dashboard/${role.slug}`} className="dashboard-role-card" key={role.id}>
                  <span className="role-badge">{role.name}</span>
                  <h3>{role.name} Account</h3>
                  <p>{role.shortDescription}</p>
                  <span className="role-action">Continue as {role.name}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
