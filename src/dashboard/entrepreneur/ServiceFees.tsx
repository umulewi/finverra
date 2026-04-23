import type { CSSProperties } from 'react'
import EntrepreneurShell from './EntrepreneurShell'

const applicationFeeRows = [
  ['100,000-1,000,000', '50,000frw'],
  ['1,000,001-3,000,000', '80,000frw'],
  ['3,000,001-5,000,000', '100,000frw'],
  ['5,000,001-7,00,000', '120,000frw'],
  ['7,000,001-10,000,000', '150,000frw'],
  ['10,000,001-Above', '210,000frw'],
]

const platformPostingRows = [
  ['6 months', '150,000frw'],
  ['1 year subscription', '250,000frw'],
]

const shortTermPostingRows = [
  ['3 Days', '25,000frw'],
  ['10 Days', '50,000frw'],
  ['30 Days', '120,000frw'],
]

const specialOccasionRows = [
  ['Conference Linking (Depending on business size and size of conference)', '300,000Frw - 500,000Frw'],
  ['Other occasion', '100,000Frw - 500,000Frw'],
]

const wholeBusinessManagementRows = [
  ['5 years', '3,000,000Frw (Paid fully before)'],
  ['10 years', '7,000,000Frw (Two Installment)'],
]

const partnerBusinessManagementRows = [
  ['Less than 6 months', '300,000frw'],
  ['1 years', '500,000frw'],
  ['2 years', '800,000frw'],
  ['Above 2 years', '1,000,000frw'],
]

const businessMentorshipRows = [
  ['3 Months', '450,000Frw'],
  ['6 Months', '700,000Frw'],
]

const internshipRows = [
  ['High school students', '80,000Frw', '30 days'],
  ['High school students', '100,000Frw', '30-60 days'],
  ['University Students', '100,000Frw', '30 days'],
  ['University Students', '150,000Frw', '30-60 days'],
  ['Research Person', '120,000Frw', '30 days'],
  ['Research Person', '180,000Frw', '30-60 days'],
  ['Employee', '150,000Frw', '30 days'],
  ['Employee', '200,000Frw', '30-60 days'],
]

export default function ServiceFees() {
  return (
    <EntrepreneurShell title="Service Fees" subtitle="Complete service fee schedule for entrepreneur services.">
      <div style={styles.page}>
        <Section number="1" title="Application fees">
          <Table headers={["Investment/Loan/Grant Requested range", "Application fees"]} rows={applicationFeeRows} />
        </Section>

        <Section number="2" title="Platform Posting/Subscription">
          <Table headers={["Duration", "Amount"]} rows={platformPostingRows} />
          <Table headers={["Duration", "Amount"]} rows={shortTermPostingRows} spacingTop />
        </Section>

        <Section number="3" title="Special Occasion">
          <Table headers={["Details", "Amount"]} rows={specialOccasionRows} />
        </Section>

        <Section number="4" title="Business Management Fees">
          <Subsection number="1" title="Whole Business Management" />
          <Table headers={["Duration", "Amount"]} rows={wholeBusinessManagementRows} />
          <div style={styles.noteBlock}>
            <div style={styles.noteTitle}>Note:</div>
            <ol style={styles.noteList}>
              <li>Whole Administration Management (Special agreement detailed on contract).</li>
              <li>More details or other additional fees will be outlined on the contract.</li>
            </ol>
          </div>

          <Subsection number="2" title="Partner Business Management" />
          <Table headers={["Duration", "Amount"]} rows={partnerBusinessManagementRows} />
          <div style={styles.noteBlock}>
            <div style={styles.noteTitle}>Note:</div>
            <ol style={styles.noteList}>
              <li>Addition Operation Expenses may be applied and detailed through contract</li>
            </ol>
          </div>
        </Section>

        <Section number="5" title="Business & Investment mentorship & Internships">
          <Subsection number="1" title="Business Mentorship" />
          <Table headers={["Duration", "Amount"]} rows={businessMentorshipRows} />

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
          {rows.map((row, rowIndex) => (
            <tr key={`${row.join('-')}-${rowIndex}`}>
              {row.map((cell) => (
                <td key={cell} style={styles.td}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
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
