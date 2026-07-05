import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/ui';
import { FileUpload } from '../../components/FileUpload';
import { PhoneField } from '../../components/PhoneField';
import { ArrowLeft, Send } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { getCurrentUnitId } from '../../services/auth';
import { ChangeRequestNavigationState } from '../../types';
import { useActiveUnitMembers, useSubmitMemberInfoChange } from '../../hooks/queries';
import { lazyImport } from '../../utils/chunkLoadError';
import {
  getResidenceChange,
  parseResidenceFormValue,
  ResidenceFormValue,
} from '../../utils/memberResidence';
import {
  getPhoneCountryFromResidence,
  getPhoneValidationError,
  isInternationalResidence,
  normalizePhone,
  phonesEqual,
} from '../../utils/phoneNumber';

const MemberResidenceFields = lazyImport(() =>
  import('../../components/MemberResidenceFields').then((module) => ({
    default: module.MemberResidenceFields,
  })),
);

export const SubmitMemberInfoChange: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as ChangeRequestNavigationState | null) ?? {};
  const fromWizard = Boolean(navState.fromWizard);
  const presetMemberId = navState.memberId ?? 0;
  
  // Get current unit ID from authenticated user
  const currentUnitId = getCurrentUnitId();
  
  // Use TanStack Query
  const { members } = useActiveUnitMembers(Boolean(currentUnitId));
  const submitMutation = useSubmitMemberInfoChange();
  
  const [selectedMemberId, setSelectedMemberId] = useState<number>(presetMemberId);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    dob: '',
    bloodGroup: '',
    qualification: '',
    number: '',
  });
  const [residence, setResidence] = useState<ResidenceFormValue>({
    livesInKerala: null,
    countryId: null,
    stateId: null,
    cityId: null,
  });
  const [reason, setReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const phoneCountry = getPhoneCountryFromResidence(residence);
  const previousPhoneCountryRef = useRef(phoneCountry);

  useEffect(() => {
    if (!currentUnitId) {
      addToast("Please login to access this page", "error");
      navigate('/');
    }
  }, [currentUnitId, addToast, navigate]);

  useEffect(() => {
    if (presetMemberId) {
      setSelectedMemberId(presetMemberId);
    }
  }, [presetMemberId]);

  useEffect(() => {
    // Auto-fill form with selected member's current data
    const member = members.find(m => m.id === selectedMemberId);
    if (member) {
      const parsedResidence = parseResidenceFormValue(member);
      setFormData({
        name: member.name,
        gender: member.gender,
        dob: member.dob,
        bloodGroup: member.bloodGroup || '',
        qualification: member.qualification || '',
        number: member.number || '',
      });
      setResidence(parsedResidence);
      previousPhoneCountryRef.current = getPhoneCountryFromResidence(parsedResidence);
    }
  }, [selectedMemberId, members]);

  useEffect(() => {
    if (previousPhoneCountryRef.current === phoneCountry) return;
    previousPhoneCountryRef.current = phoneCountry;
    setFormData((prev) => (prev.number ? { ...prev, number: '' } : prev));
  }, [phoneCountry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMemberId) {
      addToast("Please select a member", "warning");
      return;
    }
    
    if (!reason.trim()) {
      addToast("Please provide a reason", "warning");
      return;
    }

    const phoneError = getPhoneValidationError(
      formData.number,
      getPhoneCountryFromResidence(residence),
      isInternationalResidence(residence),
    );
    if (phoneError) {
      addToast(phoneError, 'warning');
      return;
    }

    const normalizedNumber =
      normalizePhone(formData.number, getPhoneCountryFromResidence(residence)) ?? formData.number;

    const selectedMember = members.find(m => m.id === selectedMemberId);
    const changes: Record<string, string | number | null> = {};
    
    if (formData.name !== selectedMember?.name) changes.name = formData.name;
    if (formData.gender !== selectedMember?.gender) changes.gender = formData.gender;
    if (formData.dob !== selectedMember?.dob) changes.dob = formData.dob;
    if (formData.bloodGroup !== (selectedMember?.bloodGroup || '')) changes.bloodGroup = formData.bloodGroup;
    if (formData.qualification !== (selectedMember?.qualification || '')) changes.qualification = formData.qualification;
    if (!phonesEqual(normalizedNumber, selectedMember?.number || '')) {
      changes.number = normalizedNumber;
    }

    if (selectedMember) {
      const residenceChange = getResidenceChange(selectedMember, residence);
      if (residenceChange.error) {
        addToast(residenceChange.error, 'warning');
        return;
      }
      if (residenceChange.changed && residenceChange.payload) {
        changes.residenceLocation = residenceChange.payload.residence_location;
        changes.residenceStateId = residenceChange.payload.residence_state_id ?? null;
        changes.residenceCityId = residenceChange.payload.residence_city_id ?? null;
      }
    }

    if (Object.keys(changes).length === 0) {
      addToast("No changes detected", "warning");
      return;
    }

    submitMutation.mutate(
      {
        memberId: selectedMemberId,
        changes,
        reason,
        proof: proofFile || undefined,
      },
      {
        onSuccess: () => navigate('/unit/my-requests'),
      }
    );
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const loading = submitMutation.isPending;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() =>
            fromWizard
              ? navigate('/unit/change-request', { state: { memberId: selectedMemberId } })
              : navigate('/unit/my-requests')
          }
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-textDark">Submit Member Info Change Request</h1>
          <p className="mt-1 text-sm text-textMuted">Request to update member information</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Select Member */}
          <Card>
            <h3 className="text-lg font-bold text-textDark mb-4">
              {fromWizard && selectedMember ? 'Selected Member' : 'Select Member'}
            </h3>
            {fromWizard && selectedMember ? (
              <div className="p-3 bg-gray-50 rounded border border-borderColor">
                <p className="font-medium text-textDark">{selectedMember.name}</p>
                <p className="text-sm text-textMuted mt-1">+91 {selectedMember.number}</p>
              </div>
            ) : (
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              >
                <option value={0}>-- Select a Member --</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} - +91 {member.number}
                  </option>
                ))}
              </select>
            )}
          </Card>

          {/* Edit Member Information */}
          {selectedMember && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-textDark">Member Information</h3>
                <Badge variant="light">Edit the fields you want to change</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>

                <PhoneField
                  label="Mobile Number"
                  value={formData.number}
                  onChange={(number) => setFormData({ ...formData, number })}
                  defaultCountry={phoneCountry}
                />

                {/* DOB */}
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">-- Select Blood Group --</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                {/* Qualification */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-textDark mb-2">
                    Education Qualification / Job
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <Suspense fallback={<p className="text-sm text-textMuted">Loading location fields...</p>}>
                    <MemberResidenceFields value={residence} onChange={setResidence} />
                  </Suspense>
                </div>
              </div>
            </Card>
          )}

          {/* Reason & Proof */}
          {selectedMember && (
            <Card>
              <h3 className="text-lg font-bold text-textDark mb-4">Additional Information</h3>
              
              <div className="space-y-4">
                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    Reason for Change <span className="text-danger">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for information change..."
                    className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    rows={3}
                    required
                  />
                </div>

                {/* Proof */}
                <FileUpload
                  label="Upload Proof"
                  helperText="Upload supporting document for the changes (PDF, PNG, JPG - max 5MB)"
                  onFileSelect={setProofFile}
                  accept=".pdf,.png,.jpg,.jpeg"
                  maxSize={5}
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-borderColor">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    fromWizard
                      ? navigate('/unit/change-request', { state: { memberId: selectedMemberId } })
                      : navigate('/unit/my-requests')
                  }
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </form>
    </div>
  );
};


