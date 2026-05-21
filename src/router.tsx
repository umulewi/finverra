import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import App from './App'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoleRoute from './dashboard/ProtectedRoleRoute'
import SuperUserRoute from './dashboard/SuperUserRoute'

const PartnershipArticlePage = lazy(() => import('./showcase/PartnershipArticlePage'))

const ProgramsPage = lazy(() => import('./showcase/ProgramsPage'))
const InvestInPage = lazy(() => import('./showcase/InvestInPage'))
const ShowcaseServicesPage = lazy(() => import('./showcase/ServicesPage'))
const ShowcaseEventsPage = lazy(() => import('./showcase/EventsGalleryPage'))
const ContactUsPage = lazy(() => import('./showcase/ContactUsPage'))
const TeamStructurePage = lazy(() => import('./showcase/TeamStructurePage'))
const WhatDrivesFinverraAdminPage = lazy(() => import('./dashboard/admin/WhatDrivesPage'))
const WhoWeAreAdminPage = lazy(() => import('./dashboard/admin/WhoWeArePage'))
const DashboardChoice = lazy(() => import('./dashboard/DashboardChoice'))
const AdminAuth = lazy(() => import('./dashboard/admin/AdminAuth'))
const ProjectsPage = lazy(() => import('./dashboard/admin/ProjectsPage'))
const ServicesPage = lazy(() => import('./dashboard/admin/ServicesPage'))
const InvestorsPage = lazy(() => import('./dashboard/admin/InvestorsPage'))
const EntrepreneursPage = lazy(() => import('./dashboard/admin/EntrepreneursPage'))
const EntreprenurBusinessInfoPage = lazy(() => import('./dashboard/admin/EntreprenurBusinessInfoPage'))
const InvestorApplicationsPage = lazy(() => import('./dashboard/admin/InvestorApplicationsPage'))
const EntrepreneurApplicationsPage = lazy(() => import('./dashboard/admin/EntrepreneurApplicationsPage'))
const ProjectApplicantsPage = lazy(() => import('./dashboard/admin/ProjectApplicantsPage'))
const ProjectApplicantDetailPage = lazy(() => import('./dashboard/admin/ProjectApplicantDetailPage'))
const PartnersPage = lazy(() => import('./dashboard/admin/PartnersPage'))
const OurProjectsAdminPage = lazy(() => import('./dashboard/admin/OurProjectsPage'))
const OurProjectsPage = lazy(() => import('./showcase/OurProjectsPage'))

const AppointmentBookingsPage = lazy(() => import('./dashboard/admin/AppointmentBookingsPage'))
const CreateAppointmentSlotsPage = lazy(() => import('./dashboard/admin/CreateAppointmentSlotsPage'))
const ConfirmedAppointmentsPage = lazy(() => import('./dashboard/admin/ConfirmedAppointmentsPage'))
const AppointmentAvailabilityPage = lazy(() => import('./dashboard/admin/AppointmentAvailabilityPage'))
const EventsPage = lazy(() => import('./dashboard/admin/EventsPage'))
const ProgramsAdminPage = lazy(() => import('./dashboard/admin/ProgramsPage'))
const EntrepreneurServiceFeesAdminPage = lazy(() => import('./dashboard/admin/entrepreneurServiceFees'))
const InvestorServiceFeesAdminPage = lazy(() => import('./dashboard/admin/investorServiceFees'))
const TeamPage = lazy(() => import('./dashboard/admin/TeamPage'))
const Testimonials = lazy(() => import('./dashboard/admin/TestimonialsPage'))
const StatisticsPage = lazy(() => import('./dashboard/admin/StatisticsPage'))
const AdminUsersPage = lazy(() => import('./dashboard/admin/AdminUsersPage'))
const AdminChangePasswordPage = lazy(() => import('./dashboard/admin/AdminChangePasswordPage'))
const EntrepreneurPaidCollectionPage = lazy(() => import('./dashboard/admin/EntrepreneurPaidCollectionPage'))

const EntrepreneurAuth = lazy(() => import('./dashboard/entrepreneur/EntrepreneurAuth'))
const EntrepreneurForgotPassword = lazy(() => import('./dashboard/entrepreneur/EntrepreneurForgotPassword'))
const EntrepreneurResetPassword = lazy(() => import('./dashboard/entrepreneur/EntrepreneurResetPassword'))
const EntrepreneurDashboard = lazy(() => import('./dashboard/entrepreneur/EntrepreneurDashboard'))
const EntrepreneurProfile = lazy(() => import('./dashboard/entrepreneur/EntrepreneurProfile'))
const EntrepreneurChangePasswordPage = lazy(() => import('./dashboard/entrepreneur/EntrepreneurChangePasswordPage.tsx'))
const BookAppointmentPage = lazy(() => import('./dashboard/entrepreneur/BookAppointmentPage'))

const ApplicationInfo = lazy(() => import('./dashboard/entrepreneur/ApplicationInfo'))
const EntrepreneurApplicationStatus = lazy(() => import('./dashboard/entrepreneur/ApplicationStatus'))
const BusinessInfo = lazy(() => import('./dashboard/entrepreneur/BusinessInfo'))

const EntrepreneurServiceFees = lazy(() => import('./dashboard/entrepreneur/ServiceFees'))
const EntrepreneurPaymentsPage = lazy(() => import('./dashboard/entrepreneur/PaymentsPage'))


const InvestorDashboard = lazy(() => import('./dashboard/investor'))
const InvestorAuth = lazy(() => import('./dashboard/investor/InvestorAuth'))
const InvestorVerifyOtp = lazy(() => import('./dashboard/investor/InvestorVerifyOtp'))
const InvestorForgotPassword = lazy(() => import('./dashboard/investor/InvestorForgotPassword'))
const InvestorResetPassword = lazy(() => import('./dashboard/investor/InvestorResetPassword'))
const InvestorApplicationForm = lazy(() => import('./dashboard/investor/InvestorApplicationForm'))
const InvestorApplicationStatus = lazy(() => import('./dashboard/investor/ApplicationStatusPage'))


const PipelinePage = lazy(() => import('./dashboard/investor/PipelinePage'))

const DocumentsPage = lazy(() => import('./dashboard/investor/DocumentsPage'))

const ProjectToInvestIn = lazy(() => import('./dashboard/investor/ProjectToInvestIn'))
const AppliedProjectsPage = lazy(() => import('./dashboard/investor/AppliedProjects'))
const AppliedProjectDetailPage = lazy(() => import('./dashboard/investor/AppliedProjectDetailPage'))

const InvestorServiceFees = lazy(() => import('./dashboard/investor/ServiceFees'))
const InvestorPaymentsPage = lazy(() => import('./dashboard/investor/PaymentsPage'))
const InvestorChangePasswordPage = lazy(() => import('./dashboard/investor/InvestorChangePasswordPage'))
const InvestorBookAppointmentPage = lazy(() => import('./dashboard/investor/BookAppointmentPage'))

const InvestorEditProfile = lazy(() => import('./dashboard/investor/InvestorEditProfile'))

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
        <ScrollToTop />
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

          <Route path="/about-us" element={<TeamStructurePage />} />
          <Route path="/events-programs" element={<ShowcaseEventsPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/invest-in" element={<InvestInPage />} />
          <Route path="/services" element={<ShowcaseServicesPage />} />
          <Route path="/events" element={<ShowcaseEventsPage />} />
          <Route path="/contact-us" element={<ContactUsPage />} />
          <Route path="/our-projects" element={<OurProjectsPage />} />
          <Route path="/team" element={<Navigate to="/about-us" replace />} />
          <Route path="/partnerships/:slug" element={<PartnershipArticlePage />} />
          <Route path="/dashboard" element={<DashboardChoice />} />
          <Route path="/admin" element={<AdminAuth />} />
          <Route path="/dashboard/admin/login" element={<AdminAuth />} />
          <Route
            path="/dashboard/admin"
            element={<Navigate to="/dashboard/admin/statistics" replace />}
          />
          <Route
            path="/admin/projects"
            element={(
              <Navigate to="/dashboard/admin/projects" replace />
            )}
          />
          <Route
            path="/dashboard/admin/projects"
            element={(
              <ProtectedRoleRoute role="admin">
                <ProjectsPage />
              </ProtectedRoleRoute>
            )}
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
            path="/dashboard/admin/project-applicants"
            element={(
              <ProtectedRoleRoute role="admin">
                <ProjectApplicantsPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/project-applicants/:id"
            element={(
              <ProtectedRoleRoute role="admin">
                <ProjectApplicantDetailPage />
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
            path="/dashboard/admin/our-projects"
            element={(
              <ProtectedRoleRoute role="admin">
                <OurProjectsAdminPage />
              </ProtectedRoleRoute>
            )}
          />

          <Route
            path="/dashboard/admin/bookings"
            element={(
              <ProtectedRoleRoute role="admin">
                <AppointmentBookingsPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/appointments/create"
            element={(
              <ProtectedRoleRoute role="admin">
                <CreateAppointmentSlotsPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/appointments/confirmed"
            element={(
              <ProtectedRoleRoute role="admin">
                <ConfirmedAppointmentsPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/appointments/availability"
            element={(
              <ProtectedRoleRoute role="admin">
                <AppointmentAvailabilityPage />
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
            path="/dashboard/admin/programs"
            element={(
              <ProtectedRoleRoute role="admin">
                <ProgramsAdminPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/entrepreneur-service-fees"
            element={(
              <ProtectedRoleRoute role="admin">
                <EntrepreneurServiceFeesAdminPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/entrepreneur-paid-collection"
            element={(
              <ProtectedRoleRoute role="admin">
                <EntrepreneurPaidCollectionPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/investor-service-fees"
            element={(
              <ProtectedRoleRoute role="admin">
                <InvestorServiceFeesAdminPage />
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
            path="/dashboard/admin/what-drives-finverra"
            element={(
              <ProtectedRoleRoute role="admin">
                <WhatDrivesFinverraAdminPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/admin/who-we-are"
            element={(
              <ProtectedRoleRoute role="admin">
                <WhoWeAreAdminPage />
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
            path="/dashboard/entrepreneur/book-appointment"
            element={(
              <ProtectedRoleRoute role="entrepreneur">
                <BookAppointmentPage />
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
          <Route
            path="/dashboard/entrepreneur/payments"
            element={(
              <ProtectedRoleRoute role="entrepreneur">
                <EntrepreneurPaymentsPage />
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
            path="/dashboard/investor/project-to-invest"
            element={(
              <ProtectedRoleRoute role="investor">
                <ProjectToInvestIn />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/investor/applied-projects"
            element={(
              <ProtectedRoleRoute role="investor">
                <AppliedProjectsPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/investor/applied-projects/:applicationId"
            element={(
              <ProtectedRoleRoute role="investor">
                <AppliedProjectDetailPage />
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
          <Route
            path="/dashboard/investor/payments"
            element={(
              <ProtectedRoleRoute role="investor">
                <InvestorPaymentsPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route
            path="/dashboard/investor/book-appointment"
            element={(
              <ProtectedRoleRoute role="investor">
                <InvestorBookAppointmentPage />
              </ProtectedRoleRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
