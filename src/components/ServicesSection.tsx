import { useEffect, useRef, useState } from 'react'
import ServiceCard from './ServiceCard'

type ServiceItem = {
  title: string
  desc: string
}

const services: ServiceItem[] = [
  {
    title: 'Project Preparation',
    desc: 'We prepare investment-ready projects, support SME growth and expansion, and design, test, and validate ventures to ensure proven profitability and investor readiness',
  },
  {
    title: 'Investment Matching',
    desc: 'Facilitating strategic connections between entrepreneurs and SMEs with qualified individual and institutional investors through a structured, transparent, and secure platform that ensures alignment, credibility, and efficient capital deployment',
  },
  {
    title: 'Access to Finance',
    desc: 'Assisting startups and established businesses in securing investment capital, facilitating access to collateral-free financing, and unlocking grant opportunities from both national and international institutions.',
  },
  {
    title: 'Financial Management',
    desc: 'Providing integrated digital tools for accurate financial record-keeping, expense tracking, tax compliance monitoring, and real-time business performance analysis.',
  },
  {
    title: 'Investment Monitoring',
    desc: 'Providing real-time, transparent monitoring tools that enable investors to remotely track investment performance, financial progress, and business outcomes with confidence and clarity.',
  },
  {
    title: 'Business Advisory',
    desc: 'Delivering expert guidance in business strategy, investment readiness, financial planning, and sustainable growth to strengthen performance and long-term success.',
  },
  {
    title: 'Mentorship',
    desc: 'Providing dedicated mentorship programs that connect entrepreneurs with experienced industry experts and business leaders, offering practical guidance, strategic insights, and continuous support to enhance decision-making, accelerate growth, and build sustainable, investment-ready businesses.',
  },
]

export default function ServicesSection() {
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

  return (
    <section className="services section" id="services" ref={ref}>
      <div className="container">
        <div className="section-header">
          <div className="section-label">What We Do</div>
          <h2 className="section-title">Comprehensive Financial Services</h2>
          <p className="section-subtitle">A full suite of tools and expertise to take your business from idea to investment-ready</p>
        </div>
        <div className={`services-grid ${inView ? 'animate-in' : ''}`}>
          {services.map((service, index) => (
            <ServiceCard
              key={service.title}
              title={service.title}
              desc={service.desc}
              delay={`${index * 0.08}s`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
