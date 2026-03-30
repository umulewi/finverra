import { Link, useParams } from 'react-router-dom'
import '../App.css'
import { Footer, Navbar } from '../App'

import handshakeMeeting from '../assets/images/business-partners-handshake-global-corporate-with-technology-concept.jpg'
import boardroomMeeting from '../assets/images/business-people-board-room-meeting.jpg'
import businessTeam from '../assets/images/young-businessmen-standing-together-holding-laptop-discussing-business.jpg'

type Article = {
  title: string
  subtitle: string
  image: string
  body: string[]
}

const articles: Record<string, Article> = {
  'strategic-partnerships': {
    title: 'Strategic Partnerships',
    subtitle: 'Building long-term relationships that drive shared growth in Rwanda\'s investment ecosystem.',
    image: handshakeMeeting,
    body: [
      'Strategic partnerships are central to how FINVERRA creates durable value for entrepreneurs and investors. We focus on alliances where each side contributes clear strengths: founders bring innovation and market understanding, while partners bring networks, capital, and execution support.',
      'Our partnership approach starts with alignment. We evaluate whether goals, timelines, and risk appetite fit before engagement. This reduces friction later and increases the likelihood of measurable outcomes for both founders and funding partners.',
      'By combining transparent governance, regular progress tracking, and practical business advisory, FINVERRA helps partnerships move from introductions to real implementation. The result is stronger trust, faster decision-making, and more resilient business growth.',
    ],
  },
  'collaborative-innovation': {
    title: 'Collaborative Innovation',
    subtitle: 'How multidisciplinary teams co-create practical solutions for real business challenges.',
    image: boardroomMeeting,
    body: [
      'Innovation becomes meaningful when it is collaborative. At FINVERRA, founders, advisors, and financial partners work together to turn good ideas into bankable opportunities supported by realistic operating plans.',
      'We facilitate structured collaboration through workshops, planning sessions, and feedback loops that keep teams focused on customer needs and financial sustainability. This process helps teams test assumptions early and refine their strategy with evidence.',
      'When collaboration is intentional, innovation is no longer a one-time event. It becomes a repeatable capability that improves product quality, strengthens investor confidence, and creates momentum for long-term growth.',
    ],
  },
  'expert-leadership': {
    title: 'Expert Leadership',
    subtitle: 'Guiding businesses through growth stages with disciplined strategy and execution.',
    image: businessTeam,
    body: [
      'Strong leadership is often the difference between stalled ideas and scalable businesses. FINVERRA supports founders with experienced guidance in strategic planning, investment preparation, and operational decision-making.',
      'Our leadership support combines high-level direction with practical follow-through. We help teams prioritize what matters most, define measurable milestones, and build accountability structures that keep growth on track.',
      'With expert leadership and consistent advisory support, businesses can navigate complexity with confidence. This enables smarter financing decisions, better stakeholder communication, and stronger long-term performance.',
    ],
  },
}

type PartnershipArticlePageProps = {
  forcedSlug?: string
}

export default function PartnershipArticlePage({ forcedSlug }: PartnershipArticlePageProps) {
  const { slug } = useParams()
  const resolvedSlug = forcedSlug ?? slug
  const article = resolvedSlug ? articles[resolvedSlug] : undefined

  if (!article) {
    return (
      <main className="article-page">
        <Navbar />
        <section className="article-content section">
          <div className="container article-body-wrap">
            <h1>Article not found</h1>
            <p>The requested article could not be loaded.</p>
            <Link to="/" className="article-back">← Back to Home</Link>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main className="article-page">
      <Navbar />

      <section className="article-hero" style={{ backgroundImage: `linear-gradient(145deg, rgba(1, 24, 32, 0.78), rgba(2, 51, 65, 0.75)), url(${article.image})` }}>
        <div className="container article-hero-inner">
          <h1>{article.title}</h1>
          <p>{article.subtitle}</p>
        </div>
      </section>

      <section className="article-content section">
        <div className="container article-body-wrap">
          {article.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}
