import { useEffect, useRef, useState } from 'react'
import './TeamStructurePage.css'
import board1 from '../assets/images/sample.png'
import corporateMeeting from '../assets/images/about-meeting.jpg'
import { Navbar, Footer } from '../App'
import { buildApiUrl } from '../config/api'
import { getAuthSession } from '../dashboard/authStorage'

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

type WhatDrivesItem = {
  id: number
  title: string
  description: string
}

type WhoWeAreItem = {
  id: number
  title: string
  first_paragraph: string
  second_paragraph: string
  image: string | null
}

function resolveToken() {
  const session = getAuthSession()

  if (!session) {
    return ''
  }

  const payload = session.payload as { token?: unknown; accessToken?: unknown; access_token?: unknown; jwt?: unknown }

  if (typeof payload.token === 'string') return payload.token
  if (typeof payload.accessToken === 'string') return payload.accessToken
  if (typeof payload.access_token === 'string') return payload.access_token
  if (typeof payload.jwt === 'string') return payload.jwt

  return ''
}

function normalizeCategory(value: string) {
  return value.trim().toLowerCase()
}

export default function TeamStructurePage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamLoading, setTeamLoading] = useState(true)
  const [teamError, setTeamError] = useState('')
  const [whatDrivesItems, setWhatDrivesItems] = useState<WhatDrivesItem[]>([])
  const [whatDrivesLoading, setWhatDrivesLoading] = useState(true)
  const [whatDrivesError, setWhatDrivesError] = useState('')
  const [whoWeAreItems, setWhoWeAreItems] = useState<WhoWeAreItem[]>([])
  const [whoWeAreLoading, setWhoWeAreLoading] = useState(true)
  const [whoWeAreError, setWhoWeAreError] = useState('')

  function useInView(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
        }
      }, { threshold })

      if (ref.current) observer.observe(ref.current)
      return () => observer.disconnect()
    }, [threshold])

    return { ref, inView }
  }

  const { ref, inView } = useInView()

  useEffect(() => {
    let mounted = true

    async function loadTeam() {
      if (mounted) {
        setTeamLoading(true)
        setTeamError('')
      }

      try {
        const response = await fetch(buildApiUrl('/admin/team'))
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload || typeof payload !== 'object' || !Array.isArray((payload as { team?: unknown }).team)) {
          if (mounted) {
            setTeamError('Unable to load team data.')
          }
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
        } else if (mounted) {
          setTeamError('No team members found.')
        }
      } catch {
        if (mounted) {
          setTeamError('Unable to load team data.')
        }
      } finally {
        if (mounted) {
          setTeamLoading(false)
        }
      }
    }

    void loadTeam()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadWhatDrives() {
      const token = resolveToken()
      if (mounted) {
        setWhatDrivesLoading(true)
        setWhatDrivesError('')
      }

      try {
        const response = await fetch(buildApiUrl('/admin/what_drives'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload || typeof payload !== 'object' || !Array.isArray((payload as { what_drives?: unknown }).what_drives)) {
          if (mounted) {
            setWhatDrivesError('Unable to load What Drives FINVERRA data.')
          }
          return
        }

        const apiItems = (payload as { what_drives: Array<Record<string, unknown>> }).what_drives
        const mappedItems: WhatDrivesItem[] = apiItems
          .filter((item) => typeof item === 'object' && item !== null)
          .map((item, index) => ({
            id: typeof item.id === 'number' ? item.id : index + 1,
            title: typeof item.title === 'string' ? item.title : '',
            description: typeof item.description === 'string' ? item.description : '',
          }))
          .filter((item) => item.title && item.description)

        if (mounted) {
          setWhatDrivesItems(mappedItems)
          if (mappedItems.length === 0) {
            setWhatDrivesError('No What Drives FINVERRA data found.')
          }
        }
      } catch {
        if (mounted) {
          setWhatDrivesError('Unable to load What Drives FINVERRA data.')
        }
      } finally {
        if (mounted) {
          setWhatDrivesLoading(false)
        }
      }
    }

    void loadWhatDrives()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadWhoWeAre() {
      const token = resolveToken()
      if (mounted) {
        setWhoWeAreLoading(true)
        setWhoWeAreError('')
      }

      try {
        const response = await fetch(buildApiUrl('/admin/whoweare'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload || typeof payload !== 'object' || !Array.isArray((payload as { whoweare?: unknown }).whoweare)) {
          if (mounted) {
            setWhoWeAreError('Unable to load Who We Are data.')
          }
          return
        }

        const apiItems = (payload as { whoweare: Array<Record<string, unknown>> }).whoweare
        const mappedItems: WhoWeAreItem[] = apiItems
          .filter((item) => typeof item === 'object' && item !== null)
          .map((item, index) => ({
            id: typeof item.id === 'number' ? item.id : index + 1,
            title: typeof item.title === 'string' ? item.title : '',
            first_paragraph: typeof item.first_paragraph === 'string' ? item.first_paragraph : '',
            second_paragraph: typeof item.second_paragraph === 'string' ? item.second_paragraph : '',
            image: typeof item.image === 'string' ? item.image : null,
          }))
          .filter((item) => item.title && item.first_paragraph && item.second_paragraph)

        if (mounted) {
          setWhoWeAreItems(mappedItems)
          if (mappedItems.length === 0) {
            setWhoWeAreError('No Who We Are data found.')
          }
        }
      } catch {
        if (mounted) {
          setWhoWeAreError('Unable to load Who We Are data.')
        }
      } finally {
        if (mounted) {
          setWhoWeAreLoading(false)
        }
      }
    }

    void loadWhoWeAre()

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
      <section className="showcase section" id="about" ref={ref}>
        <div className="container">
          {whoWeAreLoading ? (
            <div className={`showcase-about about-grid about-grid-modern ${inView ? 'animate-in' : ''}`}>
              <div className="about-text">
                <div className="section-label">Who We Are</div>
                <p>Loading Who We Are data...</p>
              </div>
            </div>
          ) : whoWeAreError ? (
            <div className={`showcase-about about-grid about-grid-modern ${inView ? 'animate-in' : ''}`}>
              <div className="about-text">
                <div className="section-label">Who We Are</div>
                <p>{whoWeAreError}</p>
              </div>
            </div>
          ) : whoWeAreItems && whoWeAreItems.length > 0 ? (
            whoWeAreItems.map((item) => (
              <div key={item.id} className={`showcase-about about-grid about-grid-modern ${inView ? 'animate-in' : ''}`}>
                <div className="about-text">
                  <div className="section-label">Who We Are</div>
                  <h2 className="section-title about-title-highlight">
                    <span>{item.title}</span>
                  </h2>
                  <p className="about-lead">
                    {item.first_paragraph}
                  </p>
                  <p className="about-body">
                    {item.second_paragraph}
                  </p>
                </div>

                <div className="about-media-panel">
                  <div className="about-feature-image-wrap about-feature-large">
                    <img src={item.image ? buildApiUrl(item.image) : corporateMeeting} alt={item.title} className="about-feature-image" loading="lazy" decoding="async" />
                    <div className="about-image-ring" />
                    <div className="about-media-caption">
                      <span>Built in Rwanda. Designed for Africa.</span>
                      <strong>Investment Facilitation Company</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={`showcase-about about-grid about-grid-modern ${inView ? 'animate-in' : ''}`}>
              <div className="about-text">
                <div className="section-label">Who We Are</div>
                <p>No Who We Are content available.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="showcase section vision-mission-section">
        <div className="container">
          <div className={`section-header vision-mission-header ${inView ? 'animate-in' : ''}`}>
            <div className="section-label">Vision &amp; Mission</div>
            <h2 className="section-title vision-mission-title">What Drives FINVERRA</h2>
          </div>

          <div className={`about-vision-modern vision-mission-grid ${inView ? 'animate-in' : ''}`}>
            {whatDrivesLoading && (
              <div className="vision-box modern-card">
                <h4>Loading</h4>
                <p>Fetching What Drives FINVERRA data...</p>
              </div>
            )}
            {!whatDrivesLoading && whatDrivesError && (
              <div className="vision-box modern-card">
                <h4>Unavailable</h4>
                <p>{whatDrivesError}</p>
              </div>
            )}
            {!whatDrivesLoading && !whatDrivesError && whatDrivesItems.map((item) => (
              <div className="vision-box modern-card" key={item.id}>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section team-intro-section">
        <div className="container">
          <div className={`section-header team-intro-header ${inView ? 'animate-in' : ''}`}>
            <div className="section-label">Team Structure</div>
            <h2 className="section-title">Meet the People Driving FINVERRA</h2>
            <p className="section-subtitle">
              This section highlights the board of directors and executive management team responsible for guiding our
              strategy, overseeing operations, and supporting long-term growth.
            </p>
          </div>
        </div>
      </section>

      <section className="team team-board-section section">
        <div className="container">
          <div className="team-header">
            <h2>Board of Directors</h2>
            <p>Strategic leadership and governance for sustainable growth.</p>
          </div>
          {teamLoading ? (
            <div className="team-empty-state">Loading team data...</div>
          ) : boardMembers.length > 0 ? (
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
          ) : (
            <div className="team-empty-state">{teamError || 'No board members available.'}</div>
          )}
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
          {teamLoading ? (
            <div className="team-empty-state">Loading team data...</div>
          ) : execMembers.length > 0 ? (
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
          ) : (
            <div className="team-empty-state">{teamError || 'No executive team members available.'}</div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  )
}
