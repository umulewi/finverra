import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar, Footer } from '../App'
import EventsSection from '../components/EventsSection'
import { buildApiUrl } from '../config/api'
import '../showcase/EventsGalleryPage.css'
import './ProgramsPage.css'

type APIProgram = {
  id: number
  title: string
  slug: string
  description: string
  launch_date: string | null
  duration: string | null
  program_highlight: string | null
  created_at: string
}

function parseHighlights(raw?: string | null) {
  if (!raw) return [] as string[]
  return raw.split(/<br\s*\/?>/i).map(s => s.trim()).filter(Boolean)
}

function formatLaunchDate(dateValue?: string | null) {
  if (!dateValue) return 'TBA'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'TBA'
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function EventsGalleryPage() {
  const [programs, setPrograms] = useState<APIProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(buildApiUrl('/admin/programs'))
        const data = await res.json().catch(() => null)
        if (!res.ok || !data) throw new Error('Failed to load programs')

        const rows: APIProgram[] = Array.isArray(data) ? data : data.programs ?? []
        setPrograms(rows)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load programs')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const selectedProgram = programs.find(p => p.id === selectedProgramId) ?? (programs.length > 0 && selectedProgramId === null ? programs[0] : null)

  return (
    <main className="events-page">
      <Navbar />

      <section className="programs-hero">
        <div className="programs-hero-overlay" aria-hidden="true" />
        <div className="container programs-hero-content">
          <p className="programs-eyebrow">Events & Programs</p>
          <h1>Events and programs in one place</h1>
          <p>
            Explore FINVERRA&apos;s annual events alongside the programs that support entrepreneurs,
            students, and investors through structured growth opportunities.
          </p>
          <div className="programs-actions">
            <Link to="/events" className="programs-btn programs-btn-secondary">View Events</Link>
            <Link to="/programs" className="programs-btn programs-btn-primary">View Programs</Link>
          </div>
        </div>
      </section>

      <EventsSection sectionId="events-programs-events" />

      <section className="programs-overview section">
        <div className="container">
          <div className="programs-overview-header">
            <div>
              <p className="programs-kicker">Programs Portfolio</p>
              <h2>Programs</h2>
              <p>
                This combined page keeps the latest event content and a live program list in one route.
              </p>
            </div>
            <div className="programs-count-card">
              <span>Total Programs</span>
              <strong>{programs.length}</strong>
            </div>
          </div>

          {loading ? (
            <div className="programs-catalog-grid" style={{ textAlign: 'center', padding: '40px 0', color: '#7a90a8' }}>
              Loading programs...
            </div>
          ) : error ? (
            <div className="programs-catalog-grid" style={{ textAlign: 'center', padding: '40px 0', color: '#dc2626' }}>
              {error}
            </div>
          ) : programs.length === 0 ? (
            <div className="programs-catalog-grid" style={{ textAlign: 'center', padding: '40px 0', color: '#7a90a8' }}>
              No programs available.
            </div>
          ) : (
            <>
              <div className="programs-catalog-grid">
                {programs.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`program-summary-card ${selectedProgramId === p.id || (selectedProgramId === null && programs[0].id === p.id) ? 'active' : ''}`}
                    onClick={() => setSelectedProgramId(p.id)}
                    aria-pressed={selectedProgramId === p.id}
                  >
                    <div className="program-summary-top">
                      <span className="program-tag">Our Program</span>
                      <span className={`program-status ${new Date(p.launch_date || '') > new Date() ? 'status-upcoming' : 'status-active'}`}>
                        {new Date(p.launch_date || '') > new Date() ? 'Upcoming' : 'Active'}
                      </span>
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.slug || p.description}</p>
                    <div className="program-summary-meta">
                      <span>Launch: {formatLaunchDate(p.launch_date)}</span>
                      <span>Duration: {p.duration || 'TBA'}</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedProgram && (
                <article className="program-card" id={`program-${selectedProgram.id}`} style={{ marginTop: '18px' }}>
                  <header className="program-card-header">
                    <div className="program-card-tags">
                      <span className="program-tag">Our Program</span>
                      <span className={`program-status ${new Date(selectedProgram.launch_date || '') > new Date() ? 'status-upcoming' : 'status-active'}`}>
                        {new Date(selectedProgram.launch_date || '') > new Date() ? 'Upcoming' : 'Active'}
                      </span>
                    </div>
                    <h2>{selectedProgram.title}</h2>
                    <p>{selectedProgram.description}</p>
                  </header>

                  <div className="program-meta-grid">
                    <div className="program-meta-item">
                      <h3>Launch Date</h3>
                      <p>{formatLaunchDate(selectedProgram.launch_date)}</p>
                    </div>
                    
                    <div className="program-meta-item">
                      <h3>Duration</h3>
                      <p>{selectedProgram.duration || 'TBA'}</p>
                    </div>
                  </div>

                  {parseHighlights(selectedProgram.program_highlight).length > 0 && (
                    <div className="program-highlights">
                      <h3>Program Highlights</h3>
                      <ul>
                        {parseHighlights(selectedProgram.program_highlight).map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
