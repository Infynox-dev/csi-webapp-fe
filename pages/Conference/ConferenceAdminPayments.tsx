import React, { useEffect, useState } from 'react';
import { formatDateIST } from '../../utils/datetime';
import { Card, Badge, Button } from '../../components/ui';
import { CreditCard, Download, ChevronDown, ChevronRight, MapPin, Search, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { downloadBlob } from '../../services/download';
import { getMediaUrl } from '../../services/http';
import {
  useConferencesAdmin,
  useConferencePaymentInfoAdmin,
  useConferenceSettingsAdmin,
  useUpdateConferenceSettings,
  useApproveConferencePayment,
  useDeclineConferencePayment,
} from '../../hooks/queries';

interface Conference {
  id: number;
  title: string;
  details: string;
  added_on: string;
  status: 'Active' | 'Inactive' | 'Completed';
}

interface DistrictMember {
  id: number;
  name: string;
  phone: string;
}

interface DistrictPayment {
  id: number;
  amount_to_pay: number;
  uploaded_by: string;
  date: string;
  status: string;
  proof_path: string | null;
  file_url: string | null;
  payment_reference: string | null;
  approved_paid_amount: number | null;
  balance_amount: number | null;
  rejection_note: string | null;
}

interface PaymentDistrictInfo {
  officials: DistrictMember[];
  members: DistrictMember[];
  payments: DistrictPayment[];
  count_of_officials: number;
  count_of_members: number;
  amount_due: number;
  fee_owed: number;
  total_paid: number;
  balance_due: number;
  payment_credit: number;
  overall_status: string;
  latest_rejection_note: string | null;
  district_id: number;
}

const isPendingProof = (status: string) => {
  const value = status.toLowerCase();
  return value === 'pending' || value === 'proof_uploaded';
};

const isApprovedProof = (status: string) => {
  const value = status.toLowerCase();
  return value === 'paid' || value === 'approved' || value === 'verified';
};

interface ConferencePaymentInfo {
  conference_id: number;
  delegate_fee: number;
  district_info: Record<string, PaymentDistrictInfo>;
}

export const ConferenceAdminPayments: React.FC = () => {
  const { addToast } = useToast();
  
  // Use TanStack Query
  const { data: conferences = [], isLoading: loading } = useConferencesAdmin();
  const { data: settings } = useConferenceSettingsAdmin();
  const updateSettings = useUpdateConferenceSettings();
  
  const [selectedConferenceId, setSelectedConferenceId] = useState<number | null>(null);
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feeInput, setFeeInput] = useState('');
  const [approvePayment, setApprovePayment] = useState<DistrictPayment | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [declinePayment, setDeclinePayment] = useState<DistrictPayment | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const approveMutation = useApproveConferencePayment();
  const declineMutation = useDeclineConferencePayment();

  // Sync fee input when settings load
  useEffect(() => {
    if (settings?.delegate_fee != null) {
      setFeeInput(String(settings.delegate_fee));
    }
  }, [settings?.delegate_fee]);

  // Auto-select active conference when conferences load
  useEffect(() => {
    if (conferences.length > 0 && !selectedConferenceId) {
      const activeConference = conferences.find((c: Conference) => c.status === 'Active');
      if (activeConference) {
        setSelectedConferenceId(activeConference.id);
      } else {
        setSelectedConferenceId(conferences[0].id);
      }
    }
  }, [conferences, selectedConferenceId]);

  // Use TanStack Query for payment info
  const { data: paymentInfo, isLoading: loadingInfo } = useConferencePaymentInfoAdmin(selectedConferenceId || 0);

  const handleExport = async () => {
    if (!selectedConferenceId) return;
    
    try {
      setExporting(true);
      const blob = await api.exportConferencePaymentInfoAdmin(selectedConferenceId);
      downloadBlob(blob, `conference_payments_${selectedConferenceId}.xlsx`);
      addToast("Export downloaded", "success");
    } catch (err) {
      addToast("Failed to export data", "error");
    } finally {
      setExporting(false);
    }
  };

  const toggleDistrict = (district: string) => {
    const newExpanded = new Set(expandedDistricts);
    if (newExpanded.has(district)) {
      newExpanded.delete(district);
    } else {
      newExpanded.add(district);
    }
    setExpandedDistricts(newExpanded);
  };

  const expandAll = () => {
    if (paymentInfo) {
      setExpandedDistricts(new Set(Object.keys(paymentInfo.district_info)));
    }
  };

  const collapseAll = () => {
    setExpandedDistricts(new Set());
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'verified':
      case 'paid':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'partial':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Partial</Badge>;
      case 'pending':
      case 'proof_uploaded':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
      case 'declined':
        return <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="light">{status}</Badge>;
    }
  };

  // Calculate totals (live amount_due based on current fee)
  const totals = paymentInfo ? Object.values(paymentInfo.district_info).reduce(
    (acc, district) => {
      const districtDue = district.fee_owed ?? district.amount_due ?? (
        (district.count_of_officials + district.count_of_members) * (paymentInfo.delegate_fee || 0)
      );
      const approved = district.total_paid ?? 0;
      const pending = district.payments.filter(p => isPendingProof(p.status))
        .reduce((sum, p) => sum + (p.amount_to_pay || 0), 0);

      return {
        total: acc.total + districtDue,
        approved: acc.approved + approved,
        pending: acc.pending + pending,
        paymentCount: acc.paymentCount + district.payments.length,
        delegates: acc.delegates + district.count_of_officials + district.count_of_members,
      };
    },
    { total: 0, approved: 0, pending: 0, paymentCount: 0, delegates: 0 }
  ) : null;

  const handleSaveFee = () => {
    const fee = parseInt(feeInput, 10);
    if (Number.isNaN(fee) || fee < 0) {
      addToast('Enter a valid fee (0 or more)', 'error');
      return;
    }
    updateSettings.mutate({ delegate_fee: fee });
  };

  // Filter districts by search and status
  const filteredDistricts = paymentInfo 
    ? Object.entries(paymentInfo.district_info).filter(([district, info]) => {
        const matchesSearch = district.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (statusFilter === 'all') return matchesSearch;
        
        const hasMatchingPayment =
          (statusFilter === 'approved' && (info.overall_status === 'paid' || info.payments.some(p => isApprovedProof(p.status)))) ||
          (statusFilter === 'pending' && (info.overall_status === 'pending' || info.overall_status === 'partial' || info.payments.some(p => isPendingProof(p.status)))) ||
          (statusFilter === 'rejected' && (info.overall_status === 'declined' || info.payments.some(p => {
            const value = p.status.toLowerCase();
            return value === 'rejected' || value === 'declined';
          })));
        
        return matchesSearch && hasMatchingPayment;
      })
    : [];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Conference Payment Info</h1>
          <p className="mt-1 text-sm text-textMuted">View payment status by district</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={!selectedConferenceId || exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
        </div>
      </div>

      {/* Conference Selector */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-textDark mb-2">Select Conference</label>
            <select
              value={selectedConferenceId || ''}
              onChange={(e) => setSelectedConferenceId(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 bg-white text-textDark border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              disabled={loading}
            >
              <option value="">Select a conference</option>
              {conferences.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.status === 'Active' ? '(Active)' : `(${c.status})`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-textDark mb-2">Search District</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                placeholder="Search districts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white text-textDark border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-textMuted/50"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-textDark mb-2">Payment Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-white text-textDark border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Global per-delegate fee */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-textDark mb-2">
              Per delegate fee (₹)
            </label>
            <p className="text-xs text-textMuted mb-2">
              Applies to all conferences. Amount = (officials + members) × this rate.
            </p>
            <input
              type="number"
              min={0}
              value={feeInput}
              onChange={(e) => setFeeInput(e.target.value)}
              className="w-full px-3 py-2.5 bg-white text-textDark border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <Button
            onClick={handleSaveFee}
            disabled={updateSettings.isPending || feeInput === String(settings?.delegate_fee ?? '')}
          >
            {updateSettings.isPending ? 'Saving...' : 'Save fee'}
          </Button>
        </div>
      </Card>

      {/* Summary Stats */}
      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <p className="text-xs text-textMuted">Total Amount</p>
            <p className="text-2xl font-bold text-textDark">₹{totals.total.toLocaleString()}</p>
          </Card>
          <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <p className="text-xs text-textMuted">Approved</p>
            <p className="text-2xl font-bold text-success">₹{totals.approved.toLocaleString()}</p>
          </Card>
          <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
            <p className="text-xs text-textMuted">Pending</p>
            <p className="text-2xl font-bold text-warning">₹{totals.pending.toLocaleString()}</p>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <p className="text-xs text-textMuted">Payments</p>
            <p className="text-2xl font-bold text-textDark">{totals.paymentCount}</p>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <p className="text-xs text-textMuted">Delegates</p>
            <p className="text-2xl font-bold text-textDark">{totals.delegates}</p>
          </Card>
        </div>
      )}

      {/* District List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-textDark">Districts ({filteredDistricts.length})</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>Expand All</Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>Collapse All</Button>
          </div>
        </div>

        {loadingInfo ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : !paymentInfo || filteredDistricts.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <p className="text-textMuted">
              {!selectedConferenceId 
                ? 'Please select a conference to view payment info' 
                : searchTerm || statusFilter !== 'all'
                  ? 'No districts match your filters'
                  : 'No payment data available for this conference'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDistricts.map(([district, info]) => {
              const districtTotal = info.fee_owed ?? info.amount_due ?? (
                (info.count_of_officials + info.count_of_members) * (paymentInfo?.delegate_fee || 0)
              );
              const approvedTotal = info.total_paid ?? 0;
              
              return (
                <div key={district} className="border border-borderColor rounded-lg overflow-hidden">
                  {/* District Header */}
                  <button
                    onClick={() => toggleDistrict(district)}
                    className="w-full px-4 py-3 bg-bgLight hover:bg-gray-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedDistricts.has(district) ? (
                        <ChevronDown className="w-5 h-5 text-textMuted" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-textMuted" />
                      )}
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="font-bold text-textDark">{district}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="light">{info.payments.length} payments</Badge>
                      <Badge variant="primary">₹{districtTotal.toLocaleString()}</Badge>
                      {approvedTotal > 0 && (
                        <Badge variant="success">₹{approvedTotal.toLocaleString()} approved</Badge>
                      )}
                    </div>
                  </button>

                  {/* District Details */}
                  {expandedDistricts.has(district) && (
                    <div className="p-4 border-t border-borderColor">
                      {/* Delegate Summary */}
                      <div className="flex flex-wrap gap-4 mb-4 text-sm text-textMuted">
                        <span>{info.count_of_officials} officials</span>
                        <span>•</span>
                        <span>{info.count_of_members} members</span>
                        <span>•</span>
                        <span>{getStatusBadge(info.overall_status || 'not_submitted')}</span>
                        <span>Due ₹{(info.balance_due ?? 0).toLocaleString()}</span>
                      </div>

                      {/* Payments List */}
                      {info.payments.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-textDark flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Payments
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-bgLight">
                                  <th className="px-3 py-2 text-left font-medium text-textMuted">Amount</th>
                                  <th className="px-3 py-2 text-left font-medium text-textMuted">Date</th>
                                  <th className="px-3 py-2 text-left font-medium text-textMuted">Uploaded By</th>
                                  <th className="px-3 py-2 text-left font-medium text-textMuted">Reference</th>
                                  <th className="px-3 py-2 text-left font-medium text-textMuted">Status</th>
                                  <th className="px-3 py-2 text-left font-medium text-textMuted">Proof</th>
                                  <th className="px-3 py-2 text-left font-medium text-textMuted">Review</th>
                                </tr>
                              </thead>
                              <tbody>
                                {info.payments.map((payment) => (
                                  <tr key={payment.id} className="border-t border-borderColor">
                                    <td className="px-3 py-2 font-medium text-textDark">
                                      ₹{(payment.approved_paid_amount ?? payment.amount_to_pay ?? 0).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2 text-textMuted">
                                      {formatDateIST(payment.date)}
                                    </td>
                                    <td className="px-3 py-2 text-textMuted">
                                      {payment.uploaded_by || 'N/A'}
                                    </td>
                                    <td className="px-3 py-2 text-textMuted">
                                      {payment.payment_reference || 'N/A'}
                                    </td>
                                    <td className="px-3 py-2">
                                      {getStatusBadge(payment.status)}
                                    </td>
                                    <td className="px-3 py-2">
                                      {payment.file_url || payment.proof_path ? (
                                        <a
                                          href={getMediaUrl(payment.file_url || payment.proof_path)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-primary hover:underline"
                                        >
                                          <FileText className="w-4 h-4" />
                                          View
                                        </a>
                                      ) : (
                                        <span className="text-textMuted">No proof</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2">
                                      {isPendingProof(payment.status) && selectedConferenceId && (
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              setApprovePayment(payment);
                                              setPaidAmount(String(info.balance_due ?? payment.amount_to_pay ?? ''));
                                            }}
                                          >
                                            Approve
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              setDeclinePayment(payment);
                                              setRejectionNote('');
                                            }}
                                          >
                                            Decline
                                          </Button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-textMuted text-center py-4">No payments recorded for this district</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {approvePayment && selectedConferenceId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-textDark">Approve payment proof</h3>
            <p className="text-sm text-textMuted">
              Enter how much was paid in this proof. Remaining balance is calculated from prior approved proofs.
            </p>
            <input
              type="number"
              min={0}
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full px-3 py-2 border border-borderColor rounded-md text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApprovePayment(null)}>Cancel</Button>
              <Button
                disabled={approveMutation.isPending}
                onClick={() => {
                  const parsed = Number(paidAmount);
                  if (!Number.isInteger(parsed) || parsed < 0) {
                    addToast('Enter a valid paid amount', 'error');
                    return;
                  }
                  approveMutation.mutate(
                    { conferenceId: selectedConferenceId, paymentId: approvePayment.id, paidAmount: parsed },
                    { onSuccess: () => setApprovePayment(null) },
                  );
                }}
              >
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {declinePayment && selectedConferenceId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-textDark">Decline payment proof</h3>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Reason for decline"
              className="w-full px-3 py-2 border border-borderColor rounded-md text-sm min-h-[96px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeclinePayment(null)}>Cancel</Button>
              <Button
                variant="danger"
                disabled={declineMutation.isPending}
                onClick={() => {
                  if (!rejectionNote.trim()) {
                    addToast('Rejection note is required', 'error');
                    return;
                  }
                  declineMutation.mutate(
                    {
                      conferenceId: selectedConferenceId,
                      paymentId: declinePayment.id,
                      rejectionNote: rejectionNote.trim(),
                    },
                    { onSuccess: () => setDeclinePayment(null) },
                  );
                }}
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

