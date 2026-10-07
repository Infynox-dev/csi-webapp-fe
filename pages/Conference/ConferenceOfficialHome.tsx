import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  MapPin, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  UserPlus,
  Target,
  TrendingUp
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../../components/ui';
import { ConferenceOfficialView } from '../../types';
import { useToast } from '../../components/Toast';
import { useConferenceOfficialView } from '../../hooks/queries';

interface ConferenceContext {
  conferenceData: ConferenceOfficialView | null;
  loading: boolean;
  refreshData: () => void;
}

export const ConferenceOfficialHome: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const context = useOutletContext<ConferenceContext>();
  
  // Use TanStack Query (fallback if context not available)
  const { data: queryData, isLoading: queryLoading } = useConferenceOfficialView();
  
  // Use context data if available, otherwise use query data
  const localData = context?.conferenceData || queryData;
  const loading = context?.loading ?? queryLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!localData) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Active Conference</h3>
        <p className="text-gray-600">There is no active conference at the moment. Please check back later.</p>
      </Card>
    );
  }

  const { 
    conference, 
    registration_open, 
    available_members,
    rem_count,
    max_count,
    allowed_count,
    member_count,
    district
  } = localData;

  // Parse conference details for venue/date info
  const conferenceDetails = conference.details || '';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="default" className="bg-white/20 text-white border-0 mb-3">
              {district} District
            </Badge>
            <h1 className="text-2xl font-bold mb-2">{conference.title}</h1>
            <p className="text-orange-100 mb-4">{conferenceDetails}</p>
          </div>
          <Badge 
            variant={conference.status === 'Active' ? 'success' : 'warning'} 
            className="bg-white/20 text-white border-0"
          >
            {conference.status}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm mt-4">
          <div className="flex items-center bg-white/20 rounded-full px-3 py-1">
            <Target className="w-4 h-4 mr-2" />
            Allowed: {localData.official_limit ?? 0} officials, {allowed_count} delegates
          </div>
          <div className="flex items-center bg-white/20 rounded-full px-3 py-1">
            <Users className="w-4 h-4 mr-2" />
            Registered: {localData.official_count ?? 0} officials, {member_count} delegates
          </div>
          <div className="flex items-center bg-white/20 rounded-full px-3 py-1">
            <TrendingUp className="w-4 h-4 mr-2" />
            Remaining Slots: {rem_count}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Registered</p>
              <p className="text-3xl font-bold text-gray-800">{member_count}</p>
              <p className="text-xs text-gray-400 mt-1">
                of {allowed_count} allowed
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Remaining Slots</p>
              <p className="text-3xl font-bold text-gray-800">{rem_count}</p>
              <p className="text-xs text-gray-400 mt-1">
                Can still add
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Available Members</p>
              <p className="text-3xl font-bold text-gray-800">{available_members?.length || 0}</p>
              <p className="text-xs text-gray-400 mt-1">
                In your district
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <UserPlus className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Max Capacity</p>
              <p className="text-3xl font-bold text-gray-800">{max_count}</p>
              <p className="text-xs text-gray-400 mt-1">
                Total conference limit
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Registration Progress</h3>
          <span className="text-sm text-gray-500">{member_count} / {allowed_count}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((member_count / allowed_count) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {allowed_count - member_count > 0 
            ? `You can add ${allowed_count - member_count} more delegate(s)`
            : 'You have reached your delegate limit'}
        </p>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          className="bg-white rounded-md border border-gray-200 shadow-sm p-5 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/conference/official/delegates')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/conference/official/delegates'); }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Manage Delegates</h3>
                <p className="text-sm text-gray-500">Add delegates from {available_members?.length || 0} available members</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div 
          className="bg-white rounded-md border border-gray-200 shadow-sm p-5 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/conference/official/payment')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/conference/official/payment'); }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Submit Payment</h3>
                <p className="text-sm text-gray-500">Upload payment proof for registration</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Registration Status Alert */}
      {!registration_open && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Registration Closed</h4>
              <p className="text-sm text-yellow-700 mt-1">
                {rem_count === 0 
                  ? 'All delegate slots have been filled.'
                  : 'The registration period for this conference has ended.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {registration_open && rem_count > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800">Registration Open</h4>
              <p className="text-sm text-green-700 mt-1">
                You can add up to {rem_count} more delegate(s) for this conference.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

