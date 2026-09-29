
import React from 'react';

export enum UserRole {
  ADMIN = 'ADMIN',
  OFFICIAL = 'OFFICIAL',
  PUBLIC = 'PUBLIC'
}

export interface Metric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface Participant {
  id: string;
  chestNumber: string;
  name: string;
  unit: string;
  district: string;
  category: string;
  points: number;
}

export interface EventItem {
  id: string;
  name: string;
  type: 'Individual' | 'Group';
  status: 'Scheduled' | 'Ongoing' | 'Completed';
  registeredCount: number;
  totalSlots: number;
}

export interface ScoreEntry {
  chestNumber: string;
  name: string;
  judge1: number;
  judge2: number;
  judge3: number;
  total: number;
  grade: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

// Service Layer Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export type AsyncStatus = 'idle' | 'pending' | 'success' | 'error';

// --- API types for new backend endpoints ---
export interface AuthUser {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  user_type: string; // role id as string
  unit_name_id?: number;
  clergy_district_id?: number;
  is_active: boolean;
}

export interface UnitName {
  id: number;
  clergy_district_id: number;
  name: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  user_type?: string;
  redirect_url?: string;
}

export interface DashboardCounts {
  users: number;
  units: number;
  members: number;
  individual_participations: number;
  group_participations: number;
  payments: number;
}

export interface ConferenceItem {
  id: number;
  title: string;
  details?: string;
  status: string;
  created_on: string;
}

// Extended Conference Types
export interface Conference {
  id: number;
  title: string;
  description?: string;
  venue?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  registration_fee: number;
  early_bird_fee?: number;
  early_bird_deadline?: string;
  max_delegates?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConferenceCreate {
  title: string;
  description?: string;
  venue?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  registration_fee: number;
  early_bird_fee?: number;
  early_bird_deadline?: string;
  max_delegates?: number;
}

export interface ConferenceUpdate extends Partial<ConferenceCreate> {
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_active?: boolean;
}

export interface ConferenceDelegate {
  id: number;
  conference_id: number;
  unit_id: number;
  unit_name?: string;
  member_id: number;
  member_name: string;
  member_phone?: string;
  member_gender?: string;
  food_preference?: 'veg' | 'non-veg';
  accommodation_required: boolean;
  registration_date: string;
  status: 'registered' | 'confirmed' | 'cancelled';
}

export interface ConferenceDelegateCreate {
  member_id: number;
  food_preference?: 'veg' | 'non-veg';
  accommodation_required?: boolean;
}

export interface ConferencePayment {
  id: number;
  conference_id: number;
  unit_id: number;
  unit_name?: string;
  amount: number;
  payment_reference?: string;
  payment_proof_url?: string;
  status: 'pending' | 'submitted' | 'verified' | 'rejected';
  submitted_at?: string;
  verified_at?: string;
  verified_by?: string;
  remarks?: string;
  created_at: string;
}

export interface ConferencePaymentSubmit {
  amount: number;
  payment_reference?: string;
}

export interface ConferenceFoodPreference {
  member_id: number;
  preference: 'veg' | 'non-veg';
}

export interface ConferenceInfo {
  conference: Conference;
  total_delegates: number;
  total_units: number;
  total_amount_collected: number;
  delegates_by_district: Array<{
    district_id: number;
    district_name: string;
    delegate_count: number;
  }>;
}

export interface ConferencePaymentInfo {
  conference_id: number;
  total_units: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  payments: ConferencePayment[];
}

export interface DistrictOfficial {
  id: number;
  district_id: number;
  district_name?: string;
  user_id: number;
  name: string;
  designation: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
}

export interface DistrictOfficialCreate {
  district_id: number;
  user_id: number;
  name: string;
  designation: string;
  phone?: string;
  email?: string;
}

export interface DistrictOfficialUpdate extends Partial<DistrictOfficialCreate> {
  is_active?: boolean;
}

// ==================== CONFERENCE MODULE TYPES ====================

// Unit Member (used in conference APIs)
export interface ConferenceUnitMember {
  id: number;
  name: string;
  number: string;
  gender: 'M' | 'F';
  dob?: string;
}

// Delegate Official
export interface ConferenceDelegateOfficial {
  id: number;
  name: string;
  phone: string;
}

// Food Preference
export interface ConferenceFoodPref {
  veg_count: number;
  non_veg_count: number;
}

// Payment Record (from API)
export interface ConferencePaymentRecord {
  amount_to_pay: number;
  uploaded_by: string;
  date: string;
  status: 'PENDING' | 'PROOF_UPLOADED' | 'PAID' | 'DECLINED';
  proof_path: string | null;
  payment_reference: string | null;
}

// API response structure for /conference/official/view
export interface ConferenceOfficialViewApi {
  conference: {
    id: number;
    title: string;
    details?: string;
    status: string;
  };
  rem_count: number;      // Remaining slots
  max_count: number;      // Maximum allowed delegates
  allowed_count: number;  // Allowed count for this district
  member_count: number;   // Currently registered delegates
  district: string;       // District name
  unit_members: ConferenceUnitMember[];  // Available members to add as delegates
}

// API response structure for /conference/official/delegates
export interface ConferenceDelegatesResponse {
  delegate_members: ConferenceUnitMember[];
  delegate_officials: ConferenceDelegateOfficial[];
  delegates_count: number;
  max_count: number;
  payment_status: string | null;
  amount_to_pay: number;
  food_preference: ConferenceFoodPref | null;
}

// Transformed structure for frontend use (ConferenceOfficialView)
export interface ConferenceOfficialView {
  conference: {
    id: number;
    title: string;
    details?: string;
    status: string;
    description?: string;
    venue?: string;
    start_date?: string;
    end_date?: string;
    registration_fee?: number;
  };
  unit_delegates: ConferenceDelegate[];
  unit_payment?: ConferencePayment;
  registration_open: boolean;
  available_members: Array<{
    id: number;
    name: string;
    gender: string;
    phone?: string;
  }>;
  // Additional fields from actual API
  rem_count: number;
  max_count: number;
  allowed_count: number;
  member_count: number;
  district: string;
}

// District Info for Admin Conference Info
export interface ConferenceDistrictInfo {
  officials: Array<{ id: number; name: string; phone: string; gender?: string }>;
  members: Array<{ id: number; name: string; phone: string; gender: string }>;
  payments: ConferencePaymentRecord[];
  count_of_officials: number;
  count_of_members: number;
  count_of_male_members: number;
  count_of_female_members: number;
  count_of_male_officials: number;
  count_of_female_officials: number;
  count_of_total_male: number;
  count_of_total_female: number;
  total_count: number;
  veg_count: number;
  non_veg_count: number;
}

// Admin Conference Info Response
export interface ConferenceAdminInfoResponse {
  conference_id: number;
  district_info: Record<string, ConferenceDistrictInfo>;
}

// Admin Conference Payment Info Response
export interface ConferenceAdminPaymentInfoResponse {
  conference_id: number;
  district_info: Record<string, {
    officials: Array<{ id: number; name: string; phone: string }>;
    members: Array<{ id: number; name: string; phone: string }>;
    payments: ConferencePaymentRecord[];
    count_of_officials: number;
    count_of_members: number;
  }>;
}

// Admin District Official (from /api/admin/conference/officials)
export interface ConferenceAdminDistrictOfficial {
  id: number;
  name: string;
  phone: string;
  district: string | null;
  conference_id: number | null;
  conference_official_count: number;
  conference_member_count: number;
}

// Public Conference (from /api/conference/public/list)
export interface ConferencePublic {
  id: number;
  title: string;
  details: string;
  added_on: string;
  status: 'Active' | 'Inactive' | 'Completed';
}

// Food Preference Submit Request
export interface ConferenceFoodPreferenceSubmit {
  conference_id: number;
  veg_count: number;
  non_veg_count: number;
}

// Food Preference Response
export interface ConferenceFoodPreferenceResponse {
  id: number;
  conference_id: number;
  veg_count: number;
  non_veg_count: number;
  uploaded_by_id: number;
  created_at: string;
  updated_at: string;
}

// Export Data Response
export interface ConferenceExportDataResponse {
  message: string;
  district: string;
  data: {
    officials: Array<{ id: number; name: string; phone: string; gender?: string }>;
    members: Array<{ id: number; name: string; phone: string; gender: string }>;
    payments: ConferencePaymentRecord[];
    count_of_officials: number;
    count_of_members: number;
    count_of_male_members: number;
    count_of_female_members: number;
    veg_count: number;
    non_veg_count: number;
  };
}

export type PaymentStatus = 'Pending' | 'Proof Uploaded' | 'Paid' | 'Declined';

export interface PaymentRecord {
  id: number;
  conference_id: number;
  amount_to_pay: number;
  status: PaymentStatus | string;
  proof_path?: string;
  date: string;
}

// --- Unit Admin Types ---

export interface ClergyDistrict {
  id: number;
  name: string;
}

export interface District {
  id: number;
  name: string;
  clergyDistrict: string;
}

export interface Unit {
  id: number;
  unitNumber: string;
  name: string;
  clergyDistrict: string;
  registrationYear: number;
  status: 'Completed' | 'In Progress' | 'Not Started' | 'Awaiting Completion';
  cycleStatus?: string | null;
  userId: number;
  paymentStatus?: 'not_submitted' | 'pending' | 'approved' | 'rejected' | 'partial';
  paymentFullyApproved?: boolean;
  canCompleteRegistration?: boolean;
  pathType?: 'fresh' | 'renewal' | null;
  membersCount: number;
  officialsCount: number;
  councilorsCount: number;
}

export interface AdminUnitFullDetail {
  unit: Unit;
  official: UnitOfficial | null;
  councilors: UnitCouncilor[];
  members: UnitMember[];
  unitRegistrationFee: number;
  unitMemberFee: number;
  totalAmount: number;
}

export interface MasterListUnit {
  id: number;
  name: string;
  clergyDistrict: string;
  clergyDistrictId: number;
}

export type ResidenceLocation = 'WITHIN_KERALA' | 'OUTSIDE_KERALA' | 'OUTSIDE_INDIA';

export const RESIDENCE_LOCATION_OPTIONS: { value: ResidenceLocation; label: string }[] = [
  { value: 'WITHIN_KERALA', label: 'Within Kerala' },
  { value: 'OUTSIDE_KERALA', label: 'Outside Kerala (India)' },
  { value: 'OUTSIDE_INDIA', label: 'Outside India' },
];

export const getResidenceLocationLabel = (
  value?: ResidenceLocation | string | null,
  country?: string | null,
  state?: string | null,
  city?: string | null,
): string => {
  if (!value) return 'Not set';
  if (value === 'WITHIN_KERALA') {
    if (state && country) return `${state}, ${country}`;
    return 'Lives in Kerala';
  }
  if (state && country) {
    if (city) return `${city}, ${state}, ${country}`;
    return `${state}, ${country}`;
  }
  const option = RESIDENCE_LOCATION_OPTIONS.find((item) => item.value === value);
  return option?.label ?? 'Not set';
};

export interface UnitMember {
  id: number;
  name: string;
  gender: 'M' | 'F' | 'Male' | 'Female';
  number: string;
  dob: string;
  age: number;
  qualification?: string;
  bloodGroup?: string;
  residenceLocation?: ResidenceLocation;
  residenceStateId?: number;
  residenceCityId?: number;
  residenceStateName?: string;
  residenceCityName?: string;
  residenceCountryName?: string;
  residenceCountryId?: number;
  unitId: number;
  unitName: string;
  districtName?: string;
  isArchived: boolean;
}

export interface UnitOfficial {
  id: number;
  unitId: number;
  unitName: string;
  presidentDesignation?: string;
  presidentName: string;
  presidentPhone: string;
  vicePresidentName: string;
  vicePresidentPhone: string;
  secretaryName: string;
  secretaryPhone: string;
  jointSecretaryName: string;
  jointSecretaryPhone: string;
  treasurerName: string;
  treasurerPhone: string;
}

export interface UnitCouncilor {
  id: number;
  unitId: number;
  unitName: string;
  memberId: number;
  memberName: string;
  memberPhone: string;
  memberGender: string;
  memberDob: string;
  memberQualification?: string;
}

// --- Unit Registration Wizard Types ---

export type UnitRegistrationStatus =
  | 'Not Started'
  | 'Registration Started'
  | 'Unit Details'
  | 'Unit Members Completed'
  | 'Unit Officials Completed'
  | 'Unit Councilors Completed'
  | 'Declaration Submitted'
  | 'Registration Completed';

export interface UnitRegistrationMember {
  id: number;
  registered_user_id: number;
  name: string;
  gender?: string;
  dob?: string;
  number?: string;
  qualification?: string;
  blood_group?: string;
  added_registration_cycle_id?: number | null;
  residence_location?: ResidenceLocation;
  residence_state_id?: number | null;
  residence_city_id?: number | null;
  residence_state_name?: string | null;
  residence_city_name?: string | null;
  residence_country_name?: string | null;
  residence_country_id?: number | null;
}

export interface MasterCountry {
  id: number;
  name: string;
  iso_code?: string | null;
}

export interface MasterState {
  id: number;
  country_id: number;
  name: string;
}

export interface MasterStateSummary {
  id: number;
  country_id: number;
  name: string;
  city_count: number;
  city_required: boolean;
}

export interface MasterCity {
  id: number;
  country_id: number;
  state_id?: number | null;
  name: string;
}

export interface UnitRegistrationOfficial {
  id?: number;
  registered_user_id?: number;
  president_designation?: string;
  president_name?: string;
  president_phone?: string;
  vice_president_name?: string;
  vice_president_phone?: string;
  secretary_name?: string;
  secretary_phone?: string;
  joint_secretary_name?: string;
  joint_secretary_phone?: string;
  treasurer_name?: string;
  treasurer_phone?: string;
}

export interface UnitRegistrationCouncilor {
  id: number;
  registered_user_id: number;
  unit_member_id: number;
}

export interface UnitApplicationForm {
  user_data: {
    id: number;
    username: string;
    email: string;
    unit_name: string | null;
    clergy_district_name?: string | null;
  };
  registration_status: UnitRegistrationStatus;
  registration_year: number;
  path_type: 'fresh' | 'renewal';
  is_renewal: boolean;
  cycle_id: number | null;
  registration_enabled: boolean;
  has_any_completed_cycle: boolean;
  unit_details: { id: number; registered_user_id: number; registration_year?: number; number_of_unit_members?: number } | null;
  unit_officials: UnitRegistrationOfficial | null;
  unit_members: UnitRegistrationMember[];
  unit_councilors: UnitRegistrationCouncilor[];
  member_count: number;
  councilor_count: number;
  number_of_councilor_fields: number;
  unit_registration_fee: number;
  unit_member_fee: number;
  members_amount: number;
  total_amount: number;
}

export interface UnitFinishRegistration {
  unit_details: UnitApplicationForm['unit_details'];
  unit_officials: UnitRegistrationOfficial | null;
  unit_members: UnitRegistrationMember[];
  unit_councilors: UnitRegistrationCouncilor[];
  councilors_count: number;
  members_count: number;
  unit_registration_fee: number;
  unit_member_fee: number;
  members_amount: number;
  total_amount: number;
}

export interface UnitDetailsPayload {
  president_designation: string;
  president_name: string;
  president_phone: string;
}

export interface UnitMemberPayload {
  name: string;
  gender?: string;
  dob?: string;
  number?: string;
  qualification?: string;
  blood_group?: string;
  residence_location?: ResidenceLocation;
  residence_state_id?: number | null;
  residence_city_id?: number | null;
}

export interface UnitOfficialPayload {
  position: 'President' | 'Vice President' | 'Secretary' | 'Joint Secretary' | 'Treasurer';
  name: string;
  phone: string;
  designation?: string;
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PaymentProofStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UnitPaymentSubmission {
  id: number;
  file_url: string | null;
  total_amount: number | null;
  balance_amount: number | null;
  approved_paid_amount?: number | null;
  detected_paid_amount?: number | null;
  status: PaymentProofStatus;
  rejection_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface UnitPaymentStatusResponse {
  overall_status: 'not_submitted' | 'pending' | 'partial' | 'approved' | 'rejected';
  balance_amount: number | null;
  registration_total_amount?: number | null;
  registration_member_count?: number | null;
  total_paid?: number;
  payment_credit?: number;
  balance_due?: number;
  latest_rejection_note: string | null;
  qr_url: string | null;
  registration_year: number;
  submissions: UnitPaymentSubmission[];
}

export interface AdminRegistrationPayment {
  id: number;
  registered_user_id: number;
  username: string;
  unit_name: string | null;
  registration_year: number | null;
  file_url: string | null;
  total_amount: number | null;
  balance_amount: number | null;
  registration_total_amount?: number | null;
  registration_member_count?: number | null;
  total_paid?: number | null;
  payment_credit?: number | null;
  balance_due?: number | null;
  approved_paid_amount?: number | null;
  detected_paid_amount?: number | null;
  status: PaymentProofStatus;
  rejection_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface RemovalPaymentImpactPreview {
  registered_user_id: number;
  username: string;
  unit_name: string | null;
  applies: boolean;
  reason?: string;
  members_to_remove?: number;
  member_fee?: number;
  fee_change?: number;
  delta_members?: number;
  current?: {
    member_count: number;
    fee_owed: number;
    total_paid: number;
    balance_due: number;
    payment_credit: number;
    is_fully_paid: boolean;
  };
  projected?: {
    member_count: number;
    fee_owed: number;
    total_paid: number;
    balance_due: number;
    payment_credit: number;
    is_fully_paid: boolean;
  };
}

export interface ApproveRegistrationPaymentResponse {
  message: string;
  id: number;
  paid_amount: number;
  balance_amount: number;
}

export interface TransferDestinationUnit {
  id: number;
  name: string;
  clergyDistrict: string;
  unitNumber: string;
}

export interface TransferRequest {
  id: number;
  createdAt: string;
  memberId: number;
  memberName: string;
  currentUnitId: number;
  currentUnitName: string;
  destinationUnitId: number;
  destinationUnitName: string;
  reason: string;
  status: RequestStatus;
  proof?: string;
}

export interface MemberInfoChangeRequest {
  id: number;
  createdAt: string;
  memberId: number;
  memberName: string;
  unitName: string;
  changes: {
    name?: string;
    gender?: string;
    dob?: string;
    bloodGroup?: string;
    qualification?: string;
    number?: string;
    residenceLocation?: ResidenceLocation;
    residenceStateId?: number | null;
    residenceCityId?: number | null;
  };
  reason: string;
  status: RequestStatus;
  proof?: string;
}

export interface OfficialsChangeRequest {
  id: number;
  createdAt: string;
  unitId: number;
  unitName: string;
  originalOfficials: {
    presidentDesignation?: string;
    presidentName: string;
    presidentPhone: string;
    vicePresidentName: string;
    vicePresidentPhone: string;
    secretaryName: string;
    secretaryPhone: string;
    jointSecretaryName: string;
    jointSecretaryPhone: string;
    treasurerName: string;
    treasurerPhone: string;
  };
  requestedChanges: {
    presidentDesignation?: string;
    presidentName?: string;
    presidentPhone?: string;
    vicePresidentName?: string;
    vicePresidentPhone?: string;
    secretaryName?: string;
    secretaryPhone?: string;
    jointSecretaryName?: string;
    jointSecretaryPhone?: string;
    treasurerName?: string;
    treasurerPhone?: string;
  };
  reason: string;
  status: RequestStatus;
  proof?: string;
}

export interface CouncilorChangeRequest {
  id: number;
  createdAt: string;
  unitId: number;
  unitName: string;
  councilorId: number;
  originalMemberId: number;
  originalMemberName: string;
  newMemberId?: number;
  newMemberName?: string;
  reason: string;
  status: RequestStatus;
  proof?: string;
}

export interface MemberAddRequest {
  id: number;
  createdAt: string;
  unitId: number;
  unitName: string;
  username?: string;
  name: string;
  gender: 'M' | 'F';
  number: string;
  dob: string;
  qualification?: string;
  bloodGroup?: string;
  reason: string;
  status: RequestStatus;
  proof?: string;
  residenceLocation?: ResidenceLocation;
  residenceStateId?: number | null;
  residenceCityId?: number | null;
  residenceStateName?: string | null;
  residenceCityName?: string | null;
  residenceCountryName?: string | null;
}

export interface ArchivedMemberConcernRequest {
  id: number;
  createdAt: string;
  archivedMemberId: number;
  archivedMemberName: string;
  archiveYear?: string;
  unitName: string;
  concernText: string;
  adminResponse?: string;
  status: RequestStatus;
}

export interface ArchivedMemberConcernSubmission {
  archivedUnitMemberId: number;
  concernText: string;
}

export interface RecentArchivedMembersSummary {
  total: number;
  male: number;
  female: number;
}

export interface RecentArchivedMember {
  id: number;
  registered_user_id: number;
  name: string;
  gender?: string;
  dob: string;
  number: string;
  qualification?: string;
  blood_group?: string;
  archived_at: string;
  archive_year?: string;
  archive_reason?: string;
}

export interface ArchivedMemberConcernStatus {
  status: RequestStatus;
  admin_response?: string | null;
}

export interface RecentArchivedMembersResponse {
  archive_year: string | null;
  archive_reason: string | null;
  summary: RecentArchivedMembersSummary;
  members: RecentArchivedMember[];
  pending_concern_member_ids: number[];
  member_concerns: Record<string, ArchivedMemberConcernStatus>;
}

export interface RemovedUnitMember {
  id: number;
  registered_user_id: number;
  name: string;
  gender?: string;
  dob: string;
  number: string;
  qualification?: string;
  blood_group?: string;
  archived_at: string;
  delete_reason?: string;
  deleted_by_id?: number;
  original_member_id?: number;
  notified_at?: string | null;
  removal_type?: string;
  removed_at?: string;
}

export interface PendingRemovedMembersResponse {
  summary: RecentArchivedMembersSummary;
  members: RemovedUnitMember[];
}

export interface WizardReturnState {
  returnTo?: string;
  returnLabel?: string;
  wizardStep?: number;
}

export interface ChangeRequestMemberSnapshot {
  id: number;
  name: string;
  gender?: string;
  number?: string;
  dob?: string;
  qualification?: string;
  blood_group?: string;
  residence_location?: ResidenceLocation;
  residence_state_id?: number | null;
  residence_city_id?: number | null;
  residence_state_name?: string | null;
  residence_city_name?: string | null;
  residence_country_name?: string | null;
}

export interface ChangeRequestNavigationState {
  memberId?: number;
  councilorId?: number;
  fromWizard?: boolean;
  memberSnapshot?: ChangeRequestMemberSnapshot;
}

export interface UnitStats {
  totalDistricts: number;
  completedDistricts: number;
  totalUnits: number;
  registeredUnits: number;
  completedUnits: number;
  inProgressUnits: number;
  notStartedUnits: number;
  notOnboardedUnits: number;
  pendingApprovalUnits: number;
  currentRegistrationYear: number;
  pendingPayments: number;
  totalMembers: number;
  totalMembersRegCompleted: number;
  maleMembers: number;
  femaleMembers: number;
  pendingRequests: number;
  maxMemberUnit: string;
  maxMemberCount: number;
}

export interface DistrictWiseData {
  name: string;
  participants: number;
}

export interface DistrictDetailStats {
  id: number;
  name: string;
  totalUnits: number;
  registeredUnits: number;
  completedUnits: number;
  inProgressUnits: number;
  pendingApprovalUnits: number;
  notStartedUnits: number;
  notOnboardedUnits: number;
  pendingPayments: number;
  totalMembers: number;
  maleMembers: number;
  femaleMembers: number;
  regCompletedMembers: number;
  regCompletedMaleMembers: number;
  regCompletedFemaleMembers: number;
  maxMemberUnit: string;
  maxMemberCount: number;
}

export interface ChartData {
  name: string;
  participants: number;
}

// Archived Members
export interface ArchivedMember extends UnitMember {
  archivedAt: string;
  archivedBy: string;
  archiveReason?: string;
  archiveYear?: string;
}

// Archive preview (active member eligible for yearly archiving)
export interface ArchivePreviewMember {
  id: number;
  name: string;
  gender: string | null;
  dob: string;
  age: number;
  number: string;
  qualification: string | null;
  blood_group: string | null;
  unit_name: string | null;
  registered_user_id: number;
}

// Request Actions & History
export interface RequestAction {
  id: number;
  requestId: number;
  requestType: string;
  action: 'APPROVED' | 'REJECTED' | 'REVERTED';
  performedBy: string;
  performedAt: string;
  remarks?: string;
}

export interface RequestRemark {
  id: number;
  requestId: number;
  requestType: string;
  author: string;
  message: string;
  createdAt: string;
}

// User Request Submissions (Form Data)
export interface TransferRequestSubmission {
  memberId: number;
  destinationUnitId: number;
  reason: string;
  proof: File;
}

export interface MemberInfoChangeSubmission {
  memberId: number;
  changes: {
    name?: string;
    gender?: string;
    dob?: string;
    bloodGroup?: string;
    qualification?: string;
    number?: string;
    residenceLocation?: ResidenceLocation;
    residenceStateId?: number | null;
    residenceCityId?: number | null;
  };
  reason: string;
  proof?: File;
}

export interface OfficialsChangeSubmission {
  unitOfficialId: number;
  changes: {
    presidentDesignation?: string;
    presidentName?: string;
    presidentPhone?: string;
    vicePresidentName?: string;
    vicePresidentPhone?: string;
    secretaryName?: string;
    secretaryPhone?: string;
    jointSecretaryName?: string;
    jointSecretaryPhone?: string;
    treasurerName?: string;
    treasurerPhone?: string;
  };
  reason: string;
  proof?: File;
}

export interface CouncilorChangeSubmission {
  councilorId: number;
  newMemberId: number;
  reason: string;
  proof?: File;
}

export interface MemberAddSubmission {
  name: string;
  gender: 'M' | 'F';
  number: string;
  dob: string;
  qualification?: string;
  bloodGroup?: string;
  reason: string;
  proof?: File;
  residence_location: ResidenceLocation;
  residence_state_id?: number | null;
  residence_city_id?: number | null;
}

// ==================== KALAMELA TYPES ====================

// Kalamela Category Master
export interface KalamelaCategory {
  id: number;
  name: string;
  description: string | null;
  created_on: string;
  updated_on: string;
}

export interface KalamelaCategoryCreate {
  name: string;
  description?: string;
}

export interface KalamelaCategoryUpdate {
  name?: string;
  description?: string;
}

// Kalamela Registration Fees
export type EventType = 'individual' | 'group';

export interface RegistrationFee {
  id: number;
  name: string;
  event_type: EventType;
  amount: number;
  created_by_id: number | null;
  updated_by_id: number | null;
  created_on: string;
  updated_on: string;
}

export interface RegistrationFeeCreate {
  name: string;
  event_type: EventType;
  amount: number;
}

export interface RegistrationFeeUpdate {
  name?: string;
  event_type?: EventType;
  amount?: number;
}

// Kalamela Events
export type GenderRestriction = 'Male' | 'Female' | null;
export type SeniorityRestriction = 'Junior' | 'Senior' | null;

export interface IndividualEvent {
  id: number;
  name: string;
  description: string | null;
  category_id?: number | null;
  category_name?: string | null;
  is_active: boolean;
  is_mandatory: boolean;
  gender_restriction: GenderRestriction;
  seniority_restriction: SeniorityRestriction;
  registration_fee_id?: number | null;
  registration_fee_amount?: number | null;
  created_on: string;
}

export interface IndividualEventCreate {
  name: string;
  category_id?: number;
  description?: string;
  is_active?: boolean;
  is_mandatory?: boolean;
  gender_restriction?: GenderRestriction;
  seniority_restriction?: SeniorityRestriction;
}

export interface IndividualEventUpdate {
  name?: string;
  category_id?: number;
  description?: string;
  is_active?: boolean;
  is_mandatory?: boolean;
  gender_restriction?: GenderRestriction;
  seniority_restriction?: SeniorityRestriction;
}

export interface GroupEvent {
  id: number;
  name: string;
  description: string | null;
  category_id?: number | null;
  category_name?: string | null;
  min_allowed_limit: number;
  max_allowed_limit: number;
  per_unit_allowed_limit: number;
  is_active: boolean;
  is_mandatory: boolean;
  gender_restriction: GenderRestriction;
  seniority_restriction: SeniorityRestriction;
  registration_fee_id?: number | null;
  registration_fee_amount?: number | null;
  created_on: string;
  // Registration status fields (from official home API)
  participation_count?: number;
  remaining_slots?: number;
  is_registration_complete?: boolean;
}

export interface GroupEventCreate {
  name: string;
  description?: string;
  category_id?: number;
  max_allowed_limit?: number;
  min_allowed_limit?: number;
  per_unit_allowed_limit?: number;
  is_active?: boolean;
  is_mandatory?: boolean;
  gender_restriction?: GenderRestriction;
  seniority_restriction?: SeniorityRestriction;
}

export interface GroupEventUpdate {
  name?: string;
  description?: string;
  category_id?: number;
  max_allowed_limit?: number;
  min_allowed_limit?: number;
  per_unit_allowed_limit?: number;
  is_active?: boolean;
  is_mandatory?: boolean;
  gender_restriction?: GenderRestriction;
  seniority_restriction?: SeniorityRestriction;
}

// Kalamela Event Schedules
export type ScheduleStatus = 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Postponed';

export interface EventSchedule {
  id: number;
  event_id: number;
  event_type: 'individual' | 'group';
  stage_name: string;
  start_time: string;
  end_time: string;
  status: ScheduleStatus;
  created_on: string;
  updated_on: string;
  created_by_id: number;
  event_name: string;
}

// Extend IndividualEvent and GroupEvent to include schedules
export interface IndividualEventWithSchedules extends IndividualEvent {
  schedules?: EventSchedule[];
}

export interface GroupEventWithSchedules extends GroupEvent {
  schedules?: EventSchedule[];
}

export interface EventsWithSchedulesResponse {
  individual_events: IndividualEventWithSchedules[];
  group_events: GroupEventWithSchedules[];
}

// Kalamela Participants
export interface EventParticipant {
  id: number;
  eventId: number;
  eventName: string;
  eventType: 'INDIVIDUAL' | 'GROUP';
  memberId: number;
  memberName: string;
  unitId: number;
  unitName: string;
  districtId: number;
  districtName: string;
  memberPhone: string;
  chestNumber: string;
  registeredAt: string;
}

export interface GroupEventTeam {
  id: number;
  eventId: number;
  eventName: string;
  chestNumber: string; // Same for all team members
  teamMembers: EventParticipant[];
  unitId: number;
  unitName: string;
  districtId: number;
  districtName: string;
  registeredAt: string;
}

// Kalamela Scoring
export type EventGrade = 'A' | 'B' | 'C' | 'No Grade';

export interface EventScore {
  id: number;
  eventParticipationId: number;
  eventId: number;
  eventName: string;
  eventType: 'INDIVIDUAL' | 'GROUP';
  chestNumber: string;
  participantName?: string; // For individual events
  awardedMarks: number; // 0-100
  grade: EventGrade;
  positionPoints: number;
  gradePoints: number; // Only for individual events
  totalPoints: number;
  position?: number; // 1st, 2nd, 3rd, etc.
  createdAt: string;
  updatedAt: string;
}

export interface ScoreSubmission {
  eventParticipationId: number;
  chestNumber: string;
  participantName?: string;
  awardedMarks: number;
}

// Kalamela Payments
export type PaymentStatus = 'PENDING' | 'PAID' | 'INVALID';

export interface KalamelaPayment {
  id: number;
  districtId: number;
  districtName: string;
  individualEventsCount: number;
  groupEventsCount: number;
  totalAmountToPay: number;
  paymentProof?: string; // Image URL
  paymentStatus: PaymentStatus;
  paidBy: string; // User/Official name
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

// Kalamela Appeals
export type AppealStatus = 'PENDING' | 'RESOLVED';

export interface ScoreAppeal {
  id: number;
  eventParticipationId: number;
  chestNumber: string;
  participantName: string;
  eventName: string;
  statement: string;
  reply?: string;
  status: AppealStatus;
  addedBy: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// Kalamela Exclusions
export interface ExcludedMember {
  id: number;
  memberId: number;
  memberName: string;
  unitId: number;
  unitName: string;
  districtId: number;
  districtName: string;
  reason: string;
  excludedBy: string;
  excludedAt: string;
}

// Kalamela Results/Stats
export interface EventResultEntry {
  position: number;
  chestNumber: string;
  participantName?: string;
  unitName: string;
  districtName: string;
  awardedMarks: number;
  grade: EventGrade;
  totalPoints: number;
}

export interface EventResults {
  eventId: number;
  eventName: string;
  eventType: 'INDIVIDUAL' | 'GROUP';
  results: EventResultEntry[];
}

export interface DistrictPerformance {
  districtId: number;
  districtName: string;
  totalParticipants: number;
  totalPoints: number;
  goldMedals: number; // Grade A
  silverMedals: number; // Grade B
  bronzeMedals: number; // Grade C
  topPerformers: EventResultEntry[];
}

export interface UnitPerformance {
  unitId: number;
  unitName: string;
  districtName: string;
  totalParticipants: number;
  totalPoints: number;
  topPerformers: EventResultEntry[];
}

export interface TopPerformer {
  memberId: number;
  memberName: string;
  unitName: string;
  districtName: string;
  totalPoints: number;
  eventsParticipated: number;
  grades: {
    A: number;
    B: number;
    C: number;
  };
}

// Kalamela Dashboard Stats
export interface KalamelaDashboardStats {
  totalIndividualEvents: number;
  totalGroupEvents: number;
  totalParticipants: number;
  totalIndividualParticipants: number;
  totalGroupParticipants: number;
  totalScoresEntered: number;
  pendingScores: number;
  totalPayments: number;
  pendingPayments: number;
  totalAppeals: number;
  pendingAppeals: number;
  topDistricts: DistrictPerformance[];
  recentRegistrations: EventParticipant[];
}

// ============================================
// Site Settings Types
// ============================================

export interface ContactInfo {
  address: string | null;
  email: string | null;
  phone: string | null;
}

export interface SocialLinks {
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
}

export interface QuickLinkPreview {
  id: number;
  label: string;
  url: string;
  enabled: boolean;
}

export interface SiteSettings {
  id: number;
  app_name: string;
  app_subtitle: string | null;
  about_text: string | null;
  logo_primary_url: string | null;
  logo_secondary_url: string | null;
  logo_tertiary_url: string | null;
  payment_qr_url: string | null;
  registration_enabled: boolean;
  registration_closed_message: string | null;
  current_registration_year: number | null;
  member_min_dob: string | null;
  member_max_dob: string | null;
  blood_donor_district_access: boolean;
  blood_donor_unit_access: boolean;
  unit_registration_fee: number;
  unit_member_fee: number;
  contact: ContactInfo;
  social_links: SocialLinks;
  updated_at: string;
  quick_links: QuickLinkPreview[];
}

export interface SiteSettingsUpdate {
  app_name?: string;
  app_subtitle?: string;
  about_text?: string;
  registration_enabled?: boolean;
  registration_closed_message?: string;
  current_registration_year?: number;
  member_min_dob?: string | null;
  member_max_dob?: string | null;
  blood_donor_district_access?: boolean;
  blood_donor_unit_access?: boolean;
  unit_registration_fee?: number;
  unit_member_fee?: number;
  contact?: Partial<ContactInfo>;
  social_links?: Partial<SocialLinks>;
}

export interface BloodDonorResult {
  id: number;
  name: string;
  gender: string | null;
  dob: string | null;
  blood_group: string | null;
  number: string;
  qualification: string | null;
  unit_name: string | null;
  district_name: string | null;
  status: 'active' | 'archived';
  archive_year: string | null;
}

export interface LogoUploadResponse {
  logo_type: string;
  url: string;
  filename: string;
}

// Notice Types
export interface Notice {
  id: number;
  text: string;
  priority: 'high' | 'normal' | 'low';
  is_active: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoticeCreate {
  text: string;
  priority?: 'high' | 'normal' | 'low';
  is_active?: boolean;
  display_order?: number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface NoticeUpdate {
  text?: string;
  priority?: 'high' | 'normal' | 'low';
  is_active?: boolean;
  display_order?: number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface NoticeReorderItem {
  id: number;
  display_order: number;
}

// Quick Link Types
export interface QuickLink {
  id: number;
  label: string;
  url: string;
  enabled: boolean;
  display_order: number;
  created_at: string;
}

export interface QuickLinkCreate {
  label: string;
  url: string;
  enabled?: boolean;
  display_order?: number;
}

export interface QuickLinkUpdate {
  label?: string;
  url?: string;
  enabled?: boolean;
  display_order?: number;
}

// ==================== KALAMELA RULES TYPES ====================

export interface KalamelaRulesGrouped {
  age_restrictions: {
    senior_dob_start: string;
    senior_dob_end: string;
    junior_dob_start: string;
    junior_dob_end: string;
  };
  participation_limits: {
    max_individual_events_per_person: string;
    max_participants_per_unit_per_event: string;
    max_groups_per_unit_per_group_event: string;
  };
  fees: {
    individual_event_fee: string;
    group_event_fee: string;
    appeal_fee: string;
  };
}

export interface KalamelaRule {
  id: number;
  rule_key: string;
  rule_category: 'age_restriction' | 'participation_limit' | 'fee';
  rule_value: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  created_on: string;
  updated_on: string;
  updated_by_id: number | null;
}

export interface KalamelaRuleCreate {
  rule_key: string;
  rule_category: 'age_restriction' | 'participation_limit' | 'fee';
  rule_value: string;
  display_name: string;
  description?: string;
  is_active?: boolean;
}

export interface KalamelaRuleUpdate {
  rule_value?: string;
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

// ==================== DISTRICT MEMBERS TYPES ====================

export interface DistrictMember {
  id: number;
  name: string;
  phone_number: string;
  dob: string;
  age: number;
  gender: string;
  unit_id: number;
  unit_name: string;
  participation_category: 'Junior' | 'Senior' | 'Ineligible';
  is_excluded: boolean;
  is_registered?: boolean;
  registered_events_count?: number;
}

export interface DistrictMembersResponse {
  members: DistrictMember[];
  total_count: number;
  summary: {
    junior_count: number;
    senior_count: number;
    ineligible_count: number;
    excluded_count: number;
  };
  units: Array<{ id: number; name: string }>;
  filters_applied: {
    unit_id: number | null;
    participation_category: string | null;
    search: string | null;
  };
  age_restrictions: {
    junior_dob_start: string;
    junior_dob_end: string;
    senior_dob_start: string;
    senior_dob_end: string;
  };
}

// ==================== YUVALOKHAM TYPES ====================

export type YuvalokhamUserRole = "admin" | "user";
export type YMSubscriptionStatus = "active" | "expired" | "pending_payment";
export type YMPaymentStatus = "pending" | "approved" | "rejected";
export type YMMagazineStatus = "draft" | "published";
export type YMComplaintCategory = "delivery_issue" | "payment_dispute" | "content_issue" | "subscription_problem" | "other";
export type YMComplaintStatus = "open" | "resolved" | "closed";

export interface YMPaginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface YMUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: YuvalokhamUserRole;
  address: string | null;
  pincode: string | null;
  district_id: number | null;
  district_name: string | null;
  unit_id: number | null;
  unit_name: string | null;
  parish_name: string | null;
  is_csi_member: boolean;
  is_active: boolean;
  created_at: string;
}

export interface YMPlan {
  id: number;
  name: string;
  duration_months: number;
  price: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface YMSubscription {
  id: number;
  user_id: number;
  plan_id: number;
  plan_name_snapshot: string;
  plan_price_snapshot: string;
  plan_duration_snapshot: number;
  start_date: string | null;
  end_date: string | null;
  status: YMSubscriptionStatus;
  created_at: string;
}

export interface YMPayment {
  id: number;
  user_id: number;
  subscription_id: number;
  amount: string;
  proof_file_url: string;
  status: YMPaymentStatus;
  admin_remarks: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface YMMagazine {
  id: number;
  title: string;
  issue_number: string | null;
  volume: string | null;
  cover_image_url: string | null;
  pdf_file_url: string | null;
  description: string | null;
  published_date: string | null;
  status: YMMagazineStatus;
  created_at: string;
}

export interface YMComplaint {
  id: number;
  user_id: number;
  category: YMComplaintCategory;
  subject: string;
  description: string;
  status: YMComplaintStatus;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
}

export interface YMQrSetting {
  id: number;
  qr_image_url: string | null;
  description: string | null;
  is_active: boolean;
  updated_at: string | null;
}

export interface YMToken {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  role: YuvalokhamUserRole;
}

export interface YMAnalyticsSummary {
  total_users: number;
  active_subscriptions: number;
  total_revenue: string;
  pending_payments: number;
  open_complaints: number;
}

export interface YMAnalyticsTrend {
  month: string;
  new_users: number;
  new_subscriptions: number;
  revenue: string;
  complaints: number;
}

export interface YMAnalyticsBreakdowns {
  by_district: Array<{ district_id: number; count: number }>;
  plan_popularity: Array<{ plan: string; count: number }>;
  complaint_categories: Array<{ category: string; count: number }>;
  renewal_rate: number;
}

export interface YMExpiringSubscription {
  subscription_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  plan_name: string;
  end_date: string;
  days_remaining: number;
}

// Form types
export interface YMRegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  address?: string;
  pincode?: string;
  district_id?: number;
  unit_id?: number;
  parish_name?: string;
  is_csi_member?: boolean;
}

export interface YMLoginForm {
  email: string;
  password: string;
}

export interface YMProfileUpdateForm {
  name?: string;
  phone?: string;
  address?: string;
  pincode?: string;
  district_id?: number;
  unit_id?: number;
  parish_name?: string;
  is_csi_member?: boolean;
}

export interface YMComplaintForm {
  category: YMComplaintCategory;
  subject: string;
  description: string;
}

export interface YMPlanForm {
  name: string;
  duration_months: number;
  price: number;
  description?: string;
}

export interface YMMagazineForm {
  title: string;
  issue_number?: string;
  volume?: string;
  description?: string;
}

export interface YMAdminCreateForm {
  name: string;
  email: string;
  phone: string;
  password: string;
}
