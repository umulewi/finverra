import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Footer, Navbar } from '../App'
import './InvestInPage.css'
import { buildApiUrl } from '../config/api'

type Project = {
  id: number
  title: string
  description: string
  image: string
}

type ProjectsResponse = {
  success?: boolean
  message?: string
  projects?: Project[]
}

async function parseResponseBody(response: Response): Promise<ProjectsResponse | string> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()

  try {
    return JSON.parse(text) as ProjectsResponse
  } catch {
    return text
  }
}

export default function InvestInPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token')
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (token) {
          headers.Authorization = `Bearer ${token}`
        }

        const response = await fetch(buildApiUrl('/admin/projects'), {
          method: 'GET',
          headers,
        })

        const data = await parseResponseBody(response)

        if (!response.ok) {
          const message = typeof data === 'string' ? data : data.message
          throw new Error(message || 'Failed to fetch projects')
        }

        if (typeof data !== 'string' && data.success) {
          setProjects(Array.isArray(data.projects) ? data.projects : [])
        } else {
          throw new Error('Failed to load projects')
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <main className="invest-in-page">
      <Navbar />

      {/* HERO SECTION */}
      <section className="invest-hero">
        <div className="invest-hero-bg" aria-hidden="true" />
        <div className="container invest-hero-content">
          <p className="invest-eyebrow">Investment Opportunities</p>
          <h1>Invest In Projects Built For Real Impact</h1>
          <p>
            These are the projects ready for investment. Each card shows the project image,
            title, and a short description.
          </p>
        </div>
      </section>

      {/* PROJECTS SECTION */}
      <section className="invest-projects section">
        <div className="container">
          <div className="invest-section-head">
            <p className="invest-summary-label">Project Catalog</p>
            <h2>Ready to invest projects</h2>
          </div>

          {/* STATES */}
          {loading && <p className="text-center">Loading projects...</p>}
          {error && <p className="text-center error">{error}</p>}
          {!loading && !error && projects.length === 0 && (
            <p className="text-center">No projects found.</p>
          )}

          {/* PROJECT GRID */}
          {!loading && !error && projects.length > 0 && (
            <div className="invest-grid">
              {projects.map((project) => (
                <article className="invest-card" key={project.id}>
                  <img
                    src={buildApiUrl(project.image)}
                    alt={project.title}
                    className="invest-card-image"
                  />

                  <div className="invest-card-body">
                    <h3>{project.title}</h3>
                    <p className="invest-summary">{project.description}</p>

                    <Link
                      to="/dashboard/investor/login"
                      className="invest-btn invest-btn-primary invest-card-btn"
                    >
                      More Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}