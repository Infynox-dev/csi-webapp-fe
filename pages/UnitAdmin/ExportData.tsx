import React, { useEffect, useMemo, useState } from 'react';
import { Card, Badge, Button, IconButton } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { Download, Building, Shield, UserCheck, CreditCard } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { Unit } from '../../types';
import { useUnits } from '../../hooks/queries';
import { useSiteSettings } from '../../hooks/queries';
import { useQuery } from '@tanstack/react-query';
import { downloadBlob, getFilenameFromContentDisposition } from '../../services/download';
import { getCurrentYearIST } from '../../utils/datetime';

const selectClassName =
  'w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

export const ExportData: React.FC = () => {
  const { addToast } = useToast();

  const { data: unitsData, isLoading: unitsLoading } = useUnits();
  const { data: districtsData, isLoading: districtsLoading } = useQuery({
    queryKey: ['clergyDistricts'],
    queryFn: async () => {
      const response = await api.getClergyDistricts();
      return response.data;
    },
  });
  const { data: siteSettings } = useSiteSettings();

  const districts = districtsData ?? [];
  const units = unitsData ?? [];
  const loading = unitsLoading || districtsLoading;

  const activeRegistrationYear =
    siteSettings?.current_registration_year ?? getCurrentYearIST();

  const yearOptions = useMemo(() => {
    const years = new Set<number>([activeRegistrationYear]);
    for (let offset = 1; offset <= 3; offset += 1) {
      years.add(activeRegistrationYear - offset);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [activeRegistrationYear]);

  const [selectedDistrict, setSelectedDistrict] = useState<number>(0);
  const [paymentYear, setPaymentYear] = useState<number>(activeRegistrationYear);
  const [paymentDistrict, setPaymentDistrict] = useState<number>(0);
  const [paymentUnit, setPaymentUnit] = useState<number>(0);
  const [exportingPayments, setExportingPayments] = useState(false);

  useEffect(() => {
    setPaymentYear(activeRegistrationYear);
  }, [activeRegistrationYear]);

  useEffect(() => {
    if (districts.length > 0 && selectedDistrict === 0) {
      setSelectedDistrict(districts[0].id);
    }
  }, [districts, selectedDistrict]);

  const filteredUnitsForPayment = useMemo(() => {
    if (!paymentDistrict) return units;
    const districtName = districts.find((district) => district.id === paymentDistrict)?.name;
    if (!districtName) return units;
    return units.filter(
      (unit) => unit.clergyDistrict.toLowerCase() === districtName.toLowerCase(),
    );
  }, [units, paymentDistrict, districts]);

  useEffect(() => {
    if (paymentUnit && !filteredUnitsForPayment.some((unit) => unit.userId === paymentUnit)) {
      setPaymentUnit(0);
    }
  }, [paymentUnit, filteredUnitsForPayment]);

  const handleDistrictOfficialsExport = async () => {
    if (!selectedDistrict) {
      addToast('Please select a district', 'warning');
      return;
    }
    try {
      await api.exportData('district-officials', selectedDistrict);
      addToast('District officials data exported successfully', 'success');
    } catch {
      addToast('Failed to export data', 'error');
    }
  };

  const handleDistrictCouncilorsExport = async () => {
    if (!selectedDistrict) {
      addToast('Please select a district', 'warning');
      return;
    }
    try {
      await api.exportData('district-councilors', selectedDistrict);
      addToast('District councilors data exported successfully', 'success');
    } catch {
      addToast('Failed to export data', 'error');
    }
  };

  const handleUnitOfficialsExport = async (unitId: number) => {
    try {
      await api.exportData('unit-officials', unitId);
      addToast('Unit officials data exported successfully', 'success');
    } catch {
      addToast('Failed to export data', 'error');
    }
  };

  const handleUnitCouncilorsExport = async (unitId: number) => {
    try {
      await api.exportData('unit-councilors', unitId);
      addToast('Unit councilors data exported successfully', 'success');
    } catch {
      addToast('Failed to export data', 'error');
    }
  };

  const handlePaymentExport = async () => {
    if (!paymentYear) {
      addToast('Please select a registration year', 'warning');
      return;
    }
    setExportingPayments(true);
    try {
      const blob = await api.exportRegistrationPayments({
        registrationYear: paymentYear,
        districtId: paymentDistrict || undefined,
        unitId: paymentUnit || undefined,
      });
      downloadBlob(
        blob,
        getFilenameFromContentDisposition(
          null,
          `registration_payments_${paymentYear}.csv`,
        ),
      );
      addToast('Payment data exported successfully', 'success');
    } catch {
      addToast('Failed to export payment data', 'error');
    } finally {
      setExportingPayments(false);
    }
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
        size: 120,
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
        header: 'District',
        cell: ({ row }) => (
          <Badge variant="light">{row.original.clergyDistrict}</Badge>
        ),
        size: 140,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <IconButton
              icon={<Shield className="w-4 h-4" />}
              tooltip="Export Officials"
              variant="primary"
              onClick={() => handleUnitOfficialsExport(row.original.id)}
            />
            <IconButton
              icon={<UserCheck className="w-4 h-4" />}
              tooltip="Export Councilors"
              variant="success"
              onClick={() => handleUnitCouncilorsExport(row.original.id)}
            />
          </div>
        ),
        enableSorting: false,
        size: 100,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Export Data</h1>
          <p className="mt-1 text-sm text-textMuted">
            Export unit officials, councilors, and registration payment data
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-textDark">Unit Data</h2>
        </div>

        <Card>
          <h3 className="text-lg font-bold text-textDark mb-4">Export District-wise Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-textMuted mb-2">District Wise Officials Data</p>
              <select
                className={`${selectClassName} mb-3`}
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(Number(e.target.value))}
                disabled={loading}
              >
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDistrictOfficialsExport}
                disabled={loading || !selectedDistrict}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Get Officials Data
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium text-textMuted mb-2">District Wise Councilors Data</p>
              <select
                className={`${selectClassName} mb-3`}
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(Number(e.target.value))}
                disabled={loading}
              >
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDistrictCouncilorsExport}
                disabled={loading || !selectedDistrict}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Get Councilors Data
              </Button>
            </div>
          </div>
        </Card>

        <Card noPadding className="overflow-hidden">
          <div className="px-6 py-4 border-b border-borderColor bg-gray-50/50">
            <h3 className="text-lg font-bold text-textDark">Export Unit-wise Data</h3>
            <p className="text-sm text-textMuted mt-1">
              Select a unit to export its officials and councilors data
            </p>
          </div>
          <div className="p-4">
            <DataTable
              data={units}
              columns={columns}
              isLoading={loading}
              showRowSelection={false}
              searchPlaceholder="Search units..."
              pageSize={10}
              emptyMessage="No units found"
              emptyIcon={<Building className="w-8 h-8 text-textMuted" />}
            />
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-textDark">Payment Data</h2>
        </div>

        <Card>
          <h3 className="text-lg font-bold text-textDark mb-1">Export Registration Payments</h3>
          <p className="text-sm text-textMuted mb-4">
            Filter by year, district, and unit. The CSV includes a payment proof URL column with
            direct links to uploaded files (no login required to open the link).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-textMuted mb-2">Year</p>
              <select
                className={selectClassName}
                value={paymentYear}
                onChange={(e) => setPaymentYear(Number(e.target.value))}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted mb-2">District</p>
              <select
                className={selectClassName}
                value={paymentDistrict}
                onChange={(e) => setPaymentDistrict(Number(e.target.value))}
                disabled={loading}
              >
                <option value={0}>All Districts</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm font-medium text-textMuted mb-2">Unit</p>
              <select
                className={selectClassName}
                value={paymentUnit}
                onChange={(e) => setPaymentUnit(Number(e.target.value))}
                disabled={loading}
              >
                <option value={0}>All Units</option>
                {filteredUnitsForPayment.map((unit) => (
                  <option key={unit.userId} value={unit.userId}>
                    {unit.name} ({unit.unitNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePaymentExport}
            disabled={exportingPayments || !paymentYear}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportingPayments ? 'Exporting...' : 'Export Payment Data (CSV)'}
          </Button>
        </Card>
      </div>
    </div>
  );
};
