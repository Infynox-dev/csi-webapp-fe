import React, { useState } from 'react';
import { formatDateIST } from '../../../../utils/datetime';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '../../../../components/ui';
import { FileUpload } from '../../../../components/FileUpload';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../services/api';
import { UnitMember } from '../../../../types';
import { queryKeys } from '../../../../constants/queryKeys';
import { useTransferDestinations } from '../../../../hooks/queries';
import { SearchableUnitSelect } from '../../../../components/SearchableUnitSelect';
import { WizardFormActions } from '../../components/WizardFormActions';

interface TransferFormStepProps {
  selectedMember: UnitMember;
  onPrevious: () => void;
  onSuccess: () => void;
}

export const TransferFormStep: React.FC<TransferFormStepProps> = ({
  selectedMember,
  onPrevious,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { data: units = [], isLoading: unitsLoading } = useTransferDestinations();
  const [loading, setLoading] = useState(false);
  const [destinationUnitId, setDestinationUnitId] = useState(0);
  const [reason, setReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!destinationUnitId) {
      addToast('Please select a destination unit', 'warning');
      return;
    }
    if (!reason.trim()) {
      addToast('Please provide a reason', 'warning');
      return;
    }
    if (reason.trim().length < 5) {
      addToast('Transfer reason must be at least 5 characters', 'warning');
      return;
    }
    if (!proofFile) {
      addToast('Please upload a proof document', 'warning');
      return;
    }

    try {
      setLoading(true);
      await api.submitTransferRequest({
        memberId: selectedMember.id,
        destinationUnitId,
        reason,
        proof: proofFile,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.myRequests() });
      addToast('Transfer request submitted successfully', 'success');
      onSuccess();
    } catch {
      addToast('Failed to submit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <h3 className="text-lg font-bold text-textDark mb-4">Transfer Details</h3>
        <div className="space-y-4">
          <Card className="bg-blue-50 border-l-4 border-l-primary">
            <h4 className="text-sm font-semibold text-textDark mb-2">Selected Member Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-textMuted">Gender:</span>{' '}
                <span className="font-medium">
                  {selectedMember.gender === 'M' ? 'Male' : 'Female'}
                </span>
              </div>
              <div>
                <span className="text-textMuted">Age:</span>{' '}
                <span className="font-medium">{selectedMember.age} years</span>
              </div>
              <div>
                <span className="text-textMuted">Phone:</span>{' '}
                <span className="font-medium">+91 {selectedMember.number}</span>
              </div>
              <div>
                <span className="text-textMuted">DOB:</span>{' '}
                <span className="font-medium">
                  {formatDateIST(selectedMember.dob)}
                </span>
              </div>
            </div>
          </Card>

          <SearchableUnitSelect
            units={units}
            value={destinationUnitId}
            onChange={setDestinationUnitId}
            isLoading={unitsLoading}
            required
          />

          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              Transfer Reason <span className="text-danger">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for transfer (minimum 5 characters)..."
              className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              rows={4}
              minLength={5}
              required
            />
            <p className="text-xs text-textMuted mt-1">
              {reason.trim().length}/5 characters minimum
            </p>
          </div>

          <FileUpload
            label="Upload Proof"
            helperText="Supported formats: PDF, PNG, JPG (max 5MB)"
            onFileSelect={setProofFile}
            accept=".pdf,.png,.jpg,.jpeg"
            maxSize={5}
            required
          />
        </div>
        <WizardFormActions onPrevious={onPrevious} isSubmitting={loading} />
      </Card>
    </form>
  );
};
