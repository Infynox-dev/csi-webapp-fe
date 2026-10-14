import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { Users, Download, ChevronDown, ChevronRight, MapPin, Phone, User, Search } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { downloadBlob } from '../../services/download';
import { useConferencesAdmin, useConferenceAdminInfo } from '../../hooks/queries';

interface Conference {
  id: number;
  title: string;
  details: string;
  added_on: string;
  status: 'Active' | 'Inactive' | 'Completed';
}

interface DistrictMember {
  id: number;
  name: string;
  phone: string;
  gender?: string;
}

interface DistrictPayment {
  amount_to_pay: number;
  uploaded_by: string;
  date: string;
  status: string;
  proof_path: string | null;
  payment_reference: string | null;
}

interface DistrictInfo {
  officials: DistrictMember[];
  members: DistrictMember[];
  payments: DistrictPayment[];
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

interface ConferenceInfo {
  conference_id: number;
  district_info: Record<string, DistrictInfo>;
}

export const ConferenceAdminInfo: React.FC = () => {
  const { addToast } = useToast();
  
  // Use TanStack Query
  const { data: conferences = [], isLoading: loading } = useConferencesAdmin();
  
  const [selectedConferenceId, setSelectedConferenceId] = useState<number | null>(null);
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);

  // Auto-select active conference when conferences load
  useEffect(() => {
    if (conferences.length > 0 && !selectedConferenceId) {
      const activeConference = conferences.find((c: Conference) => c.status === 'Active');
      if (activeConference) {
        setSelectedConferenceId(activeConference.id);
      } else {
        setSelectedConferenceId(conferences[0].id);
      }
    }
  }, [conferences, selectedConferenceId]);

  // Use TanStack Query for conference info
  const {
    data: conferenceInfo,
    isLoading: loadingInfo,
    isError: infoError,
    refetch: refetchInfo,
  } = useConferenceAdminInfo(selectedConferenceId || 0);

  const handleExport = async () => {
    if (!selectedConferenceId) return;
    
    try {
      setExporting(true);
      const blob = await api.exportConferenceInfoAdmin(selectedConferenceId);
      downloadBlob(blob, `conference_info_${selectedConferenceId}.xlsx`);
      addToast('Export downloaded', 'success');
    } catch (err) {
      addToast("Failed to export data", "error");
    } finally {
      setExporting(false);
    }
  };

  const toggleDistrict = (district: string) => {
    const newExpanded = new Set(expandedDistricts);
    if (newExpanded.has(district)) {
      newExpanded.delete(district);
    } else {
      newExpanded.add(district);
    }
    setExpandedDistricts(newExpanded);
  };

  const expandAll = () => {
    if (conferenceInfo) {
      setExpandedDistricts(new Set(Object.keys(conferenceInfo.district_info)));
    }
  };

  const collapseAll = () => {
    setExpandedDistricts(new Set());
  };

  // Calculate totals
  const totals = conferenceInfo ? Object.values(conferenceInfo.district_info).reduce(
    (acc, district) => ({
      officials: acc.officials + district.count_of_officials,
      members: acc.members + district.count_of_members,
      total: acc.total + district.total_count,
      male: acc.male + district.count_of_total_male,
      female: acc.female + district.count_of_total_female,
      veg: acc.veg + district.veg_count,
      nonVeg: acc.nonVeg + district.non_veg_count,
    }),
    { officials: 0, members: 0, total: 0, male: 0, female: 0, veg: 0, nonVeg: 0 }
  ) : null;

  // Filter districts by search
  const filteredDistricts = conferenceInfo 
    ? Object.entries(conferenceInfo.district_info).filter(([district]) =>
        district.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Conference Delegate Info</h1>
          <p className="mt-1 text-sm text-textMuted">View registered delegates by district</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={!selectedConferenceId || exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
        </div>
      </div>

      {/* Conference Selector */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-textDark mb-2">Select Conference</label>
            <select
              value={selectedConferenceId || ''}
              onChange={(e) => setSelectedConferenceId(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 bg-white text-textDark border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              disabled={loading}
            >
              <option value="">Select a conference</option>
              {conferences.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.status === 'Active' ? '(Active)' : `(${c.status})`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-textDark mb-2">Search District</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                placeholder="Search districts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white text-textDark border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-textMuted/50"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <p className="text-xs text-textMuted">Total Delegates</p>
            <p className="text-2xl font-bold text-textDark">{totals.total}</p>
          </Card>
          <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <p className="text-xs text-textMuted">Officials</p>
            <p className="text-2xl font-bold text-textDark">{totals.officials}</p>
          </Card>
          <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
            <p className="text-xs text-textMuted">Members</p>
            <p className="text-2xl font-bold text-textDark">{totals.members}</p>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <p className="text-xs text-textMuted">Male</p>
            <p className="text-2xl font-bold text-textDark">{totals.male}</p>
          </Card>
          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
            <p className="text-xs text-textMuted">Female</p>
            <p className="text-2xl font-bold text-textDark">{totals.female}</p>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <p className="text-xs text-textMuted">Veg</p>
            <p className="text-2xl font-bold text-textDark">{totals.veg}</p>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <p className="text-xs text-textMuted">Non-Veg</p>
            <p className="text-2xl font-bold text-textDark">{totals.nonVeg}</p>
          </Card>
        </div>
      )}

      {/* District List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-textDark">Districts ({filteredDistricts.length})</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>Expand All</Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>Collapse All</Button>
          </div>
        </div>

        {loadingInfo ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : infoError ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted mb-4">
              Could not load delegate info. The request may have timed out or the server may be busy.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetchInfo()}>
              Retry
            </Button>
          </div>
        ) : !conferenceInfo || filteredDistricts.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted">
              {!selectedConferenceId 
                ? 'Please select a conference to view delegate info' 
                : searchTerm 
                  ? 'No districts match your search'
                  : 'No delegate data available for this conference'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDistricts.map(([district, info]) => (
              <div key={district} className="border border-borderColor rounded-lg overflow-hidden">
                {/* District Header */}
                <button
                  onClick={() => toggleDistrict(district)}
                  className="w-full px-4 py-3 bg-bgLight hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedDistricts.has(district) ? (
                      <ChevronDown className="w-5 h-5 text-textMuted" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-textMuted" />
                    )}
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-bold text-textDark">{district}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="primary">{info.count_of_officials} officials</Badge>
                    <Badge variant="light">{info.count_of_members} members</Badge>
                    <Badge variant="success">{info.total_count} total</Badge>
                  </div>
                </button>

                {/* District Details */}
                {expandedDistricts.has(district) && (
                  <div className="p-4 border-t border-borderColor">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-600">Male Officials</p>
                        <p className="text-lg font-bold text-blue-800">{info.count_of_male_officials}</p>
                      </div>
                      <div className="bg-pink-50 p-3 rounded-lg">
                        <p className="text-xs text-pink-600">Female Officials</p>
                        <p className="text-lg font-bold text-pink-800">{info.count_of_female_officials}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-600">Male Members</p>
                        <p className="text-lg font-bold text-blue-800">{info.count_of_male_members}</p>
                      </div>
                      <div className="bg-pink-50 p-3 rounded-lg">
                        <p className="text-xs text-pink-600">Female Members</p>
                        <p className="text-lg font-bold text-pink-800">{info.count_of_female_members}</p>
                      </div>
                    </div>

                    {/* Food Preference */}
                    <div className="flex gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-textMuted">Veg: {info.veg_count}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                        <span className="text-sm text-textMuted">Non-Veg: {info.non_veg_count}</span>
                      </div>
                    </div>

                    {/* Officials List */}
                    {info.officials.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-textDark mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" /> Officials ({info.officials.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {info.officials.map(official => (
                            <div key={official.id} className="flex items-center gap-2 p-2 bg-bgLight rounded-md">
                              <div className="p-1.5 bg-primary/10 rounded">
                                <User className="w-3 h-3 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-textDark truncate">{official.name}</p>
                                <p className="text-xs text-textMuted flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {official.phone}
                                </p>
                              </div>
                              {official.gender && (
                                <Badge variant={official.gender === 'M' || official.gender === 'Male' ? 'primary' : 'light'} className="text-xs">
                                  {official.gender === 'M' || official.gender === 'Male' ? 'M' : 'F'}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Members List */}
                    {info.members.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-textDark mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" /> Members ({info.members.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {info.members.map(member => (
                            <div key={member.id} className="flex items-center gap-2 p-2 bg-bgLight rounded-md">
                              <div className="p-1.5 bg-success/10 rounded">
                                <User className="w-3 h-3 text-success" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-textDark truncate">{member.name}</p>
                                <p className="text-xs text-textMuted flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {member.phone}
                                </p>
                              </div>
                              <Badge variant={member.gender === 'M' || member.gender === 'Male' ? 'primary' : 'light'} className="text-xs">
                                {member.gender === 'M' || member.gender === 'Male' ? 'M' : 'F'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {info.officials.length === 0 && info.members.length === 0 && (
                      <p className="text-sm text-textMuted text-center py-4">No delegates registered from this district</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

