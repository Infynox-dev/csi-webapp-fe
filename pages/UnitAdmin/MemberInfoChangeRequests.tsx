import React, { useState, useMemo } from 'react';
import { formatDateIST } from '../../utils/datetime';
import { Card, Badge, IconButton } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { FileText, Check, X, RotateCcw } from 'lucide-react';
import { ProofViewButton } from '../../components/ProofDocumentViewer';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MemberInfoChangeRequest, RequestStatus, getResidenceLocationLabel } from '../../types';
import { useMemberInfoChangeRequests, useRequestActions } from '../../hooks/queries';
import {
  REQUEST_STATUS_FILTER,
  enumMatchFilter,
  nonSortableActionColumn,
  textIncludesFilter,
} from './adminTableUtils';

export const MemberInfoChangeRequests: React.FC = () => {
  // Use TanStack Query
  const { data: requests = [], isLoading: loading } = useMemberInfoChangeRequests();
  const { approve, reject, revert, isProcessing } = useRequestActions('Member Info Change');
  
  const [selectedRequest, setSelectedRequest] = useState<MemberInfoChangeRequest | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | 'revert' | null>(null);

  const openDialog = (request: MemberInfoChangeRequest, action: 'approve' | 'reject' | 'revert') => {
    setSelectedRequest(request);
    setDialogAction(action);
  };

  const closeDialog = () => {
    setSelectedRequest(null);
    setDialogAction(null);
  };

  const handleConfirmAction = async (remarks?: string) => {
    if (!selectedRequest || !dialogAction) return;
    
    const params = { requestId: selectedRequest.id, remarks };
    
    if (dialogAction === 'approve') {
      approve.mutate(params, { onSuccess: closeDialog });
    } else if (dialogAction === 'reject') {
      reject.mutate(params, { onSuccess: closeDialog });
    } else if (dialogAction === 'revert') {
      revert.mutate(params, { onSuccess: closeDialog });
    }
  };

  const getDialogConfig = () => {
    if (!selectedRequest || !dialogAction) return null;
    
    const configs = {
      approve: {
        title: 'Approve Member Info Change',
        message: `Are you sure you want to approve the information change request for ${selectedRequest.memberName}?`,
        confirmText: 'Approve',
        variant: 'success' as const,
      },
      reject: {
        title: 'Reject Member Info Change',
        message: `Are you sure you want to reject the information change request for ${selectedRequest.memberName}?`,
        confirmText: 'Reject',
        variant: 'danger' as const,
        showRemarksField: true,
        remarksLabel: 'Rejection Reason',
      },
      revert: {
        title: 'Revert Member Info Change',
        message: `Are you sure you want to revert this approved information change for ${selectedRequest.memberName}?`,
        confirmText: 'Revert',
        variant: 'warning' as const,
        showRemarksField: true,
        remarksLabel: 'Revert Reason',
      },
    };
    
    return configs[dialogAction];
  };

  const getStatusBadge = (status: RequestStatus) => {
    const variants = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
    };
    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  const formatChangeList = (changes: MemberInfoChangeRequest['changes']) => {
    const changeList: string[] = [];
    if (changes.name) changeList.push(`Name: ${changes.name}`);
    if (changes.gender) changeList.push(`Gender: ${changes.gender}`);
    if (changes.dob) changeList.push(`DOB: ${changes.dob}`);
    if (changes.bloodGroup) changeList.push(`Blood Group: ${changes.bloodGroup}`);
    if (changes.qualification) changeList.push(`Qualification: ${changes.qualification}`);
    if (changes.number) changeList.push(`Mobile: ${changes.number}`);
    if (changes.residenceLocation) {
      changeList.push(`Location: ${getResidenceLocationLabel(changes.residenceLocation)}`);
    }
    return changeList;
  };

  const columns = useMemo<ColumnDef<MemberInfoChangeRequest, any>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Created Date',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">
            {formatDateIST(row.original.createdAt)}
          </span>
        ),
        filterFn: textIncludesFilter,
        size: 120,
      },
      {
        accessorKey: 'unitName',
        header: 'Unit Name',
        cell: ({ row }) => (
          <span className="font-medium text-textDark">
            {row.original.unitName || '—'}
          </span>
        ),
        filterFn: textIncludesFilter,
      },
      {
        accessorKey: 'memberName',
        header: 'Member Name',
        cell: ({ row }) => (
          <span className="font-medium text-textDark">{row.original.memberName}</span>
        ),
        filterFn: textIncludesFilter,
      },
      {
        id: 'changes',
        header: 'Requested Changes',
        accessorFn: (row) => formatChangeList(row.changes || {}).join(' '),
        cell: ({ row }) => {
          const changeList = formatChangeList(row.original.changes || {});
          
          return (
            <div className="text-sm text-textMuted">
              {changeList.length > 0 ? (
                changeList.map((change, idx) => (
                  <div key={idx}>{change}</div>
                ))
              ) : (
                'No changes'
              )}
            </div>
          );
        },
        filterFn: textIncludesFilter,
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm line-clamp-2">{row.original.reason}</span>
        ),
        filterFn: textIncludesFilter,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.original.status),
        filterFn: enumMatchFilter,
        size: 100,
      },
      {
        id: 'proof',
        header: 'Proof',
        cell: ({ row }) => (
          <ProofViewButton
            proof={row.original.proof}
            title="Member Info Change Proof"
            subtitle={row.original.memberName}
          />
        ),
        ...nonSortableActionColumn,
        size: 80,
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === 'APPROVED') {
            return (
              <IconButton
                icon={<RotateCcw className="w-4 h-4" />}
                tooltip="Revert"
                variant="warning"
                onClick={() => openDialog(row.original, 'revert')}
              />
            );
          } else if (status === 'PENDING') {
            return (
              <div className="flex items-center gap-1">
                <IconButton
                  icon={<Check className="w-4 h-4" />}
                  tooltip="Approve"
                  variant="success"
                  onClick={() => openDialog(row.original, 'approve')}
                />
                <IconButton
                  icon={<X className="w-4 h-4" />}
                  tooltip="Reject"
                  variant="danger"
                  onClick={() => openDialog(row.original, 'reject')}
                />
              </div>
            );
          } else {
            return <span className="text-textMuted text-sm">{status}</span>;
          }
        },
        ...nonSortableActionColumn,
        size: 100,
      },
    ],
    []
  );

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Member Info Change Requests</h1>
          <p className="mt-1 text-sm text-textMuted">Manage member information update requests</p>
        </div>
      </div>

      {/* Requests Table */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor bg-gray-50/50">
          <h3 className="text-lg font-bold text-textDark">Member Info Change Requests</h3>
        </div>
        <div className="p-4">
          <DataTable
            data={requests}
            columns={columns}
            isLoading={loading}
            showRowSelection={false}
            showColumnFilters
            searchPlaceholder="Search by member name or unit..."
            pageSize={10}
            emptyMessage="No member info change requests found"
            emptyIcon={<FileText className="w-8 h-8 text-textMuted" />}
            columnFiltersConfig={[REQUEST_STATUS_FILTER]}
          />
        </div>
      </Card>

      {/* Confirmation Dialog */}
      {selectedRequest && dialogAction && getDialogConfig() && (
        <ConfirmDialog
          isOpen={true}
          onClose={closeDialog}
          onConfirm={handleConfirmAction}
          {...getDialogConfig()!}
          isLoading={isProcessing}
        />
      )}
    </div>
  );
};

