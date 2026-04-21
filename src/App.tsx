import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { buildApiUrl } from './config/api'

import './App.css'
import ScrollToTop from './components/ScrollToTop'

// Image imports from assets
import logoFinverraWhite from './assets/logo-finverra-white.png'
import heroKigali from './assets/images/hero-kigali.jpg'
import strategicMeeting from './assets/images/generated_strategic_meeting.png'
import corporateMeeting from './assets/images/about-meeting.jpg'
import eventConference from './assets/images/event-conference.jpg'
import sample from './assets/images/sample.png'
import eventProtocol1 from './assets/images/slide1.jpg'
import eventProtocol from './assets/images/people-taking-part-high-protocol-event.jpg'

// Logo component using the uploaded image
const Logo = ({ className = '' }: { className?: string }) => (
  <img
    src={logoFinverraWhite}
    alt="Finverra - Finance with trust"
    className={className}
    style={{ height: '78px', objectFit: 'contain' }}
  />
)

// Hook for intersection observer animations
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true)
    }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// Counter animation hook
function useCounter(target: number, inView: boolean, duration = 2000, restartKey = 0) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    setCount(0)
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration, restartKey])
  return count
}

type PartnerApiItem = {
  id: number
  image: string
  url: string
}

type PartnerCard = PartnerApiItem & {
  color: string
}

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

const PARTNER_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#14B8A6', '#F97316', '#6366F1']

const FALLBACK_PARTNERS: PartnerCard[] = [
  { id: 1, image: '/patners/rdb.png', url: 'https://www.rdb.rw/', color: PARTNER_COLORS[0] },
  { id: 2, image: '/patners/bk.jpg', url: 'https://bk.rw/', color: PARTNER_COLORS[1] },
  { id: 3, image: '/patners/brd.png', url: 'https://www.brd.rw/', color: PARTNER_COLORS[2] },
  { id: 4, image: '/patners/im.png', url: 'https://www.imbankgroup.com/rwanda/', color: PARTNER_COLORS[3] },
  { id: 5, image: '/patners/Equity_Group_Logo.png', url: 'https://equitygroupholdings.com/rw/', color: PARTNER_COLORS[4] },
  { id: 6, image: '/patners/africa50.jpg', url: 'https://www.africa50.com/', color: PARTNER_COLORS[5] },
]

const FALLBACK_TESTIMONIALS: TestimonialCard[] = [
  {
    id: 1,
    name: 'Marie Claire Uwimana',
    role: 'Founder, AgroTech Rwanda',
    text: 'FINVERRA connected me with the right investors within 3 months. Their advisory team prepared my business plan professionally and I secured RWF 50M in funding. Life-changing!',
    rating: 5,
  },
  {
    id: 2,
    name: 'Patrick Habimana',
    role: 'CEO, TechHub Kigali',
    text: 'The investment monitoring dashboard gives our investors real-time visibility which built enormous trust. FINVERRA transformed how we communicate with our funding partners.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Sophie Niyonzima',
    role: 'Investor, Kigali Capital Partners',
    text: 'As an investor, I value the due diligence FINVERRA does before presenting opportunities. Every project I\'ve reviewed has been thoroughly vetted and professionally prepared.',
    rating: 5,
  },
]

// NAV
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
    'How It Works',
    'Services',
    'Events',
    'Programs',
    'Team',
    'Contact', // Contact Us last
  ]

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <Link
          to="/"
          className="nav-logo-link"
          aria-label="Go to homepage"
          onClick={() => {
            setActiveLink('')
            setMenuOpen(false)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <Logo />
        </Link>
        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {links.map(l => (
            l === 'Contact' ? (
              <li key={l}>
                <Link
                  to="/#contact"
                  className={activeLink === l ? 'active' : ''}
                  onClick={() => {
                    setActiveLink(l)
                    setMenuOpen(false)
                  }}
                >
                  {l}
                </Link>
              </li>
            ) : (
              <li key={l}>
                <Link
                  to={`/${l.replace(/\s+/g, '-').toLowerCase()}`}
                  className={activeLink === l ? 'active' : ''}
                  onClick={() => {
                    setActiveLink(l)
                    setMenuOpen(false)
                  }}
                >
                  {l}
                </Link>
              </li>
            )
          ))}
          <li><Link to="/dashboard" className="nav-cta" onClick={() => setMenuOpen(false)}>Join Now</Link></li>
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

// HERO
function Hero() {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const heroImages = [heroKigali, eventProtocol1, eventProtocol]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section
      className="hero"
      id="home"
      style={{
        backgroundImage: `linear-gradient(145deg, rgba(1, 24, 32, 0.24) 0%, rgba(2, 51, 65, 0.2) 30%, rgba(3, 74, 94, 0.18) 58%, rgba(2, 58, 74, 0.2) 75%, rgba(1, 28, 40, 0.24) 100%), url(${heroImages[activeImageIndex]})`,
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
          Connecting entrepreneurs, SMEs, and investors through a secure,
          transparent, and professional ecosystem — built for Africa's future.
        </p>
        <div className="hero-actions">
          <Link to="/dashboard" className="btn-primary">Get Started <span>→</span></Link>
          <a href="#about" className="btn-ghost">Learn More</a>
        </div>
        <div className="hero-stats">
          {[['50+', 'Entrepreneurs'], ['12+', 'Investors'], ['20+', 'Active Projects'], ['RWF 2M+', 'Facilitated']].map(([val, label]) => (
            <div className="hero-stat" key={label}>
              <span className="stat-val">{val}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="hero-carousel-indicators">
        {heroImages.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot ${i === activeImageIndex ? 'active' : ''}`}
            onClick={() => setActiveImageIndex(i)}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>
      
    </section>
  )
}


// ACHIEVEMENTS
function AchievementCounter({ target, suffix = '', label }: { target: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    let wasIntersecting = false
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
      if (entry.isIntersecting && !wasIntersecting) {
        setRunId(prev => prev + 1)
      }
      wasIntersecting = entry.isIntersecting
    }, { threshold: 0.3 })

    if (ref.current) observer.observe(ref.current)
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

// BUSINESS SHOWCASE — Animated image gallery with carousel
function BusinessShowcase() {
  const { ref, inView } = useInView()
  
  // Showcase cards with titles and descriptions
  const showcaseCards = [
    {
      slug: 'strategic-partnerships',
      title: 'Strategic Partnerships',
      desc: 'Building long-term relationships that drive mutual growth and success',
      image: eventProtocol,
    },
    {
      slug: 'collaborative-innovation',
      title: 'Collaborative Innovation',
      desc: 'Teams working together to create transformative business solutions',
      image: eventConference,
    },
    {
      slug: 'expert-leadership',
      title: 'Expert Leadership',
      desc: 'Experienced professionals guiding businesses through growth stages',
      image: corporateMeeting,
    },
  ]

  // Image carousel rail (all available business images)
  const showcaseRail = [
    heroKigali,
    eventProtocol1,
    eventProtocol,
    eventConference,
    corporateMeeting,
    strategicMeeting,
    sample,
    eventProtocol1, // Loop back for seamless animation
  ]

  return (
    <section className="showcase section" id="showcase" ref={ref}>
      <div className="container">
        <div className={`showcase-about about-grid about-grid-modern ${inView ? 'animate-in' : ''}`} id="about">
          <div className="about-text">
            <div className="section-label">Who We Are</div>
            <h2 className="section-title about-title-highlight">
              <span>Transforming Rwanda&apos;s</span>
              <span>Investment Ecosystem</span>
            </h2>
            <p className="about-lead">
              FINVERRA is a Rwandan private company dedicated to bridging the gap between ambitious entrepreneurs and the capital they need to thrive.
            </p>
            <p className="about-body">
              Our platform provides a secure, transparent, and professional environment where entrepreneurs prepare investment-ready projects and gain access to investors,
              commercial banks, and development partners. Beyond finance, we deliver continuous financial advisory, business consulting, and project support for long-term success.
            </p>
            <div className="about-vision-modern">
              <div className="vision-box modern-card">
                <h4>Our Vision</h4>
                <p>
                  To be a leading digital investment platform in Africa, empowering entrepreneurs with access to finance and enabling investors to unlock credible opportunities.
                </p>
              </div>
              <div className="vision-box modern-card">
                <h4>Our Mission</h4>
                <p>
                  To connect entrepreneurs and SMEs with investors and financial partners through a secure, transparent platform, supported by continuous advisory and business development services.
                </p>
              </div>
            </div>
          </div>

          <div className="about-media-panel">
            <div className="about-feature-image-wrap about-feature-large">
              <img src={corporateMeeting} alt="FINVERRA team meeting with investors" className="about-feature-image" loading="lazy" decoding="async" />
              <div className="about-image-ring" />
              <div className="about-media-caption">
                <span>Built in Rwanda. Designed for Africa.</span>
                <strong>Investment Facilitation Company</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="section-header">
          <div className="section-label">Success Stories</div>
          <h2 className="section-title">Partnerships That Matter</h2>
          <p className="section-subtitle">Real businesses, real growth, real impact — see what's possible with FINVERRA</p>
        </div>

        {/* Animated Showcase Cards Grid */}
        <div className={`showcase-grid ${inView ? 'animate-in' : ''}`}>
          {showcaseCards.map((card, i) => (
            <Link to={`/partnerships/${card.slug}`} className="showcase-card showcase-card-link" key={card.title} style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="showcase-card-image">
                <img src={card.image} alt={card.title} loading="lazy" decoding="async" />
              </div>
              <div className="showcase-content">
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <div className="showcase-link">Read Article →</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Animated Horizontal Image Carousel */}
        <div className="showcase-rail-section">
          <h3 className="rail-title">Our Community in Action</h3>
          <div className="showcase-rail-wrap" aria-hidden="true">
            <div className="showcase-rail-fade-left" />
            <div className="showcase-rail-fade-right" />
            <div className="showcase-rail">
              {[...showcaseRail, ...showcaseRail].map((image, idx) => (
                <img
                  key={`${idx}`}
                  src={image}
                  alt="Business community"
                  className="showcase-rail-img"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
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


// TESTIMONIALS
function Testimonials() {
  const { ref, inView } = useInView()
  const [active, setActive] = useState(0)
  const [testimonials, setTestimonials] = useState<TestimonialCard[]>(FALLBACK_TESTIMONIALS)

  useEffect(() => {
    let mounted = true

    async function loadTestimonials() {
      try {
        const response = await fetch(buildApiUrl('/admin/testimonials'))
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload || typeof payload !== 'object' || !Array.isArray((payload as { testimonials?: unknown }).testimonials)) {
          return
        }

        const apiTestimonials = (payload as { testimonials: TestimonialApiItem[] }).testimonials
        const mappedTestimonials: TestimonialCard[] = apiTestimonials
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
        // Keep fallback testimonials if the API is unavailable.
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

    const timer = setInterval(() => setActive((a) => (a + 1) % testimonials.length), 5000)
    return () => clearInterval(timer)
  }, [testimonials])

  const t = testimonials[active]
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
            <div className="quote-mark">"</div>
            <p className="testimonial-text">{t.text}</p>
            <div className="testimonial-author">
              <div className="author-avatar">{t.name.split(' ').map(n => n[0]).join('')}</div>
              <div>
                <div className="author-name">{t.name}</div>
                <div className="author-role">{t.role}</div>
              </div>
              <div className="stars">{'★'.repeat(t.rating)}</div>
            </div>
          </div>
          <div className="testimonial-dots">
            {testimonials.map((_, i) => (
              <button key={i} className={`dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// APPOINTMENT
function Appointment() {
  const { ref, inView } = useInView()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    names: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    meeting_format: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.names.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.date || !formData.time || !formData.meeting_format || !formData.message.trim()) {
      setFormError('All fields are required.')
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

      if (!response.ok || !payload || typeof payload !== 'object' || payload.success !== true) {
        throw new Error((payload as { message?: string } | null)?.message ?? 'Failed to send appointment request')
      }

      setSubmitted(true)
      setFormData({
        names: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        meeting_format: '',
        message: '',
      })
      setTimeout(() => setSubmitted(false), 4000)
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
          <h2 className="section-title">Let's Talk Business</h2>
          <p className="section-subtitle">Schedule a consultation with our expert team — we're here to help you succeed</p>
        </div>
        <div className={`appt-grid ${inView ? 'animate-in' : ''}`}>
          <div className="appt-info">
            <h3>Meeting Types</h3>
            {[
              ['Business Consultation', 'One-on-one expert session for your specific challenges'],
              ['Investment Discussion', 'Explore funding opportunities tailored to your stage'],
              ['Project Evaluation', 'In-depth review of your business plan and proposals'],
              ['Partnership Meeting', 'Discuss strategic collaborations and ecosystem opportunities'],
            ].map(([title, desc]) => (
              <div className="appt-type" key={title as string}>
                <div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="appt-form-wrap">
            {submitted ? (
              <div className="success-msg">
                <h3>Appointment Booked!</h3>
                <p>You'll receive a confirmation email with meeting details shortly.</p>
              </div>
            ) : (
              <form className="appt-form" onSubmit={handleSubmit}>
                {formError && <p className="form-error" style={{ marginBottom: 12 }}>{formError}</p>}
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.names}
                    onChange={(event) => setFormData((prev) => ({ ...prev, names: event.target.value }))}
                    required
                    disabled={submitting}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                    required
                    disabled={submitting}
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                  required
                  disabled={submitting}
                />
                <div className="form-row">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))}
                    required
                    disabled={submitting}
                  />
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(event) => setFormData((prev) => ({ ...prev, time: event.target.value }))}
                    required
                    disabled={submitting}
                  />
                </div>
                <select
                  value={formData.meeting_format}
                  onChange={(event) => setFormData((prev) => ({ ...prev, meeting_format: event.target.value }))}
                  required
                  disabled={submitting}
                >
                  <option value="">Type of Meeting</option>
                  <option>Business Consultation</option>
                  <option>Investment Discussion</option>
                  <option>Project Evaluation</option>
                  <option>Partnership Meeting</option>
                  <option>Advisory Session</option>
                </select>
                <textarea
                  placeholder="Brief description of your purpose / agenda..."
                  rows={3}
                  value={formData.message}
                  onChange={(event) => setFormData((prev) => ({ ...prev, message: event.target.value }))}
                  required
                  disabled={submitting}
                />
                <button type="submit" className="btn-primary full" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Book Appointment →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// FOOTER
export function Footer() {
  const location = useLocation()
  const sectionHref = (section: string) => (location.pathname === '/' ? `#${section}` : `/#${section}`)

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Logo />
              <p>Transforming Rwanda's investment ecosystem by connecting entrepreneurs with the capital and expertise they need to grow.</p>
              <div className="footer-socials">
                <a href="#" aria-label="LinkedIn">
                  <i className="bi bi-linkedin" aria-hidden="true" />
                </a>
                <a href="#" aria-label="Twitter">
                  <i className="bi bi-twitter-x" aria-hidden="true" />
                </a>
                <a href="#" aria-label="Facebook">
                  <i className="bi bi-facebook" aria-hidden="true" />
                </a>
                <a href="#" aria-label="Instagram">
                  <i className="bi bi-instagram" aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className="footer-links">
              <h4>Platform</h4>
              <ul>
                <li><a href={sectionHref('about')}>About Us</a></li>
                <li><Link to="/services">Services</Link></li>
                <li><a href={sectionHref('achievements')}>Achievements</a></li>
                <li><Link to="/events">Events</Link></li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Get Started</h4>
              <ul>
                <li><Link to="/dashboard">Sign Up</Link></li>
                <li><a href={sectionHref('contact')}>Book Appointment</a></li>
                <li><Link to="/team">Our Team</Link></li>
                <li><a href="#">Careers</a></li>
              </ul>
            </div>
            <div className="footer-contact">
              <h4>Contact</h4>
              <p><i className="bi bi-geo-alt" aria-hidden="true" /> Kigali, Rwanda</p>
              <p><i className="bi bi-envelope" aria-hidden="true" /> info@finverra.rw</p>
              <p><i className="bi bi-telephone" aria-hidden="true" /> +250781681561</p>
              <div className="footer-cert">
                <span><i className="bi bi-shield-lock" aria-hidden="true" /> Secured Platform</span>
                <span><i className="bi bi-patch-check" aria-hidden="true" /> RDB Registered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>© 2026 FINVERRA. All rights reserved. | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
          <button
            className="scroll-to-top-btn finverra-scroll-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll to top"
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#fff" />
              <path d="M20 27V13" stroke="#2d2210" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M15 18L20 13L25 18" stroke="#2d2210" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </footer>
  )
}

// PARTNERS
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

  // Duplicate for seamless infinite scroll
  const allPartners = [...partners, ...partners]

  return (
    <section className="partners-section" ref={ref}>
      <div className="partners-inner">
        <div className={`partners-header ${inView ? 'animate-in' : ''}`}>
          <div className="section-label" style={{ textAlign: 'center' }}>Our Partners</div>
          <h2 className="section-title" style={{ textAlign: 'center', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>
            Trusted by Leading Institutions
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto' }}>
            We collaborate with Rwanda's top banks, government bodies, and development organizations
          </p>
        </div>

        {/* Infinite sliding track */}
        <div className="partners-track-wrap">
          <div className="partners-fade-left" />
          <div className="partners-fade-right" />
          <div className="partners-track">
            {allPartners.map((p, i) => (
              <a
                className="partner-logo-card"
                key={`${p.id}-${i}`}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit partner website"
              >
                <div className="partner-logo-circle" style={{ background: `${p.color}18`, borderColor: `${p.color}30` }}>
                  <img src={buildApiUrl(p.image)} alt="Partner logo" className="partner-logo-img" loading="lazy" decoding="async" />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* CTA strip */}
        <div className={`partners-cta ${inView ? 'animate-in' : ''}`}>
          <p>Interested in partnering with FINVERRA?</p>
          <a href="#contact" className="btn-ghost" style={{ fontSize: '0.88rem', padding: '12px 28px' }}>Become a Partner →</a>
        </div>
      </div>
    </section>
  )
}

// MAIN APP
export default function App() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace('#', ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0); // Use instant scroll for reliability
    }
  }, [location]);

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Hero />

      <BusinessShowcase />
      <Achievements />
      <Partners />
      <Testimonials />
      <Appointment />
      <Footer />
    </>
  )
}