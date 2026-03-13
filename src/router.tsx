import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import App from './App'
import DashboardAuth from './dashboard/DashboardAuth'
import DashboardChoice from './dashboard/DashboardChoice'
import ProtectedRoleRoute from './dashboard/ProtectedRoleRoute'
import AdminDashboard from './dashboard/admin/AdminDashboard'
import AchievementsPage from './dashboard/admin/AchievementsPage'
import EventsPage from './dashboard/admin/EventsPage'
import TeamPage from './dashboard/admin/TeamPage'
import EntrepreneurDashboard from './dashboard/entrepreneur/EntrepreneurDashboard'
import InvestorDashboard from './dashboard/investor'
import PipelinePage from './dashboard/investor/PipelinePage'
import PortfolioPage from './dashboard/investor/PortfolioPage'
import DocumentsPage from './dashboard/investor/DocumentsPage'
import MessagesPage from './dashboard/investor/MessagesPage'
import ReportsPage from './dashboard/investor/ReportsPage'
import NotificationsPage from './dashboard/investor/NotificationsPage'
import SettingsPage from './dashboard/investor/SettingsPage'




import InvestorEditProfile from './dashboard/investor/InvestorEditProfile'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<DashboardChoice />} />
        <Route path="/dashboard/admin/login" element={<DashboardAuth role="admin" mode="login" />} />
        <Route path="/dashboard/admin/signup" element={<DashboardAuth role="admin" mode="signup" />} />
        <Route
          path="/dashboard/admin"
          element={(
            <ProtectedRoleRoute role="admin">
              <AdminDashboard />
            </ProtectedRoleRoute>
          )}
        />
        <Route
          path="/dashboard/admin/services"
          element={(
            <ProtectedRoleRoute role="admin">
              <AdminDashboard />
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
        <Route path="/dashboard/entrepreneur/login" element={<DashboardAuth role="entrepreneur" mode="login" />} />
        <Route path="/dashboard/entrepreneur/signup" element={<DashboardAuth role="entrepreneur" mode="signup" />} />
        <Route
          path="/dashboard/entrepreneur"
          element={(
            <ProtectedRoleRoute role="entrepreneur">
              <EntrepreneurDashboard />
            </ProtectedRoleRoute>
          )}
        />
        <Route path="/dashboard/investor/login" element={<DashboardAuth role="investor" mode="login" />} />
        <Route path="/dashboard/investor/signup" element={<DashboardAuth role="investor" mode="signup" />} />
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
