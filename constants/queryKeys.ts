// Centralized query keys for cache management
export const queryKeys = {
  // Unit Admin
  units: {
    all: ['units'] as const,
    list: () => [...queryKeys.units.all, 'list', 'v3'] as const,
    detail: (id: number) => [...queryKeys.units.all, 'detail', id] as const,
    stats: () => [...queryKeys.units.all, 'stats', 'v2'] as const,
    notOnboarded: () => [...queryKeys.units.all, 'notOnboarded'] as const,
  },
  members: {
    all: ['members'] as const,
    list: () => [...queryKeys.members.all, 'list'] as const,
    byUnit: (unitId: number) => [...queryKeys.members.all, 'unit', unitId] as const,
    archived: () => [...queryKeys.members.all, 'archived'] as const,
  },
  officials: {
    all: ['officials'] as const,
    list: () => [...queryKeys.officials.all, 'list'] as const,
    byUnit: (unitId: number) => [...queryKeys.officials.all, 'unit', unitId] as const,
  },
  councilors: {
    all: ['councilors'] as const,
    list: () => [...queryKeys.councilors.all, 'list'] as const,
    byUnit: (unitId: number) => [...queryKeys.councilors.all, 'unit', unitId] as const,
  },
  districts: {
    all: ['districts'] as const,
    list: () => [...queryKeys.districts.all, 'list'] as const,
    chartData: () => [...queryKeys.districts.all, 'chartData'] as const,
  },

  // Requests
  requests: {
    all: ['requests'] as const,
    transfers: () => [...queryKeys.requests.all, 'transfers'] as const,
    memberInfo: () => [...queryKeys.requests.all, 'memberInfo'] as const,
    officials: () => [...queryKeys.requests.all, 'officials'] as const,
    councilors: () => [...queryKeys.requests.all, 'councilors'] as const,
    memberAdd: () => [...queryKeys.requests.all, 'memberAdd'] as const,
    archivedMemberConcern: () => [...queryKeys.requests.all, 'archivedMemberConcern'] as const,
    myRequests: () => [...queryKeys.requests.all, 'my'] as const,
    transferDestinations: () => [...queryKeys.requests.all, 'transferDestinations'] as const,
  },
  unitArchived: {
    all: ['unitArchived'] as const,
    recent: () => [...queryKeys.unitArchived.all, 'recent'] as const,
  },
  unitRemoved: {
    all: ['unitRemoved'] as const,
    pending: () => [...queryKeys.unitRemoved.all, 'pending'] as const,
  },

  // Conference
  conference: {
    all: ['conference'] as const,
    list: () => [...queryKeys.conference.all, 'list'] as const,
    publicList: () => [...queryKeys.conference.all, 'publicList'] as const,
    detail: (id: number) => [...queryKeys.conference.all, 'detail', id] as const,
    delegates: () => [...queryKeys.conference.all, 'delegates'] as const,
    officialView: () => [...queryKeys.conference.all, 'officialView'] as const,
    payments: (conferenceId: number) => [...queryKeys.conference.all, 'payments', conferenceId] as const,
    officialPayment: () => [...queryKeys.conference.all, 'officialPayment'] as const,
    settings: () => [...queryKeys.conference.all, 'settings'] as const,
    adminInfo: (conferenceId: number) => [...queryKeys.conference.all, 'adminInfo', conferenceId] as const,
    officials: () => [...queryKeys.conference.all, 'officials'] as const,
    exportData: () => [...queryKeys.conference.all, 'exportData'] as const,
  },

  // Kalamela
  kalamela: {
    all: ['kalamela'] as const,
    events: {
      all: () => [...queryKeys.kalamela.all, 'events'] as const,
      individual: () => [...queryKeys.kalamela.events.all(), 'individual'] as const,
      group: () => [...queryKeys.kalamela.events.all(), 'group'] as const,
    },
    categories: {
      all: () => [...queryKeys.kalamela.all, 'categories'] as const,
      list: () => [...queryKeys.kalamela.categories.all(), 'list'] as const,
      detail: (id: number) => [...queryKeys.kalamela.categories.all(), 'detail', id] as const,
    },
    registrationFees: {
      all: () => [...queryKeys.kalamela.all, 'registrationFees'] as const,
      list: () => [...queryKeys.kalamela.registrationFees.all(), 'list'] as const,
      detail: (id: number) => [...queryKeys.kalamela.registrationFees.all(), 'detail', id] as const,
    },
    participants: (eventId: number) => [...queryKeys.kalamela.all, 'participants', eventId] as const,
    allParticipants: () => [...queryKeys.kalamela.all, 'allParticipants'] as const,
    scores: (eventId: number) => [...queryKeys.kalamela.all, 'scores', eventId] as const,
    payments: () => [...queryKeys.kalamela.all, 'payments'] as const,
    appeals: () => [...queryKeys.kalamela.all, 'appeals'] as const,
    results: () => [...queryKeys.kalamela.all, 'results'] as const,
    officialHome: () => [...queryKeys.kalamela.all, 'officialHome'] as const,
  },

  // Site Settings
  siteSettings: {
    all: ['siteSettings'] as const,
    settings: () => [...queryKeys.siteSettings.all, 'settings'] as const,
    notices: () => [...queryKeys.siteSettings.all, 'notices'] as const,
    quickLinks: () => [...queryKeys.siteSettings.all, 'quickLinks'] as const,
  },

  // Yuvalokham
  yuvalokham: {
    all: ['yuvalokham'] as const,
    profile: () => [...queryKeys.yuvalokham.all, 'profile'] as const,
    plans: () => [...queryKeys.yuvalokham.all, 'plans'] as const,
    activeSub: () => [...queryKeys.yuvalokham.all, 'activeSub'] as const,
    subscriptions: (skip?: number) => [...queryKeys.yuvalokham.all, 'subscriptions', skip] as const,
    qrCode: () => [...queryKeys.yuvalokham.all, 'qrCode'] as const,
    payments: (skip?: number) => [...queryKeys.yuvalokham.all, 'payments', skip] as const,
    magazines: () => [...queryKeys.yuvalokham.all, 'magazines'] as const,
    magazineDetail: (id: number) => [...queryKeys.yuvalokham.all, 'magazine', id] as const,
    complaints: (skip?: number) => [...queryKeys.yuvalokham.all, 'complaints', skip] as const,
    admin: {
      users: (filters?: any) => [...queryKeys.yuvalokham.all, 'admin', 'users', filters] as const,
      userDetail: (id: number) => [...queryKeys.yuvalokham.all, 'admin', 'user', id] as const,
      plans: () => [...queryKeys.yuvalokham.all, 'admin', 'plans'] as const,
      subscriptions: (filters?: any) => [...queryKeys.yuvalokham.all, 'admin', 'subscriptions', filters] as const,
      payments: (filters?: any) => [...queryKeys.yuvalokham.all, 'admin', 'payments', filters] as const,
      magazines: (status?: string) => [...queryKeys.yuvalokham.all, 'admin', 'magazines', status] as const,
      complaints: (filters?: any) => [...queryKeys.yuvalokham.all, 'admin', 'complaints', filters] as const,
      qrSettings: () => [...queryKeys.yuvalokham.all, 'admin', 'qrSettings'] as const,
      summary: () => [...queryKeys.yuvalokham.all, 'admin', 'summary'] as const,
      trends: (months?: number) => [...queryKeys.yuvalokham.all, 'admin', 'trends', months] as const,
      breakdowns: () => [...queryKeys.yuvalokham.all, 'admin', 'breakdowns'] as const,
      expiring: (days?: number) => [...queryKeys.yuvalokham.all, 'admin', 'expiring', days] as const,
    },
  },

  // User Management
  userManagement: {
    all: ['userManagement'] as const,
    list: (filters?: { user_type?: string; district_id?: number; search?: string; is_active?: boolean }) => 
      [...queryKeys.userManagement.all, 'list', filters] as const,
    summary: () => [...queryKeys.userManagement.all, 'summary'] as const,
    districtOfficials: () => [...queryKeys.userManagement.all, 'districtOfficials'] as const,
    districtsWithStatus: () => [...queryKeys.userManagement.all, 'districtsWithStatus'] as const,
  },
} as const;


