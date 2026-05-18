import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { buildApiUrl } from './config/api'
import { getAuthSession } from './dashboard/authStorage'
import ScrollToTop from './components/ScrollToTop'

import './App.css'

import logoFinverraWhite from './assets/logo-finverra-white.png'
import heroKigali from './assets/images/hero-kigali.jpg'
import strategicMeeting from './assets/images/generated_strategic_meeting.png'
import corporateMeeting from './assets/images/about-meeting.jpg'
import eventConference from './assets/images/event-conference.jpg'
import eventProtocol1 from './assets/images/slide1.jpg'
import eventProtocol from './assets/images/people-taking-part-high-protocol-event.jpg'
import privacyTermsPdf from './PRIVACY POLICY & TERMS OF REGULATION.pdf'

const Logo = ({ className = '' }: { className?: string }) => (
  <img
    src={logoFinverraWhite}
    alt="Finverra - Finance with trust"
    className={className}
    style={{ height: '78px', objectFit: 'contain' }}
  />
)

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
      }
    }, { threshold })

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

function useCounter(target: number, inView: boolean, duration = 2000, restartKey = 0) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) {
      return
    }

    const resetFrame = window.requestAnimationFrame(() => setCount(0))
    let start = 0
    const step = target / (duration / 16)
    const timer = window.setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        window.clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => {
      window.cancelAnimationFrame(resetFrame)
      window.clearInterval(timer)
    }
  }, [inView, target, duration, restartKey])

  return count
}

type PartnerApiItem = {
  id: number
  image: string
  url: string
}

type PartnerCard = PartnerApiItem & { color: string }

type TestimonialApiItem = {
  id: number
  name: string
  position: string
  company: string
  testimony: string
}

type TestimonialCard = {
  id: number
  name: string
  role: string
  text: string
  rating: number
}

type ProjectApiItem = {
  id: number
  title: string
  description: string
  image: string
}

type ProjectCard = ProjectApiItem

type OurProjectApiItem = {
  id: number
  image: string
  link: string
}

type OurProjectCard = OurProjectApiItem

type WhoWeAreItem = {
  id: number
  title: string
  first_paragraph: string
  second_paragraph: string
  image: string | null
}

const PARTNER_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#14B8A6', '#F97316', '#6366F1']

const FALLBACK_PARTNERS: PartnerCard[] = [
  { id: 1, image: '/patners/rdb.png', url: 'https://www.rdb.rw/', color: PARTNER_COLORS[0] },
  { id: 2, image: '/patners/bk.jpg', url: 'https://bk.rw/', color: PARTNER_COLORS[1] },
  { id: 3, image: '/patners/brd.png', url: 'https://www.brd.rw/', color: PARTNER_COLORS[2] },
  { id: 4, image: '/patners/im.png', url: 'https://www.imbankgroup.com/rwanda/', color: PARTNER_COLORS[3] },
  { id: 5, image: '/patners/Equity_Group_Logo.png', url: 'https://equitygroupholdings.com/rw/', color: PARTNER_COLORS[4] },
  { id: 6, image: '/patners/africa50.jpg', url: 'https://www.africa50.com/', color: PARTNER_COLORS[5] },
]

const FALLBACK_PROJECTS: ProjectCard[] = [
  { id: 1, title: 'Green Growth Platform', description: 'A climate-conscious investment opportunity designed to connect capital with measurable community impact.', image: eventConference },
  { id: 2, title: 'Innovation Builders', description: 'Technology-focused projects that help founders turn validated ideas into investable businesses.', image: strategicMeeting },
  { id: 3, title: 'Market Expansion Fund', description: 'Growth-stage opportunities prepared for investors looking for trusted, well-structured deal flow.', image: heroKigali },
]

const FALLBACK_OUR_PROJECTS: OurProjectCard[] = [
  { id: 1, image: '/uploads/our_project/our-project-1777476057087-367958480.png', link: 'https://finverra.co/' },
  { id: 2, image: '/uploads/our_project/our-project-1777476072703-268832104.png', link: 'https://finverra.co' },
  { id: 3, image: '/uploads/our_project/our-project-1777476086616-530508234.png', link: 'https://finverra.co' },
]

const HERO_IMAGES = [heroKigali, eventProtocol1, eventProtocol]

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

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('')

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { label: 'Home', to: '/#home' },
    { label: 'About Us', to: '/about-us' },
    { label: 'Service', to: '/services' },
    { label: 'Events & Programs', to: '/events-programs' },
    { label: 'Invest In', to: '/invest-in' },
    { label: 'Our Project', to: '/our-projects' },
    { label: 'Contact Us', to: '/contact-us' },
  ]

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <Link
          to="/"
          className="nav-logo-link"
          aria-label="Go to homepage"
          onClick={() => {
            setActiveLink('Home')
            setMenuOpen(false)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <Logo />
        </Link>
        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {links.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                className={activeLink === link.label ? 'active' : ''}
                onClick={() => {
                  setActiveLink(link.label)
                  setMenuOpen(false)
                }}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li><Link to="/dashboard" className="nav-cta" onClick={() => setMenuOpen(false)}>Join now</Link></li>
        </ul>
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}

function Hero() {
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveImageIndex((previous) => (previous + 1) % HERO_IMAGES.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <section
      className="hero"
      id="home"
      style={{
        backgroundImage: `linear-gradient(145deg, rgba(1, 24, 32, 0.24) 0%, rgba(2, 51, 65, 0.2) 30%, rgba(3, 74, 94, 0.18) 58%, rgba(2, 58, 74, 0.2) 75%, rgba(1, 28, 40, 0.24) 100%), url(${HERO_IMAGES[activeImageIndex]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 1s ease-in-out',
      }}
    >
      <div className="hero-bg">
        <div className="hero-orb orb1" />
        <div className="hero-orb orb2" />
        <div className="hero-orb orb3" />
        <div className="hero-grid" />
      </div>
      <div className="hero-content">
        <h3 className="hero-title">
          <span className="line">Finance</span>
          <span className="line accent">With Trust</span>
        </h3>
        <p className="hero-subtitle">
          Embodies our commitment to transparency, integrity, and secure financial engagement, enabling entrepreneurs and investors to collaborate with confidence and clarity.
        </p>
        <div className="hero-actions">
          <Link to="/dashboard" className="btn-primary">Get Started <span>→</span></Link>
          <Link to="/about-us" className="btn-ghost">Learn More</Link>
        </div>
        <div className="hero-stats">
          {[['50+', 'Entrepreneurs'], ['12+', 'Investors'], ['20+', 'Active Projects'], ['RWF 2M+', 'Facilitated']].map(([value, label]) => (
            <div className="hero-stat" key={label}>
              <span className="stat-val">{value}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="hero-carousel-indicators">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === activeImageIndex ? 'active' : ''}`}
            onClick={() => setActiveImageIndex(index)}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

function AchievementCounter({ target, suffix = '', label }: { target: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    let wasIntersecting = false
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
      if (entry.isIntersecting && !wasIntersecting) {
        setRunId((previous) => previous + 1)
      }
      wasIntersecting = entry.isIntersecting
    }, { threshold: 0.3 })

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const count = useCounter(target, inView, 2000, runId)

  return (
    <div className="achievement-card" ref={ref}>
      <div className="achievement-number">{count}{suffix}</div>
      <div className="achievement-label">{label}</div>
      <div className="achievement-bar" />
    </div>
  )
}

function Achievements() {
  const { ref, inView } = useInView()

  return (
    <section className="achievements section" id="achievements" ref={ref}>
      <div className="achievements-bg" />
      <div className="container">
        <div className="section-header light">
          <div className="section-label">Our Impact</div>
          <h2 className="section-title">Growing Together</h2>
          <p className="section-subtitle">Real numbers that reflect our commitment to Rwanda's economic future</p>
        </div>
        <div className={`achievements-grid ${inView ? 'animate-in' : ''}`}>
          <AchievementCounter target={120} suffix="+" label="Active Investors" />
          <AchievementCounter target={500} suffix="+" label="Registered Entrepreneurs" />
          <AchievementCounter target={85} suffix="+" label="Active Businesses Supported" />
          <AchievementCounter target={60} suffix="+" label="Ongoing Business Cases" />
        </div>
      </div>
    </section>
  )
}

function InvestmentShowcase() {
  const { ref, inView } = useInView()
  const [projects, setProjects] = useState<ProjectCard[]>(FALLBACK_PROJECTS)
  const [ourProjects, setOurProjects] = useState<OurProjectCard[]>(FALLBACK_OUR_PROJECTS)
  const [whoWeAreItems, setWhoWeAreItems] = useState<WhoWeAreItem[]>([])
  const [whoWeAreLoading, setWhoWeAreLoading] = useState(true)
  const [whoWeAreError, setWhoWeAreError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadProjects() {
      try {
        const response = await fetch(buildApiUrl('/admin/projects'))
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload || typeof payload !== 'object' || !Array.isArray((payload as { projects?: unknown }).projects)) {
          return
        }

        const apiProjects = (payload as { projects: ProjectApiItem[] }).projects
        const mappedProjects = apiProjects
          .map((project) => ({
            id: project.id,
            title: project.title,
            description: project.description,
            image: project.image,
          }))
          .filter((project) => project.title.trim() && project.description.trim())

        if (mounted && mappedProjects.length > 0) {
          setProjects(mappedProjects.slice(0, 3))
        }
      } catch {
        // Keep fallback projects if the API is unavailable.
      }
    }

    async function loadOurProjects() {
      try {
        const response = await fetch(buildApiUrl('/our_projects'))
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload || typeof payload !== 'object') {
          return
        }

        const apiItems = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { our_projects?: unknown }).our_projects)
            ? (payload as { our_projects: OurProjectApiItem[] }).our_projects
            : []

        const mappedItems = apiItems
          .map((item) => ({
            id: item.id,
            image: item.image,
            link: item.link,
          }))
          .filter((item) => item.image.trim() && item.link.trim())

        if (mounted && mappedItems.length > 0) {
          setOurProjects(mappedItems.slice(0, 3))
        }
      } catch {
        // Keep fallback our projects if the API is unavailable.
      }
    }

    void loadProjects()
    void loadOurProjects()

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

  return (
    <section className="showcase section" id="showcase" ref={ref}>
      <div className="container">
        <div className={`showcase-about about-grid about-grid-modern ${inView ? 'animate-in' : ''}`} id="about">
          {whoWeAreLoading ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#666' }}>
              <p>Loading Who We Are section...</p>
            </div>
          ) : whoWeAreError || whoWeAreItems.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#999' }}>
              <p>{whoWeAreError || 'No Who We Are content available.'}</p>
            </div>
          ) : (
            whoWeAreItems.map((item) => (
              <div key={item.id} style={{ display: 'contents' }}>
                <div className="about-text">
                  <div className="section-label">Who We Are</div>
                  <h2 className="section-title about-title-highlight">
                    <span>{item.title}</span>
                  </h2>
                  <p className="about-lead">{item.first_paragraph}</p>
                  <p className="about-body">{item.second_paragraph}</p>
                </div>

                <div className="about-media-panel">
                  <div className="about-feature-image-wrap about-feature-large">
                    <img
                      src={item.image ? buildApiUrl(item.image) : corporateMeeting}
                      alt={item.title}
                      className="about-feature-image"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="about-image-ring" />
                    <div className="about-media-caption">
                      <span>Built in Rwanda. Designed for Africa.</span>
                      <strong>Investment Facilitation Company</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <section className="our-projects-intro" style={{ marginTop: 44, marginBottom: 28 }}>
          <div className="section-header" style={{ textAlign: 'left' }}>
            <div className="section-label">Our Project</div>
            <h2 className="section-title">What We Build and Showcase</h2>
            <p className="section-subtitle" style={{ maxWidth: 860 }}>
              This section explains our project work and highlights the current items we are publishing from the platform.
            </p>
          </div>

          <div className={`our-projects-grid ${inView ? 'animate-in' : ''}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, alignItems: 'stretch' }}>
            {ourProjects.map((project, index) => (
              <a
                key={project.id}
                href={project.link}
                target="_blank"
                rel="noreferrer"
                className="showcase-card showcase-card-link"
                aria-label={`Open our project ${project.id}`}
                style={{
                  animationDelay: `${index * 0.12}s`,
                  overflow: 'hidden',
                  minHeight: 220,
                  background: '#ffffff',
                  border: '1px solid rgba(198, 219, 245, 0.95)',
                  boxShadow: '0 12px 28px rgba(10, 32, 70, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 28,
                }}
              >
                <div className="showcase-card-image" style={{ width: '100%', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={buildApiUrl(project.image)}
                    alt={`Our project ${project.id}`}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: 'auto', maxHeight: 120, objectFit: 'contain' }}
                  />
                </div>
              </a>
            ))}
          </div>
        </section>

        <div className="section-header">
          <div className="section-label">Investment Opportunities</div>
          <h2 className="section-title">Projects Built For Real Impact</h2>
          <p className="section-subtitle">Three live project cards from the Invest In menu, arranged in a clean three-column layout on desktop.</p>
        </div>

        <div className={`showcase-grid ${inView ? 'animate-in' : ''}`}>
          {projects.map((project, index) => (
            <Link to="/invest-in" className="showcase-card showcase-card-link" key={project.id} style={{ animationDelay: `${index * 0.12}s` }}>
              <div className="showcase-card-image">
                <img src={buildApiUrl(project.image)} alt={project.title} loading="lazy" decoding="async" />
              </div>
              <div className="showcase-content">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="showcase-link">View Project →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function Partners() {
  const { ref, inView } = useInView()
  const [partners, setPartners] = useState<PartnerCard[]>(FALLBACK_PARTNERS)

  useEffect(() => {
    let mounted = true

    async function loadPartners() {
      try {
        const response = await fetch(buildApiUrl('/admin/partners'))
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload || typeof payload !== 'object' || !Array.isArray((payload as { partners?: unknown }).partners)) {
          return
        }

        const apiPartners = (payload as { partners: PartnerApiItem[] }).partners
        const mappedPartners = apiPartners.map((partner, index) => ({
          ...partner,
          color: PARTNER_COLORS[index % PARTNER_COLORS.length],
        }))

        if (mounted && mappedPartners.length > 0) {
          setPartners(mappedPartners)
        }
      } catch {
        // Keep fallback partners if the API is unavailable.
      }
    }

    void loadPartners()

    return () => {
      mounted = false
    }
  }, [])

  const allPartners = [...partners, ...partners]

  return (
    <section className="partners-section" ref={ref}>
      <div className="partners-inner">
        <div className={`partners-header ${inView ? 'animate-in' : ''}`}>
          <div className="section-label" style={{ textAlign: 'center' }}>Our Partners</div>
          <h2 className="section-title" style={{ textAlign: 'center', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>Trusted by Leading Institutions</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto' }}>We collaborate with Rwanda's top banks, government bodies, and development organizations</p>
        </div>

        <div className="partners-track-wrap">
          <div className="partners-fade-left" />
          <div className="partners-fade-right" />
          <div className="partners-track">
            {allPartners.map((partner, index) => (
              <a
                className="partner-logo-card"
                key={`${partner.id}-${index}`}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit partner website"
              >
                <div className="partner-logo-circle" style={{ background: `${partner.color}18`, borderColor: `${partner.color}30` }}>
                  <img src={buildApiUrl(partner.image)} alt="Partner logo" className="partner-logo-img" loading="lazy" decoding="async" />
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className={`partners-cta ${inView ? 'animate-in' : ''}`}>
          <p>Interested in partnering with FINVERRA?</p>
          <Link to="/contact-us" className="btn-ghost" style={{ fontSize: '0.88rem', padding: '12px 28px' }}>Become a Partner →</Link>
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  const { ref, inView } = useInView()
  const [active, setActive] = useState(0)
  const [testimonials, setTestimonials] = useState<TestimonialCard[]>([])

  useEffect(() => {
    let mounted = true

    async function loadTestimonials() {
      try {
        const response = await fetch(buildApiUrl('/admin/testimonials'))
        const payload = await response.json().catch(() => null)

        const rawTestimonials = Array.isArray(payload)
          ? payload
          : payload && typeof payload === 'object' && Array.isArray((payload as { testimonials?: unknown }).testimonials)
            ? (payload as { testimonials: TestimonialApiItem[] }).testimonials
            : null

        if (!response.ok || !rawTestimonials) {
          return
        }

        const mappedTestimonials: TestimonialCard[] = rawTestimonials
          .map((item) => {
            const companyPart = item.company?.trim() ? `, ${item.company.trim()}` : ''
            return {
              id: item.id,
              name: item.name,
              role: `${item.position}${companyPart}`,
              text: item.testimony,
              rating: 5,
            }
          })
          .filter((item) => item.name.trim() && item.role.trim() && item.text.trim())

        if (mounted && mappedTestimonials.length > 0) {
          setTestimonials(mappedTestimonials)
          setActive(0)
        }
      } catch {
        // Keep the testimonials section empty if the API is unavailable.
      }
    }

    void loadTestimonials()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (testimonials.length <= 1) {
      return
    }

    const timer = window.setInterval(() => setActive((value) => (value + 1) % testimonials.length), 5000)
    return () => window.clearInterval(timer)
  }, [testimonials])

  if (testimonials.length === 0) {
    return (
      <section className="testimonials testimonials-premium section" id="testimonials" ref={ref}>
        <div className="container">
          <div className="section-header testimonials-header-premium">
            <div className="section-label">Testimonials</div>
            <h2 className="section-title">Voices of Trust</h2>
            <p className="section-subtitle">Real founders and investors sharing how FINVERRA helped them move from ambition to measurable outcomes.</p>
          </div>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>No testimonials available right now.</p>
        </div>
      </section>
    )
  }

  const testimonial = testimonials[active]

  return (
    <section className="testimonials testimonials-premium section" id="testimonials" ref={ref}>
      <div className="container">
        <div className="section-header testimonials-header-premium">
          <div className="section-label">Testimonials</div>
          <h2 className="section-title">Voices of Trust</h2>
          <p className="section-subtitle">Real founders and investors sharing how FINVERRA helped them move from ambition to measurable outcomes.</p>
        </div>
        <div className={`testimonial-wrapper testimonial-wrapper-premium ${inView ? 'animate-in' : ''}`}>
          <div className="testimonial-main">
            <div className="quote-mark">&quot;</div>
            <p className="testimonial-text">{testimonial.text}</p>
            <div className="testimonial-author">
              <div className="author-avatar">{testimonial.name.split(' ').map((part) => part[0]).join('')}</div>
              <div>
                <div className="author-name">{testimonial.name}</div>
                <div className="author-role">{testimonial.role}</div>
              </div>
              <div className="stars">{'★'.repeat(testimonial.rating)}</div>
            </div>
          </div>
          <div className="testimonial-dots">
            {testimonials.map((_, index) => (
              <button key={index} className={`dot ${index === active ? 'active' : ''}`} onClick={() => setActive(index)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function getTodayValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function Appointment() {
  const { ref, inView } = useInView()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<Array<{
    id: number
    slot_date: string
    slot_time: string
    status: string
  }>>([])
  const [formData, setFormData] = useState({
    names: '',
    email: '',
    phone: '',
    date: getTodayValue(),
    time: '',
    meeting_format: '',
    meeting_type: '',
    message: '',
  })

  const WORD_LIMIT = 250

  function countWords(value: string) {
    const words = value.trim().split(/\s+/).filter(Boolean)
    return words.length === 1 && words[0] === '' ? 0 : words.length
  }

  function trimToWordLimit(value: string, limit: number) {
    const words = value.trim().split(/\s+/).filter(Boolean)
    return words.slice(0, limit).join(' ')
  }

  const messageWords = countWords(formData.message)

  function handleMessageChange(value: string) {
    const next = trimToWordLimit(value, WORD_LIMIT)
    setFormData((previous) => ({ ...previous, message: next }))
    if (formError) setFormError('')
  }

  // Load available slots when date changes
  useEffect(() => {
    let isMounted = true

    async function loadAvailability() {
      setLoadingSlots(true)
      setFormError('')

      try {
        const response = await fetch(
          formData.date ? buildApiUrl(`/appointment-availability?date=${encodeURIComponent(formData.date)}`) : buildApiUrl('/appointment-availability'),
        )

        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error((payload as { message?: string } | null)?.message ?? 'Failed to load available appointment slots')
        }

        if (!isMounted) {
          return
        }

        const rawSlots = (payload as any)?.available_slots ?? ((payload as any)?.slots ?? [])
        const slots = Array.isArray(rawSlots)
          ? rawSlots
              .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
              .map((item) => {
                let slotDate = typeof item.slot_date === 'string' ? item.slot_date : ''
                try {
                  const parsed = new Date(slotDate)
                  if (!Number.isNaN(parsed.getTime())) {
                    const y = parsed.getFullYear()
                    const m = String(parsed.getMonth() + 1).padStart(2, '0')
                    const d = String(parsed.getDate()).padStart(2, '0')
                    slotDate = `${y}-${m}-${d}`
                  }
                } catch {
                  slotDate = slotDate
                }

                let slotTime = typeof item.slot_time === 'string' ? item.slot_time : ''
                try {
                  if (slotTime.includes('T')) {
                    const dt = new Date(slotTime)
                    if (!Number.isNaN(dt.getTime())) {
                      const hh = String(dt.getHours()).padStart(2, '0')
                      const mm = String(dt.getMinutes()).padStart(2, '0')
                      slotTime = `${hh}:${mm}`
                    }
                  } else if (slotTime.split(':').length >= 2) {
                    slotTime = slotTime.slice(0, 5)
                  } else if (/^\d{3,4}$/.test(slotTime)) {
                    const padded = slotTime.padStart(4, '0')
                    slotTime = `${padded.slice(0, 2)}:${padded.slice(2)}`
                  }
                } catch {
                  slotTime = slotTime
                }

                return {
                  id: typeof item.id === 'number' ? item.id : Number(item.id) || 0,
                  slot_date: slotDate,
                  slot_time: slotTime,
                  status: typeof item.status === 'string' ? item.status : 'available',
                }
              })
              .filter((item) => item.id > 0 && item.status === 'available')
          : []

        setAvailableSlots(slots)
        if (formData.time) {
          const normalizedSelected = formData.time.length > 5 ? formData.time.slice(0, 5) : formData.time
          const exists = slots.some((s) => (s.slot_time.length > 5 ? s.slot_time.slice(0, 5) : s.slot_time) === normalizedSelected && s.slot_date === formData.date)
          if (!exists) {
            setFormData((prev) => ({ ...prev, time: '' }))
          }
        }
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setAvailableSlots([])
        setFormError(loadError instanceof Error ? loadError.message : 'Failed to load available appointment slots')
      } finally {
        if (isMounted) {
          setLoadingSlots(false)
        }
      }
    }

    void loadAvailability()

    return () => {
      isMounted = false
    }
  }, [formData.date])

  function handleDateChange(value: string) {
    setFormData((previous) => ({ ...previous, date: value, time: '' }))
    if (formError) setFormError('')
  }

  function handleSlotSelect(slotTime: string) {
    const normalized = slotTime.length > 5 ? slotTime.slice(0, 5) : slotTime
    setFormData((previous) => ({ ...previous, time: normalized }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.names.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.date || !formData.meeting_format || !formData.meeting_type || !formData.message.trim()) {
      setFormError('All fields are required.')
      return
    }

    const selectedNormalized = formData.time.length > 5 ? formData.time.slice(0, 5) : formData.time
    const selectedSlot = availableSlots.find(
      (s) => (s.slot_time.length > 5 ? s.slot_time.slice(0, 5) : s.slot_time) === selectedNormalized && s.slot_date === formData.date,
    )

    if (!selectedSlot) {
      setFormError('Please select a time from the available slots.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const response = await fetch(buildApiUrl('/book-appointment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload || typeof payload !== 'object' || (payload as { success?: boolean }).success !== true) {
        throw new Error((payload as { message?: string } | null)?.message ?? 'Failed to send appointment request')
      }

      setSubmitted(true)
      setFormData({
        names: '',
        email: '',
        phone: '',
        date: getTodayValue(),
        time: '',
        meeting_format: '',
        meeting_type: '',
        message: '',
      })
      window.setTimeout(() => setSubmitted(false), 4000)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to send appointment request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="appointment section" id="contact" ref={ref}>
      <div className="container">
        <div className="section-header">
          <div className="section-label">Book a Meeting</div>
          <h2 className="section-title">Let&apos;s Talk Business</h2>
          <p className="section-subtitle">Schedule a consultation with our expert team. We&apos;re here to help you succeed.</p>
        </div>
        <div className={`appt-grid ${inView ? 'animate-in' : ''}`}>
          <div className="appt-info">
            <h3>Meeting Types</h3>
            {[
              ['Business Consultation', 'One-on-one expert session for your specific challenges'],
              ['Investment Discussion', 'Explore funding opportunities tailored to your stage'],
              ['Project Evaluation', 'In-depth review of your business plan and proposals'],
              ['Partnership Meeting', 'Discuss strategic collaborations and ecosystem opportunities'],
            ].map(([title, description]) => (
              <div className="appt-type" key={title}>
                <div>
                  <h4>{title}</h4>
                  <p>{description}</p>
                </div>
              </div>
            ))}
            <div className="appt-formats">
              <span>Onsite</span>
              <span>Virtual</span>
              <span>Phone Call</span>
            </div>
          </div>
          <div className="appt-form-wrap">
            {submitted ? (
              <div className="success-msg">
                <h3>Appointment Booked!</h3>
                <p>You&apos;ll receive a confirmation email with meeting details shortly.</p>
              </div>
            ) : (
              <form className="appt-form" onSubmit={handleSubmit}>
                {formError ? <p className="form-error" style={{ marginBottom: 12 }}>{formError}</p> : null}
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.names}
                    onChange={(event) => setFormData((previous) => ({ ...previous, names: event.target.value }))}
                    required
                    disabled={submitting}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(event) => setFormData((previous) => ({ ...previous, email: event.target.value }))}
                    required
                    disabled={submitting}
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(event) => setFormData((previous) => ({ ...previous, phone: event.target.value }))}
                  required
                  disabled={submitting}
                />
                <div className="form-row">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(event) => handleDateChange(event.target.value)}
                    min={getTodayValue()}
                    required
                    disabled={submitting}
                  />
                  <select
                    value={formData.meeting_format}
                    onChange={(event) => setFormData((previous) => ({ ...previous, meeting_format: event.target.value }))}
                    required
                    disabled={submitting}
                  >
                    <option value="">Select Meeting Format</option>
                    <option value="Onsite">Onsite</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Phone Call">Phone Call</option>
                  </select>
                </div>

                {/* Meeting Type Selection */}
                <select
                  value={formData.meeting_type}
                  onChange={(event) => setFormData((previous) => ({ ...previous, meeting_type: event.target.value }))}
                  required
                  disabled={submitting}
                >
                  <option value="">Select Meeting Type</option>
                  <option value="Business Consultation">Business Consultation</option>
                  <option value="Investment Discussion">Investment Discussion</option>
                  <option value="Project Evaluation">Project Evaluation</option>
                  <option value="Partnership Meeting">Partnership Meeting</option>
                </select>

                {/* Available Slots Display */}
                <div style={{ marginTop: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#35515b', marginBottom: 8 }}>Available Times</label>
                  {loadingSlots ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#57707b', fontSize: 13 }}>Loading available slots...</div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#57707b', fontSize: 13 }}>No available slots for this date</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 8 }}>
                      {availableSlots.map((slot) => {
                        const isSelected = (slot.slot_time.length > 5 ? slot.slot_time.slice(0, 5) : slot.slot_time) === formData.time
                        const displayTime = slot.slot_time.length > 5 ? slot.slot_time.slice(0, 5) : slot.slot_time

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => handleSlotSelect(displayTime)}
                            disabled={submitting}
                            style={{
                              padding: '10px',
                              borderRadius: 12,
                              border: isSelected ? '1px solid rgba(230, 168, 23, 0.35)' : '1px solid rgba(2, 49, 62, 0.12)',
                              background: isSelected ? 'linear-gradient(135deg, rgba(230, 168, 23, 0.18), rgba(255, 255, 255, 1))' : '#f8fcfd',
                              color: '#023341',
                              cursor: 'pointer',
                              fontWeight: isSelected ? 700 : 500,
                              fontSize: 13,
                            }}
                          >
                            {displayTime}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <textarea
                  rows={4}
                  placeholder="Brief description of your purpose / agenda..."
                  value={formData.message}
                  onChange={(event) => handleMessageChange(event.target.value)}
                  required
                  disabled={submitting}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 6 }}>
                  <span>{messageWords} / {WORD_LIMIT} words</span>
                  <span>Max {WORD_LIMIT} words</span>
                </div>
                <button type="submit" className="btn-primary full" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Book Appointment'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Logo />
              <p>Reshaping Rwanda’s investment environment by assisting Innovative/Creative and Impactful businesses to access funding and professional support for their growth.</p>
              <div className="footer-socials">
                <a target="_blank" rel="noreferrer" href="https://www.instagram.com/finverra__rw/" aria-label="LinkedIn">
                  <i className="bi bi-linkedin" aria-hidden="true" />
                </a>
                <a href="https://x.com/finverra__rw" target="_blank" rel="noreferrer" aria-label="Twitter">
                  <i className="bi bi-twitter-x" aria-hidden="true" />
                </a>
                <a href="https://www.facebook.com/finverra__rw" target="_blank" rel="noreferrer" aria-label="Facebook">
                  <i className="bi bi-facebook" aria-hidden="true" />
                </a>
                <a target="_blank" rel="noreferrer" href="https://www.instagram.com/finverra__rw/" aria-label="Instagram">
                  <i className="bi bi-instagram" aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className="footer-links">
              <h4>Menu</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about-us">About Us</Link></li>
                <li><Link to="/services">Services</Link></li>
                <li><Link to="/how-it-works">How it works</Link></li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Explore</h4>
              <ul>
                <li><Link to="/events-programs">Events & Programs</Link></li>
                <li><Link to="/invest-in">Invest In</Link></li>
                <li><Link to="/contact-us">Contact Us</Link></li>
                <li><a href="/#contact">Book Appointment</a></li>
                <li><Link to="/dashboard">Join Now</Link></li>
              </ul>
            </div>
            <div className="footer-contact">
              <h4>Contact</h4>
              <p><i className="bi bi-geo-alt" aria-hidden="true" /> Kigali, Rwanda</p>
              <p><i className="bi bi-envelope" aria-hidden="true" /> info@finverra.rw</p>
              <p><i className="bi bi-telephone" aria-hidden="true" /> +250781681561</p>
              <div className="footer-cert">
                
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>
            © 2026 FINVERRA. All rights reserved. |{' '}
            <a href={privacyTermsPdf} target="_blank" rel="noreferrer">
              Privacy Policy
            </a>{' '}
            |{' '}
            <a href={privacyTermsPdf} target="_blank" rel="noreferrer">
              Terms of Service
            </a>
          </p>
          <button
            className="scroll-to-top-btn finverra-scroll-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll to top"
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#fff" />
              <path d="M20 27V13" stroke="#2d2210" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M15 18L20 13L25 18" stroke="#2d2210" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      window.scrollTo(0, 0)
    }
  }, [location])

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Hero />
      <InvestmentShowcase />
      <Achievements />
      <Partners />
      <Testimonials />
      <Appointment />
      <Footer />
    </>
  )
}