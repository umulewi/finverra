import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ServicesSection from './components/ServicesSection'
import EventsSection from './components/EventsSection'
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

// NAV
export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('')
  const location = useLocation()
  const sectionHref = (section: string) => (location.pathname === '/' ? `#${section}` : `/#${section}`)

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

// ABOUT
function About() {
  const { ref, inView } = useInView()
  const aboutFeatureImage = corporateMeeting

  return (
    <section className="about section" id="about" ref={ref}>
      <div className="container">
        <div className={`about-grid about-grid-modern ${inView ? 'animate-in' : ''}`}>
          <div className="about-text">
            <div className="section-label">Who We Are</div>
            <h2 className="section-title about-title-highlight">
              <span>Transforming Rwanda's</span>
              <span>Investment Ecosystem</span>
            </h2>
            <p className="about-lead">
              FINVERRA  is a Rwandan private company dedicated to bridging the gap between
              ambitious entrepreneurs and the capital they need to thrive.
            </p>
            <p className="about-body">
              Our platform provides a secure, transparent, and professional environment where
              entrepreneurs prepare investment-ready projects and gain access to investors,
              commercial banks, and development partners. Beyond finance, we deliver continuous
              financial advisory, business consulting, and project support for long-term success.
            </p>
            <div className="about-vision about-vision-modern">
              <div className="vision-box modern-card">
                <h4>Our Vision</h4>
                <p>To become a leading digital investment connectivity platform in Africa, enabling entrepreneurs to access finance and empowering investors to discover credible opportunities.</p>
              </div>
              <div className="vision-box modern-card">
                <h4>Our Mission</h4>
                <p>To connect entrepreneurs and SMEs with investors and financial partners through a secure, transparent platform, supported by continuous advisory and business development services.</p>
              </div>
            </div>
          </div>
          <div className="about-media-panel">
            <div className="about-image-ring" />
            <div className="about-feature-image-wrap about-feature-large">
              <img src={aboutFeatureImage} alt="Strategic business discussion" className="about-feature-image" loading="lazy" decoding="async" />
              <div className="about-media-caption">
                <span>Built in Rwanda. Designed for Africa.</span>
                <strong>Trusted investment connections</strong>
              </div>
            </div>
          </div>
        </div>
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

// TEAM
function Team() {
  const { ref, inView } = useInView()
  const team = [
    {
      name: 'Ishimwe Rodrigue',
      role: 'CEO & Founder',
      bio: 'Leads FINVERRA\'s strategic direction, investor partnerships, and platform growth across Rwanda\'s entrepreneurship ecosystem.',
      image: sample,
      email: 'mailto:rodrigue.ishimwe@finverra.rw',
      linkedin: 'https://www.linkedin.com/in/rodrigue-ishimwe',
    },
    {
      name: 'Aline Uwase',
      role: 'Head of Investment Advisory',
      bio: 'Guides entrepreneurs to become investment-ready through financial modeling, due diligence preparation, and deal structuring support.',
      image: sample,
      email: 'mailto:aline.uwase@finverra.rw',
      linkedin: 'https://www.linkedin.com/in/aline-uwase',
    },
    {
      name: 'Patrick Ndayisaba',
      role: 'Partnerships & Ecosystem Lead',
      bio: 'Builds collaboration with banks, development partners, and institutions to unlock practical financing pathways for SMEs.',
      image: sample,
      email: 'mailto:patrick.ndayisaba@finverra.rw',
      linkedin: 'https://www.linkedin.com/in/patrick-ndayisaba',
    },
    {
      name: 'Jeanne Mukamana',
      role: 'Operations & Client Success Manager',
      bio: 'Ensures founders and investors receive responsive support, smooth onboarding, and consistent progress across every engagement.',
      image: sample,
      email: 'mailto:jeanne.mukamana@finverra.rw',
      linkedin: 'https://www.linkedin.com/in/jeanne-mukamana',
    },
    
    
  ]
  return (
    <section className="team team-modern section" id="team" ref={ref}>
      <div className="container">
        <div className="section-header team-header-modern">
          <h2 className="section-title">Our Team</h2>
          <p className="section-subtitle">Explore the full team powering FINVERRA with technology, strategy, and investor-first execution.</p>
        </div>
        <div className={`team-grid-modern ${inView ? 'animate-in' : ''}`}>
          {team.map((m, i) => (
            <article className="team-card-modern" key={`${m.name}-${i}`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="team-photo-wrap">
                <img src={m.image} alt={m.name} className="team-photo" loading="lazy" decoding="async" />
              </div>
              <div className="team-content-modern">
                <h3>{m.name}</h3>
                <div className="team-role-modern">{m.role}</div>
                <p>{m.bio}</p>
                <div className="team-social-modern">
                  <a href={m.email} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} Email`}><i className="bi bi-envelope" aria-hidden="true" /></a>
                  <a href={m.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} LinkedIn`}><i className="bi bi-linkedin" aria-hidden="true" /></a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// TESTIMONIALS
function Testimonials() {
  const { ref, inView } = useInView()
  const [active, setActive] = useState(0)
  const testimonials = [
    { name: 'Marie Claire Uwimana', role: 'Founder, AgroTech Rwanda', text: 'FINVERRA connected me with the right investors within 3 months. Their advisory team prepared my business plan professionally and I secured RWF 50M in funding. Life-changing!', rating: 5 },
    { name: 'Patrick Habimana', role: 'CEO, TechHub Kigali', text: 'The investment monitoring dashboard gives our investors real-time visibility which built enormous trust. FINVERRA transformed how we communicate with our funding partners.', rating: 5 },
    { name: 'Sophie Niyonzima', role: 'Investor, Kigali Capital Partners', text: 'As an investor, I value the due diligence FINVERRA does before presenting opportunities. Every project I\'ve reviewed has been thoroughly vetted and professionally prepared.', rating: 5 },
  ]
  useEffect(() => {
    const timer = setInterval(() => setActive(a => (a + 1) % testimonials.length), 5000)
    return () => clearInterval(timer)
  }, [])
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
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
            <div className="appt-formats">
              <span>In-Person (Kigali)</span>
              <span>Zoom / Google Meet</span>
              <span>Phone Call</span>
            </div>
          </div>
          <div className="appt-form-wrap">
            {submitted ? (
              <div className="success-msg">
                <h3>Appointment Booked!</h3>
                <p>You'll receive a confirmation email with meeting details shortly.</p>
              </div>
            ) : (
              <form className="appt-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <input type="text" placeholder="Full Name" required />
                  <input type="email" placeholder="Email Address" required />
                </div>
                <select required>
                  <option value="">Type of Meeting</option>
                  <option>Business Consultation</option>
                  <option>Investment Discussion</option>
                  <option>Project Evaluation</option>
                  <option>Partnership Meeting</option>
                  <option>Advisory Session</option>
                </select>
                <div className="form-row">
                  <input type="date" required />
                  <select>
                    <option>9:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                    <option>2:00 PM</option>
                    <option>3:00 PM</option>
                    <option>4:00 PM</option>
                  </select>
                </div>
                <select>
                  <option value="">Meeting Format</option>
                  <option>In-Person (Kigali Office)</option>
                  <option>Zoom</option>
                  <option>Google Meet</option>
                  <option>Phone Call</option>
                </select>
                <textarea placeholder="Brief description of your purpose / agenda..." rows={3} />
                <button type="submit" className="btn-primary full">Book Appointment →</button>
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

  const partners = [
    { name: 'Rwanda Development Board', category: 'Government', color: '#3B82F6', logo: '/patners/rdb.png', website: 'https://www.rdb.rw/' },
    { name: 'Bank of Kigali', category: 'Banking', color: '#10B981', logo: '/patners/bk.jpg', website: 'https://bk.rw/' },
    { name: 'Development Bank of Rwanda', category: 'Development', color: '#F59E0B', logo: '/patners/brd.png', website: 'https://www.brd.rw/' },
    { name: 'I&M Bank Rwanda', category: 'Banking', color: '#14B8A6', logo: '/patners/im.png', website: 'https://www.imbankgroup.com/rwanda/' },
    { name: 'Equity Bank Rwanda', category: 'Banking', color: '#F97316', logo: '/patners/Equity_Group_Logo.png', website: 'https://equitygroupholdings.com/rw/' },
    { name: 'Africa50', category: 'Investment', color: '#6366F1', logo: '/patners/africa50.jpg', website: 'https://www.africa50.com/' },
  ]

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
                key={`${p.name}-${i}`}
                href={p.website}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${p.name} website`}
              >
                <div className="partner-logo-circle" style={{ background: `${p.color}18`, borderColor: `${p.color}30` }}>
                  <img src={p.logo} alt={`${p.name} logo`} className="partner-logo-img" loading="lazy" decoding="async" />
                </div>
                <div className="partner-meta">
                  <span className="partner-name">{p.name}</span>
                  <span className="partner-cat" style={{ color: p.color }}>{p.category}</span>
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