import { formatDateTimeIST } from '../../utils/datetime';
import React, { useState, useRef } from 'react';
import {
  CreditCard,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  X,
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { getMediaUrl } from '../../services/http';
import {
  useConferenceOfficialPayment,
  useUploadConferencePaymentProof,
} from '../../hooks/queries';

const statusBadge = (status: string | null | undefined) => {
  switch (status) {
    case 'paid':
    case 'PAID':
      return <Badge variant="success">Paid</Badge>;
    case 'partial':
    case 'PARTIAL':
      return <Badge variant="warning">Partial</Badge>;
    case 'pending':
    case 'PENDING':
    case 'PROOF_UPLOADED':
      return <Badge variant="info">Under review</Badge>;
    case 'declined':
    case 'DECLINED':
      return <Badge variant="danger">Declined</Badge>;
    default:
      return <Badge variant="warning">Not submitted</Badge>;
  }
};

export const ConferencePayment: React.FC = () => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: ledger, isLoading, refetch } = useConferenceOfficialPayment();
  const uploadPaymentMutation = useUploadConferencePaymentProof();

  const [paymentReference, setPaymentReference] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      addToast('Please select an image or PDF file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('File size must be less than 5MB', 'error');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitPayment = () => {
    if (!selectedFile) {
      addToast('Please select a payment proof file', 'error');
      return;
    }
    uploadPaymentMutation.mutate(
      {
        file: selectedFile,
        paymentData: { payment_reference: paymentReference || undefined },
      },
      {
        onSuccess: () => {
          clearFile();
          setPaymentReference('');
          refetch();
        },
      },
    );
  };

  if (isLoading || !ledger) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const canSubmit = !ledger.is_fully_paid && !ledger.has_blocking_pending && ledger.fee_owed > 0;
  const amountDue = ledger.balance_due > 0 ? ledger.balance_due : ledger.fee_owed;
  const qrSrc = ledger.qr_url ? getMediaUrl(ledger.qr_url) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Payment</h1>
        <p className="text-gray-500 mt-1">Pay the district conference fee using the same UPI QR as Units</p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">District ledger</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Officials + member delegates</span>
            <span className="font-medium text-gray-800">{ledger.delegate_count}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Fee per delegate</span>
            <span className="font-medium text-gray-800">₹{ledger.delegate_fee}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Current fee</span>
            <span className="font-medium text-gray-800">₹{ledger.fee_owed}</span>
          </div>
          {ledger.total_paid > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Approved so far</span>
              <span className="font-medium text-green-700">₹{ledger.total_paid}</span>
            </div>
          )}
          {ledger.payment_credit > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Prepaid credit</span>
              <span className="font-medium text-orange-700">₹{ledger.payment_credit}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-3 bg-orange-50 -mx-6 px-6 rounded-lg">
            <span className="text-lg font-semibold text-gray-800">
              {ledger.is_fully_paid ? 'Fully paid' : 'Amount still due'}
            </span>
            <span className="text-2xl font-bold text-orange-600">
              ₹{ledger.is_fully_paid ? 0 : amountDue}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-100 rounded-xl">
            {ledger.overall_status === 'paid' ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : ledger.overall_status === 'declined' ? (
              <AlertCircle className="w-6 h-6 text-red-500" />
            ) : (
              <Clock className="w-6 h-6 text-yellow-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Payment status</h3>
              {statusBadge(ledger.overall_status)}
            </div>
            {ledger.has_blocking_pending && (
              <p className="text-sm text-gray-600">A proof is awaiting admin review.</p>
            )}
            {ledger.latest_rejection_note && ledger.overall_status !== 'paid' && (
              <p className="text-sm text-red-600 mt-1">Reason: {ledger.latest_rejection_note}</p>
            )}
          </div>
        </div>
      </Card>

      {ledger.submissions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Submissions</h3>
          <div className="space-y-2">
            {ledger.submissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <div>
                  {sub.file_url ? (
                    <a
                      href={getMediaUrl(sub.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline inline-flex items-center gap-1"
                    >
                      <FileText className="w-4 h-4" />
                      View proof
                    </a>
                  ) : (
                    <span className="text-gray-500">No file</span>
                  )}
                  {sub.submitted_at && (
                    <p className="text-xs text-gray-500">{formatDateTimeIST(sub.submitted_at)}</p>
                  )}
                  {sub.rejection_note && sub.status === 'DECLINED' && (
                    <p className="text-xs text-red-600">{sub.rejection_note}</p>
                  )}
                </div>
                <div className="text-right">
                  {statusBadge(sub.status)}
                  {sub.approved_paid_amount != null && (
                    <p className="text-xs text-gray-500 mt-1">Paid ₹{sub.approved_paid_amount}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {canSubmit && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {ledger.overall_status === 'partial' ? 'Pay remaining balance' : 'Submit payment'}
          </h3>
          {qrSrc ? (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg text-center">
              <img src={qrSrc} alt="UPI QR code" className="w-48 h-48 object-contain mx-auto" />
              <p className="text-sm text-gray-600 mt-2">Scan this QR and pay ₹{amountDue}</p>
            </div>
          ) : (
            <p className="text-sm text-yellow-700 mb-4">
              Payment QR is not configured yet. Ask an admin to upload it under Unit Payment Settings.
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment reference / transaction ID
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Enter transaction ID or reference number"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment proof (screenshot / receipt)
              </label>
              {selectedFile ? (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={clearFile} className="p-1 hover:bg-gray-100 rounded-full">
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">Click to upload payment proof</p>
                  <p className="text-sm text-gray-400">PNG, JPG or PDF (max 5MB)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <Button
              onClick={handleSubmitPayment}
              disabled={!selectedFile || uploadPaymentMutation.isPending}
              isLoading={uploadPaymentMutation.isPending}
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Submit payment
            </Button>
          </div>
        </Card>
      )}

      {ledger.fee_owed <= 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">No delegates on this district roster</h4>
              <p className="text-sm text-yellow-700 mt-1">Add delegates first before submitting payment.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
