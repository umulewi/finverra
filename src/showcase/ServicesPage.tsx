import { Link } from 'react-router-dom'
import { Footer, Navbar } from '../App'
import ServicesSection from '../components/ServicesSection'
import './ServicesPage.css'

export default function ServicesPage() {
  return (
    <main className="services-page">
      <Navbar />

      <section className="services-hero">
        <div className="services-hero-overlay" aria-hidden="true" />
        <div className="container services-hero-content">
          <p className="services-eyebrow">What We Do</p>
          <h1>Comprehensive Financial Services</h1>
          <p>
            A full suite of tools and expertise to take your business from idea to
            investment-ready.
          </p>
          <div className="services-hero-actions">
            <Link to="/dashboard" className="services-btn services-btn-primary">Work With FinVerra</Link>
            
          </div>
        </div>
      </section>

      <ServicesSection />

      <Footer />
    </main>
  )
}
