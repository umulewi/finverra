import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getAuthSession } from '../authStorage'
import { isSuperUserSession } from './superUser'

// ── Lucide-style inline SVG icons ──────────────────────────────────────────

const Icon = ({ d, viewBox = '0 0 24 24', size = 20 }: { d: string | ReactNode; viewBox?: string; size?: number }) => (
  <svg width={size} height={size} viewBox={viewBox} style={{ flexShrink: 0 }} aria-hidden>
    {/* subtle circular background using currentColor with low opacity */}
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.06" />
    <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {typeof d === 'string' ? <path d={d} /> : d}
    </g>
  </svg>
)

const Icons = {
  // Dashboard / Statistics
  BarChart3: () => <Icon d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>} />,

  // Entrepreneurs
  Users: () => <Icon d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />,
  Briefcase: () => <Icon d={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12"/><path d="M2 12h20"/></>} />,
  FileText: () => <Icon d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></>} />,
  Receipt: () => <Icon d={<><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></>} />,

  // Investors
  TrendingUp: () => <Icon d={<><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></>} />,
  DollarSign: () => <Icon d={<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>} />,
  ClipboardCheck: () => <Icon d={<><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3"/><path d="m9 14 2 2 4-4"/></>} />,
  FolderOpen: () => <Icon d={<><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></>} />,

  // Appointments
  CalendarPlus: () => <Icon d={<><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18"/><path d="M12 14v4"/><path d="M10 16h4"/></>} />,
  CalendarDays: () => <Icon d={<><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M7 14h2"/><path d="M7 18h2"/><path d="M11 14h2"/><path d="M11 18h2"/><path d="M15 14h2"/></>} />,
  CalendarCheck: () => <Icon d={<><path d="M9 11l2 2 4-4"/><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/></>} />,

  // Website
  Layers: () => <Icon d={<><polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/></>} />,
  Monitor: () => <Icon d={<><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>} />,
  Settings: () => <Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />,
  Link2: () => <Icon d={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>} />,
  Grid: () => <Icon d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>} />,
  CalendarEvent: () => <Icon d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />,
  Team: () => <Icon d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />,
  Info: () => <Icon d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>} />,
  Lightbulb: () => <Icon d={<><path d="M9 18h6"/><path d="M10 22h4"/><path d="M7.5 14.5a6.5 6.5 0 1 1 9 0c-.8.8-1.5 2-1.5 3.5H9c0-1.5-.7-2.7-1.5-3.5z"/></>} />,
  MessageSquare: () => <Icon d={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>} />,

  // Administration
  UserPlus: () => <Icon d={<><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></>} />,

  // Logout
  LogOut: () => <Icon d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></>} />,

  ChevronRight: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="9,18 15,12 9,6" />
    </svg>
  ),
}

// ── Types ──────────────────────────────────────────────────────────────────

type AdminSidebarProps = { onLogout: () => void }

type MenuItem = {
  label: string
  path: string
  icon: ReactNode
  groupKey: SidebarGroup['key']
  children?: Array<{ label: string; path: string }>
}

type SidebarGroup = {
  key: 'entrepreneurs' | 'investors' | 'appointments' | 'website' | 'administration'
  label: string
  emoji: string
  items: MenuItem[]
}

// ── Menu definitions ───────────────────────────────────────────────────────

const dashboardMenu: MenuItem[] = [
  { label: 'Dashboard Statistics', path: '/dashboard/admin/statistics', groupKey: 'entrepreneurs', icon: <Icons.BarChart3 /> },
]

const entrepreneurMenu: MenuItem[] = [
  { label: 'Entrepreneurs', path: '/dashboard/admin/entrepreneurs', groupKey: 'entrepreneurs', icon: <Icons.Users /> },
  { label: 'Business Information', path: '/dashboard/admin/entreprenur-business-info', groupKey: 'entrepreneurs', icon: <Icons.Briefcase /> },
  { label: 'Applications', path: '/dashboard/admin/entrepreneur-applications', groupKey: 'entrepreneurs', icon: <Icons.FileText /> },
  {
    label: 'Service Fees',
    path: '/dashboard/admin/entrepreneur-service-fees',
    groupKey: 'entrepreneurs',
    icon: <Icons.Receipt />,
    children: [
      { label: 'Application Fees', path: '/dashboard/admin/entrepreneur-service-fees?tab=application' },
      { label: 'Business Management', path: '/dashboard/admin/entrepreneur-service-fees?tab=business-management' },
      { label: 'Business Mentorship', path: '/dashboard/admin/entrepreneur-service-fees?tab=mentorship' },
      { label: 'Internships', path: '/dashboard/admin/entrepreneur-service-fees?tab=internships' },
      { label: 'Partner Business Mgmt', path: '/dashboard/admin/entrepreneur-service-fees?tab=partner-business' },
      { label: 'Posting Fees', path: '/dashboard/admin/entrepreneur-service-fees?tab=posting' },
      { label: 'Special Occasions', path: '/dashboard/admin/entrepreneur-service-fees?tab=special-occasion' },
    ],
  },
]

const investorMenu: MenuItem[] = [
  { label: 'Investors', path: '/dashboard/admin/investors', groupKey: 'investors', icon: <Icons.TrendingUp /> },
  {
    label: 'Service Fees',
    path: '/dashboard/admin/investor-service-fees',
    groupKey: 'investors',
    icon: <Icons.DollarSign />,
    children: [
      { label: 'Application Fees', path: '/dashboard/admin/investor-service-fees?tab=application' },
      { label: 'Investment Mentorships', path: '/dashboard/admin/investor-service-fees?tab=investment-mentorships' },
      { label: 'Partner Business Mgmt', path: '/dashboard/admin/investor-service-fees?tab=partner-business' },
      { label: 'Special Occasions', path: '/dashboard/admin/investor-service-fees?tab=special-occasion' },
      { label: 'Transaction Fees', path: '/dashboard/admin/investor-service-fees?tab=transaction-fees' },
      { label: 'Whole Business Mgmt', path: '/dashboard/admin/investor-service-fees?tab=whole-business' },
    ],
  },
  { label: 'Applications', path: '/dashboard/admin/investor-applications', groupKey: 'investors', icon: <Icons.ClipboardCheck /> },
  { label: 'Project Applicants', path: '/dashboard/admin/project-applicants', groupKey: 'investors', icon: <Icons.FolderOpen /> },
]

const appointmentMenu: MenuItem[] = [
  { label: 'Create Slots', path: '/dashboard/admin/appointments/create', groupKey: 'appointments', icon: <Icons.CalendarPlus /> },
  { label: 'Availability', path: '/dashboard/admin/appointments/availability', groupKey: 'appointments', icon: <Icons.CalendarDays /> },
  { label: 'Confirmed Appointments', path: '/dashboard/admin/appointments/confirmed', groupKey: 'appointments', icon: <Icons.CalendarCheck /> },
]

const websiteMenu: MenuItem[] = [
  { label: 'Projects', path: '/dashboard/admin/projects', groupKey: 'website', icon: <Icons.Layers /> },
  { label: 'Our Projects', path: '/dashboard/admin/our-projects', groupKey: 'website', icon: <Icons.Monitor /> },
  { label: 'Services', path: '/dashboard/admin/services', groupKey: 'website', icon: <Icons.Settings /> },
  { label: 'Partners', path: '/dashboard/admin/partners', groupKey: 'website', icon: <Icons.Link2 /> },
  { label: 'Programs', path: '/dashboard/admin/programs', groupKey: 'website', icon: <Icons.Grid /> },
  { label: 'Events', path: '/dashboard/admin/events', groupKey: 'website', icon: <Icons.CalendarEvent /> },
  { label: 'Team', path: '/dashboard/admin/team', groupKey: 'website', icon: <Icons.Team /> },
  { label: 'Who We Are', path: '/dashboard/admin/who-we-are', groupKey: 'website', icon: <Icons.Info /> },
  { label: 'What Drives Finverra', path: '/dashboard/admin/what-drives-finverra', groupKey: 'website', icon: <Icons.Lightbulb /> },
  { label: 'Testimonials', path: '/dashboard/admin/testimonials', groupKey: 'website', icon: <Icons.MessageSquare /> },
]

const administrationMenu: MenuItem[] = [
  { label: 'Admin Users', path: '/dashboard/admin/users', groupKey: 'administration', icon: <Icons.UserPlus /> },
]

const sidebarGroups: SidebarGroup[] = [
  { key: 'entrepreneurs', label: 'Entrepreneurs', emoji: '🚀', items: entrepreneurMenu },
  { key: 'investors', label: 'Investors', emoji: '📈', items: investorMenu },
  { key: 'appointments', label: 'Appointments', emoji: '📅', items: appointmentMenu },
  { key: 'website', label: 'Website', emoji: '🌐', items: websiteMenu },
  { key: 'administration', label: 'Administration', emoji: '🛡️', items: administrationMenu },
]

const STORAGE_KEY = 'finverra-admin-sidebar-open-groups'

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const session = getAuthSession()
  const isSuperUser = isSuperUserSession(session)

  const [openGroups, setOpenGroups] = useState<Record<SidebarGroup['key'], boolean>>({
    entrepreneurs: false, investors: false, appointments: false, website: false, administration: false,
  })
  const [openNested, setOpenNested] = useState<Record<string, boolean>>({
    'Service Fees': pathname.includes('entrepreneur-service-fees') || pathname.includes('investor-service-fees'),
  })

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored) as Partial<Record<SidebarGroup['key'], boolean>>
      setOpenGroups({
        entrepreneurs: !!parsed.entrepreneurs, investors: !!parsed.investors,
        appointments: !!parsed.appointments, website: !!parsed.website, administration: !!parsed.administration,
      })
    } catch { /* ignore */ }
  }, [])

  function saveGroups(next: Record<SidebarGroup['key'], boolean>) {
    setOpenGroups(next)
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  function toggleGroup(key: SidebarGroup['key']) {
    saveGroups({ entrepreneurs: false, investors: false, appointments: false, website: false, administration: false, [key]: !openGroups[key] })
  }

  function goTo(groupKey: SidebarGroup['key'], path: string) {
    saveGroups({ entrepreneurs: false, investors: false, appointments: false, website: false, administration: false, [groupKey]: true })
    navigate(path)
  }

  const visibleGroups = sidebarGroups
    .map(g => g.key === 'administration' ? { ...g, items: isSuperUser ? g.items : [] } : g)
    .filter(g => g.items.length > 0)

  function isGroupActive(g: SidebarGroup) {
    return g.items.some(item => {
      if (item.children?.length) return item.children.some(c => pathname === c.path.split('?')[0])
      return pathname === item.path || (item.path === '/dashboard/admin/services' && pathname === '/dashboard/admin')
    })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .fin-sidebar * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }

        .fin-sidebar {
          width: 268px; height: 100%; display: flex; flex-direction: column;
          background: linear-gradient(180deg, #023341 0%, #03475a 52%, #023341 100%);
          border-right: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
          box-shadow: 28px 0 60px rgba(15,30,53,0.18);
        }

        /* Brand */
        .fin-brand {
          padding: 18px 20px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }
        .fin-brand-btn {
          background: none; border: none; padding: 0; cursor: pointer;
          width: 100%; display: flex; align-items: center; justify-content: center;
        }
        .fin-brand-img { width: 140px; height: auto; opacity: 0.95; }

        /* Scroll */
        .fin-scroll {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          padding: 16px 12px 8px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .fin-scroll::-webkit-scrollbar { width: 4px; }
        .fin-scroll::-webkit-scrollbar-track { background: transparent; }
        .fin-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        /* Section label */
        .fin-section-label {
          font-size: 10px; font-weight: 700; letter-spacing: 1.4px;
          text-transform: uppercase; color: rgba(255,255,255,0.28);
          padding: 4px 8px 10px; display: block;
        }

        /* Quick-access item */
        .fin-quick-item {
          display: flex; align-items: center; gap: 11px; width: 100%;
          padding: 10px 11px; border-radius: 10px; border: 1px solid transparent;
          background: none; cursor: pointer; text-align: left;
          color: rgba(255,255,255,0.65); font-size: 13.5px; font-weight: 500;
          margin-bottom: 14px;
          transition: background 0.13s, color 0.13s, border-color 0.13s;
        }
        .fin-quick-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .fin-quick-item.active {
          background: linear-gradient(135deg, rgba(255,236,0,0.25), rgba(255,236,0,0.12));
          border-color: rgba(255,236,0,0.35); color: #ffffff;
        }
        .fin-quick-item.active .fin-item-icon { color: #ffec00; }
        .fin-item-icon { color: rgba(255,255,255,0.4); display: flex; align-items: center; width: 36px; height: 36px; justify-content: center; }

        /* Group block */
        .fin-group { margin-bottom: 4px; }

        .fin-group-header {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 10px 12px; border-radius: 10px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer; text-align: left;
          transition: background 0.13s, border-color 0.13s;
          margin-bottom: 2px;
        }
        .fin-group-header:hover { background: rgba(255,255,255,0.06); }
        .fin-group-header.active {
          background: linear-gradient(135deg, rgba(255,236,0,0.25), rgba(255,236,0,0.12));
          border-color: rgba(255,236,0,0.35);
        }
        .fin-group-left { display: flex; align-items: center; gap: 9px; }
        .fin-group-emoji { font-size: 14px; line-height: 1; }
        .fin-group-name {
          font-size: 13px; font-weight: 650; letter-spacing: 0.1px;
          color: rgba(255,255,255,0.75);
        }
        .fin-group-header.active .fin-group-name { color: #ffffff; }
        .fin-group-chevron {
          color: rgba(255,255,255,0.3); display: flex; align-items: center;
          transition: transform 0.18s ease;
        }
        .fin-group-header.open .fin-group-chevron { transform: rotate(90deg); }
        .fin-group-header.active .fin-group-chevron { color: rgba(255,236,0,0.6); }

        /* Group items */
        .fin-group-items {
          padding: 4px 0 6px 10px;
          display: flex; flex-direction: column; gap: 2px;
        }

        /* Nav item */
        .fin-nav-item {
          display: flex; align-items: center; gap: 11px; width: 100%;
          padding: 9px 11px; border-radius: 9px; border: 1px solid transparent;
          background: none; cursor: pointer; text-align: left;
          color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 500;
          transition: background 0.12s, color 0.12s, border-color 0.12s;
        }
        .fin-nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.9); }
        .fin-nav-item.active {
          background: linear-gradient(135deg, rgba(255,236,0,0.25), rgba(255,236,0,0.12));
          border-color: rgba(255,236,0,0.35); color: #ffffff;
        }
        .fin-nav-item.active .fin-item-icon { color: #ffec00; }
        .fin-nav-label { flex: 1; }

        /* Nested sub-items */
        .fin-sub-items {
          padding: 3px 0 4px 16px;
          display: flex; flex-direction: column; gap: 1px;
        }
        .fin-sub-item {
          display: flex; align-items: center; gap: 9px; width: 100%;
          padding: 7px 11px; border-radius: 7px; border: 1px solid transparent;
          background: none; cursor: pointer; text-align: left;
          color: rgba(255,255,255,0.48); font-size: 12.5px; font-weight: 500;
          transition: background 0.12s, color 0.12s;
        }
        .fin-sub-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.8); }
        .fin-sub-item.active {
          background: linear-gradient(135deg, rgba(255,236,0,0.25), rgba(255,236,0,0.12));
          border-color: rgba(255,236,0,0.35); color: #ffffff;
        }
        .fin-sub-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(255,255,255,0.25); flex-shrink: 0;
        }
        .fin-sub-item.active .fin-sub-dot { background: #ffec00; }

        /* Divider */
        .fin-divider {
          height: 1px; background: rgba(255,255,255,0.06);
          margin: 10px 8px 12px;
        }

        /* Footer */
        .fin-footer {
          padding: 12px 12px 16px;
          border-top: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }
        .fin-logout {
          display: flex; align-items: center; justify-content: center; gap: 9px;
          width: 100%; padding: 11px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.65); font-size: 13.5px; font-weight: 600;
          cursor: pointer; letter-spacing: 0.2px;
          transition: background 0.13s, color 0.13s, border-color 0.13s;
        }
        .fin-logout:hover {
          background: rgba(220,53,69,0.15); border-color: rgba(220,53,69,0.35);
          color: #ff6b7a;
        }
      `}</style>

      <aside className="fin-sidebar">
        {/* Brand */}
        <div className="fin-brand">
          <button className="fin-brand-btn" onClick={() => navigate('/dashboard/admin/statistics')} aria-label="Dashboard">
            <img src="/logo-finverra-white.png" alt="Finverra" className="fin-brand-img" />
          </button>
        </div>

        <div className="fin-scroll">
          {/* Quick Access */}
          <span className="fin-section-label">Quick Access</span>
          {dashboardMenu.map(item => {
            const active = pathname === item.path
            return (
              <button key={item.label} className={`fin-quick-item${active ? ' active' : ''}`} onClick={() => navigate(item.path)}>
                <span className="fin-item-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}

          <div className="fin-divider" />

          {/* Groups */}
          <span className="fin-section-label">Navigation</span>
          {visibleGroups.map(group => {
            const groupActive = isGroupActive(group)
            const groupOpen = openGroups[group.key]

            return (
              <div key={group.key} className="fin-group">
                <button
                  className={`fin-group-header${groupActive ? ' active' : ''}${groupOpen ? ' open' : ''}`}
                  onClick={() => toggleGroup(group.key)}
                >
                  <span className="fin-group-left">
                    <span className="fin-group-emoji">{group.emoji}</span>
                    <span className="fin-group-name">{group.label}</span>
                  </span>
                  <span className="fin-group-chevron"><Icons.ChevronRight /></span>
                </button>

                {groupOpen && (
                  <div className="fin-group-items">
                    {group.items.map(item => {
                      if (item.children?.length) {
                        const nestedActive = item.children.some(c => pathname === c.path.split('?')[0])
                        const nestedOpen = openNested[item.label] ?? nestedActive

                        return (
                          <div key={item.label}>
                            <button
                              className={`fin-nav-item${nestedActive ? ' active' : ''}`}
                              onClick={() => setOpenNested(p => ({ ...p, [item.label]: !p[item.label] }))}
                            >
                              <span className="fin-item-icon">{item.icon}</span>
                              <span className="fin-nav-label">{item.label}</span>
                              <span style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.3)', transition: 'transform 0.15s', transform: nestedOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                <Icons.ChevronRight />
                              </span>
                            </button>

                            {nestedOpen && (
                              <div className="fin-sub-items">
                                {item.children.map(child => {
                                  const childActive = pathname === child.path.split('?')[0] &&
                                    window.location.search === (child.path.includes('?') ? child.path.slice(child.path.indexOf('?')) : '')
                                  return (
                                    <button
                                      key={child.label}
                                      className={`fin-sub-item${childActive ? ' active' : ''}`}
                                      onClick={() => goTo(item.groupKey, child.path)}
                                    >
                                      <span className="fin-sub-dot" />
                                      {child.label}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      }

                      const isActive = pathname === item.path || (item.path === '/dashboard/admin/services' && pathname === '/dashboard/admin')

                      return (
                        <button
                          key={item.label}
                          className={`fin-nav-item${isActive ? ' active' : ''}`}
                          onClick={() => goTo(item.groupKey, item.path)}
                        >
                          <span className="fin-item-icon">{item.icon}</span>
                          <span className="fin-nav-label">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="fin-footer">
          <button className="fin-logout" onClick={onLogout}>
            <Icons.LogOut />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}