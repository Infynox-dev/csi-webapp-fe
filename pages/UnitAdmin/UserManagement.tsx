import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import {
  Users,
  KeyRound,
  Building,
  UserCog,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Check,
  MapPin,
  XCircle,
  Phone,
  Plus,
  UserPlus,
  Droplets,
  Lock,
  Settings2,
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Portal } from '../../components/Portal';
import { downloadBase64Spreadsheet } from '../../utils/downloadSpreadsheet';
import {
  useUsers,
  useUsersSummary,
  useResetPassword,
  useBulkResetPasswords,
  useResetAllByType,
  useDistrictOfficials,
  useDistrictsWithOfficialStatus,
  useCreateDistrictOfficial,
  useCreateBloodBankUser,
  useUpdateBloodBankUser,
  useSiteSettings,
  useUpdateSiteSettings,
} from '../../hooks/queries';
import { PhoneField } from '../../components/PhoneField';
import { getPhoneValidationError, normalizePhone, validatePhone } from '../../utils/phoneNumber';

type UserType = 'all' | 'UNIT' | 'DISTRICT_OFFICIAL' | 'BLOOD_BANK';

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

const generatePassword = (length = 12): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let pw = '';
  for (let i = 0; i < length; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
  return pw;
};

// ── Reusable toggle ──────────────────────────────────────────────────────────
const Toggle: React.FC<{
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}> = ({ checked, disabled, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
      checked ? 'bg-primary' : 'bg-gray-200'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const UserManagement: React.FC = () => {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<UserType>('all');
  const [selectedUsers, setSelectedUsers] = useState<OfficialUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const [showSingleResetConfirm, setShowSingleResetConfirm] = useState(false);
  const [showBulkResetConfirm, setShowBulkResetConfirm] = useState(false);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);
  const [userToReset, setUserToReset] = useState<OfficialUser | null>(null);

  const [showCreateOfficialModal, setShowCreateOfficialModal] = useState(false);
  const [createOfficialForm, setCreateOfficialForm] = useState({ district_id: 0, official_name: '', phone_number: '' });
  const [createdOfficialResult, setCreatedOfficialResult] = useState<{
    username: string;
    district_name: string;
    default_password_hint: string;
  } | null>(null);

  const [showCreateBloodBankModal, setShowCreateBloodBankModal] = useState(false);
  const [showEditBloodBankModal, setShowEditBloodBankModal] = useState(false);
  const [bloodBankForm, setBloodBankForm] = useState({
    username: '',
    email: '',
    first_name: '',
    phone_number: '',
    password: '',
    is_active: true,
  });
  const [editingBloodBankUser, setEditingBloodBankUser] = useState<OfficialUser | null>(null);

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: allUsers = [], isLoading: allUsersLoading, refetch: refetchAll } = useUsers({
    user_type: activeTab === 'all' ? undefined
      : activeTab === 'UNIT' ? 'UNIT'
      : activeTab === 'BLOOD_BANK' ? 'BLOOD_BANK'
      : undefined,
    search: searchTerm || undefined,
  });
  const { data: districtOfficials = [], isLoading: districtOfficialsLoading, refetch: refetchDistrictOfficials } = useDistrictOfficials();
  const { data: districtsWithStatus = [], isLoading: districtsLoading } = useDistrictsWithOfficialStatus();
  const { data: summary } = useUsersSummary();
  const { data: siteSettings } = useSiteSettings();
  const updateSiteSettings = useUpdateSiteSettings();
  const [bgSaving, setBgSaving] = React.useState(false);

  const toggleBloodDonorAccess = async (field: 'blood_donor_district_access' | 'blood_donor_unit_access', value: boolean) => {
    setBgSaving(true);
    try {
      await updateSiteSettings.mutateAsync({ [field]: value });
      addToast('Access setting updated', 'success');
    } catch {
      addToast('Failed to update access settings', 'error');
    } finally {
      setBgSaving(false);
    }
  };

  const users: OfficialUser[] = useMemo(() => {
    if (activeTab === 'DISTRICT_OFFICIAL') {
      return districtOfficials.map(d => ({
        id: d.id,
        username: d.username,
        email: d.email,
        phone_number: d.phone_number,
        user_type: d.user_type || 'DISTRICT_OFFICIAL',
        is_active: d.is_active,
        unit_name: d.official_name,
        district_name: d.district_name,
      }));
    }
    return allUsers;
  }, [activeTab, allUsers, districtOfficials]);

  const isLoading = activeTab === 'DISTRICT_OFFICIAL' ? districtOfficialsLoading : allUsersLoading;
  const refetch = () => (activeTab === 'DISTRICT_OFFICIAL' ? refetchDistrictOfficials() : refetchAll());

  const resetPasswordMutation = useResetPassword();
  const bulkResetMutation = useBulkResetPasswords();
  const resetAllMutation = useResetAllByType();
  const createOfficialMutation = useCreateDistrictOfficial();
  const createBloodBankMutation = useCreateBloodBankUser();
  const updateBloodBankMutation = useUpdateBloodBankUser();

  const districtStats = useMemo(() => {
    const total = districtsWithStatus.length;
    const withOfficial = districtsWithStatus.filter(d => d.has_official).length;
    return { total, withOfficial, withoutOfficial: total - withOfficial };
  }, [districtsWithStatus]);

  const tabs = [
    { id: 'all' as UserType,             label: 'All Users',          icon: <Users size={15} />,   count: summary?.total || 0 },
    { id: 'UNIT' as UserType,            label: 'Unit Officials',      icon: <Building size={15} />, count: summary?.unit_officials || 0 },
    { id: 'DISTRICT_OFFICIAL' as UserType, label: 'District Officials', icon: <UserCog size={15} />, count: districtOfficials.length || summary?.district_officials || 0 },
    { id: 'BLOOD_BANK' as UserType,       label: 'Blood Bank Users',    icon: <Droplets size={15} />, count: summary?.blood_bank_users || 0 },
  ];

  const districtsWithoutOfficials = useMemo(() => districtsWithStatus.filter(d => !d.has_official), [districtsWithStatus]);

  // ── Password modal helpers ────────────────────────────────────────────────
  const openPasswordModal = () => { setNewPassword(generatePassword()); setShowPassword(false); setPasswordCopied(false); setShowPasswordModal(true); };
  const copyPassword = async () => {
    try { await navigator.clipboard.writeText(newPassword); setPasswordCopied(true); setTimeout(() => setPasswordCopied(false), 2000); }
    catch { addToast('Failed to copy password', 'error'); }
  };
  const handleSingleReset = (user: OfficialUser) => { setUserToReset(user); openPasswordModal(); };
  const confirmSingleReset = () => { if (!userToReset || !newPassword) return; setShowPasswordModal(false); setShowSingleResetConfirm(true); };
  const executeSingleReset = () => {
    if (!userToReset || !newPassword) return;
    resetPasswordMutation.mutate({ user_id: userToReset.id, new_password: newPassword }, {
      onSuccess: (data) => { addToast(`Password reset for ${data.username}`, 'success'); setShowSingleResetConfirm(false); setUserToReset(null); setNewPassword(''); },
      onError: () => setShowSingleResetConfirm(false),
    });
  };
  const confirmBulkReset  = () => { if (!newPassword) return; setShowPasswordModal(false); setShowBulkResetConfirm(true); };
  const executeBulkReset = () => {
    bulkResetMutation.mutate({ user_ids: selectedUsers.map(u => u.id), new_password: newPassword }, {
      onSuccess: (data) => { addToast(`Passwords reset for ${data.total_reset} of ${data.total_requested} users`, data.total_reset === data.total_requested ? 'success' : 'warning'); setShowBulkResetConfirm(false); setSelectedUsers([]); setNewPassword(''); refetch(); },
      onError: () => setShowBulkResetConfirm(false),
    });
  };
  const handleResetAll = () => {
    if (activeTab === 'all') { addToast('Select a specific tab first', 'warning'); return; }
    if (activeTab === 'UNIT') {
      setShowResetAllConfirm(true);
      return;
    }
    openPasswordModal();
  };
  const confirmResetAll = () => { if (!newPassword || activeTab === 'all') return; setShowPasswordModal(false); setShowResetAllConfirm(true); };
  const executeResetAll = () => {
    if (activeTab === 'all') return;
    const isUnitResetAll = activeTab === 'UNIT';
    resetAllMutation.mutate({
      user_type: activeTab,
      new_password: isUnitResetAll ? undefined : newPassword,
      export_spreadsheet: isUnitResetAll,
      unique_passwords: isUnitResetAll,
    }, {
      onSuccess: (data) => {
        if (data.spreadsheet_base64 && data.spreadsheet_filename) {
          downloadBase64Spreadsheet(data.spreadsheet_base64, data.spreadsheet_filename);
        }
        addToast(
          isUnitResetAll
            ? `Unique passwords generated for ${data.total_reset} unit officials. Excel file downloaded.`
            : `Passwords reset for ${data.total_reset} ${activeTab === 'BLOOD_BANK' ? 'blood bank' : 'district'} officials`,
          'success',
        );
        setShowResetAllConfirm(false);
        setNewPassword('');
        refetch();
      },
      onError: () => setShowResetAllConfirm(false),
    });
  };
  const openCreateOfficialModal = () => { setCreateOfficialForm({ district_id: 0, official_name: '', phone_number: '' }); setCreatedOfficialResult(null); setShowCreateOfficialModal(true); };
  const handleCreateOfficial = () => {
    if (!createOfficialForm.district_id || !createOfficialForm.official_name || !createOfficialForm.phone_number) { addToast('Please fill in all fields', 'error'); return; }
    const phoneError = getPhoneValidationError(createOfficialForm.phone_number);
    if (phoneError) { addToast(phoneError, 'error'); return; }
    createOfficialMutation.mutate({
      ...createOfficialForm,
      phone_number: normalizePhone(createOfficialForm.phone_number) ?? createOfficialForm.phone_number,
    }, {
      onSuccess: (data) => { setCreatedOfficialResult({ username: data.username, district_name: data.district_name, default_password_hint: data.default_password_hint }); refetchDistrictOfficials(); },
    });
  };
  const closeCreateOfficialModal = () => { setShowCreateOfficialModal(false); setCreateOfficialForm({ district_id: 0, official_name: '', phone_number: '' }); setCreatedOfficialResult(null); };

  const openCreateBloodBankModal = () => {
    setBloodBankForm({ username: '', email: '', first_name: '', phone_number: '', password: generatePassword(), is_active: true });
    setShowCreateBloodBankModal(true);
  };

  const openEditBloodBankModal = (user: OfficialUser) => {
    setEditingBloodBankUser(user);
    setBloodBankForm({
      username: user.username,
      email: user.email || '',
      first_name: user.first_name || '',
      phone_number: user.phone_number || '',
      password: '',
      is_active: user.is_active,
    });
    setShowEditBloodBankModal(true);
  };

  const handleCreateBloodBankUser = () => {
    if (!bloodBankForm.username.trim() || !bloodBankForm.email.trim() || !bloodBankForm.password) {
      addToast('Username, email, and password are required', 'error');
      return;
    }
    if (bloodBankForm.phone_number) {
      const phoneError = getPhoneValidationError(bloodBankForm.phone_number);
      if (phoneError) {
        addToast(phoneError, 'error');
        return;
      }
    }
    createBloodBankMutation.mutate({
      username: bloodBankForm.username.trim(),
      email: bloodBankForm.email.trim(),
      first_name: bloodBankForm.first_name.trim() || undefined,
      phone_number: bloodBankForm.phone_number
        ? normalizePhone(bloodBankForm.phone_number) ?? bloodBankForm.phone_number
        : undefined,
      password: bloodBankForm.password,
    }, {
      onSuccess: () => {
        setShowCreateBloodBankModal(false);
        refetch();
      },
    });
  };

  const handleUpdateBloodBankUser = () => {
    if (!editingBloodBankUser) return;
    if (!bloodBankForm.email.trim()) {
      addToast('Email is required', 'error');
      return;
    }
    if (bloodBankForm.phone_number) {
      const phoneError = getPhoneValidationError(bloodBankForm.phone_number);
      if (phoneError) {
        addToast(phoneError, 'error');
        return;
      }
    }
    updateBloodBankMutation.mutate({
      userId: editingBloodBankUser.id,
      data: {
        email: bloodBankForm.email.trim(),
        first_name: bloodBankForm.first_name.trim() || undefined,
        phone_number: bloodBankForm.phone_number
          ? normalizePhone(bloodBankForm.phone_number) ?? bloodBankForm.phone_number
          : undefined,
        is_active: bloodBankForm.is_active,
        password: bloodBankForm.password || undefined,
      },
    }, {
      onSuccess: () => {
        setShowEditBloodBankModal(false);
        setEditingBloodBankUser(null);
        refetch();
      },
    });
  };

  const getUserTypeLabel = (userType: string) => {
    if (userType === 'UNIT') return 'Unit Official';
    if (userType === 'BLOOD_BANK') return 'Blood Bank User';
    return 'District Official';
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: ColumnDef<OfficialUser, any>[] = useMemo(() => [
    {
      accessorKey: 'username',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            row.original.user_type === 'UNIT' ? 'bg-primary/10'
              : row.original.user_type === 'BLOOD_BANK' ? 'bg-red-50'
              : 'bg-amber-100'
          }`}>
            {row.original.user_type === 'UNIT'
              ? <Building className="w-4 h-4 text-primary" />
              : row.original.user_type === 'BLOOD_BANK'
                ? <Droplets className="w-4 h-4 text-red-500" />
                : <UserCog className="w-4 h-4 text-amber-600" />}
          </div>
          <div>
            <p className="font-semibold text-textDark text-sm">{row.original.username}</p>
            <p className="text-xs text-textMuted">{getUserTypeLabel(row.original.user_type)}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'unit_name',
      header: 'Unit / District',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.user_type === 'BLOOD_BANK' && row.original.first_name && (
            <p className="font-medium text-textDark">{row.original.first_name}</p>
          )}
          {row.original.unit_name && <p className="font-medium text-textDark">{row.original.unit_name}</p>}
          {row.original.district_name && <p className="text-textMuted text-xs mt-0.5">{row.original.district_name}</p>}
          {row.original.user_type === 'BLOOD_BANK' && !row.original.first_name && (
            <span className="text-textMuted text-xs">Blood Bank access only</span>
          )}
          {row.original.user_type !== 'BLOOD_BANK' && !row.original.unit_name && !row.original.district_name && (
            <span className="text-textMuted">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'phone_number',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.phone_number && (
            <p className="font-mono text-textDark flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-textMuted" />
              {row.original.phone_number}
            </p>
          )}
          {row.original.email && row.original.email !== row.original.username && (
            <p className="text-textMuted text-xs mt-0.5">{row.original.email}</p>
          )}
          {!row.original.phone_number && (!row.original.email || row.original.email === row.original.username) && (
            <span className="text-textMuted">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'light'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
      size: 90,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.user_type === 'BLOOD_BANK' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditBloodBankModal(row.original)}
              className="gap-1.5"
            >
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSingleReset(row.original)}
            disabled={resetPasswordMutation.isPending}
            className="gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Reset
          </Button>
        </div>
      ),
      size: 120,
    },
  ], [resetPasswordMutation.isPending]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-slide-in">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">User Management</h1>
            <p className="mt-0.5 text-sm text-textMuted">Manage login credentials and feature access</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {activeTab === 'DISTRICT_OFFICIAL' && (
            <Button variant="primary" onClick={openCreateOfficialModal}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add District Official
            </Button>
          )}
          {activeTab === 'BLOOD_BANK' && (
            <Button variant="primary" onClick={openCreateBloodBankModal}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Blood Bank User
            </Button>
          )}
          {selectedUsers.length > 0 && (
            <Button variant="primary" onClick={() => { if (selectedUsers.length > 0) { setUserToReset(null); openPasswordModal(); } }} disabled={bulkResetMutation.isPending}>
              <RefreshCw className={`w-4 h-4 mr-2 ${bulkResetMutation.isPending ? 'animate-spin' : ''}`} />
              Reset {selectedUsers.length} Selected
            </Button>
          )}
          {activeTab !== 'all' && selectedUsers.length === 0 && (
            <Button variant="danger" onClick={handleResetAll} disabled={resetAllMutation.isPending}>
              <Shield className="w-4 h-4 mr-2" />
              Reset All {activeTab === 'UNIT' ? 'Unit' : activeTab === 'BLOOD_BANK' ? 'Blood Bank' : 'District'}
            </Button>
          )}
        </div>
      </div>

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Users',        value: summary?.total || 0,                                                icon: <Users className="w-5 h-5 text-primary" />,         bg: 'bg-primary/10' },
          { label: 'Unit Officials',     value: summary?.unit_officials || 0,                                       icon: <Building className="w-5 h-5 text-blue-600" />,      bg: 'bg-blue-50' },
          { label: 'District Officials', value: districtOfficials.length || summary?.district_officials || 0,       icon: <UserCog className="w-5 h-5 text-amber-600" />,       bg: 'bg-amber-50' },
          { label: 'Blood Bank Users',   value: summary?.blood_bank_users || 0,                                       icon: <Droplets className="w-5 h-5 text-red-500" />,        bg: 'bg-red-50' },
          { label: 'Selected',           value: selectedUsers.length,                                               icon: <CheckCircle2 className="w-5 h-5 text-success" />,    bg: 'bg-green-50' },
        ].map((s) => (
          <Card key={s.label} className="py-3.5 px-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-textDark leading-none">{s.value}</p>
                <p className="text-xs text-textMuted mt-0.5">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Feature Access ───────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-textDark">Feature Access Control</h3>
            <p className="text-xs text-textMuted">Configure which user groups can access optional features</p>
          </div>
        </div>

        {/* Blood Donor Search section */}
        <div className="rounded-xl border border-borderColor overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/70 border-b border-borderColor">
            <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
              <Droplets className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-textDark">Blood Donor Search</p>
              <p className="text-xs text-textMuted">Admins and dedicated Blood Bank users always have access — enable for other roles below</p>
            </div>
            <Badge variant="success" className="text-xs">Admin + Blood Bank</Badge>
          </div>

          <div className="divide-y divide-borderColor">
            {[
              {
                field: 'blood_donor_district_access' as const,
                icon: <Shield className="w-4 h-4 text-amber-500" />,
                bg: 'bg-amber-50',
                label: 'District Officials',
                desc: 'Allow district officials to search blood donors',
                value: siteSettings?.blood_donor_district_access ?? false,
              },
              {
                field: 'blood_donor_unit_access' as const,
                icon: <Building className="w-4 h-4 text-blue-500" />,
                bg: 'bg-blue-50',
                label: 'Unit Officials',
                desc: 'Allow unit officials to search blood donors',
                value: siteSettings?.blood_donor_unit_access ?? false,
              },
            ].map((row) => (
              <div key={row.field} className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 ${row.bg} rounded-lg flex items-center justify-center`}>
                    {row.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-textDark">{row.label}</p>
                    <p className="text-xs text-textMuted">{row.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${row.value ? 'text-success' : 'text-textMuted'}`}>
                    {row.value ? 'Enabled' : 'Disabled'}
                  </span>
                  <Toggle checked={row.value} disabled={bgSaving} onChange={(v) => toggleBloodDonorAccess(row.field, v)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-full sm:w-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedUsers([]); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-textMuted hover:text-textDark'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-textMuted'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Context hint ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
        <AlertCircle className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
        <span>
          {activeTab === 'all'
            ? 'Viewing all users. Select a specific tab to enable bulk reset options.'
            : activeTab === 'UNIT'
              ? 'Unit officials manage unit registrations and member data.'
              : activeTab === 'BLOOD_BANK'
                ? 'Blood bank users can only access the Blood Donor Search page after login.'
              : 'District officials manage Kalamela and Conference registrations.'}
          {' '}Passwords can be reset individually, in bulk, or all at once.
        </span>
      </div>

      {/* ── District Status Overview ──────────────────────────────────────── */}
      {activeTab === 'DISTRICT_OFFICIAL' && (
        <Card noPadding className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-borderColor bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-textDark">District Official Status</h3>
                <p className="text-xs text-textMuted">Overview of districts and their assigned officials</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-textMuted">Has Official ({districtStats.withOfficial})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-textMuted">No Official ({districtStats.withoutOfficial})</span>
              </span>
            </div>
          </div>
          <div className="p-4">
            {districtsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse p-4 bg-gray-100 rounded-xl h-20" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {districtsWithStatus.map((district) => (
                  <div
                    key={district.id}
                    className={`p-4 rounded-xl border transition-all ${
                      district.has_official
                        ? 'bg-success/5 border-success/25 hover:border-success/50'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {district.has_official
                        ? <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                        : <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                      <p className="font-semibold text-textDark text-sm truncate">{district.name}</p>
                    </div>
                    {district.has_official ? (
                      <div className="ml-6 space-y-0.5">
                        {district.official_name && (
                          <p className="text-xs text-textMuted truncate">{district.official_name}</p>
                        )}
                        {district.official_phone && (
                          <p className="text-xs text-textMuted flex items-center gap-1">
                            <Phone className="w-3 h-3" />{district.official_phone}
                          </p>
                        )}
                        <p className="text-xs font-medium text-primary truncate">
                          {district.official_username || district.login_username || district.name}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-textMuted ml-6">No official assigned</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Users Table ──────────────────────────────────────────────────── */}
      <Card noPadding className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-borderColor bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              activeTab === 'DISTRICT_OFFICIAL' ? 'bg-amber-50' : 'bg-primary/10'
            }`}>
              {activeTab === 'DISTRICT_OFFICIAL'
                ? <UserCog className="w-4 h-4 text-amber-600" />
                : <Users className="w-4 h-4 text-primary" />}
            </div>
            <div>
              <h3 className="font-bold text-textDark">
                {activeTab === 'all' ? 'All Users'
                  : activeTab === 'UNIT' ? 'Unit Officials'
                  : activeTab === 'BLOOD_BANK' ? 'Blood Bank Users'
                  : 'District Officials'}
              </h3>
              <p className="text-xs text-textMuted">{users.length} user{users.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-textMuted">{selectedUsers.length} selected</span>
              <Button variant="outline" size="sm" onClick={() => setSelectedUsers([])}>
                Clear
              </Button>
            </div>
          )}
        </div>
        <div className="p-4">
          <DataTable
            data={users}
            columns={columns}
            searchPlaceholder="Search by username, phone…"
            showSearch
            showPagination
            showRowSelection
            pageSize={10}
            onRowSelectionChange={setSelectedUsers}
            isLoading={isLoading}
            emptyMessage="No users found"
            emptyIcon={<Users className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>

      {/* ── Password Modal ───────────────────────────────────────────────── */}
      {showPasswordModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[100]" onClick={() => setShowPasswordModal(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-in" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-borderColor flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-textDark">Set New Password</h3>
                  <p className="text-xs text-textMuted">
                    {userToReset
                      ? `For ${userToReset.username}`
                      : selectedUsers.length > 0
                        ? `For ${selectedUsers.length} selected users`
                        : `For all ${activeTab === 'UNIT' ? 'unit' : 'district'} officials`}
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-textDark mb-1.5">
                    New Password <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2.5 pr-20 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                      minLength={6}
                      maxLength={128}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1.5 text-textMuted hover:text-textDark rounded-md hover:bg-bgLight">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button type="button" onClick={copyPassword} className="p-1.5 text-textMuted hover:text-textDark rounded-md hover:bg-bgLight">
                        {passwordCopied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-textMuted mt-1.5">Must be 6–128 characters</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewPassword(generatePassword())}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-borderColor rounded-lg text-sm text-textMuted hover:text-textDark hover:border-gray-400 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Generate random password
                </button>
              </div>
              <div className="px-6 py-4 border-t border-borderColor flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowPasswordModal(false); setUserToReset(null); setNewPassword(''); }}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (newPassword.length < 6) { addToast('Password must be at least 6 characters', 'error'); return; }
                    if (userToReset) confirmSingleReset();
                    else if (selectedUsers.length > 0) confirmBulkReset();
                    else confirmResetAll();
                  }}
                  disabled={newPassword.length < 6}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ── Confirm Dialogs ───────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={showSingleResetConfirm}
        title="Confirm Password Reset"
        message={`Reset password for "${userToReset?.username}"? Make sure you have copied the new password.`}
        confirmLabel="Reset Password"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={executeSingleReset}
        onCancel={() => { setShowSingleResetConfirm(false); setUserToReset(null); setNewPassword(''); }}
      />
      <ConfirmDialog
        isOpen={showBulkResetConfirm}
        title="Confirm Bulk Password Reset"
        message={`Reset passwords for ${selectedUsers.length} users? All selected users will receive the same new password.`}
        confirmLabel={`Reset ${selectedUsers.length} Passwords`}
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={executeBulkReset}
        onCancel={() => { setShowBulkResetConfirm(false); setNewPassword(''); }}
      />
      <ConfirmDialog
        isOpen={showResetAllConfirm}
        title="⚠️ Reset ALL Passwords"
        message={
          activeTab === 'UNIT'
            ? `This will generate a unique new password for all ${summary?.unit_officials ?? 0} unit officials. An Excel file with each unit's login credentials will download automatically. This may take up to a minute for many units. This cannot be undone.`
            : `This will reset passwords for ALL ${activeTab === 'BLOOD_BANK' ? 'blood bank' : 'district'} officials (${activeTab === 'BLOOD_BANK' ? summary?.blood_bank_users : summary?.district_officials} users). This cannot be undone.`
        }
        confirmLabel={`Reset All ${activeTab === 'UNIT' ? 'Unit' : activeTab === 'BLOOD_BANK' ? 'Blood Bank' : 'District'} Official Passwords`}
        cancelLabel="Cancel"
        variant="danger"
        isLoading={resetAllMutation.isPending}
        onConfirm={executeResetAll}
        onCancel={() => { if (!resetAllMutation.isPending) { setShowResetAllConfirm(false); setNewPassword(''); } }}
      />

      {/* ── Create District Official Modal ───────────────────────────────── */}
      {showCreateOfficialModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[100]" onClick={closeCreateOfficialModal} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-in" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-borderColor flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-textDark">Create District Official</h3>
                  <p className="text-xs text-textMuted">New login account for a district official</p>
                </div>
              </div>

              {createdOfficialResult ? (
                <div className="px-6 py-6">
                  <div className="flex flex-col items-center gap-2 mb-6">
                    <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-success" />
                    </div>
                    <h4 className="font-bold text-textDark">Official Created!</h4>
                    <p className="text-sm text-textMuted">Share these credentials with the official</p>
                  </div>
                  <div className="space-y-2 bg-bgLight p-4 rounded-xl text-sm">
                    {[
                      { label: 'District',  value: createdOfficialResult.district_name },
                      { label: 'Username',  value: createdOfficialResult.username, mono: true },
                      { label: 'Password',  value: createdOfficialResult.default_password_hint },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center">
                        <span className="text-textMuted">{row.label}</span>
                        <span className={`font-medium text-textDark ${row.mono ? 'font-mono text-primary' : ''}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    Default password is the phone number. Advise the official to change it after first login.
                  </div>
                  <Button variant="primary" className="w-full mt-5" onClick={closeCreateOfficialModal}>Done</Button>
                </div>
              ) : (
                <>
                  <div className="px-6 py-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-textDark mb-1.5">
                        District <span className="text-danger">*</span>
                      </label>
                      <select
                        value={createOfficialForm.district_id}
                        onChange={(e) => setCreateOfficialForm(prev => ({ ...prev, district_id: Number(e.target.value) }))}
                        className="w-full px-3 py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                      >
                        <option value={0}>Select a district…</option>
                        {districtsWithoutOfficials.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      {districtsWithoutOfficials.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1.5">All districts already have officials assigned</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-textDark mb-1.5">
                        Official Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={createOfficialForm.official_name}
                        onChange={(e) => setCreateOfficialForm(prev => ({ ...prev, official_name: e.target.value }))}
                        placeholder="Full name"
                        className="w-full px-3 py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <PhoneField
                      label={<>Phone Number <span className="text-danger">*</span></>}
                      value={createOfficialForm.phone_number}
                      onChange={(phone_number) => setCreateOfficialForm(prev => ({ ...prev, phone_number }))}
                      showIcon
                      required
                    />
                    <p className="text-xs text-textMuted mt-1.5">Used as the default password</p>
                  </div>
                  <div className="px-6 py-4 border-t border-borderColor flex justify-end gap-2">
                    <Button variant="outline" onClick={closeCreateOfficialModal}>Cancel</Button>
                    <Button
                      variant="primary"
                      onClick={handleCreateOfficial}
                      isLoading={createOfficialMutation.isPending}
                      disabled={createOfficialMutation.isPending || !createOfficialForm.district_id || !createOfficialForm.official_name || !validatePhone(createOfficialForm.phone_number)}
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Create Official
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </Portal>
      )}
      {/* ── Create Blood Bank User Modal ───────────────────────────────────── */}
      {showCreateBloodBankModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[100]" onClick={() => setShowCreateBloodBankModal(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-in" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-borderColor flex items-center gap-3">
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-textDark">Create Blood Bank User</h3>
                  <p className="text-xs text-textMuted">Dedicated access to Blood Donor Search only</p>
                </div>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-textDark mb-1.5">Username <span className="text-danger">*</span></label>
                  <input type="text" value={bloodBankForm.username} onChange={(e) => setBloodBankForm(p => ({ ...p, username: e.target.value }))} placeholder="Login username" className="w-full px-3 py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-textDark mb-1.5">Email <span className="text-danger">*</span></label>
                  <input type="email" value={bloodBankForm.email} onChange={(e) => setBloodBankForm(p => ({ ...p, email: e.target.value }))} placeholder="user@example.com" className="w-full px-3 py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-textDark mb-1.5">Display Name</label>
                  <input type="text" value={bloodBankForm.first_name} onChange={(e) => setBloodBankForm(p => ({ ...p, first_name: e.target.value }))} placeholder="Full name (optional)" className="w-full px-3 py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <PhoneField
                  label="Phone"
                  value={bloodBankForm.phone_number}
                  onChange={(phone_number) => setBloodBankForm(p => ({ ...p, phone_number }))}
                  placeholder="10-digit phone (optional)"
                />
                <div>
                  <label className="block text-sm font-semibold text-textDark mb-1.5">Password <span className="text-danger">*</span></label>
                  <div className="flex gap-2">
                    <input type="text" value={bloodBankForm.password} onChange={(e) => setBloodBankForm(p => ({ ...p, password: e.target.value }))} className="flex-1 px-3 py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm" />
                    <Button variant="outline" size="sm" onClick={() => setBloodBankForm(p => ({ ...p, password: generatePassword() }))}>Generate</Button>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-borderColor flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateBloodBankModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleCreateBloodBankUser} isLoading={createBloodBankMutation.isPending} disabled={createBloodBankMutation.isPending || !bloodBankForm.username.trim() || !bloodBankForm.email.trim() || bloodBankForm.password.length < 6}>
                  <Plus className="w-4 h-4 mr-1.5" />Create User
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ── Edit Blood Bank User Modal ─────────────────────────────────────── */}
      {showEditBloodBankModal && editingBloodBankUser && (
        <Portal>
          <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[100]" onClick={() => { setShowEditBloodBankModal(false); setEditingBloodBankUser(null); }} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-in" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-borderColor flex items-center gap-3">
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-textDark">Edit Blood Bank User</h3>
                  <p className="text-xs text-textMuted font-mono">{editingBloodBankUser.username}</p>
                </div>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-textDark mb-1.5">Email <span className="text-danger">*</span></label>
                  <input type="email" value={bloodBankForm.email} onChange={(e) => setBloodBankForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-textDark mb-1.5">Display Name</label>
                  <input type="text" value={bloodBankForm.first_name} onChange={(e) => setBloodBankForm(p => ({ ...p, first_name: e.target.value }))} className="w-full px-3 py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <PhoneField
                  label="Phone"
                  value={bloodBankForm.phone_number}
                  onChange={(phone_number) => setBloodBankForm(p => ({ ...p, phone_number }))}
                />
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-semibold text-textDark">Active</p>
                    <p className="text-xs text-textMuted">Inactive users cannot log in</p>
                  </div>
                  <Toggle checked={bloodBankForm.is_active} onChange={(v) => setBloodBankForm(p => ({ ...p, is_active: v }))} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-textDark mb-1.5">New Password</label>
                  <div className="flex gap-2">
                    <input type="text" value={bloodBankForm.password} onChange={(e) => setBloodBankForm(p => ({ ...p, password: e.target.value }))} placeholder="Leave blank to keep current" className="flex-1 px-3 py-2.5 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm" />
                    <Button variant="outline" size="sm" onClick={() => setBloodBankForm(p => ({ ...p, password: generatePassword() }))}>Generate</Button>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-borderColor flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowEditBloodBankModal(false); setEditingBloodBankUser(null); }}>Cancel</Button>
                <Button variant="primary" onClick={handleUpdateBloodBankUser} isLoading={updateBloodBankMutation.isPending} disabled={updateBloodBankMutation.isPending || !bloodBankForm.email.trim()}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
