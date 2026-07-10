import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, IconButton } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { Download, Eye, Building, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { api } from '../../services/api';
import { formatRegistrationSeason } from '../../services/authRouting';
import { Unit } from '../../types';
import { useUnits, useCompleteUnitRegistration, useSiteSettings } from '../../hooks/queries';
import { getCurrentYearIST } from '../../utils/datetime';

const resolveUnitUserId = (unit: Unit): number | null => unit.userId ?? null;

const REGISTRATION_STATUS_FILTER = {
  columnId: 'status',
  label: 'Registration',
  allLabel: 'All statuses',
  options: [
    { value: 'Not Started', label: 'Not Started' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Awaiting Completion', label: 'Awaiting Completion' },
    { value: 'Completed', label: 'Completed' },
  ],
} as const;

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  not_submitted: 'Not submitted',
  pending: 'Pending review',
  approved: 'Fully paid',
  partial: 'Partially paid',
  rejected: 'Rejected',
};

const selectClassName =
  'px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

export const ViewAllUnits: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const { data: units = [], isLoading: loading } = useUnits();
  const completeRegistration = useCompleteUnitRegistration();
  const { data: siteSettings } = useSiteSettings();

  const activeRegistrationYear = siteSettings?.current_registration_year ?? getCurrentYearIST();
  const yearOptions = useMemo(() => {
    const years = new Set<number>([activeRegistrationYear]);
    for (let offset = 1; offset <= 3; offset += 1) {
      years.add(activeRegistrationYear - offset);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [activeRegistrationYear]);
  const [exportYear, setExportYear] = useState<number>(activeRegistrationYear);

  useEffect(() => {
    setExportYear(activeRegistrationYear);
  }, [activeRegistrationYear]);

  const handleExport = async () => {
    try {
      await api.exportData('units', undefined, exportYear);
      addToast('Units data exported successfully', 'success');
    } catch {
      addToast('Failed to export data', 'error');
    }
  };

  const handleViewDetails = useCallback((unit: Unit) => {
    const userId = resolveUnitUserId(unit);
    if (!userId) {
      addToast('Unable to open unit details. Please refresh the page.', 'error');
      return;
    }
    navigate(`/admin/units/${userId}`);
  }, [addToast, navigate]);

  const handleConfirmComplete = async () => {
    if (!selectedUnit) return;
    const userId = resolveUnitUserId(selectedUnit);
    if (!userId) {
      addToast('Unable to complete registration for this unit. Please refresh the page.', 'error');
      return;
    }
    completeRegistration.mutate(userId, {
      onSuccess: () => setSelectedUnit(null),
    });
  };

  const columns = useMemo<ColumnDef<Unit, any>[]>(
    () => [
      {
        accessorKey: 'unitNumber',
        header: 'Unit Number',
        cell: ({ row }) => (
          <span className="font-mono text-textMuted font-medium">
            {row.original.unitNumber}
          </span>
        ),
        size: 160,
      },
      {
        accessorKey: 'name',
        header: 'Unit Name',
        cell: ({ row }) => (
          <span className="font-medium text-textDark">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'clergyDistrict',
        header: 'Clergy District',
        cell: ({ row }) => (
          <Badge variant="light">{row.original.clergyDistrict}</Badge>
        ),
        size: 140,
      },
      {
        accessorKey: 'registrationYear',
        header: 'Season',
        cell: ({ row }) => (
          <span className="text-sm text-textMuted">
            {formatRegistrationSeason(row.original.registrationYear)}
          </span>
        ),
        size: 110,
      },
      {
        accessorKey: 'status',
        header: 'Registration',
        cell: ({ row }) => {
          const status = row.original.status;
          const variant =
            status === 'Completed'
              ? 'success'
              : status === 'Awaiting Completion'
                ? 'info'
                : status === 'In Progress'
                  ? 'warning'
                  : 'light';
          return <Badge variant={variant}>{status}</Badge>;
        },
        filterFn: (row, columnId, filterValue) =>
          !filterValue || row.getValue(columnId) === filterValue,
        enableSorting: false,
        size: 160,
      },
      {
        id: 'payment',
        header: 'Payment',
        cell: ({ row }) => {
          const paymentStatus = row.original.paymentStatus ?? 'not_submitted';
          const variant =
            paymentStatus === 'approved'
              ? 'success'
              : paymentStatus === 'pending' || paymentStatus === 'partial'
                ? 'warning'
                : paymentStatus === 'rejected'
                  ? 'danger'
                  : 'light';
          return (
            <Badge variant={variant}>
              {PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus}
            </Badge>
          );
        },
        enableSorting: false,
        size: 140,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.canCompleteRegistration && (
              <Button
                variant="success"
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setSelectedUnit(row.original)}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Mark as Completed
              </Button>
            )}
            <IconButton
              icon={<Eye className="w-4 h-4" />}
              tooltip="View Details"
              variant="info"
              onClick={() => handleViewDetails(row.original)}
            />
          </div>
        ),
        enableSorting: false,
        size: 220,
      },
    ],
    [handleViewDetails]
  );

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">All Units</h1>
          <p className="mt-1 text-sm text-textMuted">
            Current season registration status for all registered units
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={selectClassName}
            value={exportYear}
            onChange={(e) => setExportYear(Number(e.target.value))}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <Button variant="primary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Units Summary (CSV)
          </Button>
        </div>
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor bg-gray-50/50">
          <h3 className="text-lg font-bold text-textDark">Unit Registration Details</h3>
          <p className="text-sm text-textMuted mt-1">
            All current-season registrations with full payment require admin approval
            before they are finalized. Use Mark as Completed in the Actions column.
            Older seasons are legacy data and are bulk-updated separately.
          </p>
        </div>
        <div className="p-4">
          <DataTable
            data={units}
            columns={columns}
            isLoading={loading}
            showRowSelection={false}
            searchPlaceholder="Search units by name, number, or district..."
            pageSize={15}
            emptyMessage="No units found"
            emptyIcon={<Building className="w-8 h-8 text-textMuted" />}
            columnFiltersConfig={[REGISTRATION_STATUS_FILTER]}
          />
        </div>
      </Card>

      {selectedUnit && (
        <ConfirmDialog
          isOpen={!!selectedUnit}
          onClose={() => setSelectedUnit(null)}
          onConfirm={handleConfirmComplete}
          title="Mark Registration as Completed"
          message={`Confirm registration completion for ${selectedUnit.name}? Current-season units require full payment approval.`}
          confirmText="Mark as Completed"
          variant="success"
          isLoading={completeRegistration.isPending}
        />
      )}
    </div>
  );
};
