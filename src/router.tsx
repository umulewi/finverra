import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import App from './App'
import ProtectedRoleRoute from './dashboard/ProtectedRoleRoute'
import SuperUserRoute from './dashboard/SuperUserRoute'

const PartnershipArticlePage = lazy(() => import('./showcase/PartnershipArticlePage'))
const HowItWorksPage = lazy(() => import('./showcase/HowItWorksPage'))
const ProgramsPage = lazy(() => import('./showcase/ProgramsPage'))
const ShowcaseServicesPage = lazy(() => import('./showcase/ServicesPage'))
const ShowcaseEventsPage = lazy(() => import('./showcase/EventsGalleryPage'))
const TeamStructurePage = lazy(() => import('./showcase/TeamStructurePage'))
const DashboardChoice = lazy(() => import('./dashboard/DashboardChoice'))
const AdminAuth = lazy(() => import('./dashboard/admin/AdminAuth'))
const ServicesPage = lazy(() => import('./dashboard/admin/ServicesPage'))
const InvestorsPage = lazy(() => import('./dashboard/admin/InvestorsPage'))
const EntrepreneursPage = lazy(() => import('./dashboard/admin/EntrepreneursPage'))
const EntreprenurBusinessInfoPage = lazy(() => import('./dashboard/admin/EntreprenurBusinessInfoPage'))
const InvestorApplicationsPage = lazy(() => import('./dashboard/admin/InvestorApplicationsPage'))
const EntrepreneurApplicationsPage = lazy(() => import('./dashboard/admin/EntrepreneurApplicationsPage'))
const PartnersPage = lazy(() => import('./dashboard/admin/PartnersPage'))

const EventsPage = lazy(() => import('./dashboard/admin/EventsPage'))
const TeamPage = lazy(() => import('./dashboard/admin/TeamPage'))
const Testimonials = lazy(() => import('./dashboard/admin/TestimonialsPage'))
const StatisticsPage = lazy(() => import('./dashboard/admin/StatisticsPage'))
const AdminUsersPage = lazy(() => import('./dashboard/admin/AdminUsersPage'))
const AdminChangePasswordPage = lazy(() => import('./dashboard/admin/AdminChangePasswordPage'))

const EntrepreneurAuth = lazy(() => import('./dashboard/entrepreneur/EntrepreneurAuth'))
const EntrepreneurForgotPassword = lazy(() => import('./dashboard/entrepreneur/EntrepreneurForgotPassword'))
const EntrepreneurResetPassword = lazy(() => import('./dashboard/entrepreneur/EntrepreneurResetPassword'))
const EntrepreneurDashboard = lazy(() => import('./dashboard/entrepreneur/EntrepreneurDashboard'))
const EntrepreneurProfile = lazy(() => import('./dashboard/entrepreneur/EntrepreneurProfile'))
const EntrepreneurChangePasswordPage = lazy(() => import('./dashboard/entrepreneur/EntrepreneurChangePasswordPage.tsx'))

const ApplicationInfo = lazy(() => import('./dashboard/entrepreneur/ApplicationInfo'))
const EntrepreneurApplicationStatus = lazy(() => import('./dashboard/entrepreneur/ApplicationStatus'))
const BusinessInfo = lazy(() => import('./dashboard/entrepreneur/BusinessInfo'))

const EntrepreneurServiceFees = lazy(() => import('./dashboard/entrepreneur/ServiceFees'))



const InvestorDashboard = lazy(() => import('./dashboard/investor'))
const InvestorAuth = lazy(() => import('./dashboard/investor/InvestorAuth'))
const InvestorVerifyOtp = lazy(() => import('./dashboard/investor/InvestorVerifyOtp'))
const InvestorForgotPassword = lazy(() => import('./dashboard/investor/InvestorForgotPassword'))
const InvestorResetPassword = lazy(() => import('./dashboard/investor/InvestorResetPassword'))
const InvestorApplicationForm = lazy(() => import('./dashboard/investor/InvestorApplicationForm'))
const InvestorApplicationStatus = lazy(() => import('./dashboard/investor/ApplicationStatusPage'))


const PipelinePage = lazy(() => import('./dashboard/investor/PipelinePage'))

const DocumentsPage = lazy(() => import('./dashboard/investor/DocumentsPage'))

const InvestorServiceFees = lazy(() => import('./dashboard/investor/ServiceFees'))
const InvestorChangePasswordPage = lazy(() => import('./dashboard/investor/InvestorChangePasswordPage'))


const InvestorEditProfile = lazy(() => import('./dashboard/investor/InvestorEditProfile'))

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route
            path="/partnerships/strategic-partnerships"
            element={<PartnershipArticlePage forcedSlug="strategic-partnerships" />}
          />
          <Route
            path="/partnerships/collaborative-innovation"
            element={<PartnershipArticlePage forcedSlug="collaborative-innovation" />}
          />
          <Route
            path="/partnerships/expert-leadership"
            element={<PartnershipArticlePage forcedSlug="expert-leadership" />}
          />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/services" element={<ShowcaseServicesPage />} />
          <Route path="/events" element={<ShowcaseEventsPage />} />
          <Route path="/team" element={<TeamStructurePage />} />
          <Route path="/partnerships/:slug" element={<PartnershipArticlePage />} />
          <Route path="/dashboard" element={<DashboardChoice />} />
          <Route path="/admin" element={<AdminAuth />} />
          <Route path="/dashboard/admin/login" element={<AdminAuth />} />
          <Route
            path="/dashboard/admin"
            element={<Navigate to="/dashboard/admin/statistics" replace />}
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
            path="/dashboard/admin/investors"
            element={(
              <ProtectedRoleRoute role="admin">
                <InvestorsPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/entrepreneurs"
            element={(
              <ProtectedRoleRoute role="admin">
                <EntrepreneursPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/entreprenur-business-info"
            element={(
              <ProtectedRoleRoute role="admin">
                <EntreprenurBusinessInfoPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/investor-applications"
            element={(
              <ProtectedRoleRoute role="admin">
                <InvestorApplicationsPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/entrepreneur-applications"
            element={(
              <ProtectedRoleRoute role="admin">
                <EntrepreneurApplicationsPage />
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
          <Route
            path="/dashboard/admin/statistics"
            element={(
              <ProtectedRoleRoute role="admin">
                <StatisticsPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/users"
            element={(
              <ProtectedRoleRoute role="admin">
                <SuperUserRoute>
                  <AdminUsersPage />
                </SuperUserRoute>
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/change-password"
            element={(
              <ProtectedRoleRoute role="admin">
                <AdminChangePasswordPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route path="/dashboard/entrepreneur/login" element={<EntrepreneurAuth mode="login" />} />
          <Route path="/dashboard/entrepreneur/signup" element={<EntrepreneurAuth mode="signup" />} />
          <Route path="/dashboard/entrepreneur/forgot-password" element={<EntrepreneurForgotPassword />} />
          <Route path="/dashboard/entrepreneur/reset-password" element={<EntrepreneurResetPassword />} />
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
          />
          <Route
            path="/dashboard/entrepreneur/change-password"
            element={(
              <ProtectedRoleRoute role="entrepreneur">
                <EntrepreneurChangePasswordPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/entrepreneur/ApplicationInfo"
            element={(
              <ProtectedRoleRoute role="entrepreneur">
                <ApplicationInfo />
              </ProtectedRoleRoute>
            )}
          />

          <Route
            path="/dashboard/entrepreneur/application-status"
            element={(
              <ProtectedRoleRoute role="entrepreneur">
                <EntrepreneurApplicationStatus />
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

          <Route
            path="/dashboard/entrepreneur/service-fees"
            element={(
              <ProtectedRoleRoute role="entrepreneur">
                <EntrepreneurServiceFees />
              </ProtectedRoleRoute>
            )}
          />

          
          <Route path="/dashboard/investor/login" element={<InvestorAuth mode="login" />} />
          <Route path="/dashboard/investor/signup" element={<InvestorAuth mode="signup" />} />
          <Route path="/dashboard/investor/verify-otp" element={<InvestorVerifyOtp />} />
          <Route path="/dashboard/investor/forgot-password" element={<InvestorForgotPassword />} />
          <Route path="/dashboard/investor/reset-password" element={<InvestorResetPassword />} />
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
            path="/dashboard/investor/InvestorApplicationForm"
            element={(
              <ProtectedRoleRoute role="investor">
                <InvestorApplicationForm />
              </ProtectedRoleRoute>
            )}
          />

          <Route
            path="/dashboard/investor/application-form"
            element={(
              <ProtectedRoleRoute role="investor">
                <InvestorApplicationForm />
              </ProtectedRoleRoute>
            )}
          />

          <Route
            path="/dashboard/investor/application-status"
            element={(
              <ProtectedRoleRoute role="investor">
                <InvestorApplicationStatus />
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
            path="/dashboard/investor/edit-profile"
            element={(
              <ProtectedRoleRoute role="investor">
                <InvestorEditProfile />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/investor/change-password"
            element={(
              <ProtectedRoleRoute role="investor">
                <InvestorChangePasswordPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/investor/service-fees"
            element={(
              <ProtectedRoleRoute role="investor">
                <InvestorServiceFees />
              </ProtectedRoleRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
