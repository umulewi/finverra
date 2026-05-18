import { useEffect, useState } from 'react'
import { Navbar, Footer } from '../App'
import { buildApiUrl } from '../config/api'
import '../App.css'

type OurProjectApiItem = { id: number; image: string | null; link: string }

function resolveImageUrl(imagePath: string | null) {
  if (!imagePath) return null
  if (/^https?:\/\//i.test(imagePath)) return imagePath
  return buildApiUrl(imagePath)
}

export default function OurProjectsPage() {
  const [items, setItems] = useState<OurProjectApiItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const res = await fetch(buildApiUrl('/admin/our_projects'))
        const payload = await res.json().catch(() => null)
        if (!res.ok || !payload) return
        const rows: OurProjectApiItem[] = Array.isArray(payload) ? payload : payload.our_projects ?? []
        if (mounted) setItems(rows)
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => { mounted = false }
  }, [])

  return (
    <>
      <Navbar />

      <section className="showcase section" id="showcase">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Our Project</div>
            <h2 className="section-title">What Finverra Builds</h2>
            <p className="section-subtitle">
              Explore the projects Finverra has built and continues to showcase through the platform.
            </p>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center' }}>Loading…</p>
          ) : items.length === 0 ? (
            <p style={{ textAlign: 'center' }}>No projects to show.</p>
          ) : (
            <div className="showcase-grid">
              {items.map((it) => (
                <a
                  key={it.id}
                  href={it.link}
                  target="_blank"
                  rel="noreferrer"
                  className="showcase-card showcase-card-link"
                  aria-label={`Open project ${it.id}`}
                >
                  <div className="showcase-card-image">
                    {it.image ? (
                      <img
                        src={resolveImageUrl(it.image) ?? undefined}
                        alt={`project-${it.id}`}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div style={{ height: '100%', width: '100%', background: '#f1f5f9' }} />
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  )
}
