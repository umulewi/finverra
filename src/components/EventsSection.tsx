import { useEffect, useRef, useState } from 'react'
import eventProtocol from '../assets/images/people-taking-part-high-protocol-event.jpg'
import { buildApiUrl } from '../config/api'

type ApiEvent = {
  id: number
  title: string
  description: string
  type: string
  date: string
  image: string
}

type EventCard = {
  id: number
  title: string
  desc: string
  type: string
  dateLabel: string
  yearLabel: string
  image: string
}

const FALLBACK_EVENTS: EventCard[] = [
  {
    id: 0,
    dateLabel: 'MAY 01',
    yearLabel: 'Every Year',
    title: "CEO's Summit",
    type: 'Forum',
    desc: 'A dynamic platform that brings together CEOs, business leaders, key decision-makers, and emerging entrepreneurs to share experiences and support one another in their journey toward excellence. It identifies daily operational challenges and explores practical, collaborative solutions that drive growth and long-term success.',
    image: eventProtocol,
  },
]

function getDateLabel(isoDate: string) {
  const parsed = new Date(isoDate)

  if (Number.isNaN(parsed.getTime())) {
    return 'TBA'
  }

  const day = String(parsed.getDate()).padStart(2, '0')
  const month = parsed.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  return `${month} ${day}`
}

function getYearLabel(isoDate: string) {
  const parsed = new Date(isoDate)
  return Number.isNaN(parsed.getTime()) ? '' : 'Every Year'
}

function formatEventType(type: string) {
  if (!type.trim()) {
    return 'Event'
  }

  return type.charAt(0).toUpperCase() + type.slice(1)
}

type EventsSectionProps = {
  sectionId?: string
}

export default function EventsSection({ sectionId = 'events' }: EventsSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  const [events, setEvents] = useState<EventCard[]>(FALLBACK_EVENTS)

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

  useEffect(() => {
    let mounted = true

    async function loadEvents() {
      try {
        const response = await fetch(buildApiUrl('/admin/events'))
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload || typeof payload !== 'object' || !Array.isArray((payload as { events?: unknown }).events)) {
          return
        }

        const apiEvents = (payload as { events: ApiEvent[] }).events
        const mappedEvents: EventCard[] = apiEvents.map((event) => ({
          id: event.id,
          title: event.title,
          desc: event.description,
          type: formatEventType(event.type),
          dateLabel: getDateLabel(event.date),
          yearLabel: getYearLabel(event.date),
          image: buildApiUrl(event.image),
        }))

        if (mounted && mappedEvents.length > 0) {
          setEvents(mappedEvents)
        }
      } catch {
        // Keep fallback event if API is unavailable.
      }
    }

    void loadEvents()

    return () => {
      mounted = false
    }
  }, [])

  const featuredEvent = events[0]

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
            {events.map((ev, i) => (
              <div className="event-card-modern" key={ev.id} style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="event-date-modern">
                  <span className="event-day-modern">{ev.dateLabel.split(' ')[1] ?? 'TBA'}</span>
                  <span className="event-month-modern">{ev.dateLabel.split(' ')[0] ?? ''}</span>
                  <span className="event-year-modern">{ev.yearLabel}</span>
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
            <img
              src={featuredEvent?.image || eventProtocol}
              alt={`${featuredEvent?.title ?? "CEO's Summit"} forum highlights`}
              className="events-feature-image"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
