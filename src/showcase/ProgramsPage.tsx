import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Footer, Navbar } from '../App'
import './ProgramsPage.css'

type Program = {
  id: string
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

const programs: Program[] = [
  {
    id: 'singirurwanda',
    name: 'SINGIRURWANDA',
    status: 'Upcoming',
    launchDate: '5th May 2026',
    competitionPeriod: '1st February - 1st November 2027',
    duration: '9 Months',
    category: 'Our Own Project',
    summary: 'A structured youth-focused entrepreneurship and innovation program for university students in Rwanda.',
    description:
      'SINGIRURWANDA is a structured youth-focused program designed by FinVerra to empower university students across Rwanda by fostering innovation, entrepreneurship, and collaboration. It features a nationwide business competition with progressive selection stages from university level to national finals, recognizing and awarding the top three outstanding projects.',
    highlights: [
      'Official launch on 5th May 2026.',
      'Main competition phase from 1st February to 1st November 2027.',
      'Nationwide business competition from campus stages to national finals.',
      'Mentorship, study visits, community engagement, training sessions, and networking opportunities.',
      'Promotes saving culture, collaboration, and inclusive participation, with strong support for young women.',
      'Addresses student challenges through guidance, advocacy, and access to FinVerra extended services.',
    ],
  },
]

export default function ProgramsPage() {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
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
        </div>
      </section>

      <section className="programs-list section">
        <div className="container">
          {selectedProgram ? (
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

              <div className="program-highlights">
                <h3>Program Highlights</h3>
                <ul>
                  {selectedProgram.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
            </article>
          ) : (
            <div className="program-empty-state" role="status" aria-live="polite">
              Click on a program card above to view full details.
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
