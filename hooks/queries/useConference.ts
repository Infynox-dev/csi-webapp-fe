import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../constants/queryKeys';
import { useToast } from '../../components/Toast';

// ============ ADMIN QUERIES ============

// Get all conferences (admin)
export const useConferencesAdmin = () => {
  return useQuery({
    queryKey: queryKeys.conference.list(),
    queryFn: async () => {
      const data = await api.getConferencesAdmin();
      return data;
    },
  });
};

// Get conference info for admin
export const useConferenceAdminInfo = (conferenceId: number) => {
  return useQuery({
    queryKey: queryKeys.conference.adminInfo(conferenceId),
    queryFn: async () => {
      const data = await api.getConferenceInfoAdmin(conferenceId);
      return data;
    },
    enabled: !!conferenceId,
  });
};

// Get conference payment info for admin
export const useConferencePaymentInfoAdmin = (conferenceId: number) => {
  return useQuery({
    queryKey: queryKeys.conference.payments(conferenceId),
    queryFn: async () => {
      const data = await api.getConferencePaymentInfoAdmin(conferenceId);
      return data;
    },
    enabled: !!conferenceId,
  });
};

// Conference module settings (delegate fee)
export const useConferenceSettingsAdmin = () => {
  return useQuery({
    queryKey: queryKeys.conference.settings(),
    queryFn: async () => api.getConferenceSettingsAdmin(),
  });
};

export const useUpdateConferenceSettings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async (data: { delegate_fee: number }) =>
      api.updateConferenceSettingsAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.settings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.all });
      addToast('Delegate fee updated', 'success');
    },
    onError: (err: Error) => {
      addToast(err.message || 'Failed to update fee', 'error');
    },
  });
};

// Get conference officials (admin)
export const useConferenceOfficialsAdmin = () => {
  return useQuery({
    queryKey: queryKeys.conference.officials(),
    queryFn: async () => {
      const data = await api.getConferenceOfficialsAdmin();
      return data;
    },
  });
};

// ============ OFFICIAL QUERIES ============

// Get conference official view
export const useConferenceOfficialView = () => {
  return useQuery({
    queryKey: queryKeys.conference.officialView(),
    queryFn: async () => {
      const data = await api.getConferenceOfficialView();
      return data;
    },
  });
};

// Get conference delegates (official)
export const useConferenceDelegatesOfficial = () => {
  return useQuery({
    queryKey: queryKeys.conference.delegates(),
    queryFn: async () => {
      const data = await api.getConferenceDelegatesOfficial();
      return data;
    },
  });
};

export const useConferenceOfficialPayment = () => {
  return useQuery({
    queryKey: queryKeys.conference.officialPayment(),
    queryFn: async () => api.getConferenceOfficialPayment(),
  });
};

export const useApproveConferencePayment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async ({
      conferenceId,
      paymentId,
      paidAmount,
    }: {
      conferenceId: number;
      paymentId: number;
      paidAmount: number;
    }) => api.approveConferencePaymentAdmin(conferenceId, paymentId, paidAmount),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.payments(vars.conferenceId) });
      addToast('Payment approved', 'success');
    },
    onError: (error: Error) => {
      addToast(error.message || 'Failed to approve payment', 'error');
    },
  });
};

export const useDeclineConferencePayment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async ({
      conferenceId,
      paymentId,
      rejectionNote,
    }: {
      conferenceId: number;
      paymentId: number;
      rejectionNote: string;
    }) => api.declineConferencePaymentAdmin(conferenceId, paymentId, rejectionNote),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.payments(vars.conferenceId) });
      addToast('Payment declined', 'success');
    },
    onError: (error: Error) => {
      addToast(error.message || 'Failed to decline payment', 'error');
    },
  });
};

// Get conference export data
export const useConferenceExportData = () => {
  return useQuery({
    queryKey: queryKeys.conference.exportData(),
    queryFn: async () => {
      const data = await api.getConferenceExportData();
      return data;
    },
  });
};

// ============ PUBLIC QUERIES ============

export const usePublicConferences = () => {
  return useQuery({
    queryKey: queryKeys.conference.publicList(),
    queryFn: async () => {
      const data = await api.getPublicConferences();
      return data;
    },
  });
};

// ============ ADMIN MUTATIONS ============

// Create conference
export const useCreateConference = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: { title: string; details?: string }) => {
      return api.createConferenceAdmin(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.list() });
      addToast('Conference created successfully', 'success');
    },
    onError: () => {
      addToast('Failed to create conference', 'error');
    },
  });
};

// Update conference
export const useUpdateConference = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ conferenceId, data }: { conferenceId: number; data: { title?: string; details?: string; status?: string } }) => {
      return api.updateConferenceAdmin(conferenceId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.list() });
      addToast('Conference updated successfully', 'success');
    },
    onError: () => {
      addToast('Failed to update conference', 'error');
    },
  });
};

// Delete conference
export const useDeleteConference = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (conferenceId: number) => {
      return api.deleteConferenceAdmin(conferenceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.list() });
      addToast('Conference deleted successfully', 'success');
    },
    onError: () => {
      addToast('Failed to delete conference', 'error');
    },
  });
};

// Add conference official
export const useAddConferenceOfficial = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: { conference_id: number; member_id: number }) => {
      return api.addConferenceOfficialAdmin(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.officials() });
      addToast('Official added successfully', 'success');
    },
    onError: (error: Error) => {
      addToast(error.message || 'Failed to add official', 'error');
    },
  });
};

// Update conference official
export const useUpdateConferenceOfficial = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ officialId, data }: { officialId: number; data: { conference_official_count?: number; conference_member_count?: number } }) => {
      return api.updateConferenceOfficialAdmin(officialId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.officials() });
      addToast('Official updated successfully', 'success');
    },
    onError: () => {
      addToast('Failed to update official', 'error');
    },
  });
};

// Delete conference official
export const useDeleteConferenceOfficial = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (officialId: number) => {
      return api.deleteConferenceOfficialAdmin(officialId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.officials() });
      addToast('Official deleted successfully', 'success');
    },
    onError: () => {
      addToast('Failed to delete official', 'error');
    },
  });
};

// ============ OFFICIAL MUTATIONS ============

// Add delegate
export const useAddDelegate = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ memberId, data }: { memberId: number; data?: { member_id: number; food_preference?: 'veg' | 'non-veg'; accommodation_required?: boolean } }) => {
      return api.addConferenceDelegateOfficial(memberId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.delegates() });
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.officialView() });
      addToast('Delegate added successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to add delegate', 'error');
    },
  });
};

// Remove delegate
export const useRemoveDelegate = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (memberId: number) => {
      return api.removeConferenceDelegateOfficial(memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.delegates() });
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.officialView() });
      addToast('Delegate removed successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to remove delegate', 'error');
    },
  });
};

// Submit payment
export const useSubmitConferencePayment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: { amount_to_pay: number; payment_reference?: string }) => {
      return api.submitConferencePaymentOfficial(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.delegates() });
      addToast('Payment submitted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to submit payment', 'error');
    },
  });
};

// Upload payment proof
export const useUploadConferencePaymentProof = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ file, paymentData }: { file: File; paymentData?: { payment_reference?: string } }) => {
      return api.uploadConferencePaymentProofOfficial(file, paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.delegates() });
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.officialPayment() });
      addToast('Payment proof uploaded successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to upload payment proof', 'error');
    },
  });
};

// Set food preference
export const useSetFoodPreference = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: { conference_id: number; veg_count: number; non_veg_count: number }) => {
      return api.setConferenceFoodPreference(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conference.delegates() });
      addToast('Food preference saved successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to save food preference', 'error');
    },
  });
};


