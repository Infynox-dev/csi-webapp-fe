import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { Plus, Edit2, Trash2, X, Users, Shield, Phone, MapPin, Search } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable, Column } from '../../components/DataTable';
import { Portal } from '../../components/Portal';
import { 
  useConferencesAdmin, 
  useConferenceOfficialsAdmin, 
  useAddConferenceOfficial, 
  useUpdateConferenceOfficial, 
  useDeleteConferenceOfficial 
} from '../../hooks/queries';

interface DistrictOfficial {
  id: number;
  name: string;
  phone: string;
  district: string | null;
  conference_id: number | null;
  conference_official_count: number;
  conference_member_count: number;
}

interface Conference {
  id: number;
  title: string;
  details: string;
  added_on: string;
  status: 'Active' | 'Inactive' | 'Completed';
}

interface UnitMember {
  id: number;
  name: string;
  number: string;
  gender: string;
  dob: string;
  unitName?: string;
  districtName?: string;
}

export const ConferenceAdminOfficials: React.FC = () => {
  const { addToast } = useToast();
  
  // Use TanStack Query
  const { data: officials = [], isLoading: officialsLoading } = useConferenceOfficialsAdmin();
  const { data: conferences = [], isLoading: conferencesLoading } = useConferencesAdmin();
  const addOfficialMutation = useAddConferenceOfficial();
  const updateOfficialMutation = useUpdateConferenceOfficial();
  const deleteOfficialMutation = useDeleteConferenceOfficial();
  
  const loading = officialsLoading || conferencesLoading;
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedOfficial, setSelectedOfficial] = useState<DistrictOfficial | null>(null);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [officialToDelete, setOfficialToDelete] = useState<DistrictOfficial | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    conference_id: 0,
    member_id: 0,
    conference_official_count: 5,
    conference_member_count: 10,
  });

  // Member search for adding new official
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UnitMember[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<UnitMember | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal || showDeleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal, showDeleteConfirm]);

  const searchMembers = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      // Use the units members API to search
      const response = await api.getUnitMembers();
      const members = response.data.filter((m: any) => 
        m.name?.toLowerCase().includes(term.toLowerCase()) ||
        m.number?.includes(term)
      ).slice(0, 10);
      setSearchResults(members);
    } catch (err) {
      addToast("Failed to search members", "error");
    } finally {
      setSearchLoading(false);
    }
  };

  const openModal = (type: 'add' | 'edit', official?: DistrictOfficial) => {
    setModalType(type);
    setSelectedOfficial(official || null);
    setSelectedMember(null);
    setMemberSearchTerm('');
    setSearchResults([]);
    
    if (type === 'edit' && official) {
      setFormData({
        conference_id: official.conference_id || 0,
        member_id: 0,
        conference_official_count: official.conference_official_count,
        conference_member_count: official.conference_member_count,
      });
    } else {
      const activeConference = conferences.find(c => c.status === 'Active');
      setFormData({
        conference_id: activeConference?.id || 0,
        member_id: 0,
        conference_official_count: 5,
        conference_member_count: 10,
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOfficial(null);
    setSelectedMember(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (modalType === 'add') {
      if (!selectedMember) {
        addToast("Please select a member", "error");
        return;
      }
      addOfficialMutation.mutate(
        { conference_id: formData.conference_id, member_id: selectedMember.id },
        { onSuccess: closeModal }
      );
    } else if (modalType === 'edit' && selectedOfficial) {
      updateOfficialMutation.mutate(
        {
          officialId: selectedOfficial.id,
          data: {
            conference_official_count: formData.conference_official_count,
            conference_member_count: formData.conference_member_count,
          },
        },
        { onSuccess: closeModal }
      );
    }
  };

  const handleDelete = async () => {
    if (!officialToDelete) return;
    
    deleteOfficialMutation.mutate(officialToDelete.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setOfficialToDelete(null);
      },
    });
  };

  const filteredOfficials = officials.filter(official =>
    official.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    official.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    official.phone?.includes(searchTerm)
  );

  const columns: Column<DistrictOfficial>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (official) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-textDark">{official.name}</p>
            <p className="text-xs text-textMuted flex items-center gap-1">
              <Phone className="w-3 h-3" /> {official.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'district',
      header: 'District',
      render: (official) => (
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-textMuted" />
          <span>{official.district || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'conference_official_count',
      header: 'Official Limit',
      render: (official) => (
        <Badge variant="primary">{official.conference_official_count} officials</Badge>
      ),
    },
    {
      key: 'conference_member_count',
      header: 'Member Limit',
      render: (official) => (
        <Badge variant="light">{official.conference_member_count} members</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (official) => (
        <div className="flex gap-2">
          <Button variant="warning" size="sm" onClick={() => openModal('edit', official)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            onClick={() => {
              setOfficialToDelete(official);
              setShowDeleteConfirm(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">District Officials</h1>
          <p className="mt-1 text-sm text-textMuted">Manage district officials who can register conference delegates</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => openModal('add')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Official
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-textMuted">Total Officials</p>
              <p className="text-2xl font-bold text-textDark">{officials.length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success/10 rounded-lg">
              <Users className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-textMuted">Total Official Slots</p>
              <p className="text-2xl font-bold text-textDark">
                {officials.reduce((sum, o) => sum + o.conference_official_count, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning/10 rounded-lg">
              <Users className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-textMuted">Total Member Slots</p>
              <p className="text-2xl font-bold text-textDark">
                {officials.reduce((sum, o) => sum + o.conference_member_count, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type="text"
              placeholder="Search by name, district, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white text-textDark border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-textMuted/50"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredOfficials.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted mb-4">
              {searchTerm ? 'No officials match your search' : 'No district officials found'}
            </p>
            {!searchTerm && (
              <Button variant="primary" size="sm" onClick={() => openModal('add')}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Official
              </Button>
            )}
          </div>
        ) : (
          <DataTable
            data={filteredOfficials}
            columns={columns}
            keyField="id"
          />
        )}
      </Card>

      {/* Add/Edit Modal - Using Portal to render at body level */}
      {showModal && (
        <Portal>
          {/* Overlay - darker for better focus */}
          <div 
            className="fixed inset-0 bg-black/35 backdrop-blur z-[100] transition-opacity" 
            onClick={closeModal}
            aria-hidden="true"
          />
          
          {/* Modal Container */}
          <div 
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="official-modal-title"
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md pointer-events-auto animate-slide-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-borderColor">
                <h3 id="official-modal-title" className="text-lg font-semibold text-textDark">
                  {modalType === 'add' ? 'Add District Official' : 'Edit Official Limits'}
                </h3>
                <button 
                  onClick={closeModal} 
                  className="p-2 -mr-2 rounded-lg text-textMuted hover:text-textDark hover:bg-bgLight transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                {modalType === 'add' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-textDark mb-1.5">
                        Conference <span className="text-danger">*</span>
                      </label>
                      <select
                        value={formData.conference_id}
                        onChange={(e) => setFormData({ ...formData, conference_id: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-white text-textDark border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                        required
                      >
                        <option value={0}>Select Conference</option>
                        {conferences.filter(c => c.status === 'Active').map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textDark mb-1.5">
                        Search Member <span className="text-danger">*</span>
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                        <input
                          type="text"
                          value={memberSearchTerm}
                          onChange={(e) => {
                            setMemberSearchTerm(e.target.value);
                            searchMembers(e.target.value);
                          }}
                          placeholder="Search by name or phone..."
                          className="w-full pl-10 pr-4 py-2 bg-white text-textDark border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-textMuted text-sm"
                        />
                      </div>
                      
                      {searchLoading && (
                        <p className="text-sm text-textMuted mt-2">Searching...</p>
                      )}
                      
                      {searchResults.length > 0 && !selectedMember && (
                        <div className="mt-2 border border-borderColor rounded-lg max-h-48 overflow-y-auto bg-white shadow-sm">
                          {searchResults.map(member => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => {
                                setSelectedMember(member);
                                setSearchResults([]);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-bgLight border-b border-borderColor last:border-b-0"
                            >
                              <p className="font-medium text-textDark text-sm">{member.name}</p>
                              <p className="text-xs text-textMuted">
                                {member.number}
                                {' • '}
                                {member.unitName || 'Unknown Unit'}
                                {member.districtName ? ` • ${member.districtName}` : ''}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {selectedMember && (
                        <div className="mt-2 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium text-textDark text-sm">{selectedMember.name}</p>
                            <p className="text-xs text-textMuted">
                              {selectedMember.number}
                              {' • '}
                              {selectedMember.unitName || 'Unknown Unit'}
                              {selectedMember.districtName ? ` • ${selectedMember.districtName}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedMember(null)}
                            className="p-1.5 hover:bg-white rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-1.5">
                      Official Limit <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.conference_official_count}
                      onChange={(e) => setFormData({ ...formData, conference_official_count: parseInt(e.target.value) })}
                      min="1"
                      className="w-full px-3 py-2 bg-white text-textDark border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                      required
                    />
                    <p className="text-xs text-textMuted mt-1">Max officials allowed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textDark mb-1.5">
                      Member Limit <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.conference_member_count}
                      onChange={(e) => setFormData({ ...formData, conference_member_count: parseInt(e.target.value) })}
                      min="1"
                      className="w-full px-3 py-2 bg-white text-textDark border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                      required
                    />
                    <p className="text-xs text-textMuted mt-1">Max members allowed</p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2 pt-4 border-t border-borderColor">
                  <Button type="button" variant="outline" size="sm" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    {modalType === 'add' ? 'Add Official' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Remove District Official"
        message={`Are you sure you want to remove "${officialToDelete?.name}" as a district official? They will no longer be able to register delegates.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setOfficialToDelete(null);
        }}
      />
    </div>
  );
};

