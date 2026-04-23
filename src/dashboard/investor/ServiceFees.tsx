import InvestorLayout, { investorCardStyle } from './InvestorLayout'

export default function ServiceFees() {
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
              <tr>
                <td style={styles.td}>Application Fees</td>
                <td style={styles.td}>20,000frw</td>
              </tr>
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
              <tr>
                <td style={styles.td}>Investment Transaction Success fees</td>
                <td style={styles.td}>15%</td>
              </tr>
              <tr>
                <td style={styles.td}>Dividends Transaction fees</td>
                <td style={styles.td}>2%</td>
              </tr>
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
              <tr>
                <td style={styles.td}>Attending Business High Level Pitching Conference</td>
                <td style={styles.td}>100,000frw - 300,000frw</td>
              </tr>
              <tr>
                <td style={styles.td}>Other Conference</td>
                <td style={styles.td}>50,000Frw - 150,000Frw</td>
              </tr>
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
                <tr>
                  <td style={styles.td}>5 years</td>
                  <td style={styles.td}>3,000,000Frw (Paid fully before)</td>
                </tr>
                <tr>
                  <td style={styles.td}>10 years</td>
                  <td style={styles.td}>7,000,000Frw (Two Installment)</td>
                </tr>
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
                <tr>
                  <td style={styles.td}>Less than 6 months</td>
                  <td style={styles.td}>300,000frw</td>
                </tr>
                <tr>
                  <td style={styles.td}>1 years</td>
                  <td style={styles.td}>500,000frw</td>
                </tr>
                <tr>
                  <td style={styles.td}>2 years</td>
                  <td style={styles.td}>800,000frw</td>
                </tr>
                <tr>
                  <td style={styles.td}>Above 2 years</td>
                  <td style={styles.td}>1,000,000frw</td>
                </tr>
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
                <tr>
                  <td style={styles.td}>3 Months</td>
                  <td style={styles.td}>450,000Frw</td>
                </tr>
                <tr>
                  <td style={styles.td}>6 Months</td>
                  <td style={styles.td}>700,000Frw</td>
                </tr>
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