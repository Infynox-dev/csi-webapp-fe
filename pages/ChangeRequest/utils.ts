export { mapRegistrationCouncilors, mapRegistrationMemberToUnitMember } from '../../utils/unitMembers';

export const CHANGE_REQUEST_STEPS = [
  { id: 1, label: 'Request Type', shortLabel: 'Request' },
  { id: 2, label: 'Select Member', shortLabel: 'Member' },
  { id: 3, label: 'Submit Request', shortLabel: 'Submit' },
] as const;

export type ChangeRequestStepId = (typeof CHANGE_REQUEST_STEPS)[number]['id'];

export type ChangeRequestTypeId =
  | 'member-info'
  | 'transfer'
  | 'councilor'
  | 'officials'
  | 'member-add';

export interface ChangeRequestTypeOption {
  id: ChangeRequestTypeId;
  title: string;
  description: string;
  path: string;
  memberSpecific: boolean;
}

export const MEMBER_REQUEST_TYPES: ChangeRequestTypeOption[] = [
  {
    id: 'member-info',
    title: 'Member Info Change',
    description: 'Update name, gender, date of birth, blood group, mobile number, or qualification',
    path: '/unit/submit-member-info',
    memberSpecific: true,
  },
  {
    id: 'transfer',
    title: 'Unit Transfer',
    description: 'Transfer this member to another unit',
    path: '/unit/submit-transfer',
    memberSpecific: true,
  },
  {
    id: 'councilor',
    title: 'Councilor Change',
    description: 'Replace this councilor with another unit member',
    path: '/unit/submit-councilor',
    memberSpecific: true,
  },
];

export const UNIT_REQUEST_TYPES: ChangeRequestTypeOption[] = [
  {
    id: 'officials',
    title: 'Officials Change',
    description: 'Update unit president, secretary, treasurer, and other officials',
    path: '/unit/submit-officials',
    memberSpecific: false,
  },
  {
    id: 'member-add',
    title: 'Add New Member',
    description: 'Request to add a new member to your unit',
    path: '/unit/submit-member-add',
    memberSpecific: false,
  },
];

export const ALL_REQUEST_TYPES: ChangeRequestTypeOption[] = [
  ...MEMBER_REQUEST_TYPES,
  ...UNIT_REQUEST_TYPES,
];

export const getRequestTypeById = (id: ChangeRequestTypeId): ChangeRequestTypeOption | undefined =>
  ALL_REQUEST_TYPES.find((request) => request.id === id);

export const isMemberSelectionRequired = (requestTypeId: ChangeRequestTypeId): boolean =>
  getRequestTypeById(requestTypeId)?.memberSpecific ?? false;

export const getEligibleMembersForRequestType = <
  TMember extends { id: number },
  TCouncilor extends { memberId: number },
>(
  requestTypeId: ChangeRequestTypeId,
  members: TMember[],
  councilors: TCouncilor[],
): TMember[] => {
  if (requestTypeId === 'councilor') {
    const councilorMemberIds = new Set(councilors.map((councilor) => councilor.memberId));
    return members.filter((member) => councilorMemberIds.has(member.id));
  }
  if (requestTypeId === 'member-info' || requestTypeId === 'transfer') {
    return members;
  }
  return [];
};
