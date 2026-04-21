import { useEffect, useState } from 'react'
import './TeamStructurePage.css'
import board1 from '../assets/images/sample.png'
import board2 from '../assets/images/sample.png'
import board3 from '../assets/images/sample.png'
import board4 from '../assets/images/sample.png'
import board5 from '../assets/images/sample.png'
import board6 from '../assets/images/sample.png'
import exec1 from '../assets/images/sample.png'
import exec2 from '../assets/images/sample.png'

import thierryImg from '../assets/images/thierry.jpeg'
import moreenImg from '../assets/images/moreen.jpeg'
import { Navbar, Footer } from '../App'
import { buildApiUrl } from '../config/api'

type TeamMember = {
  id: number
  name: string
  position: string
  location?: string
  phone?: string
  email?: string
  team_category: string
  image: string
}

const FALLBACK_TEAM: TeamMember[] = [
  {
    id: 1,
    name: 'Rachel UWASE KABAMBA',
    position: "Board Chairperson in charge of International Relations",
    location: '',
    phone: '+250 781 681 561',
    email: 'info@finverra.co',
    team_category: 'Board of Directors',
    image: board1,
  },
  {
    id: 2,
    name: 'ISHIMWE Rodrigue',
    position: "Board Member in charge of Human Resources",
    location: '',
    phone: '+250 781 681 561',
    email: 'info@finverra.co',
    team_category: 'Board of Directors',
    image: board2,
  },
  {
    id: 3,
    name: 'HIGIRO Martin',
    position: "Board Member in charge of Operational Advisor",
    location: '',
    phone: '+250 781 681 561',
    email: 'info@finverra.co',
    team_category: 'Board of Directors',
    image: board3,
  },
  {
    id: 4,
    name: 'NSHIMIYIMANA Gad',
    position: "Board Member in charge of Promotion and Company's Brand",
    location: '',
    phone: '+250 781 681 561',
    email: 'info@finverra.co',
    team_category: 'Board of Directors',
    image: board4,
  },
  {
    id: 5,
    name: 'RUDAHUNGA Gideon',
    position: "Board Member in charge of Administration Management",
    location: '',
    phone: '+250 781 681 561',
    email: 'info@finverra.co',
    team_category: 'Board of Directors',
    image: board5,
  },
  {
    id: 6,
    name: 'MUTUYE Tresor CYUZUZO',
    position: "Board Member in charge of Financial Strategy",
    location: '',
    phone: '+250 781 681 561',
    email: 'info@finverra.co',
    team_category: 'Board of Directors',
    image: board6,
  },
  {
    id: 7,
    name: 'ISHIMWE Rodrigue',
    position: 'Chief Executive Officer',
    location: '',
    phone: '+250 798 334 423',
    email: 'admin@finverra.co',
    team_category: 'Executive Management Team',
    image: exec1,
  },
  {
    id: 8,
    name: 'IGIHOZO Honorine',
    position: 'Deputy CEO',
    location: '',
    phone: '+250 781 681 561',
    email: 'admin@finverra.co',
    team_category: 'Executive Management Team',
    image: exec2,
  },
  {
    id: 9,
    name: 'MUTONI Moreen',
    position: 'Head of Customer Care',
    location: '',
    phone: '+250 781 681 561',
    email: 'info@finverra.co',
    team_category: 'Executive Management Team',
    image: moreenImg,
  },
  {
    id: 10,
    name: 'ISHIMWE Thierry',
    position: 'Head of Digital Marketing',
    location: '',
    phone: '+250 781 681 561',
    email: 'info@finverra.co',
    team_category: 'Executive Management Team',
    image: thierryImg,
  },
]

function normalizeCategory(value: string) {
  return value.trim().toLowerCase()
}

export default function TeamStructurePage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(FALLBACK_TEAM)

  useEffect(() => {
    let mounted = true

    async function loadTeam() {
      try {
        const response = await fetch(buildApiUrl('/admin/team'))
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload || typeof payload !== 'object' || !Array.isArray((payload as { team?: unknown }).team)) {
          return
        }

        const apiTeam = (payload as { team: Array<Record<string, unknown>> }).team
        const mappedTeam: TeamMember[] = apiTeam
          .filter((member) => typeof member === 'object' && member !== null)
          .map((member, index) => {
            const id = typeof member.id === 'number' ? member.id : index + 1
            const name = typeof member.name === 'string' ? member.name : ''
            const position = typeof member.position === 'string' ? member.position : ''
            const email = typeof member.email === 'string' ? member.email : ''
            const phone = typeof member.phone === 'string' ? member.phone : ''
            const teamCategory = typeof member.team_category === 'string' ? member.team_category : ''
            const imagePath = typeof member.image === 'string' ? member.image : ''

            return {
              id,
              name,
              position,
              email,
              phone,
              team_category: teamCategory,
              image: imagePath ? buildApiUrl(imagePath) : board1,
            }
          })
          .filter((member) => member.name && member.position && member.team_category)

        if (mounted && mappedTeam.length > 0) {
          setTeamMembers(mappedTeam)
        }
      } catch {
        // Keep fallback team if API is unavailable.
      }
    }

    void loadTeam()

    return () => {
      mounted = false
    }
  }, [])

  const boardMembers = teamMembers.filter((member) => normalizeCategory(member.team_category) === 'board of directors')
  const execMembers = teamMembers.filter((member) => normalizeCategory(member.team_category) === 'executive management team')
  const boardContact = boardMembers[0]
  const boardPhone = boardContact?.phone || '+250 781 681 561'
  const boardEmail = boardContact?.email || 'info@finverra.co'

  return (
    <main className="team-structure-page">
      <Navbar />
      <section className="team-hero">
        <div className="team-hero-overlay" aria-hidden="true" />
        <div className="container team-hero-content">
          <p className="team-eyebrow">Meet the Team</p>
          <h1>Our Leadership</h1>
          <p>
            Board of Directors and Executive Management Team guiding FINVERRA's vision and operations.
          </p>
        </div>
      </section>

      <section className="team team-board-section section">
        <div className="container">
          <div className="team-header">
            <h2>Board of Directors</h2>
            <p>Strategic leadership and governance for sustainable growth.</p>
          </div>
          <div className="team-members-grid">
              {boardMembers.map((m) => (
              <div className="team-member-card" key={`${m.id}-${m.name}`}>
                <div className="team-member-image">
                  <img src={m.image} alt={m.name} />
                </div>
                <h3>{m.name}</h3>
                <div className="team-member-position">{m.position}</div>
                {m.location && <div className="team-member-location">{m.location}</div>}
              </div>
            ))}
          </div>
          <div className="team-contact-note" aria-label="Board contact information">
            <p className="team-contact-title">Need to reach a member of our Board?</p>
            <div className="team-contact-links">
              <a className="team-contact-chip" href={`tel:${boardPhone.replace(/\s+/g, '')}`}>
                <span>Phone</span>
                <strong>{boardPhone}</strong>
              </a>
              <a className="team-contact-chip" href={`mailto:${boardEmail}`}>
                <span>Email</span>
                <strong>{boardEmail}</strong>
              </a>
            </div>
            <p className="team-contact-copy">We’re happy to help with board-related inquiries during business hours.</p>
          </div>
        </div>
      </section>

      <section className="team team-exec-section section">
        <div className="container">
          <div className="team-header">
            <h2>Executive Management Team </h2>
            <p>Operational leadership and day-to-day management.</p>
          </div>
          <div className="team-members-grid">
              {execMembers.map((m) => (
              <div className="team-member-card" key={`${m.id}-${m.name}`}>
                <div className="team-member-image">
                  <img src={m.image} alt={m.name} />
                </div>
                <h3>{m.name}</h3>
                <div className="team-member-position">{m.position}</div>
                {m.location && <div className="team-member-location">{m.location}</div>}
                <div className="team-member-location">
                  {m.phone && (
                    <>
                      <span>Tel: <a href={`tel:${m.phone.replace(/\s+/g, '')}`}>{m.phone}</a></span><br />
                    </>
                  )}
                  {m.email && <span>Email: <a href={`mailto:${m.email}`}>{m.email}</a></span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
