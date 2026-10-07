import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  Target,
  CreditCard,
  Utensils,
  UserCog,
  Home,
  Leaf,
  Drumstick,
  Pencil,
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Portal } from '../../components/Portal';
import { ConferenceOfficialView } from '../../types';
import {
  useConferenceOfficialView,
  useConferenceDelegatesOfficial,
  useAddDelegate,
  useRemoveDelegate,
  useUpdateAttendeePreferences,
} from '../../hooks/queries';

interface ConferenceContext {
  conferenceData: ConferenceOfficialView | null;
  loading: boolean;
  refreshData: () => void;
}

interface AvailableMember {
  id: number;
  name: string;
  gender: string;
  phone?: string;
  unitName?: string;
}

type FoodPref = 'veg' | 'non-veg' | null;
type StayPref = boolean | null;
type AttendeeRole = 'official' | 'delegate';

interface Attendee {
  id: number;
  name: string;
  phone?: string;
  number?: string;
  gender?: string | null;
  unit_name?: string | null;
  food_preference?: FoodPref;
  accommodation_required?: StayPref;
  removable?: boolean;
}

const genderCode = (gender?: string | null) => {
  if (!gender) return '';
  const value = gender.toLowerCase();
  if (gender === 'M' || value === 'male') return 'M';
  if (gender === 'F' || value === 'female') return 'F';
  return gender;
};

const genderLabel = (gender?: string | null) => {
  const code = genderCode(gender);
  if (code === 'M') return 'Male';
  if (code === 'F') return 'Female';
  return gender || '-';
};

const foodLabel = (food?: FoodPref) => {
  if (food === 'veg') return 'Veg';
  if (food === 'non-veg') return 'Non-Veg';
  return 'Not set';
};

const stayLabel = (stay?: StayPref) => {
  if (stay === true) return 'Yes';
  if (stay === false) return 'No';
  return 'Not set';
};

const matchesAttendee = (row: Attendee, query: string, gender: string, food: string) => {
  const q = query.trim().toLowerCase();
  const phone = row.phone || row.number || '';
  const text =
    !q ||
    row.name.toLowerCase().includes(q) ||
    phone.includes(query.trim()) ||
    (row.unit_name || '').toLowerCase().includes(q);
  const genderOk = gender === 'all' || genderCode(row.gender) === gender;
  const foodOk =
    food === 'all' ||
    (food === 'unset' ? !row.food_preference : row.food_preference === food);
  return text && genderOk && foodOk;
};

const PreferenceFields: React.FC<{
  food: FoodPref;
  stay: StayPref;
  onFood: (value: FoodPref) => void;
  onStay: (value: StayPref) => void;
}> = ({ food, stay, onFood, onStay }) => (
  <>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Utensils className="w-4 h-4 inline mr-2" />
        Food Preference
      </label>
      <div className="grid grid-cols-3 gap-2">
        {([
          ['veg', 'Veg', 'border-green-500 bg-green-50 text-green-700'],
          ['non-veg', 'Non-Veg', 'border-red-500 bg-red-50 text-red-700'],
          [null, 'Not set', 'border-gray-500 bg-gray-50 text-gray-700'],
        ] as const).map(([value, label, active]) => (
          <button
            key={label}
            type="button"
            onClick={() => onFood(value)}
            className={`p-3 rounded-lg border-2 text-sm font-medium ${
              food === value ? active : 'border-gray-200 text-gray-600'
            }`}
          >
            {value === 'veg' && <Leaf className="w-4 h-4 inline mr-1" />}
            {value === 'non-veg' && <Drumstick className="w-4 h-4 inline mr-1" />}
            {label}
          </button>
        ))}
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Home className="w-4 h-4 inline mr-2" />
        Accommodation Required?
      </label>
      <div className="grid grid-cols-3 gap-2">
        {([
          [true, 'Yes'],
          [false, 'No'],
          [null, 'Not set'],
        ] as const).map(([value, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => onStay(value)}
            className={`p-3 rounded-lg border-2 text-sm font-medium ${
              stay === value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  </>
);

export const ConferenceDelegates: React.FC = () => {
  const context = useOutletContext<ConferenceContext>();
  const { data: viewData, isLoading: viewLoading, refetch: refetchView } = useConferenceOfficialView();
  const { data: delegatesData, isLoading: delegatesLoading, refetch: refetchDelegates } = useConferenceDelegatesOfficial();
  const addDelegateMutation = useAddDelegate();
  const removeDelegateMutation = useRemoveDelegate();
  const updatePreferencesMutation = useUpdateAttendeePreferences();

  const loading = (viewLoading && !viewData) || (delegatesLoading && !delegatesData);
  const availableMembers = viewData?.available_members || [];
  const conferenceActive = viewData?.conference?.status === 'Active';
  const officialLimit = delegatesData?.official_limit ?? viewData?.official_limit ?? 0;
  const memberLimit = delegatesData?.member_limit ?? viewData?.allowed_count ?? 0;
  const officials = (delegatesData?.delegate_officials || []) as Attendee[];
  const delegates = (delegatesData?.delegate_members || []) as Attendee[];
  const officialCount = officials.length;
  const delegateCount = delegates.length;
  const canAddOfficial = conferenceActive && officialCount < officialLimit;
  const canAddDelegate = conferenceActive && delegateCount < memberLimit;

  const [searchTerm, setSearchTerm] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [pickerSearchTerm, setPickerSearchTerm] = useState('');
  const [officialQuery, setOfficialQuery] = useState('');
  const [officialGender, setOfficialGender] = useState('all');
  const [officialFood, setOfficialFood] = useState('all');
  const [delegateQuery, setDelegateQuery] = useState('');
  const [delegateGender, setDelegateGender] = useState('all');
  const [delegateFood, setDelegateFood] = useState('all');

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addRole, setAddRole] = useState<AttendeeRole>('delegate');
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AvailableMember | null>(null);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [foodPreference, setFoodPreference] = useState<FoodPref>('veg');
  const [accommodationRequired, setAccommodationRequired] = useState<StayPref>(false);

  const refreshData = async () => {
    await refetchDelegates();
    void refetchView();
    context?.refreshData?.();
  };

  const filterMembersByQuery = (members: AvailableMember[], query: string) => {
    const q = query.toLowerCase();
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(q) ||
        member.phone?.includes(query) ||
        (member.unitName ?? '').toLowerCase().includes(q),
    );
  };

  const filteredMembers = filterMembersByQuery(availableMembers, searchTerm);
  const memberPageSize = 10;
  const memberPageCount = Math.max(1, Math.ceil(filteredMembers.length / memberPageSize));
  const memberPageSafe = Math.min(memberPage, memberPageCount);
  const pagedMembers = filteredMembers.slice(
    (memberPageSafe - 1) * memberPageSize,
    memberPageSafe * memberPageSize,
  );
  const pickerMembers = filterMembersByQuery(availableMembers, pickerSearchTerm);
  const filteredOfficials = officials.filter((row) => matchesAttendee(row, officialQuery, officialGender, officialFood));
  const filteredDelegates = delegates.filter((row) => matchesAttendee(row, delegateQuery, delegateGender, delegateFood));

  const openAddDialog = (role: AttendeeRole, member?: AvailableMember) => {
    setAddRole(role);
    setSelectedMember(member ?? null);
    setPickerSearchTerm('');
    setFoodPreference('veg');
    setAccommodationRequired(false);
    setShowAddDialog(true);
  };

  const closeAddDialog = () => {
    setShowAddDialog(false);
    setSelectedMember(null);
    setPickerSearchTerm('');
  };

  const openEditDialog = (row: Attendee) => {
    setSelectedAttendee(row);
    setFoodPreference(row.food_preference ?? null);
    setAccommodationRequired(row.accommodation_required ?? null);
    setShowEditDialog(true);
  };

  const handleAdd = () => {
    if (!selectedMember) return;
    addDelegateMutation.mutate(
      {
        memberId: selectedMember.id,
        data: {
          member_id: selectedMember.id,
          role: addRole,
          food_preference: foodPreference,
          accommodation_required: accommodationRequired,
        },
      },
      {
        onSuccess: async () => {
          await refreshData();
          closeAddDialog();
        },
      },
    );
  };

  const handleSavePreferences = () => {
    if (!selectedAttendee) return;
    updatePreferencesMutation.mutate(
      {
        delegateId: selectedAttendee.id,
        food_preference: foodPreference,
        accommodation_required: accommodationRequired,
      },
      {
        onSuccess: async () => {
          await refreshData();
          setShowEditDialog(false);
          setSelectedAttendee(null);
        },
      },
    );
  };

  const handleRemove = () => {
    if (!selectedAttendee) return;
    removeDelegateMutation.mutate(selectedAttendee.id, {
      onSuccess: async () => {
        await refreshData();
        setShowRemoveDialog(false);
        setSelectedAttendee(null);
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const paymentStatus = delegatesData?.payment_status;
  const amount = delegatesData?.amount_to_pay || 0;

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Delegates</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          {viewData?.district} District — add officials and delegates within the conference limits
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><UserCog className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{officialCount}/{officialLimit}</p>
              <p className="text-xs sm:text-sm text-gray-500">Officials</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" /></div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{delegateCount}/{memberLimit}</p>
              <p className="text-xs sm:text-sm text-gray-500">Delegates</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" /></div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">₹{amount}</p>
              <p className="text-xs sm:text-sm text-gray-500">Amount</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" /></div>
            <div>
              <p className="text-base sm:text-lg font-bold text-gray-800">
                <span className="text-green-600">{delegatesData?.food_preference?.veg_count || 0}</span>
                {' / '}
                <span className="text-red-600">{delegatesData?.food_preference?.non_veg_count || 0}</span>
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Veg / Non-Veg</p>
            </div>
          </div>
        </Card>
      </div>

      {delegatesData && (
        <Card className={`p-3 sm:p-4 ${paymentStatus === 'PAID' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-gray-800 text-sm">Payment:</span>
              <Badge variant={paymentStatus === 'PAID' ? 'success' : paymentStatus === 'DECLINED' ? 'danger' : 'warning'}>
                {paymentStatus || 'Pending'}
              </Badge>
            </div>
            <p className="text-base font-bold text-gray-800">₹{amount}</p>
          </div>
        </Card>
      )}

      {!conferenceActive && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Registration Closed</h4>
              <p className="text-sm text-yellow-700 mt-1">This conference is not open for changes.</p>
            </div>
          </div>
        </Card>
      )}

      <AttendeeTable
        title={`Officials (${officialCount}/${officialLimit})`}
        hint="Includes the district official added by conference admin. Preferences stay blank until someone from this district sets them."
        icon={<UserCog className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />}
        rows={filteredOfficials}
        empty={officials.length === 0 ? 'No officials yet' : 'No officials match these filters'}
        query={officialQuery}
        gender={officialGender}
        food={officialFood}
        onQuery={setOfficialQuery}
        onGender={setOfficialGender}
        onFood={setOfficialFood}
        canEdit={!!conferenceActive}
        onEdit={openEditDialog}
        onRemove={(row) => {
          setSelectedAttendee(row);
          setShowRemoveDialog(true);
        }}
        addLabel="Add Official"
        addDisabled={!canAddOfficial}
        onAdd={() => openAddDialog('official')}
      />

      <AttendeeTable
        title={`Delegates (${delegateCount}/${memberLimit})`}
        hint="Unit members registered as conference delegates."
        icon={<Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />}
        rows={filteredDelegates}
        empty={delegates.length === 0 ? 'No delegates yet' : 'No delegates match these filters'}
        query={delegateQuery}
        gender={delegateGender}
        food={delegateFood}
        onQuery={setDelegateQuery}
        onGender={setDelegateGender}
        onFood={setDelegateFood}
        canEdit={!!conferenceActive}
        onEdit={openEditDialog}
        onRemove={(row) => {
          setSelectedAttendee(row);
          setShowRemoveDialog(true);
        }}
      />

      <Card id="available-members-section">
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            Available Members ({availableMembers.length})
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            District members who are not already an official or delegate
          </p>
        </div>
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or unit..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setMemberPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
        <div className="max-h-96 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                {conferenceActive && (canAddOfficial || canAddDelegate) && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'No members found matching your search' : 'No available members'}
                  </td>
                </tr>
              ) : (
                pagedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{member.name}</td>
                    <td className="px-4 py-3 text-gray-600">{member.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{member.unitName || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={genderCode(member.gender) === 'M' ? 'info' : 'default'}>{genderLabel(member.gender)}</Badge>
                    </td>
                    {conferenceActive && (canAddOfficial || canAddDelegate) && (
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <Button variant="outline" size="sm" disabled={!canAddOfficial} onClick={() => openAddDialog('official', member)}>
                          Official
                        </Button>
                        <Button variant="outline" size="sm" disabled={!canAddDelegate} onClick={() => openAddDialog('delegate', member)}>
                          Delegate
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-gray-500">
            {filteredMembers.length === 0
              ? '0 members'
              : `${(memberPageSafe - 1) * memberPageSize + 1}–${Math.min(memberPageSafe * memberPageSize, filteredMembers.length)} of ${filteredMembers.length}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={memberPageSafe <= 1}
              onClick={() => setMemberPage(memberPageSafe - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-gray-500">
              Page {memberPageSafe} of {memberPageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={memberPageSafe >= memberPageCount}
              onClick={() => setMemberPage(memberPageSafe + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {showAddDialog && (
        <Portal>
          <div className="fixed inset-0 z-[100] bg-black/50" onClick={closeAddDialog} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedMember ? `Confirm ${addRole === 'official' ? 'Official' : 'Delegate'}` : `Add ${addRole === 'official' ? 'Official' : 'Delegate'}`}
                </h3>
                {selectedMember && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedMember(null)}>Change member</Button>
                )}
              </div>
              {!selectedMember ? (
                <div className="p-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search by name, phone, or unit..."
                      value={pickerSearchTerm}
                      onChange={(e) => setPickerSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y">
                    {pickerMembers.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500 text-center">No members match your search</p>
                    ) : (
                      pickerMembers.slice(0, 30).map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setSelectedMember(member)}
                          className="w-full px-3 py-2.5 text-left hover:bg-orange-50"
                        >
                          <p className="font-medium text-gray-800 text-sm">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.phone || '-'}{member.unitName ? ` · ${member.unitName}` : ''}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-800">{selectedMember.name}</p>
                    <p className="text-sm text-gray-500">{selectedMember.phone || '-'}</p>
                    <p className="text-sm text-gray-500">{selectedMember.unitName || '-'}</p>
                  </div>
                  <PreferenceFields
                    food={foodPreference}
                    stay={accommodationRequired}
                    onFood={setFoodPreference}
                    onStay={setAccommodationRequired}
                  />
                </div>
              )}
              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={closeAddDialog}>Cancel</Button>
                {selectedMember && (
                  <Button onClick={handleAdd} disabled={addDelegateMutation.isPending} isLoading={addDelegateMutation.isPending}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Add {addRole === 'official' ? 'Official' : 'Delegate'}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </Portal>
      )}

      {showEditDialog && selectedAttendee && (
        <Portal>
          <div className="fixed inset-0 z-[100] bg-black/50" onClick={() => setShowEditDialog(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <Card className="w-full max-w-md pointer-events-auto">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Edit Preferences</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedAttendee.name}</p>
              </div>
              <div className="p-4 space-y-4">
                <PreferenceFields
                  food={foodPreference}
                  stay={accommodationRequired}
                  onFood={setFoodPreference}
                  onStay={setAccommodationRequired}
                />
              </div>
              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                <Button onClick={handleSavePreferences} disabled={updatePreferencesMutation.isPending} isLoading={updatePreferencesMutation.isPending}>
                  Save
                </Button>
              </div>
            </Card>
          </div>
        </Portal>
      )}

      <ConfirmDialog
        isOpen={showRemoveDialog}
        onClose={() => {
          setShowRemoveDialog(false);
          setSelectedAttendee(null);
        }}
        onConfirm={handleRemove}
        title="Remove from conference"
        message={`Remove ${selectedAttendee?.name || 'this person'} from the conference list?`}
        confirmText="Remove"
        confirmVariant="danger"
        isLoading={removeDelegateMutation.isPending}
      />
    </div>
  );
};

const AttendeeTable: React.FC<{
  title: string;
  hint: string;
  icon: React.ReactNode;
  rows: Attendee[];
  empty: string;
  query: string;
  gender: string;
  food: string;
  onQuery: (value: string) => void;
  onGender: (value: string) => void;
  onFood: (value: string) => void;
  canEdit: boolean;
  onEdit: (row: Attendee) => void;
  onRemove: (row: Attendee) => void;
  addLabel?: string;
  addDisabled?: boolean;
  onAdd?: () => void;
}> = ({ title, hint, icon, rows, empty, query, gender, food, onQuery, onGender, onFood, canEdit, onEdit, onRemove, addLabel, addDisabled, onAdd }) => (
  <Card>
    <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
          {icon}
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">{hint}</p>
      </div>
      {onAdd && addLabel && (
        <Button onClick={onAdd} disabled={addDisabled} className="w-full sm:w-auto flex-shrink-0">
          <UserPlus className="w-4 h-4 mr-2" />
          {addLabel}
        </Button>
      )}
    </div>
    <div className="p-3 sm:p-4 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
      <div className="relative sm:col-span-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Name, phone, or unit"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg"
        />
      </div>
      <select value={gender} onChange={(e) => onGender(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
        <option value="all">All genders</option>
        <option value="M">Male</option>
        <option value="F">Female</option>
      </select>
      <select value={food} onChange={(e) => onFood(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
        <option value="all">All food preferences</option>
        <option value="veg">Veg</option>
        <option value="non-veg">Non-Veg</option>
        <option value="unset">Not set</option>
      </select>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {['Name', 'Unit Name', 'Phone', 'Gender', 'Food', 'Stay', 'Action'].map((heading) => (
              <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">{empty}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                <td className="px-4 py-3 text-gray-600">{row.unit_name || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{row.phone || row.number || '-'}</td>
                <td className="px-4 py-3">
                  <Badge variant={genderCode(row.gender) === 'M' ? 'info' : 'default'}>{genderLabel(row.gender)}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-700">{foodLabel(row.food_preference)}</td>
                <td className="px-4 py-3 text-gray-700">{stayLabel(row.accommodation_required)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                  {canEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(row)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  {canEdit && row.removable && (
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => onRemove(row)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </Card>
);
