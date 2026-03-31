import './TeamStructurePage.css'
import board1 from '../assets/images/sample.png'
import board2 from '../assets/images/sample.png'
import board3 from '../assets/images/sample.png'
import board4 from '../assets/images/sample.png'
import board5 from '../assets/images/sample.png'
import board6 from '../assets/images/sample.png'
import exec1 from '../assets/images/sample.png'
import exec2 from '../assets/images/sample.png'

import thierryImg from '../assets/images/thierry.jpeg'
import moreenImg from '../assets/images/moreen.jpeg'
import { Navbar, Footer } from '../App'

const boardMembers = [
  {
    name: 'Rachel UWASE KABAMBA',
    position: "Board Chairperson in charge of International Relations",
    location: '',
    image: board1,
  },
  {
    name: 'ISHIMWE Rodrigue',
    position: "Board Member in charge of Human Resources",
    location: '',
    image: board2,
  },
  {
    name: 'HIGIRO Martin',
    position: "Board Member in charge of Operational Advisor",
    location: '',
    image: board3,
  },
  {
    name: 'NSHIMIYIMANA Gad',
    position: "Board Member in charge of Promotion and Company's Brand",
    location: '',
    image: board4,
  },
  {
    name: 'RUDAHUNGA Gideon',
    position: "Board Member in charge of Administration Management",
    location: '',
    image: board5,
  },
  {
    name: 'MUTUYE Tresor CYUZUZO',
    position: "Board Member in charge of Financial Strategy",
    location: '',
    image: board6,
  },
]

const execMembers = [
  {
    name: 'ISHIMWE Rodrigue',
    position: 'Chief Executive Officer',
    location: '',
    tel: '+250 798 334 423',
    email: 'admin@finverra.co',
    image: exec1,
  },
  {
    name: 'IGIHOZO Honorine',
    position: 'Deputy CEO',
    location: '',
    tel: '+250 781 681 561',
    email: 'admin@finverra.co',
    image: exec2,
  },
  {
    name: 'MUTONI Moreen',
    position: 'Head of Customer Care',
    location: '',
    tel: '+250 781 681 561',
    email: 'info@finverra.co',
    image: moreenImg,
  },
  {
    name: 'ISHIMWE Thierry',
    position: 'Head of Digital Marketing',
    location: '',
    tel: '+250 781 681 561',
    email: 'info@finverra.co',
    image: thierryImg,
  },
]

export default function TeamStructurePage() {
  return (
    <main className="team-structure-page">
      <Navbar />
      <section className="team-hero">
        <div className="team-hero-overlay" aria-hidden="true" />
        <div className="container team-hero-content">
          <p className="team-eyebrow">Meet the Team</p>
          <h1>Our Leadership</h1>
          <p>
            Board of Directors and Executive Management Team guiding FINVERRA's vision and operations.
          </p>
        </div>
      </section>

      <section className="team section">
        <div className="container">
          <div className="team-header">
            <h2>Board of Directors</h2>
            <p>Strategic leadership and governance for sustainable growth.</p>
          </div>
          <div className="team-members-grid">
            {boardMembers.map((m, i) => (
              <div className="team-member-card" key={m.name}>
                <div className="team-member-image">
                  <img src={m.image} alt={m.name} />
                </div>
                <h3>{m.name}</h3>
                <div className="team-member-position">{m.position}</div>
                {m.location && <div className="team-member-location">{m.location}</div>}
              </div>
            ))}
          </div>
          <div className="team-contact-note">
            For inquiries or to contact a member of our Board, please reach us at <a href="tel:+250781681561">+250 781 681 561</a> or via email at <a href="mailto:info@finverra.co">info@finverra.co</a>
          </div>
        </div>
      </section>

      <section className="team section">
        <div className="container">
          <div className="team-header">
            <h2>Executive Management Team </h2>
            <p>Operational leadership and day-to-day management.</p>
          </div>
          <div className="team-members-grid">
            {execMembers.map((m, i) => (
              <div className="team-member-card" key={m.name}>
                <div className="team-member-image">
                  <img src={m.image} alt={m.name} />
                </div>
                <h3>{m.name}</h3>
                <div className="team-member-position">{m.position}</div>
                {m.location && <div className="team-member-location">{m.location}</div>}
                <div className="team-member-location">
                  <span>Tel: <a href={`tel:${m.tel}`}>{m.tel}</a></span><br />
                  <span>Email: <a href={`mailto:${m.email}`}>{m.email}</a></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
