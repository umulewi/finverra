import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { buildApiUrl } from '../config/api'
import { getAuthSession } from '../dashboard/authStorage'

type WhoWeAreItem = {
  id: number
  title: string
  first_paragraph: string
  second_paragraph: string
  image: string | null
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function authHeader(): HeadersInit {
  const session = getAuthSession()

  if (!session) {
    return {}
  }

  const payload = session.payload as { token?: unknown; accessToken?: unknown; access_token?: unknown; jwt?: unknown }
  const tokenValue = typeof payload.token === 'string'
    ? payload.token
    : typeof payload.accessToken === 'string'
      ? payload.accessToken
      : typeof payload.access_token === 'string'
        ? payload.access_token
        : typeof payload.jwt === 'string'
          ? payload.jwt
          : ''

  return tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}
}

export default function WhoWeAreShowcasePage() {
  const [items, setItems] = useState<WhoWeAreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadItems() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(buildApiUrl('/admin/whoweare'), { headers: authHeader() })
        const data = await parseResponseBody(response)

        if (!response.ok) {
          throw new Error(typeof data === 'string' ? data : data?.message ?? 'Failed to load who we are content')
        }

        setItems(Array.isArray(data?.whoweare) ? data.whoweare : [])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load who we are content')
      } finally {
        setLoading(false)
      }
    }

    void loadItems()
  }, [])

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>Loading who we are content...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>{error}</div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>No who we are content available yet.</div>
      </div>
    )
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Who We Are</h1>
      </div>

      <div style={styles.container}>
        <div style={styles.grid}>
          {items.map((item) => (
            <section key={item.id} style={styles.card}>
              {item.image && (
                <div style={styles.imageContainer}>
                  <img src={buildApiUrl(item.image)} alt={item.title} style={styles.image} />
                </div>
              )}
              <div style={styles.content}>
                <h2 style={styles.cardTitle}>{item.title}</h2>
                <p style={styles.paragraph}>{item.first_paragraph}</p>
                <p style={styles.paragraph}>{item.second_paragraph}</p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  pageContainer: {
    width: '100%',
  },
  pageHeader: {
    backgroundColor: '#023341',
    color: '#fff',
    padding: '60px 20px',
    textAlign: 'center',
    marginBottom: 40,
  },
  pageTitle: {
    margin: 0,
    fontSize: 42,
    fontWeight: 700,
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 32,
    marginBottom: 60,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  imageContainer: {
    width: '100%',
    height: 240,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  content: {
    padding: 24,
  },
  cardTitle: {
    margin: '0 0 12px 0',
    fontSize: 20,
    fontWeight: 700,
    color: '#023341',
  },
  paragraph: {
    margin: '0 0 12px 0',
    fontSize: 14,
    lineHeight: 1.6,
    color: '#4b5563',
  },
  loadingState: {
    padding: 60,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
  },
  errorState: {
    padding: 40,
    textAlign: 'center',
    color: '#dc2626',
    fontSize: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  emptyState: {
    padding: 60,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
  },
}
