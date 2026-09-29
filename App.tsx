
import React, { Suspense, useState } from 'react';
import { lazyImport } from './utils/chunkLoadError';
import { HashRouter as Router, Route, Navigate, Routes } from 'react-router-dom';
import { FaroRoutes } from '@grafana/faro-react';
import { Layout, AuthLayout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Skeleton } from './components/ui';
import { UserRole } from './types';
import { QueryProvider } from './providers/QueryProvider';
import { isBloodBankUser } from './services/auth';

// Lazy Load Pages
const PublicHome = lazyImport(() => import('./pages/PublicHome').then(module => ({ default: module.PublicHome })));
const Login = lazyImport(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Register = lazyImport(() => import('./pages/Register').then(module => ({ default: module.Register })));
const RegistrationWizard = lazyImport(() => import('./pages/UnitRegistration/RegistrationWizard').then(module => ({ default: module.RegistrationWizard })));
const RegistrationComplete = lazyImport(() => import('./pages/UnitRegistration/RegistrationComplete').then(module => ({ default: module.RegistrationComplete })));
const RegistrationFormPrint = lazyImport(() => import('./pages/UnitRegistration/RegistrationFormPrint').then(module => ({ default: module.RegistrationFormPrint })));
const UnitRegistrationGuard = lazyImport(() => import('./pages/UnitRegistration/UnitRegistrationGuard').then(module => ({ default: module.UnitRegistrationGuard })));
const AdminDashboard = lazyImport(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const KalamelaPublic = lazyImport(() => import('./pages/KalamelaPublic').then(module => ({ default: module.KalamelaPublic })));
const Conference = lazyImport(() => import('./pages/Conference').then(module => ({ default: module.Conference })));

// Conference Official Pages
const ConferenceOfficialLayout = lazyImport(() => import('./pages/Conference/ConferenceOfficialLayout').then(module => ({ default: module.ConferenceOfficialLayout })));
const ConferenceOfficialHome = lazyImport(() => import('./pages/Conference/ConferenceOfficialHome').then(module => ({ default: module.ConferenceOfficialHome })));
const ConferenceDelegates = lazyImport(() => import('./pages/Conference/ConferenceDelegates').then(module => ({ default: module.ConferenceDelegates })));
const ConferencePayment = lazyImport(() => import('./pages/Conference/ConferencePayment').then(module => ({ default: module.ConferencePayment })));
const ConferenceExport = lazyImport(() => import('./pages/Conference/ConferenceExport').then(module => ({ default: module.ConferenceExport })));

// Conference Admin Pages
const ConferenceAdminHome = lazyImport(() => import('./pages/Conference/ConferenceAdminHome').then(module => ({ default: module.ConferenceAdminHome })));
const ConferenceAdminOfficials = lazyImport(() => import('./pages/Conference/ConferenceAdminOfficials').then(module => ({ default: module.ConferenceAdminOfficials })));
const ConferenceAdminInfo = lazyImport(() => import('./pages/Conference/ConferenceAdminInfo').then(module => ({ default: module.ConferenceAdminInfo })));
const ConferenceAdminPayments = lazyImport(() => import('./pages/Conference/ConferenceAdminPayments').then(module => ({ default: module.ConferenceAdminPayments })));
const ScoreEntry = lazyImport(() => import('./pages/ScoreEntry').then(module => ({ default: module.ScoreEntry })));

// Unit Admin Pages
const ViewAllUnits = lazyImport(() => import('./pages/UnitAdmin/ViewAllUnits').then(module => ({ default: module.ViewAllUnits })));
const NotOnboardedUnits = lazyImport(() => import('./pages/UnitAdmin/NotOnboardedUnits').then(module => ({ default: module.NotOnboardedUnits })));
const ViewAllOfficials = lazyImport(() => import('./pages/UnitAdmin/ViewAllOfficials').then(module => ({ default: module.ViewAllOfficials })));
const ViewAllCouncilors = lazyImport(() => import('./pages/UnitAdmin/ViewAllCouncilors').then(module => ({ default: module.ViewAllCouncilors })));
const ViewAllMembers = lazyImport(() => import('./pages/UnitAdmin/ViewAllMembers').then(module => ({ default: module.ViewAllMembers })));
const ViewIndividualUnit = lazyImport(() => import('./pages/UnitAdmin/ViewIndividualUnit').then(module => ({ default: module.ViewIndividualUnit })));
const ArchivedMembers = lazyImport(() => import('./pages/UnitAdmin/ArchivedMembers').then(module => ({ default: module.ArchivedMembers })));
const UnitTransferRequests = lazyImport(() => import('./pages/UnitAdmin/UnitTransferRequests').then(module => ({ default: module.UnitTransferRequests })));
const MemberInfoChangeRequests = lazyImport(() => import('./pages/UnitAdmin/MemberInfoChangeRequests').then(module => ({ default: module.MemberInfoChangeRequests })));
const OfficialsChangeRequests = lazyImport(() => import('./pages/UnitAdmin/OfficialsChangeRequests').then(module => ({ default: module.OfficialsChangeRequests })));
const CouncilorChangeRequests = lazyImport(() => import('./pages/UnitAdmin/CouncilorChangeRequests').then(module => ({ default: module.CouncilorChangeRequests })));
const MemberAddRequests = lazyImport(() => import('./pages/UnitAdmin/MemberAddRequests').then(module => ({ default: module.MemberAddRequests })));
const ArchivedMemberConcernRequests = lazyImport(() => import('./pages/UnitAdmin/ArchivedMemberConcernRequests').then(module => ({ default: module.ArchivedMemberConcernRequests })));
const UnitRegistrationPayments = lazyImport(() => import('./pages/UnitAdmin/UnitRegistrationPayments').then(module => ({ default: module.UnitRegistrationPayments })));
const PaymentSettings = lazyImport(() => import('./pages/UnitAdmin/PaymentSettings').then(module => ({ default: module.PaymentSettings })));
const ExportData = lazyImport(() => import('./pages/UnitAdmin/ExportData').then(module => ({ default: module.ExportData })));
const PrintForm = lazyImport(() => import('./pages/UnitAdmin/PrintForm').then(module => ({ default: module.PrintForm })));
const SiteSettings = lazyImport(() => import('./pages/UnitAdmin/SiteSettings').then(module => ({ default: module.SiteSettings })));
const UserManagement = lazyImport(() => import('./pages/UnitAdmin/UserManagement').then(module => ({ default: module.UserManagement })));
const BloodDonorSearch = lazyImport(() => import('./pages/UnitAdmin/BloodDonorSearch').then(module => ({ default: module.BloodDonorSearch })));

// Unit User Pages (for unit officials)
const ViewMyRequests = lazyImport(() => import('./pages/UnitUser/ViewMyRequests').then(module => ({ default: module.ViewMyRequests })));
const UnitArchivedMembers = lazyImport(() => import('./pages/UnitUser/UnitArchivedMembers').then(module => ({ default: module.UnitArchivedMembers })));
const SubmitTransferRequest = lazyImport(() => import('./pages/UnitUser/SubmitTransferRequest').then(module => ({ default: module.SubmitTransferRequest })));
const SubmitMemberInfoChange = lazyImport(() => import('./pages/UnitUser/SubmitMemberInfoChange').then(module => ({ default: module.SubmitMemberInfoChange })));
const SubmitOfficialsChange = lazyImport(() => import('./pages/UnitUser/SubmitOfficialsChange').then(module => ({ default: module.SubmitOfficialsChange })));
const SubmitCouncilorChange = lazyImport(() => import('./pages/UnitUser/SubmitCouncilorChange').then(module => ({ default: module.SubmitCouncilorChange })));
const SubmitMemberAdd = lazyImport(() => import('./pages/UnitUser/SubmitMemberAdd').then(module => ({ default: module.SubmitMemberAdd })));
const UpdateMemberLocations = lazyImport(() => import('./pages/UnitUser/UpdateMemberLocations').then(module => ({ default: module.UpdateMemberLocations })));
const ChangeRequestGuard = lazyImport(() => import('./pages/UnitUser/ChangeRequestGuard').then(module => ({ default: module.ChangeRequestGuard })));
const ChangeRequestWizard = lazyImport(() => import('./pages/ChangeRequest/ChangeRequestWizard').then(module => ({ default: module.ChangeRequestWizard })));

// Kalamela Pages
const EventsManagement = lazyImport(() => import('./pages/Kalamela/EventsManagement').then(module => ({ default: module.EventsManagement })));
const KalamelaOfficialHome = lazyImport(() => import('./pages/Kalamela/OfficialHome').then(module => ({ default: module.KalamelaOfficialHome })));
const SelectIndividualParticipants = lazyImport(() => import('./pages/Kalamela/SelectIndividualParticipants').then(module => ({ default: module.SelectIndividualParticipants })));
const SelectGroupParticipants = lazyImport(() => import('./pages/Kalamela/SelectGroupParticipants').then(module => ({ default: module.SelectGroupParticipants })));
const ViewParticipants = lazyImport(() => import('./pages/Kalamela/ViewParticipants').then(module => ({ default: module.ViewParticipants })));
const PaymentPreview = lazyImport(() => import('./pages/Kalamela/PaymentPreview').then(module => ({ default: module.PaymentPreview })));
const PrintView = lazyImport(() => import('./pages/Kalamela/PrintView').then(module => ({ default: module.PrintView })));
const PublicResults = lazyImport(() => import('./pages/Kalamela/PublicResults').then(module => ({ default: module.PublicResults })));
const TopPerformers = lazyImport(() => import('./pages/Kalamela/TopPerformers').then(module => ({ default: module.TopPerformers })));
const SubmitAppeal = lazyImport(() => import('./pages/Kalamela/SubmitAppeal').then(module => ({ default: module.SubmitAppeal })));
const EventResults = lazyImport(() => import('./pages/Kalamela/Admin/EventResults').then(module => ({ default: module.EventResults })));

// Kalamela Admin Pages
const ViewScores = lazyImport(() => import('./pages/Kalamela/Admin/ViewScores').then(module => ({ default: module.ViewScores })));
const ScoreIndividualEvent = lazyImport(() => import('./pages/Kalamela/Admin/ScoreIndividualEvent').then(module => ({ default: module.ScoreIndividualEvent })));
const ScoreGroupEvent = lazyImport(() => import('./pages/Kalamela/Admin/ScoreGroupEvent').then(module => ({ default: module.ScoreGroupEvent })));
const AdminResults = lazyImport(() => import('./pages/Kalamela/Admin/AdminResults').then(module => ({ default: module.AdminResults })));
const ManagePayments = lazyImport(() => import('./pages/Kalamela/Admin/ManagePayments').then(module => ({ default: module.ManagePayments })));
const ManageAppeals = lazyImport(() => import('./pages/Kalamela/Admin/ManageAppeals').then(module => ({ default: module.ManageAppeals })));
const CategoryManagement = lazyImport(() => import('./pages/Kalamela/Admin/CategoryManagement').then(module => ({ default: module.CategoryManagement })));
const MasterData = lazyImport(() => import('./pages/Kalamela/Admin/MasterData').then(module => ({ default: module.MasterData })));
const ScheduleManagement = lazyImport(() => import('./pages/Kalamela/Admin/ScheduleManagement').then(module => ({ default: module.ScheduleManagement })));

// Yuvalokham Pages
const YuvalokhamPublic = lazyImport(() => import('./pages/Yuvalokham/YuvalokhamPublic').then(module => ({ default: module.YuvalokhamPublic })));
const YuvalokhamLogin = lazyImport(() => import('./pages/Yuvalokham/YuvalokhamLogin').then(module => ({ default: module.YuvalokhamLogin })));
const YuvalokhamRegister = lazyImport(() => import('./pages/Yuvalokham/YuvalokhamRegister').then(module => ({ default: module.YuvalokhamRegister })));
const YMAuthGuard = lazyImport(() => import('./pages/Yuvalokham/YMAuthGuard').then(module => ({ default: module.YMAuthGuard })));

// Yuvalokham User Pages
const YMUserLayout = lazyImport(() => import('./pages/Yuvalokham/YMUserLayout').then(module => ({ default: module.YMUserLayout })));
const YMDashboard = lazyImport(() => import('./pages/Yuvalokham/User/YMDashboard').then(module => ({ default: module.YMDashboard })));
const YMProfile = lazyImport(() => import('./pages/Yuvalokham/User/YMProfile').then(module => ({ default: module.YMProfile })));
const YMPlans = lazyImport(() => import('./pages/Yuvalokham/User/YMPlans').then(module => ({ default: module.YMPlans })));
const YMPaymentNew = lazyImport(() => import('./pages/Yuvalokham/User/YMPaymentNew').then(module => ({ default: module.YMPaymentNew })));
const YMSubscriptions = lazyImport(() => import('./pages/Yuvalokham/User/YMSubscriptions').then(module => ({ default: module.YMSubscriptions })));
const YMMagazinesUser = lazyImport(() => import('./pages/Yuvalokham/User/YMMagazines').then(module => ({ default: module.YMMagazines })));
const YMPayments = lazyImport(() => import('./pages/Yuvalokham/User/YMPayments').then(module => ({ default: module.YMPayments })));
const YMComplaints = lazyImport(() => import('./pages/Yuvalokham/User/YMComplaints').then(module => ({ default: module.YMComplaints })));

// Yuvalokham Admin Pages
const YMAdminLayout = lazyImport(() => import('./pages/Yuvalokham/Admin/YMAdminLayout').then(module => ({ default: module.YMAdminLayout })));
const YMAdminDashboard = lazyImport(() => import('./pages/Yuvalokham/Admin/YMAdminDashboard').then(module => ({ default: module.YMAdminDashboard })));
const YMUserManagement = lazyImport(() => import('./pages/Yuvalokham/Admin/YMUserManagement').then(module => ({ default: module.YMUserManagement })));
const YMPlanManagement = lazyImport(() => import('./pages/Yuvalokham/Admin/YMPlanManagement').then(module => ({ default: module.YMPlanManagement })));
const YMPaymentReview = lazyImport(() => import('./pages/Yuvalokham/Admin/YMPaymentReview').then(module => ({ default: module.YMPaymentReview })));
const YMMagazineManagement = lazyImport(() => import('./pages/Yuvalokham/Admin/YMMagazineManagement').then(module => ({ default: module.YMMagazineManagement })));
const YMComplaintManagement = lazyImport(() => import('./pages/Yuvalokham/Admin/YMComplaintManagement').then(module => ({ default: module.YMComplaintManagement })));
const YMQRSettings = lazyImport(() => import('./pages/Yuvalokham/Admin/YMQRSettings').then(module => ({ default: module.YMQRSettings })));
const YMSubscriptionManagement = lazyImport(() => import('./pages/Yuvalokham/Admin/YMSubscriptionManagement').then(module => ({ default: module.YMSubscriptionManagement })));
const YMAdminCreate = lazyImport(() => import('./pages/Yuvalokham/Admin/YMAdminCreate').then(module => ({ default: module.YMAdminCreate })));

// Loading Fallback
const PageLoader = () => (
  <div className="p-8 space-y-4">
    <Skeleton className="h-12 w-1/3" />
    <Skeleton className="h-64 w-full" />
    <div className="grid grid-cols-3 gap-4">
       <Skeleton className="h-32" />
       <Skeleton className="h-32" />
       <Skeleton className="h-32" />
    </div>
  </div>
);

// Wrapper for Admin Routes that applies the Dashboard Layout
const AdminRoute: React.FC<{ children: React.ReactNode; allowBloodBank?: boolean }> = ({
  children,
  allowBloodBank = false,
}) => {
  if (isBloodBankUser() && !allowBloodBank) {
    return <Navigate to="/admin/blood-donor-search" replace />;
  }
  return <Layout>{children}</Layout>;
};

// Wrapper for Auth Routes that applies the Auth Layout
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthLayout>{children}</AuthLayout>;
};

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
  };

  return (
    <ErrorBoundary>
      <QueryProvider>
        <ToastProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              {/* routesComponent: Faro only sets internal Routes when VITE_FARO_URL is set */}
              <FaroRoutes routesComponent={Routes}>
              {/* Homepage with Login */}
              <Route path="/" element={<PublicHome onLogin={handleLogin} />} />
              
              {/* Kalamela Public Portal */}
              <Route path="/kalamela" element={<KalamelaPublic />} />
              
              {/* Redirect old Kalamela Official route to new home */}
              <Route path="/kalamela/official" element={<Navigate to="/kalamela/official/home" replace />} />
              
              {/* Conference Public Portal */}
              <Route path="/conference" element={<Conference />} />
              
              {/* Conference Official Portal */}
              <Route path="/conference/official" element={<ConferenceOfficialLayout />}>
                <Route path="home" element={<ConferenceOfficialHome />} />
                <Route path="delegates" element={<ConferenceDelegates />} />
                <Route path="payment" element={<ConferencePayment />} />
                <Route path="export" element={<ConferenceExport />} />
                <Route index element={<ConferenceOfficialHome />} />
              </Route>
              
              {/* Auth Routes */}
              <Route path="/login" element={
                <AuthRoute>
                  <Login onLogin={handleLogin} />
                </AuthRoute>
              } />
              <Route path="/register" element={<Register />} />
              <Route path="/register/wizard" element={
                <UnitRegistrationGuard>
                  <RegistrationWizard />
                </UnitRegistrationGuard>
              } />
              <Route path="/register/complete" element={
                <UnitRegistrationGuard>
                  <RegistrationComplete />
                </UnitRegistrationGuard>
              } />
              <Route path="/register/form" element={
                <UnitRegistrationGuard>
                  <RegistrationFormPrint />
                </UnitRegistrationGuard>
              } />
              
              {/* Admin Routes - Unit Admin Module */}
              <Route path="/admin/dashboard" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />

              {/* Unit Management */}
              <Route path="/admin/units" element={
                <AdminRoute>
                  <ViewAllUnits />
                </AdminRoute>
              } />

              <Route path="/admin/units/not-onboarded" element={
                <AdminRoute>
                  <NotOnboardedUnits />
                </AdminRoute>
              } />

              <Route path="/admin/units/:id" element={
                <AdminRoute>
                  <ViewIndividualUnit />
                </AdminRoute>
              } />

              <Route path="/admin/officials" element={
                <AdminRoute>
                  <ViewAllOfficials />
                </AdminRoute>
              } />

              <Route path="/admin/councilors" element={
                <AdminRoute>
                  <ViewAllCouncilors />
                </AdminRoute>
              } />

              <Route path="/admin/members" element={
                <AdminRoute>
                  <ViewAllMembers />
                </AdminRoute>
              } />

              <Route path="/admin/archived-members" element={
                <AdminRoute>
                  <ArchivedMembers />
                </AdminRoute>
              } />

              <Route path="/admin/blood-donor-search" element={
                <AdminRoute allowBloodBank>
                  <BloodDonorSearch />
                </AdminRoute>
              } />

              {/* Change Requests */}
              <Route path="/admin/requests/transfers" element={
                <AdminRoute>
                  <UnitTransferRequests />
                </AdminRoute>
              } />

              <Route path="/admin/requests/member-info" element={
                <AdminRoute>
                  <MemberInfoChangeRequests />
                </AdminRoute>
              } />

              <Route path="/admin/requests/officials" element={
                <AdminRoute>
                  <OfficialsChangeRequests />
                </AdminRoute>
              } />

              <Route path="/admin/requests/councilors" element={
                <AdminRoute>
                  <CouncilorChangeRequests />
                </AdminRoute>
              } />

              <Route path="/admin/requests/member-add" element={
                <AdminRoute>
                  <MemberAddRequests />
                </AdminRoute>
              } />

              <Route path="/admin/requests/archived-member-concerns" element={
                <AdminRoute>
                  <ArchivedMemberConcernRequests />
                </AdminRoute>
              } />

              <Route path="/admin/payments/settings" element={
                <AdminRoute>
                  <PaymentSettings />
                </AdminRoute>
              } />

              <Route path="/admin/payments" element={
                <AdminRoute>
                  <UnitRegistrationPayments />
                </AdminRoute>
              } />

              <Route path="/admin/requests/registration-payments" element={
                <Navigate to="/admin/payments" replace />
              } />

              {/* Export & Print */}
              <Route path="/admin/export" element={
                <AdminRoute>
                  <ExportData />
                </AdminRoute>
              } />

              {/* Site Settings */}
              <Route path="/admin/site-settings" element={
                <AdminRoute>
                  <SiteSettings />
                </AdminRoute>
              } />

              {/* User Management */}
              <Route path="/admin/user-management" element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              } />

              {/* Conference Admin Routes */}
              <Route path="/admin/conference/home" element={
                <AdminRoute>
                  <ConferenceAdminHome />
                </AdminRoute>
              } />

              <Route path="/admin/conference/officials" element={
                <AdminRoute>
                  <ConferenceAdminOfficials />
                </AdminRoute>
              } />

              <Route path="/admin/conference/info" element={
                <AdminRoute>
                  <ConferenceAdminInfo />
                </AdminRoute>
              } />

              <Route path="/admin/conference/payments" element={
                <AdminRoute>
                  <ConferenceAdminPayments />
                </AdminRoute>
              } />

              <Route path="/admin/print-form/:unitId" element={
                <AdminRoute>
                  <PrintForm />
                </AdminRoute>
              } />

              {/* Unit User Routes (for unit officials) */}
              <Route path="/unit/my-requests" element={
                <AdminRoute>
                  <ChangeRequestGuard>
                    <ViewMyRequests />
                  </ChangeRequestGuard>
                </AdminRoute>
              } />

              <Route path="/unit/change-request" element={
                <AdminRoute>
                  <ChangeRequestGuard>
                    <ChangeRequestWizard />
                  </ChangeRequestGuard>
                </AdminRoute>
              } />

              <Route path="/unit/archived-members" element={
                <AdminRoute>
                  <UnitArchivedMembers />
                </AdminRoute>
              } />

              <Route path="/unit/submit-transfer" element={
                <AdminRoute>
                  <ChangeRequestGuard>
                    <SubmitTransferRequest />
                  </ChangeRequestGuard>
                </AdminRoute>
              } />

              <Route path="/unit/submit-member-info" element={
                <AdminRoute>
                  <ChangeRequestGuard>
                    <SubmitMemberInfoChange />
                  </ChangeRequestGuard>
                </AdminRoute>
              } />

              <Route path="/unit/submit-officials" element={
                <AdminRoute>
                  <ChangeRequestGuard>
                    <SubmitOfficialsChange />
                  </ChangeRequestGuard>
                </AdminRoute>
              } />

              <Route path="/unit/submit-councilor" element={
                <AdminRoute>
                  <ChangeRequestGuard>
                    <SubmitCouncilorChange />
                  </ChangeRequestGuard>
                </AdminRoute>
              } />

              <Route path="/unit/submit-member-add" element={
                <AdminRoute>
                  <ChangeRequestGuard>
                    <SubmitMemberAdd />
                  </ChangeRequestGuard>
                </AdminRoute>
              } />

              <Route path="/unit/update-locations" element={
                <UnitRegistrationGuard>
                  <AdminRoute>
                    <UpdateMemberLocations />
                  </AdminRoute>
                </UnitRegistrationGuard>
              } />

              {/* Kalamela Admin Routes */}
              <Route path="/kalamela/admin/events" element={
                <AdminRoute>
                  <EventsManagement />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/schedules" element={
                <AdminRoute>
                  <ScheduleManagement />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/categories" element={
                <AdminRoute>
                  <CategoryManagement />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/master-data" element={
                <AdminRoute>
                  <MasterData />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/scores" element={
                <AdminRoute>
                  <ViewScores />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/scores/results/:eventType/:eventName" element={
                <AdminRoute>
                  <EventResults />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/scores/individual/:eventId/add" element={
                <AdminRoute>
                  <ScoreIndividualEvent />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/scores/group/:eventId/add" element={
                <AdminRoute>
                  <ScoreGroupEvent />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/scores/individual/:eventId/edit" element={
                <AdminRoute>
                  <ScoreIndividualEvent />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/scores/group/:eventId/edit" element={
                <AdminRoute>
                  <ScoreGroupEvent />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/results" element={
                <AdminRoute>
                  <AdminResults />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/payments" element={
                <AdminRoute>
                  <ManagePayments />
                </AdminRoute>
              } />

              <Route path="/kalamela/admin/appeals" element={
                <AdminRoute>
                  <ManageAppeals />
                </AdminRoute>
              } />

              {/* Kalamela Official Routes */}
              <Route path="/kalamela/official/home" element={
                <AdminRoute>
                  <KalamelaOfficialHome />
                </AdminRoute>
              } />

              <Route path="/kalamela/official/event/individual/:eventId" element={
                <AdminRoute>
                  <SelectIndividualParticipants />
                </AdminRoute>
              } />

              <Route path="/kalamela/official/event/group/:eventId" element={
                <AdminRoute>
                  <SelectGroupParticipants />
                </AdminRoute>
              } />

              <Route path="/kalamela/official/participants" element={
                <AdminRoute>
                  <ViewParticipants />
                </AdminRoute>
              } />

              <Route path="/kalamela/official/preview" element={
                <AdminRoute>
                  <PaymentPreview />
                </AdminRoute>
              } />

              <Route path="/kalamela/official/print" element={
                <AdminRoute>
                  <PrintView />
                </AdminRoute>
              } />

              {/* Kalamela Public Routes */}
              <Route path="/kalamela/results" element={<PublicResults />} />
              <Route path="/kalamela/appeal" element={<SubmitAppeal />} />
              <Route path="/kalamela/top-performers" element={
                <AdminRoute>
                  <TopPerformers />
                </AdminRoute>
              } />

              {/* ==================== YUVALOKHAM ROUTES ==================== */}
              
              {/* Yuvalokham Public */}
              <Route path="/yuvalokham" element={<YuvalokhamPublic />} />
              <Route path="/yuvalokham/login" element={<YuvalokhamLogin />} />
              <Route path="/yuvalokham/register" element={<YuvalokhamRegister />} />

              {/* Yuvalokham User Routes */}
              <Route path="/yuvalokham/user" element={
                <YMAuthGuard requiredRole="user">
                  <YMUserLayout />
                </YMAuthGuard>
              }>
                <Route path="dashboard" element={<YMDashboard />} />
                <Route path="profile" element={<YMProfile />} />
                <Route path="plans" element={<YMPlans />} />
                <Route path="subscriptions" element={<YMSubscriptions />} />
                <Route path="payments" element={<YMPayments />} />
                <Route path="payments/new" element={<YMPaymentNew />} />
                <Route path="magazines" element={<YMMagazinesUser />} />
                <Route path="complaints" element={<YMComplaints />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Yuvalokham Admin Routes */}
              <Route path="/yuvalokham/admin" element={
                <YMAuthGuard requiredRole="admin">
                  <YMAdminLayout />
                </YMAuthGuard>
              }>
                <Route path="dashboard" element={<YMAdminDashboard />} />
                <Route path="users" element={<YMUserManagement />} />
                <Route path="plans" element={<YMPlanManagement />} />
                <Route path="subscriptions" element={<YMSubscriptionManagement />} />
                <Route path="payments" element={<YMPaymentReview />} />
                <Route path="magazines" element={<YMMagazineManagement />} />
                <Route path="complaints" element={<YMComplaintManagement />} />
                <Route path="qr-settings" element={<YMQRSettings />} />
                <Route path="admins/new" element={<YMAdminCreate />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Legacy Routes */}
              <Route path="/admin/events" element={
                <AdminRoute>
                  <ScoreEntry />
                </AdminRoute>
              } />

              {/* Default Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </FaroRoutes>
          </Suspense>
        </Router>
      </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;
