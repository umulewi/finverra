import { useEffect, useRef, useState } from 'react'
import ServiceCard from './ServiceCard'
import { buildApiUrl } from '../config/api'

type ServiceItem = {
  id?: number
  category: 'Investor' | 'Entrepreneur'
  title: string
  desc: string
  created_at?: string
}

export default function ServicesSection() {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  const [services, setServices] = useState<ServiceItem[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(buildApiUrl('/admin/services'))
        const data = await res.json()
        const arr = Array.isArray(data) ? data : data?.services ?? []
        const mapped: ServiceItem[] = arr.map((s: any) => ({
          id: s.id,
          category: s.category === 'Investor' ? 'Investor' : 'Entrepreneur',
          title: s.title,
          desc: s.description ?? s.desc ?? '',
          created_at: s.created_at,
        }))
        if (mapped.length) setServices(mapped)
      } catch (err) {
        // API failed — keep services empty
      }
    }

    load()

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

  return (
    <section className="services section" id="services" ref={ref}>
      <div className="container">
        <div className="section-header">
          <div className="section-label">What We Do</div>
          <h2 className="section-title">Comprehensive Financial Services</h2>
          <p className="section-subtitle">A full suite of tools and expertise to take your business from idea to investment-ready</p>
        </div>

        {(['Investor', 'Entrepreneur'] as const).map((category) => {
          const categoryServices = services.filter((service) => service.category === category)

          return (
            <div key={category} className="services-category-block">
              <div className="services-category-header">
                <div>
                  
                  <h3 className="services-category-title">{category}s Services</h3>
                </div>
                <span className="services-category-count">{categoryServices.length} service{categoryServices.length !== 1 ? 's' : ''}</span>
              </div>

              <div className={`services-grid ${inView ? 'animate-in' : ''}`}>
                {categoryServices.map((service, index) => (
                  <ServiceCard
                    key={service.id ?? service.title}
                    title={service.title}
                    desc={service.desc}
                    delay={`${index * 0.08}s`}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
