import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { formatDateIST } from '../../utils/datetime';
import { Card, Badge, Button } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { RemovalPaymentImpact } from '../../components/RegistrationPaymentLedger';
import { Download, Users, Trash2 } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { UnitMember, ResidenceLocation, RESIDENCE_LOCATION_OPTIONS, RemovalPaymentImpactPreview } from '../../types';
import { getMemberResidenceLabel } from '../../utils/memberResidence';
import { useMembers, useRemoveUnitMember, useBulkRemoveUnitMembers, useSiteSettings } from '../../hooks/queries';

const MIN_REASON_LENGTH = 5;

type DeleteMode = 'single' | 'bulk' | null;

const isMemberArchiveEligible = (
  member: UnitMember,
  minDob: string,
  maxDob: string,
): boolean => member.dob < minDob || member.dob > maxDob;

export const ViewAllMembers: React.FC = () => {
  const { addToast } = useToast();
  const [locationFilter, setLocationFilter] = useState<ResidenceLocation | '' | 'NOT_SET'>('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { data: siteSettings } = useSiteSettings();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const minDob = siteSettings?.member_min_dob ?? '1990-01-01';
  const maxDob = siteSettings?.member_max_dob ?? '2011-12-31';

  const { data: members = [], isPending, isFetching, isError, error } = useMembers(undefined, {
    residenceLocation: locationFilter && locationFilter !== 'NOT_SET' ? locationFilter : undefined,
    missingResidenceLocation: locationFilter === 'NOT_SET',
    search: debouncedSearch || undefined,
  });

  const tableLoading = isPending || isFetching;
  const [selectedRows, setSelectedRows] = useState<UnitMember[]>([]);
  const [deleteMode, setDeleteMode] = useState<DeleteMode>(null);
  const [memberToDelete, setMemberToDelete] = useState<UnitMember | null>(null);
  const [confirmNotArchival, setConfirmNotArchival] = useState(false);
  const [removalPreview, setRemovalPreview] = useState<RemovalPaymentImpactPreview[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const removeMember = useRemoveUnitMember();
  const bulkRemove = useBulkRemoveUnitMembers();

  const deleteTargets = useMemo(
    () => (deleteMode === 'bulk' ? selectedRows : memberToDelete ? [memberToDelete] : []),
    [deleteMode, selectedRows, memberToDelete],
  );

  const hasArchiveEligibleTargets = useMemo(
    () => deleteTargets.some((member) => isMemberArchiveEligible(member, minDob, maxDob)),
    [deleteTargets, minDob, maxDob],
  );

  const handleExport = async () => {
    try {
      await api.exportData('members');
      addToast('Members data exported successfully', 'success');
    } catch {
      addToast('Failed to export data', 'error');
    }
  };

  const openSingleDelete = useCallback((member: UnitMember) => {
    setConfirmNotArchival(false);
    setMemberToDelete(member);
    setDeleteMode('single');
  }, []);

  const openBulkDelete = () => {
    if (selectedRows.length === 0) {
      addToast('Please select at least one member', 'warning');
      return;
    }
    setConfirmNotArchival(false);
    setDeleteMode('bulk');
  };

  const closeDeleteDialog = () => {
    setDeleteMode(null);
    setMemberToDelete(null);
    setConfirmNotArchival(false);
    setRemovalPreview(null);
  };

  useEffect(() => {
    if (deleteMode === null || deleteTargets.length === 0) {
      setRemovalPreview(null);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    api
      .previewMemberRemovalPaymentImpact(deleteTargets.map((m) => m.id))
      .then((result) => {
        if (!cancelled) setRemovalPreview(result.impacts);
      })
      .catch(() => {
        if (!cancelled) setRemovalPreview(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deleteMode, deleteTargets]);

  const handleConfirmDelete = async (remarks?: string) => {
    const reason = (remarks || '').trim();
    if (reason.length < MIN_REASON_LENGTH) {
      addToast(`Please provide a reason of at least ${MIN_REASON_LENGTH} characters.`, 'error');
      return;
    }

    try {
      if (deleteMode === 'single' && memberToDelete) {
        await removeMember.mutateAsync({
          memberId: memberToDelete.id,
          reason,
          confirmNotArchival: hasArchiveEligibleTargets,
        });
        setSelectedRows((prev) => prev.filter((row) => row.id !== memberToDelete.id));
      } else if (deleteMode === 'bulk') {
        await bulkRemove.mutateAsync({
          member_ids: selectedRows.map((row) => row.id),
          reason,
          confirm_not_archival: hasArchiveEligibleTargets,
        });
        setSelectedRows([]);
      }
      closeDeleteDialog();
    } catch {
      // Toast handled by mutation hooks
    }
  };

  const isDeleting = removeMember.isPending || bulkRemove.isPending;

  const deleteDialogTitle =
    deleteMode === 'bulk'
      ? `Remove ${selectedRows.length} member(s)?`
      : `Remove ${memberToDelete?.name ?? 'member'}?`;

  const deleteDialogMessage = hasArchiveEligibleTargets
    ? 'One or more selected members are outside the configured age range and should normally be handled via Admin → Archive Members (seasonal archival). Admin removal is separate: it deletes the member permanently and notifies the unit. It does not create an archived record that can be restored.'
    : deleteMode === 'bulk'
      ? 'These members will be permanently removed from active rosters (not seasonally archived). Affected units will be notified with your reason.'
      : 'This member will be permanently removed from the active roster (not seasonally archived). The unit will be notified with your reason.';

  const columns = useMemo<ColumnDef<UnitMember, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium text-textDark">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'unitName',
        header: 'Unit',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">{row.original.unitName}</span>
        ),
      },
      {
        accessorKey: 'number',
        header: 'Contact',
        cell: ({ row }) => (
          <span className="font-mono text-textMuted text-sm">+91 {row.original.number}</span>
        ),
        size: 140,
      },
      {
        accessorKey: 'age',
        header: 'Age / DOB',
        cell: ({ row }) => (
          <div>
            <span className="text-textDark font-medium block">{row.original.age} years</span>
            <span className="text-xs text-textMuted">{formatDateIST(row.original.dob)}</span>
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: 'gender',
        header: 'Gender',
        cell: ({ row }) => (
          <Badge variant="light">{row.original.gender === 'M' ? 'Male' : 'Female'}</Badge>
        ),
        size: 80,
      },
      {
        accessorKey: 'qualification',
        header: 'Qualification',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">{row.original.qualification || '-'}</span>
        ),
      },
      {
        accessorKey: 'bloodGroup',
        header: 'Blood Group',
        cell: ({ row }) => (
          <span className="text-textMuted">{row.original.bloodGroup || '-'}</span>
        ),
        size: 100,
      },
      {
        accessorKey: 'residenceLocation',
        header: 'Living Location',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">
            {getMemberResidenceLabel({
              residence_location: row.original.residenceLocation,
              residence_state_id: row.original.residenceStateId,
              residence_city_id: row.original.residenceCityId,
              residence_state_name: row.original.residenceStateName,
              residence_city_name: row.original.residenceCityName,
              residence_country_name: row.original.residenceCountryName,
            })}
          </span>
        ),
        size: 180,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-danger hover:text-danger hover:bg-red-50"
            onClick={() => openSingleDelete(row.original)}
            aria-label={`Remove ${row.original.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        ),
        size: 56,
        enableSorting: false,
      },
    ],
    [openSingleDelete],
  );

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Unit Members</h1>
          <p className="mt-1 text-sm text-textMuted">View all unit members across districts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50">
          <h3 className="text-lg font-bold text-textDark">Unit Members Details</h3>
          <div className="flex items-center gap-2">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value as ResidenceLocation | '')}
              className="px-3 py-2 border border-borderColor rounded-md bg-white text-sm"
            >
              <option value="">All Locations</option>
              <option value="NOT_SET">Not set</option>
              {RESIDENCE_LOCATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {selectedRows.length > 0 && (
              <Button variant="danger" size="sm" onClick={openBulkDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Selected ({selectedRows.length})
              </Button>
            )}
          </div>
        </div>
        <div className="p-4">
          {isError && debouncedSearch && (
            <p className="mb-3 text-sm text-danger">
              Search failed{(error as Error)?.message ? `: ${(error as Error).message}` : ''}. Try logging in again.
            </p>
          )}
          <DataTable
            data={members}
            columns={columns}
            isLoading={tableLoading}
            showRowSelection={true}
            onRowSelectionChange={setSelectedRows}
            searchPlaceholder="Search by name, unit, qualification..."
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            serverSideSearch
            pageSize={20}
            emptyMessage={
              isError && debouncedSearch
                ? 'Search could not be completed'
                : debouncedSearch
                  ? 'No members match your search'
                  : 'No members found'
            }
            emptyIcon={<Users className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>

      <ConfirmDialog
        isOpen={deleteMode !== null}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        title={deleteDialogTitle}
        message={deleteDialogMessage}
        confirmText="Remove member"
        variant="danger"
        showRemarksField
        remarksLabel="Reason for removal (required)"
        remarksPlaceholder={`Explain why this member is being removed (minimum ${MIN_REASON_LENGTH} characters)...`}
        isLoading={isDeleting}
        showExtraCheckbox={hasArchiveEligibleTargets}
        extraCheckboxLabel="I confirm this is an intentional admin removal, not seasonal age archiving."
        extraCheckboxChecked={confirmNotArchival}
        onExtraCheckboxChange={setConfirmNotArchival}
      >
        {previewLoading && (
          <p className="text-xs text-textMuted">Loading payment impact preview…</p>
        )}
        {!previewLoading &&
          removalPreview?.map((impact) => (
            <RemovalPaymentImpact
              key={impact.registered_user_id}
              applies={impact.applies}
              reason={impact.reason}
              unitLabel={impact.unit_name ?? impact.username}
              membersToRemove={impact.members_to_remove ?? deleteTargets.length}
              memberFee={impact.member_fee}
              current={impact.current}
              projected={impact.projected}
              feeChange={impact.fee_change}
            />
          ))}
      </ConfirmDialog>
    </div>
  );
};
