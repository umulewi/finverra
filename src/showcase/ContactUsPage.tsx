import { useMemo, useState, type FormEvent } from 'react'
import { Footer, Navbar } from '../App'
import { buildApiUrl } from '../config/api'
import './ContactUsPage.css'

type ContactFormState = {
  names: string
  email: string
  phone: string
  message: string
}

const WORD_LIMIT = 250

function countWords(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  return words.length === 1 && words[0] === '' ? 0 : words.length
}

function trimToWordLimit(value: string, limit: number) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, limit).join(' ')
}

export default function ContactUsPage() {
  const [formData, setFormData] = useState<ContactFormState>({
    names: '',
    email: '',
    phone: '',
    message: '',
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const messageWords = useMemo(() => countWords(formData.message), [formData.message])
  const wordPct = Math.min((messageWords / WORD_LIMIT) * 100, 100)

  function handleMessageChange(value: string) {
    const nextMessage = trimToWordLimit(value, WORD_LIMIT)
    setFormData((prev) => ({ ...prev, message: nextMessage }))
    if (errorMessage) setErrorMessage('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (!formData.names.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.message.trim()) {
      setErrorMessage('All fields are required.')
      return
    }

    setSubmitting(true)

    void (async () => {
      try {
        const response = await fetch(buildApiUrl('/contact-us'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.names.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
          }),
        })

        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload || typeof payload !== 'object' || (payload as { success?: boolean }).success !== true) {
          throw new Error((payload as { message?: string } | null)?.message ?? 'Failed to submit contact request')
        }

        setSubmitted(true)
        setFormData({ names: '', email: '', phone: '', message: '' })
        window.setTimeout(() => setSubmitted(false), 5000)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to submit contact request')
      } finally {
        setSubmitting(false)
      }
    })()
  }

  return (
    <main className="contact-page">
      <Navbar />

      {/* ── Hero ── */}
      <section className="contact-hero">
        <div className="contact-hero-overlay" aria-hidden="true" />
        <div className="container contact-hero-grid">

          <div className="contact-hero-copy">
            <p className="contact-eyebrow">Get in touch</p>
            <h1>
              Talk to <em>FINVERRA</em>
            </h1>
            <p>
              Have a question or partnership inquiry? Reach out to us and we'll get back to you as soon as possible.
            </p>
            <div className="contact-hero-badges">
              <span>📍 Kigali, Rwanda</span>
              <span>⚡ Same-day response</span>
              <span>🤝 Partnership inquiries welcome</span>
            </div>
          </div>

          <div className="contact-hero-card">
            <p className="contact-card-label">Direct contact</p>
            <div className="contact-hero-card-row">
              <div>
                <span>Email</span>
                <strong>info@finverra.rw</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>+250 781 681 561</strong>
              </div>
            </div>
            <div className="contact-hero-card-row">
              <div>
                <span>Location</span>
                <strong>Kigali, Rwanda</strong>
              </div>
              <div>
                <span>Response time</span>
                <strong>Same business day</strong>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Main section ── */}
      <section className="contact-section section">
        <div className="container contact-grid">

          {/* Left: Map + hours */}
          <div className="contact-panel contact-info-panel">
            <div className="contact-map-wrap">
              <iframe
                title="FINVERRA office map"
                src="https://www.google.com/maps?q=-1.9458272,30.0609804&z=17&hl=en&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="contact-map"
              />
            </div>

            <div className="contact-info-blocks">
              <article className="contact-info-card">
                <p className="contact-info-label">Working hours</p>
                <ul>
                  <li>
                    <span>Monday – Friday</span>
                    <strong>09:00 – 17:00</strong>
                  </li>
                  <li>
                    <span>Saturday</span>
                    <strong>Closed</strong>
                  </li>
                  <li>
                    <span>Sunday</span>
                    <strong>Closed</strong>
                  </li>
                </ul>
              </article>
            </div>
          </div>

          {/* Right: Contact form */}
          <div className="contact-panel contact-form-panel">
            <div className="contact-panel-head">
              <p className="contact-eyebrow" style={{ color: 'var(--contact-muted)' }}>Contact form</p>
              <h2>Send us a message</h2>
              <p>Fill in the form below and a member of our team will be in touch shortly.</p>
            </div>

            {errorMessage && (
              <div className="contact-error" role="alert">{errorMessage}</div>
            )}

            {submitted ? (
              <div className="contact-success" role="status">
                <div style={{ fontSize: '2rem', marginBottom: 4 }}>✓</div>
                <h3>Message sent!</h3>
                <p>Thank you for reaching out. We'll get back to you within the same business day.</p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>

                <div className="contact-form-row">
                  <div>
                    <label htmlFor="names">Full name</label>
                    <input
                      id="names"
                      type="text"
                      value={formData.names}
                      onChange={(e) => setFormData((prev) => ({ ...prev, names: e.target.value }))}
                      placeholder="Your full name"
                      disabled={submitting}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email">Email address</label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="you@example.com"
                      disabled={submitting}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone">Phone number</label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+250 …"
                    disabled={submitting}
                    autoComplete="tel"
                  />
                </div>

                <div className="contact-textarea-wrap">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    rows={6}
                    value={formData.message}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    placeholder="Share your question or inquiry…"
                    disabled={submitting}
                  />
                  {/* Word-count progress bar */}
                  <div style={{ marginTop: 8 }}>
                    <div
                      style={{
                        height: 3,
                        borderRadius: 99,
                        background: 'rgba(2, 51, 65, 0.08)',
                        overflow: 'hidden',
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${wordPct}%`,
                          borderRadius: 99,
                          background:
                            wordPct >= 95
                              ? '#c0392b'
                              : wordPct >= 80
                              ? '#e67e22'
                              : 'var(--contact-teal-mid)',
                          transition: 'width 0.2s ease, background 0.2s ease',
                        }}
                      />
                    </div>
                    <div className="contact-word-count">
                      <span>{messageWords} / {WORD_LIMIT} words</span>
                      <span>{WORD_LIMIT - messageWords} remaining</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="contact-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      Sending
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </>
                  ) : (
                    'Send message →'
                  )}
                </button>

              </form>
            )}
          </div>

        </div>
      </section>

      <Footer />
    </main>
  )
}