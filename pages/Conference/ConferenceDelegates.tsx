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
  Drumstick
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../../components/ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ConferenceOfficialView, ConferenceDelegatesResponse } from '../../types';
import { useToast } from '../../components/Toast';
import { 
  useConferenceOfficialView, 
  useConferenceDelegatesOfficial, 
  useAddDelegate, 
  useRemoveDelegate 
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
}

// Delegate member type from API
interface DelegateMember {
  id: number;
  name: string;
  number: string;
  gender: string;
}

// Delegate official type from API
interface DelegateOfficial {
  id: number;
  name: string;
  phone: string;
}

export const ConferenceDelegates: React.FC = () => {
  const { addToast } = useToast();
  const context = useOutletContext<ConferenceContext>();
  
  // Use TanStack Query
  const { data: viewData, isLoading: viewLoading, refetch: refetchView } = useConferenceOfficialView();
  const { data: delegatesData, isLoading: delegatesLoading, refetch: refetchDelegates } = useConferenceDelegatesOfficial();
  const addDelegateMutation = useAddDelegate();
  const removeDelegateMutation = useRemoveDelegate();
  
  const loading = viewLoading || delegatesLoading;
  
  // Extract data from queries
  const availableMembers = viewData?.available_members || [];
  const registrationOpen = viewData?.registration_open || false;
  const conferenceInfo = viewData ? {
    rem_count: viewData.rem_count,
    max_count: viewData.max_count,
    allowed_count: viewData.allowed_count,
    member_count: viewData.member_count,
    district: viewData.district,
  } : null;
  
  const delegateMembers = delegatesData?.delegate_members || [];
  const delegateOfficials = delegatesData?.delegate_officials || [];
  const delegatesInfo = delegatesData ? {
    delegates_count: delegatesData.delegates_count,
    max_count: delegatesData.max_count,
    payment_status: delegatesData.payment_status,
    amount_to_pay: delegatesData.amount_to_pay,
    food_preference: delegatesData.food_preference,
  } : null;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [delegatesSearchTerm, setDelegatesSearchTerm] = useState('');
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AvailableMember | null>(null);
  const [selectedDelegate, setSelectedDelegate] = useState<DelegateMember | null>(null);
  
  // Add delegate form states
  const [foodPreference, setFoodPreference] = useState<'veg' | 'non-veg'>('veg');
  const [accommodationRequired, setAccommodationRequired] = useState(false);

  const refreshData = () => {
    refetchView();
    refetchDelegates();
    context?.refreshData?.();
  };

  const handleAddDelegate = async () => {
    if (!selectedMember) return;
    
    addDelegateMutation.mutate(
      {
        memberId: selectedMember.id,
        data: {
          member_id: selectedMember.id,
          food_preference: foodPreference,
          accommodation_required: accommodationRequired,
        },
      },
      {
        onSuccess: () => {
          setShowAddDialog(false);
          setSelectedMember(null);
          setFoodPreference('veg');
          setAccommodationRequired(false);
          refreshData();
        },
      }
    );
  };

  const handleRemoveDelegate = async () => {
    if (!selectedDelegate) return;
    
    removeDelegateMutation.mutate(selectedDelegate.id, {
      onSuccess: () => {
        setShowRemoveDialog(false);
        setSelectedDelegate(null);
        refreshData();
      },
    });
  };

  const filteredMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone?.includes(searchTerm)
  );

  const filteredDelegateMembers = delegateMembers.filter(member =>
    member.name.toLowerCase().includes(delegatesSearchTerm.toLowerCase()) ||
    member.number?.includes(delegatesSearchTerm)
  );

  const filteredDelegateOfficials = delegateOfficials.filter(official =>
    official.name.toLowerCase().includes(delegatesSearchTerm.toLowerCase()) ||
    official.phone?.includes(delegatesSearchTerm)
  );

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return <Badge variant="success">Paid</Badge>;
      case 'PARTIAL':
        return <Badge variant="warning">Partial</Badge>;
      case 'PENDING':
      case 'PROOF_UPLOADED':
        return <Badge variant="warning">Pending</Badge>;
      case 'DECLINED':
      case 'INVALID':
        return <Badge variant="danger">Declined</Badge>;
      default:
        return <Badge variant="default">{status || 'Unknown'}</Badge>;
    }
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

  const totalDelegates = delegatesInfo?.delegates_count || (delegateMembers.length + delegateOfficials.length);
  const canAddMore = conferenceInfo && conferenceInfo.rem_count > 0;

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Delegates</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            {conferenceInfo?.district} District - Add delegates for the conference
          </p>
        </div>
        {registrationOpen && canAddMore && (
          <Button 
            onClick={() => {
              // Scroll to the available members section
              const availableMembersSection = document.getElementById('available-members-section');
              if (availableMembersSection) {
                availableMembersSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Delegate
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{totalDelegates}</p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">Registered</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{delegatesInfo?.max_count || conferenceInfo?.max_count || 0}</p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">Max Allowed</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-800">₹{delegatesInfo?.amount_to_pay || 0}</p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">Amount</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold text-gray-800">
                <span className="text-green-600">{delegatesInfo?.food_preference?.veg_count || 0}</span>
                {'/'}
                <span className="text-red-600">{delegatesInfo?.food_preference?.non_veg_count || 0}</span>
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">Veg/Non-Veg</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Status Banner */}
      {delegatesInfo && (
        <Card className={`p-3 sm:p-4 ${delegatesInfo.payment_status === 'PAID' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <CreditCard className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${delegatesInfo.payment_status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`} />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-800 text-sm sm:text-base">Payment: </span>
                {getPaymentStatusBadge(delegatesInfo.payment_status)}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-500">Total Amount</p>
              <p className="text-base sm:text-lg font-bold text-gray-800">₹{delegatesInfo.amount_to_pay}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Registration Closed Alert */}
      {!registrationOpen && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Registration Closed</h4>
              <p className="text-sm text-yellow-700 mt-1">
                You cannot add or remove delegates as the registration period has ended or slots are full.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Registered Delegates Section */}
      {(delegateMembers.length > 0 || delegateOfficials.length > 0) && (
        <Card>
          <div className="p-3 sm:p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              Registered Delegates ({totalDelegates})
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Members and officials registered for the conference
            </p>
          </div>

          {/* Search */}
          <div className="p-3 sm:p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search delegates..."
                value={delegatesSearchTerm}
                onChange={(e) => setDelegatesSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Delegate Officials */}
          {filteredDelegateOfficials.length > 0 && (
            <div className="p-3 sm:p-4 border-b border-gray-100">
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                Officials ({filteredDelegateOfficials.length})
              </h4>
              <div className="space-y-2">
                {filteredDelegateOfficials.map((official) => (
                  <div key={`official-${official.id}`} className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs sm:text-sm font-medium text-blue-600">
                          {official.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 text-sm truncate">{official.name}</p>
                        <p className="text-xs text-gray-500">{official.phone || '-'}</p>
                      </div>
                    </div>
                    <Badge variant="info" className="flex-shrink-0 text-xs">Official</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delegate Members */}
          {filteredDelegateMembers.length > 0 && (
            <>
              <div className="p-3 sm:p-4 border-b border-gray-100">
                <h4 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Members ({filteredDelegateMembers.length})
                </h4>
              </div>
              
              {/* Mobile Card View */}
              <div className="block sm:hidden divide-y divide-gray-100">
                {filteredDelegateMembers.map((member) => (
                  <div key={`member-${member.id}`} className="p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-green-600">
                            {member.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 text-sm truncate">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.number || '-'}</p>
                          <Badge variant={member.gender === 'M' ? 'info' : 'default'} className="mt-1 text-xs">
                            {member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender}
                          </Badge>
                        </div>
                      </div>
                      {registrationOpen && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDelegate(member);
                            setShowRemoveDialog(true);
                          }}
                          className="text-red-600 hover:bg-red-50 hover:border-red-300 flex-shrink-0 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                      {registrationOpen && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDelegateMembers.map((member) => (
                      <tr key={`member-${member.id}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600">
                                {member.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <span className="font-medium text-gray-800">{member.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{member.number || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={member.gender === 'M' ? 'info' : 'default'}>
                            {member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender}
                          </Badge>
                        </td>
                        {registrationOpen && (
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDelegate(member);
                                setShowRemoveDialog(true);
                              }}
                              className="text-red-600 hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {filteredDelegateMembers.length === 0 && filteredDelegateOfficials.length === 0 && delegatesSearchTerm && (
            <div className="p-6 sm:p-8 text-center text-gray-500 text-sm">
              No delegates found matching your search
            </div>
          )}
        </Card>
      )}

      {/* Available Members List */}
      <Card id="available-members-section">
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            Available Members ({availableMembers.length})
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Members from your district who can be added as delegates
          </p>
        </div>
        
        {/* Search */}
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {filteredMembers.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchTerm ? 'No members found matching your search' : 'No available members'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredMembers.slice(0, 50).map((member) => (
                <div key={member.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-orange-600">
                          {member.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 text-sm truncate">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.phone || '-'}</p>
                        <Badge variant={member.gender === 'M' ? 'info' : 'default'} className="mt-1 text-xs">
                          {member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender}
                        </Badge>
                      </div>
                    </div>
                    {registrationOpen && canAddMore && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMember(member);
                          setShowAddDialog(true);
                        }}
                        className="flex-shrink-0 ml-2"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                {registrationOpen && canAddMore && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'No members found matching your search' : 'No available members'}
                  </td>
                </tr>
              ) : (
                filteredMembers.slice(0, 50).map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-orange-600">
                            {member.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{member.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={member.gender === 'M' ? 'info' : 'default'}>
                        {member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender}
                      </Badge>
                    </td>
                    {registrationOpen && canAddMore && (
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowAddDialog(true);
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredMembers.length > 50 && (
          <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500 border-t border-gray-100">
            Showing 50 of {filteredMembers.length} members. Use search to find specific members.
          </div>
        )}
      </Card>

      {/* Add Delegate Dialog */}
      {showAddDialog && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Add Delegate</h3>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              {/* Member Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-base sm:text-lg font-medium text-orange-600">
                    {selectedMember.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{selectedMember.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{selectedMember.phone || '-'}</p>
                </div>
              </div>
              
              {/* Food Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Utensils className="w-4 h-4 inline mr-2" />
                  Food Preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFoodPreference('veg')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      foodPreference === 'veg' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Leaf className="w-5 h-5" />
                    <span className="font-medium text-sm">Veg</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFoodPreference('non-veg')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      foodPreference === 'non-veg' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Drumstick className="w-5 h-5" />
                    <span className="font-medium text-sm">Non-Veg</span>
                  </button>
                </div>
              </div>

              {/* Accommodation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Home className="w-4 h-4 inline mr-2" />
                  Accommodation Required?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccommodationRequired(true)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      accommodationRequired 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium text-sm">Yes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccommodationRequired(false)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      !accommodationRequired 
                        ? 'border-gray-500 bg-gray-50 text-gray-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium text-sm">No</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddDialog(false);
                  setSelectedMember(null);
                  setFoodPreference('veg');
                  setAccommodationRequired(false);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddDelegate} 
                disabled={addDelegateMutation.isPending}
                isLoading={addDelegateMutation.isPending}
                className="w-full sm:w-auto"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Delegate
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Remove Delegate Confirmation */}
      <ConfirmDialog
        isOpen={showRemoveDialog}
        onClose={() => {
          setShowRemoveDialog(false);
          setSelectedDelegate(null);
        }}
        onConfirm={handleRemoveDelegate}
        title="Remove Delegate"
        message={`Are you sure you want to remove ${selectedDelegate?.name} from the delegates list?`}
        confirmText="Remove"
        confirmVariant="danger"
        isLoading={removeDelegateMutation.isPending}
      />
    </div>
  );
};
