import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Footer, Navbar } from '../App'
import { buildApiUrl } from '../config/api'
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

type Program = {
  id: string | number
  name: string
  status: 'Upcoming' | 'Active' | 'Completed'
  launchDate: string
  competitionPeriod: string
  duration: string
  category: string
  summary: string
  description: string
  highlights: string[]
}

function transformAPIProgram(api: APIProgram): Program {
  const launchDate = api.launch_date ? new Date(api.launch_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBA'
  
  // Parse highlights from program_highlight (contains <br> tags)
  const highlights = api.program_highlight
    ? api.program_highlight.split(/<br\s*\/?>/i).filter(h => h.trim()).map(h => h.trim())
    : []

  // Determine status based on launch date
  const status: 'Upcoming' | 'Active' | 'Completed' = api.launch_date
    ? new Date(api.launch_date) > new Date() ? 'Upcoming' : 'Active'
    : 'Upcoming'

  return {
    id: api.id,
    name: api.title,
    status,
    launchDate,
    competitionPeriod: `From ${launchDate}`,
    duration: api.duration || 'Duration TBA',
    category: 'Our Program',
    summary: api.slug || api.description || '',
    description: api.description || '',
    highlights,
  }
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProgramId, setSelectedProgramId] = useState<string | number | null>(null)

  useEffect(() => {
    const loadPrograms = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(buildApiUrl('/admin/programsss'))
        const data = await res.json().catch(() => null)
        if (!res.ok || !data) throw new Error('Failed to load programs')
        
        const apiPrograms: APIProgram[] = Array.isArray(data) ? data : data.programs ?? []
        const transformed = apiPrograms.map(transformAPIProgram)
        setPrograms(transformed)
        
        // Auto-select first program
        if (transformed.length > 0) {
          setSelectedProgramId(transformed[0].id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load programs')
      } finally {
        setLoading(false)
      }
    }
    void loadPrograms()
  }, [])

  const selectedProgram = programs.find(program => program.id === selectedProgramId)

  return (
    <main className="programs-page">
      <Navbar />

      <section className="programs-hero">
        <div className="programs-hero-overlay" aria-hidden="true" />
        <div className="container programs-hero-content">
          <p className="programs-eyebrow">FinVerra Programs</p>
          <h1>Our Projects and Impact Programs</h1>
          <p>
            Explore programs designed by FinVerra to equip the next generation with practical
            entrepreneurship skills, collaborative leadership, and sustainable growth pathways.
          </p>
          <div className="programs-actions">
            <Link to="/dashboard" className="programs-btn programs-btn-primary">Join the Journey</Link>
            
          </div>
        </div>
      </section>

      <section className="programs-overview section">
        <div className="container">
          <div className="programs-overview-header">
            <div>
              <p className="programs-kicker">Programs Portfolio</p>
              <h2>Built for Many Programs</h2>
              <p>
                This section is designed to host all current and upcoming FinVerra projects. Add new
                program objects to the data list and they will appear automatically.
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
              No programs available yet.
            </div>
          ) : (
            <div className="programs-catalog-grid">
              {programs.map((program) => (
                <button
                  className={`program-summary-card ${selectedProgramId === program.id ? 'active' : ''}`}
                  key={program.id}
                  type="button"
                  onClick={() => setSelectedProgramId(program.id)}
                  aria-pressed={selectedProgramId === program.id}
                >
                  <div className="program-summary-top">
                    <span className="program-tag">{program.category}</span>
                    <span className={`program-status status-${program.status.toLowerCase()}`}>{program.status}</span>
                  </div>
                  <h3>{program.name}</h3>
                  <p>{program.summary}</p>
                  <div className="program-summary-meta">
                    <span>Launch: {program.launchDate}</span>
                    <span>Duration: {program.duration}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="programs-list section">
        <div className="container">
          {!loading && selectedProgram ? (
            <article className="program-card" id={`program-${selectedProgram.id}`}>
              <header className="program-card-header">
                <div className="program-card-tags">
                  <span className="program-tag">{selectedProgram.category}</span>
                  <span className={`program-status status-${selectedProgram.status.toLowerCase()}`}>{selectedProgram.status}</span>
                </div>
                <h2>{selectedProgram.name}</h2>
                <p>{selectedProgram.description}</p>
              </header>

              <div className="program-meta-grid">
                <div className="program-meta-item">
                  <h3>Launch Date</h3>
                  <p>{selectedProgram.launchDate}</p>
                </div>
                <div className="program-meta-item">
                  <h3>Competition Period</h3>
                  <p>{selectedProgram.competitionPeriod}</p>
                </div>
                <div className="program-meta-item">
                  <h3>Duration</h3>
                  <p>{selectedProgram.duration}</p>
                </div>
              </div>

              {selectedProgram.highlights.length > 0 && (
                <div className="program-highlights">
                  <h3>Program Highlights</h3>
                  <ul>
                    {selectedProgram.highlights.map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ) : (
            <div className="program-empty-state" role="status" aria-live="polite">
              {loading ? 'Loading program details...' : 'Click on a program card above to view full details.'}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
