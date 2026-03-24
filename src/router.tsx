import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import App from './App'
import DashboardChoice from './dashboard/DashboardChoice'
import ProtectedRoleRoute from './dashboard/ProtectedRoleRoute'
import AdminAuth from './dashboard/admin/AdminAuth'
import ServicesPage from './dashboard/admin/ServicesPage'
import PartnersPage from './dashboard/admin/PartnersPage'


import AchievementsPage from './dashboard/admin/AchievementsPage'
import EventsPage from './dashboard/admin/EventsPage'
import TeamPage from './dashboard/admin/TeamPage'
import Testimonials from './dashboard/admin/TestimonialsPage'






//Entrepreneur Pages
import EntrepreneurAuth from './dashboard/entrepreneur/EntrepreneurAuth'
import EntrepreneurDashboard from './dashboard/entrepreneur/EntrepreneurDashboard'
import EntrepreneurProfile from './dashboard/entrepreneur/EntrepreneurProfile'
import BusinessInfo from './dashboard/entrepreneur/BusinessInfo'




import InvestorDashboard from './dashboard/investor'
import InvestorAuth from './dashboard/investor/InvestorAuth'
import PipelinePage from './dashboard/investor/PipelinePage'
import PortfolioPage from './dashboard/investor/PortfolioPage'
import DocumentsPage from './dashboard/investor/DocumentsPage'
import MessagesPage from './dashboard/investor/MessagesPage'
import ReportsPage from './dashboard/investor/ReportsPage'
import NotificationsPage from './dashboard/investor/NotificationsPage'
import SettingsPage from './dashboard/investor/SettingsPage'




import InvestorEditProfile from './dashboard/investor/InvestorEditProfile'
import ApplicationInfo from './dashboard/entrepreneur/ApplicationInfo'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<DashboardChoice />} />
        <Route path="/dashboard/admin/login" element={<AdminAuth mode="login" />} />
        <Route path="/dashboard/admin/signup" element={<AdminAuth mode="signup" />} />
        <Route
          path="/dashboard/admin"
          element={<Navigate to="/dashboard/admin/services" replace />}
        />
        <Route
          path="/dashboard/admin/services"
          element={(
            <ProtectedRoleRoute role="admin">
              <ServicesPage />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/admin/partners"
          element={(
            <ProtectedRoleRoute role="admin">
              <PartnersPage />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/admin/achievements"
          element={(
            <ProtectedRoleRoute role="admin">
              <AchievementsPage />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/admin/events"
          element={(
            <ProtectedRoleRoute role="admin">
              <EventsPage />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/admin/team"
          element={(
            <ProtectedRoleRoute role="admin">
              <TeamPage />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/admin/testimonials"
          element={(
            <ProtectedRoleRoute role="admin">
              <Testimonials />
            </ProtectedRoleRoute>
          )}
        />
        <Route path="/dashboard/entrepreneur/login" element={<EntrepreneurAuth mode="login" />} />
        <Route path="/dashboard/entrepreneur/signup" element={<EntrepreneurAuth mode="signup" />} />
        <Route
          path="/dashboard/entrepreneur"
          element={(
            <ProtectedRoleRoute role="entrepreneur">
              <EntrepreneurDashboard />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/entrepreneur/profile"
          element={(
            <ProtectedRoleRoute role="entrepreneur">
              <EntrepreneurProfile />
            </ProtectedRoleRoute>
          )}
        /><Route
          path="/dashboard/entrepreneur/ApplicationInfo"
          element={(
            <ProtectedRoleRoute role="entrepreneur">
              <ApplicationInfo />
            </ProtectedRoleRoute>
          )}
        />

        <Route
          path="/dashboard/entrepreneur/BusinessInfo"
          element={(
            <ProtectedRoleRoute role="entrepreneur">
              <BusinessInfo />
            </ProtectedRoleRoute>
          )}
        />



        <Route path="/dashboard/investor/login" element={<InvestorAuth mode="login" />} />
        <Route path="/dashboard/investor/signup" element={<InvestorAuth mode="signup" />} />
        <Route
          path="/dashboard/investor"
          element={(
            <ProtectedRoleRoute role="investor">
              <InvestorDashboard />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/investor/pipeline"
          element={(
            <ProtectedRoleRoute role="investor">
              <PipelinePage />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/investor/portfolio"
          element={(
            <ProtectedRoleRoute role="investor">
              <PortfolioPage />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/investor/documents"
          element={(
            <ProtectedRoleRoute role="investor">
              <DocumentsPage />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/investor/messages"
          element={(
            <ProtectedRoleRoute role="investor">
              <MessagesPage />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/investor/reports"
          element={(
            <ProtectedRoleRoute role="investor">
              <ReportsPage />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/investor/notifications"
          element={(
            <ProtectedRoleRoute role="investor">
              <NotificationsPage />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/investor/settings"
          element={(
            <ProtectedRoleRoute role="investor">
              <SettingsPage />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/edit-profile"
          element={(
            <ProtectedRoleRoute role="investor">
              <InvestorEditProfile />
            </ProtectedRoleRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
