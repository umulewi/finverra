import { useEffect, useState } from 'react'
import InvestorLayout, { investorCardStyle } from './InvestorLayout'
import { buildApiUrl } from '../../config/api'
import { getAuthSession } from '../authStorage'

interface ApplicationFee {
  id: number
  details: string
  amount: string
}

interface DurationAmount {
  id: number
  duration: string
  amount: string
}

interface TransactionFee {
  id: number
  details: string
  percentage: string | number
}

export default function ServiceFees() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [applicationFees, setApplicationFees] = useState<ApplicationFee[]>([])
  const [investmentMentorships, setInvestmentMentorships] = useState<DurationAmount[]>([])
  const [partnerBusiness, setPartnerBusiness] = useState<DurationAmount[]>([])
  const [specialOccasions, setSpecialOccasions] = useState<ApplicationFee[]>([])
  const [transactionFees, setTransactionFees] = useState<TransactionFee[]>([])
  const [wholeBusiness, setWholeBusiness] = useState<DurationAmount[]>([])

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      setError(null)
      const token = (getAuthSession()?.payload as { token?: string } | undefined)?.token ?? ''
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` }

      try {
        const endpoints = [
          ['/admin/i_application_fees', 'i_application_fees'],
          ['/admin/i_investment_mentorships', 'i_investment_mentorships'],
          ['/admin/i_partner_business_management', 'i_partner_business_management'],
          ['/admin/i_special_occasion', 'i_special_occasion'],
          ['/admin/i_transaction_fees', 'i_transaction_fees'],
          ['/admin/i_whole_business_management', 'i_whole_business_management'],
        ] as const

        const fetches = endpoints.map(([path]) => fetch(buildApiUrl(path), { headers }))
        const responses = await Promise.all(fetches)
        const bodies = await Promise.all(responses.map((r) => r.json()))

        setApplicationFees(bodies[0]?.i_application_fees ?? [])
        setInvestmentMentorships(bodies[1]?.i_investment_mentorships ?? [])
        setPartnerBusiness(bodies[2]?.i_partner_business_management ?? [])
        setSpecialOccasions(bodies[3]?.i_special_occasion ?? [])
        setTransactionFees(bodies[4]?.i_transaction_fees ?? [])
        setWholeBusiness(bodies[5]?.i_whole_business_management ?? [])
      } catch (err: any) {
        setError(err?.message ?? 'Failed to fetch service fees')
      } finally {
        setLoading(false)
      }
    }

    void fetchAll()
  }, [])

  return (
    <InvestorLayout>
      <section style={investorCardStyle}>
        <div style={styles.headerBlock}>
          <p style={styles.kicker}>Investor Service Fees</p>
          <h2 style={styles.title}>Services and fee schedule</h2>
          <p style={styles.description}>
            The fee list below summarizes the investor-related charges shown in the contract.
          </p>
        </div>

        {loading && <p>Loading service fees...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>1. Application fees</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Details</th>
                <th style={styles.th}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {applicationFees.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan={2}>
                    No application fees configured
                  </td>
                </tr>
              ) : (
                applicationFees.map((f) => (
                  <tr key={f.id}>
                    <td style={styles.td}>{f.details}</td>
                    <td style={styles.td}>{f.amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>2. Investment Transaction Fees</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Details</th>
                <th style={styles.th}>Percentage rate</th>
              </tr>
            </thead>
            <tbody>
                {transactionFees.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan={2}>
                      No transaction fees configured
                    </td>
                  </tr>
                ) : (
                  transactionFees.map((t) => (
                    <tr key={t.id}>
                      <td style={styles.td}>{t.details}</td>
                      <td style={styles.td}>{String(t.percentage)}%</td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>3. Special Occasion</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Details</th>
                <th style={styles.th}>Amount</th>
              </tr>
            </thead>
            <tbody>
                {specialOccasions.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan={2}>
                      No special occasion fees configured
                    </td>
                  </tr>
                ) : (
                  specialOccasions.map((s) => (
                    <tr key={s.id}>
                      <td style={styles.td}>{s.details}</td>
                      <td style={styles.td}>{s.amount}</td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>4. Business Management Fees</h3>

          <div style={styles.subsection}>
            <h4 style={styles.subsectionTitle}>1. Whole Business Management</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Amount</th>
                </tr>
              </thead>
                <tbody>
                  {wholeBusiness.length === 0 ? (
                    <tr>
                      <td style={styles.td} colSpan={2}>
                        No whole business management fees configured
                      </td>
                    </tr>
                  ) : (
                    wholeBusiness.map((w) => (
                      <tr key={w.id}>
                        <td style={styles.td}>{w.duration}</td>
                        <td style={styles.td}>{w.amount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
            </table>
            <div style={styles.noteBox}>
              <strong>Note:</strong>
              <ol style={styles.noteList}>
                <li>Whole Administration Management (Special agreement detailed on contract).</li>
                <li>More details or other additional fees will be outlined on the contract.</li>
              </ol>
            </div>
          </div>

          <div style={styles.subsection}>
            <h4 style={styles.subsectionTitle}>2. Partner Business Management</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Amount</th>
                </tr>
              </thead>
                  <tbody>
                    {partnerBusiness.length === 0 ? (
                      <tr>
                        <td style={styles.td} colSpan={2}>
                          No partner business management fees configured
                        </td>
                      </tr>
                    ) : (
                      partnerBusiness.map((p) => (
                        <tr key={p.id}>
                          <td style={styles.td}>{p.duration}</td>
                          <td style={styles.td}>{p.amount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div style={styles.noteBox}>
                  <strong>Note:</strong> Addition Operation Expenses may be applied and detailed through contract.
                </div>
          </div>

          <div style={styles.subsection}>
            <h4 style={styles.subsectionTitle}>3. Investment mentorship</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Amount</th>
                </tr>
              </thead>
                <tbody>
                  {investmentMentorships.length === 0 ? (
                    <tr>
                      <td style={styles.td} colSpan={2}>
                        No investment mentorship fees configured
                      </td>
                    </tr>
                  ) : (
                    investmentMentorships.map((m) => (
                      <tr key={m.id}>
                        <td style={styles.td}>{m.duration}</td>
                        <td style={styles.td}>{m.amount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
            </table>
          </div>
        </div>
      </section>
    </InvestorLayout>
  )
}

const styles = {
  headerBlock: {
    marginBottom: 24,
  },
  kicker: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: '#b07a00',
  },
  title: {
    margin: '8px 0 8px',
    fontSize: 28,
    lineHeight: 1.1,
    color: '#192537',
  },
  description: {
    margin: 0,
    maxWidth: 760,
    color: '#4d607d',
    lineHeight: 1.7,
  },
  section: {
    display: 'grid',
    gap: 14,
    marginTop: 24,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    lineHeight: 1.3,
    color: '#0f1e35',
  },
  subsection: {
    display: 'grid',
    gap: 12,
    marginTop: 8,
  },
  subsectionTitle: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.3,
    color: '#15304f',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    overflow: 'hidden',
    borderRadius: 16,
    border: '1px solid rgba(15, 30, 53, 0.12)',
    background: '#ffffff',
  },
  th: {
    textAlign: 'left' as const,
    padding: '14px 16px',
    background: '#f5f8fc',
    color: '#0f1e35',
    fontSize: 14,
    fontWeight: 700,
    borderBottom: '1px solid rgba(15, 30, 53, 0.12)',
    borderRight: '1px solid rgba(15, 30, 53, 0.12)',
  },
  td: {
    padding: '14px 16px',
    color: '#20324d',
    fontSize: 14,
    lineHeight: 1.6,
    borderBottom: '1px solid rgba(15, 30, 53, 0.12)',
    borderRight: '1px solid rgba(15, 30, 53, 0.12)',
    verticalAlign: 'top' as const,
  },
  noteBox: {
    borderLeft: '4px solid #e6a817',
    background: 'rgba(230, 168, 23, 0.08)',
    padding: '14px 16px',
    borderRadius: 12,
    color: '#20324d',
    lineHeight: 1.7,
  },
  noteList: {
    margin: '10px 0 0 20px',
    padding: 0,
  },
} satisfies Record<string, React.CSSProperties>