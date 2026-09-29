import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../constants/queryKeys';
import { useToast } from '../../components/Toast';

// ============ TYPES ============

interface UserFilters {
  user_type?: 'UNIT' | 'DISTRICT_OFFICIAL' | 'BLOOD_BANK';
  district_id?: number;
  search?: string;
  is_active?: boolean;
}

interface OfficialUser {
  id: number;
  username: string;
  email?: string;
  phone_number?: string;
  first_name?: string;
  user_type: string;
  is_active: boolean;
  unit_name?: string;
  district_name?: string;
}

interface DistrictOfficial {
  id: number;
  username: string;
  email?: string;
  phone_number?: string;
  user_type: string;
  is_active: boolean;
  district_id?: number;
  district_name?: string;
  official_name?: string;
}

interface DistrictWithStatus {
  id: number;
  name: string;
  has_official: boolean;
  login_username?: string;
  official_id?: number;
  official_name?: string;
  official_phone?: string;
  official_username?: string;
}

interface UsersSummary {
  unit_officials: number;
  district_officials: number;
  blood_bank_users: number;
  total: number;
}

interface ResetPasswordResponse {
  message: string;
  user_id: number;
  username: string;
}

interface BulkResetResponse {
  message: string;
  total_requested: number;
  total_reset: number;
  reset_users: Array<{
    user_id: number;
    username: string;
    user_type: string;
    unit_name?: string;
    district_name?: string;
    phone_number?: string;
    display_name?: string;
  }>;
  failed_users: Array<{
    user_id: number;
    reason: string;
  }>;
  spreadsheet_filename?: string;
  spreadsheet_base64?: string;
}

interface CreateDistrictOfficialResponse {
  message: string;
  official_id: number;
  username: string;
  district_name: string;
  default_password_hint: string;
}

// ============ QUERIES ============

// Get all users with optional filters
export const useUsers = (filters?: UserFilters) => {
  return useQuery({
    queryKey: queryKeys.userManagement.list(filters),
    queryFn: async (): Promise<OfficialUser[]> => {
      const data = await api.getUsers(filters);
      return data;
    },
  });
};

// Get users summary (counts by type)
export const useUsersSummary = () => {
  return useQuery({
    queryKey: queryKeys.userManagement.summary(),
    queryFn: async (): Promise<UsersSummary> => {
      const data = await api.getUsersSummary();
      return data;
    },
  });
};

// Get all district officials (dedicated endpoint)
export const useDistrictOfficials = () => {
  return useQuery({
    queryKey: queryKeys.userManagement.districtOfficials(),
    queryFn: async (): Promise<DistrictOfficial[]> => {
      const data = await api.getDistrictOfficials();
      return data;
    },
  });
};

// Get districts with official status
export const useDistrictsWithOfficialStatus = () => {
  return useQuery({
    queryKey: queryKeys.userManagement.districtsWithStatus(),
    queryFn: async (): Promise<DistrictWithStatus[]> => {
      const data = await api.getDistrictsWithOfficialStatus();
      return data;
    },
  });
};

// ============ MUTATIONS ============

// Reset single user password
export const useResetPassword = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: { user_id: number; new_password: string }): Promise<ResetPasswordResponse> => {
      return api.resetUserPassword(data);
    },
    onSuccess: () => {
      // Invalidate users list to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.userManagement.all });
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to reset password';
      addToast(message, 'error');
    },
  });
};

// Bulk reset passwords
export const useBulkResetPasswords = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: { user_ids: number[]; new_password: string }): Promise<BulkResetResponse> => {
      return api.bulkResetPasswords(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userManagement.all });
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to reset passwords';
      addToast(message, 'error');
    },
  });
};

// Reset all passwords by type
export const useResetAllByType = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      user_type: 'UNIT' | 'DISTRICT_OFFICIAL' | 'BLOOD_BANK';
      new_password?: string;
      district_id?: number;
      export_spreadsheet?: boolean;
      unique_passwords?: boolean;
    }): Promise<BulkResetResponse> => {
      return api.resetAllPasswordsByType(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userManagement.all });
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to reset passwords';
      addToast(message, 'error');
    },
  });
};

// Create district official
export const useCreateDistrictOfficial = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      district_id: number;
      official_name: string;
      phone_number: string;
    }): Promise<CreateDistrictOfficialResponse> => {
      return api.createDistrictOfficial(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userManagement.all });
      addToast(`District official created: ${data.username}`, 'success');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to create district official';
      addToast(message, 'error');
    },
  });
};

// Create blood bank user
export const useCreateBloodBankUser = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      username: string;
      email: string;
      first_name?: string;
      phone_number?: string;
      password: string;
    }) => api.createBloodBankUser(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userManagement.all });
      addToast(`Blood bank user created: ${data.username}`, 'success');
    },
    onError: (error: Error) => {
      addToast(error.message || 'Failed to create blood bank user', 'error');
    },
  });
};

// Update blood bank user
export const useUpdateBloodBankUser = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: number;
      data: {
        email?: string;
        first_name?: string;
        phone_number?: string;
        is_active?: boolean;
        password?: string;
      };
    }) => api.updateBloodBankUser(userId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userManagement.all });
      addToast(`Updated ${data.username}`, 'success');
    },
    onError: (error: Error) => {
      addToast(error.message || 'Failed to update blood bank user', 'error');
    },
  });
};

