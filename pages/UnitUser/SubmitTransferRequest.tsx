import React, { useEffect, useState } from 'react';
import { formatDateIST } from '../../utils/datetime';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button } from '../../components/ui';
import { FileUpload } from '../../components/FileUpload';
import { ArrowLeft, Send } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { getCurrentUnitId } from '../../services/auth';
import { ChangeRequestNavigationState } from '../../types';
import { useActiveUnitMembers, useTransferDestinations } from '../../hooks/queries';
import { SearchableUnitSelect } from '../../components/SearchableUnitSelect';

export const SubmitTransferRequest: React.FC = () => {
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
  const { data: units = [], isLoading: unitsLoading } = useTransferDestinations(Boolean(currentUnitId));
  
  const [loading, setLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number>(presetMemberId);
  const [destinationUnitId, setDestinationUnitId] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMemberId) {
      addToast("Please select a member", "warning");
      return;
    }
    
    if (!destinationUnitId) {
      addToast("Please select a destination unit", "warning");
      return;
    }
    
    if (!reason.trim()) {
      addToast("Please provide a reason", "warning");
      return;
    }

    if (reason.trim().length < 5) {
      addToast("Transfer reason must be at least 5 characters", "warning");
      return;
    }

    if (!proofFile) {
      addToast("Please upload a proof document", "warning");
      return;
    }

    try {
      setLoading(true);
      await api.submitTransferRequest({
        memberId: selectedMemberId,
        destinationUnitId,
        reason,
        proof: proofFile,
      });
      addToast("Transfer request submitted successfully", "success");
      navigate('/unit/my-requests');
    } catch (err) {
      addToast("Failed to submit request", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);

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
          <h1 className="text-2xl font-bold text-textDark">Submit Unit Transfer Request</h1>
          <p className="mt-1 text-sm text-textMuted">Request to transfer a member to another unit</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <h3 className="text-lg font-bold text-textDark mb-4">Transfer Details</h3>
          
          <div className="space-y-4">
            {/* Select Member */}
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                {fromWizard && selectedMember ? 'Selected Member' : 'Select Member'}{' '}
                {!fromWizard && <span className="text-danger">*</span>}
              </label>
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
            </div>

            {/* Display selected member details */}
            {selectedMember && (
              <Card className="bg-blue-50 border-l-4 border-l-primary">
                <h4 className="text-sm font-semibold text-textDark mb-2">Selected Member Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-textMuted">Gender:</span> <span className="font-medium">{selectedMember.gender === 'M' ? 'Male' : 'Female'}</span></div>
                  <div><span className="text-textMuted">Age:</span> <span className="font-medium">{selectedMember.age} years</span></div>
                  <div><span className="text-textMuted">Phone:</span> <span className="font-medium">+91 {selectedMember.number}</span></div>
                  <div><span className="text-textMuted">DOB:</span> <span className="font-medium">{formatDateIST(selectedMember.dob)}</span></div>
                </div>
              </Card>
            )}

            <SearchableUnitSelect
              units={units}
              value={destinationUnitId}
              onChange={setDestinationUnitId}
              isLoading={unitsLoading}
              required
            />

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Transfer Reason <span className="text-danger">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for transfer (e.g., family relocation, job transfer, marriage, higher studies)..."
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                rows={4}
                minLength={5}
                required
              />
              <p className="text-xs text-textMuted mt-1">
                {reason.trim().length}/5 characters minimum
              </p>
            </div>

            {/* Proof Upload */}
            <FileUpload
              label="Upload Proof"
              helperText="Supported formats: PDF, PNG, JPG (max 5MB)"
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
      </form>
    </div>
  );
};


