import { Navbar, Footer } from '../App'
import EventsSection from '../components/EventsSection'
import '../showcase/EventsGalleryPage.css'

export default function EventsGalleryPage() {
  return (
    <main className="events-page">
      <Navbar />
      <EventsSection />
      <Footer />
    </main>
  )
}
