import { useEffect, useRef, useState } from 'react'
import eventProtocol from '../assets/images/people-taking-part-high-protocol-event.jpg'

type EventsSectionProps = {
  sectionId?: string
}

export default function EventsSection({ sectionId = 'events' }: EventsSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
        }
      },
      { threshold: 0.15 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const upcoming = [
    {
      date: 'MAY 01',
      year: 'Every Year',
      title: "CEO's Summit",
      type: 'Forum',
      desc: 'A dynamic platform that brings together CEOs, business leaders, key decision-makers, and emerging entrepreneurs to share experiences and support one another in their journey toward excellence. It identifies daily operational challenges and explores practical, collaborative solutions that drive growth and long-term success.',
    },
  ]

  return (
    <section className="events events-modern section" id={sectionId} ref={ref}>
      <div className="container">
        <div className="section-header events-header-modern">
          <div className="section-label">Event & Gallery</div>
          <h2 className="section-title">CEO's Summit Forum</h2>
          <p className="section-subtitle">Our signature annual forum, held every May, where leadership meets practical business growth solutions.</p>
        </div>

        <div className={`events-modern-grid ${inView ? 'animate-in' : ''}`}>
          <div className="events-list-modern">
            {upcoming.map((ev, i) => (
              <div className="event-card-modern" key={ev.title} style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="event-date-modern">
                  <span className="event-day-modern">{ev.date.split(' ')[1]}</span>
                  <span className="event-month-modern">{ev.date.split(' ')[0]}</span>
                  <span className="event-year-modern">{ev.year}</span>
                </div>
                <div className="event-info-modern">
                  <span className="event-type-modern">{ev.type}</span>
                  <h3>{ev.title}</h3>
                  <p>{ev.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="events-feature-media">
            <img src={eventProtocol} alt="CEO's Summit forum highlights" className="events-feature-image" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </section>
  )
}
