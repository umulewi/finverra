import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import AdminShell from '../AdminShell'
import ApplicationFeesPage from './ApplicationFeesPage'
import BusinessManagementFeesPage from './BusinessManagementFeesPage'
import BusinessMentorshipPage from './BusinessMentorshipPage'
import InternshipsPage from './InternshipsPage'
import PartnerBusinessManagementPage from './PartnerBusinessManagementPage'
import PostingFeesPage from './PostingFeesPage'
import SpecialOccasionPage from './SpecialOccasionPage'

type FeeType = 'application' | 'business-management' | 'mentorship' | 'internships' | 'partner-business' | 'posting' | 'special-occasion'

interface TabItem {
  id: FeeType
  label: string

}

export default function EntrepreneurServiceFeesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const tabs: TabItem[] = [
    { id: 'application', label: 'Application Fees'},
    { id: 'business-management', label: 'Business Management' },
    { id: 'mentorship', label: 'Mentorship' },
    { id: 'internships', label: 'Internships' },
    { id: 'partner-business', label: 'Partner Business' },
    { id: 'posting', label: 'Posting Fees' },
    { id: 'special-occasion', label: 'Special Occasions' },
  ]

  const activeTab = useMemo<FeeType>(() => {
    const tab = searchParams.get('tab')
    const validTabs: FeeType[] = [
      'application',
      'business-management',
      'mentorship',
      'internships',
      'partner-business',
      'posting',
      'special-occasion',
    ]

    return validTabs.includes(tab as FeeType) ? (tab as FeeType) : 'application'
  }, [searchParams])

  const renderContent = () => {
    switch (activeTab) {
      case 'application':
        return <ApplicationFeesPage />
      case 'business-management':
        return <BusinessManagementFeesPage />
      case 'mentorship':
        return <BusinessMentorshipPage />
      case 'internships':
        return <InternshipsPage />
      case 'partner-business':
        return <PartnerBusinessManagementPage />
      case 'posting':
        return <PostingFeesPage />
      case 'special-occasion':
        return <SpecialOccasionPage />
      default:
        return <ApplicationFeesPage />
    }
  }

  return (
    <AdminShell
      title="Entrepreneur Service Fees"
      subtitle="Manage pricing for all entrepreneur services and programs"
    >
      <div style={styles.container}>
        

        <div style={styles.tabsContainer}>
          <div style={styles.tabsList}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id ? styles.tabActive : styles.tabInactive),
                }}
              >
                
                <span style={styles.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={styles.content}>
          {renderContent()}
        </div>
      </div>
    </AdminShell>
  )
}

const styles: Record<string, CSSProperties> = {
  container: {
    width: '100%',
    background: '#fff',
  },
  header: {
    padding: '24px',
    background: 'linear-gradient(135deg, #023341 0%, #04617a 100%)',
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    margin: '0 0 8px',
    color: '#fff',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.9)',
    margin: 0,
    fontWeight: '500',
  },
  tabsContainer: {
    background: '#f7fafd',
    borderBottom: '2px solid rgba(15,30,53,0.08)',
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  tabsList: {
    display: 'flex',
    gap: 0,
    padding: '0 24px',
    minWidth: 'min-content',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 20px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderBottom: '3px solid transparent',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: '#04617a',
    borderBottomColor: '#04617a',
    background: '#e8f4f8',
  },
  tabInactive: {
    color: '#7a8a9a',
    borderBottomColor: 'transparent',
  },
  tabIcon: {
    fontSize: '16px',
    display: 'inline-block',
  },
  tabLabel: {
    display: 'inline-block',
  },
  content: {
    minHeight: '600px',
  },
}
