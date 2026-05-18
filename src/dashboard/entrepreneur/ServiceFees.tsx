import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import EntrepreneurShell from './EntrepreneurShell'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

interface AppFee {
  id: number
  Investment: string
  fees: string
}

interface DurationAmount {
  id: number
  duration: string
  amount: string
}

interface Internship {
  id: number
  details: string
  amount: string
  duration: string
}

interface SpecialOccasion {
  id: number
  details: string
  amount: string
}

export default function ServiceFees() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [applicationFees, setApplicationFees] = useState<AppFee[]>([])
  const [businessManagement, setBusinessManagement] = useState<DurationAmount[]>([])
  const [businessMentorship, setBusinessMentorship] = useState<DurationAmount[]>([])
  const [internships, setInternships] = useState<Internship[]>([])
  const [partnerBusiness, setPartnerBusiness] = useState<DurationAmount[]>([])
  const [postingFees, setPostingFees] = useState<DurationAmount[]>([])
  const [specialOccasion, setSpecialOccasion] = useState<SpecialOccasion[]>([])

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      setError(null)
      const token = (getAuthSession()?.payload as { token?: string } | undefined)?.token ?? ''
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` }

      try {
        const endpoints = [
          ['/admin/e_application_fees', 'e_application_fees'],
          ['/admin/e_business_management_fees', 'e_business_management_fees'],
          ['/admin/e_business_mentorship', 'e_business_mentorship'],
          ['/admin/e_internships', 'e_internships'],
          ['/admin/e_partner_business_management', 'e_partner_business_management'],
          ['/admin/e_posting_fees', 'e_posting_fees'],
          ['/admin/e_special_occusion', 'e_special_occusion'],
        ] as const

        const fetches = endpoints.map(([path]) => fetch(buildApiUrl(path), { headers }))
        const responses = await Promise.all(fetches)
        const bodies = await Promise.all(responses.map((r) => r.json()))

        setApplicationFees(bodies[0]?.e_application_fees ?? [])
        setBusinessManagement(bodies[1]?.e_business_management_fees ?? [])
        setBusinessMentorship(bodies[2]?.e_business_mentorship ?? [])
        setInternships(bodies[3]?.e_internships ?? [])
        setPartnerBusiness(bodies[4]?.e_partner_business_management ?? [])
        setPostingFees(bodies[5]?.e_posting_fees ?? [])
        setSpecialOccasion(bodies[6]?.e_special_occusion ?? [])
      } catch (err: any) {
        setError(err?.message ?? 'Failed to fetch service fees')
      } finally {
        setLoading(false)
      }
    }

    void fetchAll()
  }, [])

  if (loading) return <EntrepreneurShell title="Service Fees" subtitle="Loading..."><p>Loading service fees...</p></EntrepreneurShell>
  if (error) return <EntrepreneurShell title="Service Fees" subtitle="Error"><p style={{ color: 'red' }}>{error}</p></EntrepreneurShell>

  // Transform API data to row format
  const applicationFeeRows = applicationFees.map((f) => [f.Investment, f.fees])
  const postingRows = postingFees.filter((p) => p.duration.toLowerCase().includes('month') || p.duration.toLowerCase().includes('year')).map((p) => [p.duration, p.amount])
  const specialOccasionRows = specialOccasion.map((s) => [s.details, s.amount])
  const businessMgmtRows = businessManagement.map((b) => [b.duration, b.amount])
  const partnerBizRows = partnerBusiness.map((p) => [p.duration, p.amount])
  const mentorshipRows = businessMentorship.map((m) => [m.duration, m.amount])
  const internshipRows = internships.map((i) => [i.details, i.amount, i.duration])

  return (
    <EntrepreneurShell title="Service Fees" subtitle="Complete service fee schedule for entrepreneur services.">
      <div style={styles.page}>
        <Section number="1" title="Application fees">
          <Table headers={["Investment/Loan/Grant Requested range", "Application fees"]} rows={applicationFeeRows} />
        </Section>

        <Section number="2" title="Platform Posting/Subscription">
          <Table headers={["Duration", "Amount"]} rows={postingRows} />
        </Section>

        <Section number="3" title="Special Occasion">
          <Table headers={["Details", "Amount"]} rows={specialOccasionRows} />
        </Section>

        <Section number="4" title="Business Management Fees">
          <Subsection number="1" title="Whole Business Management" />
          <Table headers={["Duration", "Amount"]} rows={businessMgmtRows} />
          <div style={styles.noteBlock}>
            <div style={styles.noteTitle}>Note:</div>
            <ol style={styles.noteList}>
              <li>Whole Administration Management (Special agreement detailed on contract).</li>
              <li>More details or other additional fees will be outlined on the contract.</li>
            </ol>
          </div>

          <Subsection number="2" title="Partner Business Management" />
          <Table headers={["Duration", "Amount"]} rows={partnerBizRows} />
          <div style={styles.noteBlock}>
            <div style={styles.noteTitle}>Note:</div>
            <ol style={styles.noteList}>
              <li>Addition Operation Expenses may be applied and detailed through contract</li>
            </ol>
          </div>
        </Section>

        <Section number="5" title="Business & Investment mentorship & Internships">
          <Subsection number="1" title="Business Mentorship" />
          <Table headers={["Duration", "Amount"]} rows={mentorshipRows} />

          <Subsection number="2" title="Internships" />
          <Table headers={["Details", "Amount", "Duration"]} rows={internshipRows} />
        </Section>
      </div>
    </EntrepreneurShell>
  )
}

type TableProps = {
  headers: string[]
  rows: string[][]
  spacingTop?: boolean
}

function Table({ headers, rows, spacingTop = false }: TableProps) {
  const columnWidths = headers.length === 3 ? ['52%', '24%', '24%'] : headers.length === 2 ? ['65%', '35%'] : []

  return (
    <div style={{ ...styles.tableWrap, ...(spacingTop ? styles.tableSpacingTop : {}) }}>
      <table style={styles.table}>
        {columnWidths.length > 0 ? (
          <colgroup>
            {columnWidths.map((width) => (
              <col key={width} style={{ width }} />
            ))}
          </colgroup>
        ) : null}
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} style={styles.th}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ ...styles.td, textAlign: 'center' }}>
                No data available
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={`${row.join('-')}-${rowIndex}`}>
                {row.map((cell) => (
                  <td key={cell} style={styles.td}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHeading}>
        <span style={styles.sectionNumber}>{number}.</span>
        <h3 style={styles.sectionTitle}>{title}</h3>
      </div>
      {children}
    </section>
  )
}

function Subsection({ number, title }: { number: string; title: string }) {
  return (
    <div style={styles.subsectionHeading}>
      <span style={styles.subsectionNumber}>{number}.</span>
      <h4 style={styles.subsectionTitle}>{title}</h4>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: 'grid',
    gap: 28,
  },
  section: {
    display: 'grid',
    gap: 12,
  },
  sectionHeading: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    flexWrap: 'wrap',
  },
  sectionNumber: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e5ebe',
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.2,
    color: '#0f1e35',
  },
  subsectionHeading: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  subsectionNumber: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0f1e35',
  },
  subsectionTitle: {
    margin: 0,
    fontSize: 18,
    lineHeight: 1.2,
    color: '#0f1e35',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  tableSpacingTop: {
    marginTop: 8,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    borderSpacing: 0,
    tableLayout: 'fixed',
    background: '#ffffff',
    border: '1px solid rgba(15, 30, 53, 0.28)',
  },
  th: {
    textAlign: 'left',
    fontSize: 14,
    fontWeight: 700,
    color: '#0f1e35',
    border: '1px solid rgba(15, 30, 53, 0.28)',
    padding: '8px 12px',
    background: '#ffffff',
    verticalAlign: 'top',
  },
  td: {
    fontSize: 13,
    color: '#111827',
    border: '1px solid rgba(15, 30, 53, 0.28)',
    padding: '8px 12px',
    verticalAlign: 'top',
  },
  noteBlock: {
    marginTop: 4,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0f1e35',
    marginBottom: 8,
  },
  noteList: {
    margin: 0,
    paddingLeft: 24,
    display: 'grid',
    gap: 8,
    lineHeight: 1.6,
    color: '#111827',
  },
}
