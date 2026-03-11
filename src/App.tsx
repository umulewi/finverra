import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './App.css'

// Logo component using the uploaded image
const Logo = ({ className = '' }: { className?: string }) => (
  <img
    src="/src/assets/logo-finverra-white.png"
    alt="Finverra - Finance with trust"
    className={className}
    style={{ height: '52px', objectFit: 'contain' }}
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
function useCounter(target: number, inView: boolean, duration = 2000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])
  return count
}

// NAV
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = ['About', 'Services', 'Achievements', 'Events', 'Team', 'Contact']

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <Logo />
        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {links.map(l => (
            <li key={l}>
              <a href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{l}</a>
            </li>
          ))}
          <li><Link to="/dashboard" className="nav-cta" onClick={() => setMenuOpen(false)}>Join Now</Link></li>
        </ul>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}

// HERO
function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-bg">
        <div className="hero-orb orb1" />
        <div className="hero-orb orb2" />
        <div className="hero-orb orb3" />
        <div className="hero-grid" />
      </div>
      <div className="hero-content">
        <div className="hero-badge">🌍 Rwanda's Premier Investment Platform</div>
        <h1 className="hero-title">
          <span className="line">Finance</span>
          <span className="line accent">With Trust</span>
        </h1>
        <p className="hero-subtitle">
          Connecting entrepreneurs, SMEs, and investors through a secure,
          transparent, and professional ecosystem — built for Africa's future.
        </p>
        <div className="hero-actions">
          <Link to="/dashboard" className="btn-primary">Get Started <span>→</span></Link>
          <a href="#about" className="btn-ghost">Learn More</a>
        </div>
        <div className="hero-stats">
          {[['500+', 'Entrepreneurs'], ['120+', 'Investors'], ['80+', 'Active Projects'], ['RWF 2B+', 'Facilitated']].map(([val, label]) => (
            <div className="hero-stat" key={label}>
              <span className="stat-val">{val}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="hero-scroll">
        <div className="scroll-line" />
        <span>Scroll</span>
      </div>
    </section>
  )
}

// ABOUT
function About() {
  const { ref, inView } = useInView()
  const pillars = [
    { icon: '🌱', title: 'Sustainable Growth', desc: 'Building long-term economic value for Rwanda and Africa' },
    { icon: '🤝', title: 'Financial Inclusion', desc: 'Making finance accessible to every entrepreneur' },
    { icon: '💡', title: 'Innovation', desc: 'Technology-driven solutions for modern business challenges' },
    { icon: '👥', title: 'Job Creation', desc: 'Empowering businesses that drive employment' },
  ]
  return (
    <section className="about section" id="about" ref={ref}>
      <div className="container">
        <div className={`about-grid ${inView ? 'animate-in' : ''}`}>
          <div className="about-text">
            <div className="section-label">Who We Are</div>
            <h2 className="section-title">Transforming Rwanda's Investment Ecosystem</h2>
            <p className="about-lead">
              FINVERRA Ltd is a Rwandan private company dedicated to bridging the gap between
              ambitious entrepreneurs and the capital they need to thrive.
            </p>
            <p className="about-body">
              Our platform provides a secure, transparent, and professional environment where
              entrepreneurs prepare investment-ready projects and gain access to investors,
              commercial banks, and development partners. Beyond finance, we deliver continuous
              financial advisory, business consulting, and project support for long-term success.
            </p>
            <div className="about-vision">
              <div className="vision-box">
                <h4>Our Vision</h4>
                <p>To become a leading digital investment connectivity platform in Africa, enabling entrepreneurs to access finance and empowering investors to discover credible opportunities.</p>
              </div>
              <div className="vision-box">
                <h4>Our Mission</h4>
                <p>Connect entrepreneurs and SMEs with investors, banks, and financial partners through a secure, transparent platform with continuous advisory and business development support.</p>
              </div>
            </div>
          </div>
          <div className="about-pillars">
            {pillars.map((p, i) => (
              <div className="pillar-card" key={p.title} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="pillar-icon">{p.icon}</div>
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// SERVICES
function Services() {
  const { ref, inView } = useInView()
  const services = [
    {
      icon: '🔗',
      title: 'Investment Matching',
      desc: 'Connecting entrepreneurs and SMEs with individual and institutional investors through a structured, transparent platform.',
      tags: ['Startups', 'SMEs', 'Angel Investors', 'VC']
    },
    {
      icon: '🏦',
      title: 'Access to Finance',
      desc: 'Helping businesses obtain investment capital, bank loans, and grant opportunities from national and international organizations.',
      tags: ['Bank Loans', 'Grants', 'Capital']
    },
    {
      icon: '📊',
      title: 'Business Advisory',
      desc: 'Expert guidance in business strategy, investment preparation, financial planning, and sustainable business growth.',
      tags: ['Strategy', 'Planning', 'Growth']
    },
    {
      icon: '📋',
      title: 'Project Preparation',
      desc: 'Supporting entrepreneurs in preparing business plans, financial statements, and compelling investment proposals.',
      tags: ['Business Plans', 'Proposals', 'Financials']
    },
    {
      icon: '💻',
      title: 'Financial Management',
      desc: 'Digital tools for financial record keeping, expense tracking, tax monitoring, and business performance analysis.',
      tags: ['Records', 'Tax', 'Analytics']
    },
    {
      icon: '📈',
      title: 'Investment Monitoring',
      desc: 'Transparent monitoring tools allowing investors to track investments and business performance remotely in real time.',
      tags: ['Real-time', 'Dashboard', 'Reports']
    },
  ]
  return (
    <section className="services section" id="services" ref={ref}>
      <div className="container">
        <div className="section-header">
          <div className="section-label">What We Do</div>
          <h2 className="section-title">Comprehensive Financial Services</h2>
          <p className="section-subtitle">A full suite of tools and expertise to take your business from idea to investment-ready</p>
        </div>
        <div className={`services-grid ${inView ? 'animate-in' : ''}`}>
          {services.map((s, i) => (
            <div className="service-card" key={s.title} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="service-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <div className="service-tags">
                {s.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
              <div className="service-hover-line" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ACHIEVEMENTS
function AchievementCounter({ target, suffix = '', label }: { target: number; suffix?: string; label: string }) {
  const { ref, inView } = useInView(0.3)
  const count = useCounter(target, inView)
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

// EVENTS
function Events() {
  const { ref, inView } = useInView()
  const upcoming = [
    { date: 'APR 15', year: '2025', title: 'Investment Forum Kigali', type: 'Forum', desc: 'Annual gathering of investors and entrepreneurs to showcase investment-ready projects.' },
    { date: 'MAY 08', year: '2025', title: 'Entrepreneur Boot Camp', type: 'Workshop', desc: 'Intensive 2-day workshop covering financial planning, pitch preparation, and investor relations.' },
    { date: 'JUN 20', year: '2025', title: 'Investor–Entrepreneur Matchmaking', type: 'Networking', desc: 'Curated one-on-one sessions connecting vetted SMEs with qualified investors.' },
  ]
  return (
    <section className="events section" id="events" ref={ref}>
      <div className="container">
        <div className="section-header">
          <div className="section-label">Events & Gallery</div>
          <h2 className="section-title">Connect, Learn & Grow</h2>
          <p className="section-subtitle">Join our vibrant community events and be part of Rwanda's investment revolution</p>
        </div>
        <div className={`events-grid ${inView ? 'animate-in' : ''}`}>
          {upcoming.map((ev, i) => (
            <div className="event-card" key={ev.title} style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="event-date">
                <span className="event-day">{ev.date.split(' ')[1]}</span>
                <span className="event-month">{ev.date.split(' ')[0]}</span>
                <span className="event-year">{ev.year}</span>
              </div>
              <div className="event-info">
                <span className="event-type">{ev.type}</span>
                <h3>{ev.title}</h3>
                <p>{ev.desc}</p>
                <a href="#contact" className="event-register">Register →</a>
              </div>
            </div>
          ))}
        </div>
        <div className="gallery-placeholder">
          <div className="gallery-label">📸 Event Gallery — Coming Soon</div>
          <div className="gallery-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="gallery-item" key={i}>
                <div className="gallery-shimmer" />
                <div className="gallery-overlay">FINVERRA Events</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// TEAM
function Team() {
  const { ref, inView } = useInView()
  const team = [
    { name: 'Jean-Pierre Mugabo', role: 'CEO & Founder', bio: 'Serial entrepreneur with 15+ years in investment banking and SME development across East Africa.', initial: 'JM', color: '#F5C518' },
    { name: 'Amina Uwase', role: 'Chief Investment Officer', bio: 'Former investment analyst at BRD with deep expertise in SME financing and impact investing.', initial: 'AU', color: '#2DD4BF' },
    { name: 'Eric Niyomugabo', role: 'Head of Technology', bio: 'Tech visionary building Africa\'s most trusted digital investment infrastructure.', initial: 'EN', color: '#818CF8' },
    { name: 'Grace Ishimwe', role: 'Financial Advisory Lead', bio: 'CPA with extensive experience in financial planning, restructuring, and investor relations.', initial: 'GI', color: '#FB923C' },
  ]
  return (
    <section className="team section" id="team" ref={ref}>
      <div className="container">
        <div className="section-header">
          <div className="section-label">Our Team</div>
          <h2 className="section-title">The People Behind FINVERRA</h2>
          <p className="section-subtitle">Experienced professionals dedicated to your financial success</p>
        </div>
        <div className={`team-grid ${inView ? 'animate-in' : ''}`}>
          {team.map((m, i) => (
            <div className="team-card" key={m.name} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="team-avatar" style={{ background: `${m.color}22`, border: `2px solid ${m.color}44` }}>
                <span style={{ color: m.color }}>{m.initial}</span>
              </div>
              <h3>{m.name}</h3>
              <div className="team-role" style={{ color: m.color }}>{m.role}</div>
              <p>{m.bio}</p>
              <div className="team-links">
                <span>LinkedIn</span>
                <span>Email</span>
              </div>
            </div>
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
    <section className="testimonials section" id="testimonials" ref={ref}>
      <div className="container">
        <div className="section-header">
          <div className="section-label">Testimonials</div>
          <h2 className="section-title">Voices of Trust</h2>
        </div>
        <div className={`testimonial-wrapper ${inView ? 'animate-in' : ''}`}>
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

// SIGN UP
function SignUp() {
  const { ref, inView } = useInView()
  const [type, setType] = useState<'entrepreneur' | 'investor'>('entrepreneur')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <section className="signup section" id="signup" ref={ref}>
      <div className="signup-bg" />
      <div className="container">
        <div className={`signup-inner ${inView ? 'animate-in' : ''}`}>
          <div className="signup-info">
            <div className="section-label light">Join FINVERRA</div>
            <h2 className="section-title light">Start Your Journey Today</h2>
            <p>Become part of Rwanda's fastest-growing investment ecosystem. Whether you're building a business or seeking opportunities, FINVERRA is your trusted partner.</p>
            <div className="signup-steps">
              {['Create your account', 'Complete your profile', 'Submit your project or interest', 'Get matched with partners'].map((s, i) => (
                <div className="signup-step" key={s}>
                  <div className="step-num">{i + 1}</div>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="signup-form-wrap">
            <div className="type-toggle">
              <button className={type === 'entrepreneur' ? 'active' : ''} onClick={() => setType('entrepreneur')}>🚀 Entrepreneur</button>
              <button className={type === 'investor' ? 'active' : ''} onClick={() => setType('investor')}>💼 Investor</button>
            </div>
            {submitted ? (
              <div className="success-msg">
                <div className="success-icon">✅</div>
                <h3>Application Received!</h3>
                <p>Our team will contact you within 48 hours.</p>
              </div>
            ) : (
              <form className="signup-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <input type="text" placeholder="First Name" required />
                  <input type="text" placeholder="Last Name" required />
                </div>
                <input type="email" placeholder="Email Address" required />
                <input type="tel" placeholder="Phone Number" />
                {type === 'entrepreneur' && <input type="text" placeholder="Business / Startup Name" />}
                {type === 'investor' && <input type="text" placeholder="Organization / Fund Name" />}
                <select>
                  <option value="">Select your primary interest</option>
                  {type === 'entrepreneur'
                    ? ['Investment Capital', 'Bank Loan Support', 'Business Advisory', 'Grant Opportunities'].map(o => <option key={o}>{o}</option>)
                    : ['Equity Investment', 'Debt Investment', 'Portfolio Monitoring', 'Deal Sourcing'].map(o => <option key={o}>{o}</option>)}
                </select>
                <button type="submit" className="btn-primary full">Create Account →</button>
                <p className="form-disclaimer">By registering, you agree to our Terms of Service and Privacy Policy.</p>
              </form>
            )}
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
              ['🏢', 'Business Consultation', 'One-on-one expert session for your specific challenges'],
              ['💰', 'Investment Discussion', 'Explore funding opportunities tailored to your stage'],
              ['📑', 'Project Evaluation', 'In-depth review of your business plan and proposals'],
              ['🤝', 'Partnership Meeting', 'Discuss strategic collaborations and ecosystem opportunities'],
            ].map(([icon, title, desc]) => (
              <div className="appt-type" key={title as string}>
                <div className="appt-icon">{icon}</div>
                <div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
            <div className="appt-formats">
              <span>📍 In-Person (Kigali)</span>
              <span>💻 Zoom / Google Meet</span>
              <span>📞 Phone Call</span>
            </div>
          </div>
          <div className="appt-form-wrap">
            {submitted ? (
              <div className="success-msg">
                <div className="success-icon">📅</div>
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
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Logo />
              <p>Transforming Rwanda's investment ecosystem by connecting entrepreneurs with the capital and expertise they need to grow.</p>
              <div className="footer-socials">
                <a href="#">LinkedIn</a>
                <a href="#">Twitter</a>
                <a href="#">Facebook</a>
                <a href="#">Instagram</a>
              </div>
            </div>
            <div className="footer-links">
              <h4>Platform</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#achievements">Achievements</a></li>
                <li><a href="#events">Events</a></li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Get Started</h4>
              <ul>
                <li><Link to="/dashboard">Sign Up</Link></li>
                <li><a href="#contact">Book Appointment</a></li>
                <li><a href="#team">Our Team</a></li>
                <li><a href="#">Careers</a></li>
              </ul>
            </div>
            <div className="footer-contact">
              <h4>Contact</h4>
              <p>📍 Kigali, Rwanda</p>
              <p>📧 info@finverra.rw</p>
              <p>📞 +250 788 000 000</p>
              <div className="footer-cert">
                <span>🔐 Secured Platform</span>
                <span>✅ RDB Registered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>© 2025 FINVERRA Ltd. All rights reserved. | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
        </div>
      </div>
    </footer>
  )
}

// PARTNERS
function Partners() {
  const { ref, inView } = useInView()

  const partners = [
    { name: 'Rwanda Development Board', abbr: 'RDB', category: 'Government', color: '#3B82F6' },
    { name: 'Bank of Kigali', abbr: 'BK', category: 'Banking', color: '#10B981' },
    { name: 'Development Bank of Rwanda', abbr: 'BRD', category: 'Development', color: '#F59E0B' },
    { name: 'Ministry of Finance', abbr: 'MINECOFIN', category: 'Government', color: '#8B5CF6' },
    { name: 'Rwanda Finance Limited', abbr: 'RFL', category: 'Finance', color: '#EC4899' },
    { name: 'I&M Bank Rwanda', abbr: 'I&M', category: 'Banking', color: '#14B8A6' },
    { name: 'Equity Bank Rwanda', abbr: 'EBR', category: 'Banking', color: '#F97316' },
    { name: 'Africa50', abbr: 'A50', category: 'Investment', color: '#6366F1' },
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
              <div className="partner-logo-card" key={i}>
                <div className="partner-logo-circle" style={{ background: `${p.color}18`, borderColor: `${p.color}30` }}>
                  <span className="partner-abbr" style={{ color: p.color }}>{p.abbr}</span>
                </div>
                <div className="partner-meta">
                  <span className="partner-name">{p.name}</span>
                  <span className="partner-cat" style={{ color: p.color }}>{p.category}</span>
                </div>
              </div>
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
  return (
    <div className="app">
      <Navbar />
      <Hero />
      <About />
      <Services />
      <Achievements />
      <Partners />
      <Events />
      <Team />
      <Testimonials />
      <SignUp />
      <Appointment />
      <Footer />
    </div>
  )
}