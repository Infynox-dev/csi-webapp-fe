import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Card, Badge } from '../../../../components/ui';
import { FileUpload } from '../../../../components/FileUpload';
import { PhoneField } from '../../../../components/PhoneField';
import { useToast } from '../../../../components/Toast';
import { UnitMember } from '../../../../types';
import { useSubmitMemberInfoChange } from '../../../../hooks/queries';
import { WizardFormActions } from '../../components/WizardFormActions';
import { lazyImport } from '../../../../utils/chunkLoadError';
import {
  getResidenceChange,
  parseResidenceFormValue,
  ResidenceFormValue,
} from '../../../../utils/memberResidence';
import {
  getPhoneCountryFromResidence,
  getPhoneValidationError,
  isInternationalResidence,
  normalizePhone,
  phonesEqual,
} from '../../../../utils/phoneNumber';

const MemberResidenceFields = lazyImport(() =>
  import('../../../../components/MemberResidenceFields').then((module) => ({
    default: module.MemberResidenceFields,
  })),
);

interface MemberInfoChangeFormStepProps {
  selectedMember: UnitMember;
  onPrevious: () => void;
  onSuccess: () => void;
}

export const MemberInfoChangeFormStep: React.FC<MemberInfoChangeFormStepProps> = ({
  selectedMember,
  onPrevious,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const submitMutation = useSubmitMemberInfoChange();
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
    const parsedResidence = parseResidenceFormValue(selectedMember);
    setFormData({
      name: selectedMember.name,
      gender: selectedMember.gender,
      dob: selectedMember.dob,
      bloodGroup: selectedMember.bloodGroup || '',
      qualification: selectedMember.qualification || '',
      number: selectedMember.number || '',
    });
    setResidence(parsedResidence);
    previousPhoneCountryRef.current = getPhoneCountryFromResidence(parsedResidence);
  }, [selectedMember]);

  useEffect(() => {
    if (previousPhoneCountryRef.current === phoneCountry) return;
    previousPhoneCountryRef.current = phoneCountry;
    setFormData((prev) => (prev.number ? { ...prev, number: '' } : prev));
  }, [phoneCountry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      addToast('Please provide a reason', 'warning');
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

    const changes: Record<string, string | number | null> = {};
    if (formData.name !== selectedMember.name) changes.name = formData.name;
    if (formData.gender !== selectedMember.gender) changes.gender = formData.gender;
    if (formData.dob !== selectedMember.dob) changes.dob = formData.dob;
    if (formData.bloodGroup !== (selectedMember.bloodGroup || '')) changes.bloodGroup = formData.bloodGroup;
    if (formData.qualification !== (selectedMember.qualification || '')) {
      changes.qualification = formData.qualification;
    }
    if (!phonesEqual(normalizedNumber, selectedMember.number || '')) {
      changes.number = normalizedNumber;
    }

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

    if (Object.keys(changes).length === 0) {
      addToast('No changes detected', 'warning');
      return;
    }

    submitMutation.mutate(
      {
        memberId: selectedMember.id,
        changes,
        reason,
        proof: proofFile || undefined,
      },
      { onSuccess },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-textDark">Member Information</h3>
          <Badge variant="light">Edit the fields you want to change</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">Gender</label>
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
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">Date of Birth</label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">Blood Group</label>
            <select
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">-- Select Blood Group --</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
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

      <Card>
        <h3 className="text-lg font-bold text-textDark mb-4">Additional Information</h3>
        <div className="space-y-4">
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
          <FileUpload
            label="Upload Proof"
            helperText="Upload supporting document for the changes (PDF, PNG, JPG - max 5MB)"
            onFileSelect={setProofFile}
            accept=".pdf,.png,.jpg,.jpeg"
            maxSize={5}
            required
          />
        </div>
        <WizardFormActions onPrevious={onPrevious} isSubmitting={submitMutation.isPending} />
      </Card>
    </form>
  );
};
