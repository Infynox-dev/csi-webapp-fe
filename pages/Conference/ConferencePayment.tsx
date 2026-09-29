import { formatDateTimeIST } from '../../utils/datetime';
import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  CreditCard, 
  Upload, 
  CheckCircle, 
  Clock,
  AlertCircle,
  IndianRupee,
  FileText,
  Image,
  X
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../../components/ui';
import { ConferenceOfficialView, ConferencePayment as ConferencePaymentType } from '../../types';
import { useToast } from '../../components/Toast';
import { getMediaUrl } from '../../services/http';
import { 
  useConferenceOfficialView, 
  useConferenceDelegatesOfficial, 
  useUploadConferencePaymentProof 
} from '../../hooks/queries';

interface ConferenceContext {
  conferenceData: ConferenceOfficialView | null;
  loading: boolean;
  refreshData: () => void;
}

export const ConferencePayment: React.FC = () => {
  const { addToast } = useToast();
  const context = useOutletContext<ConferenceContext>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use TanStack Query
  const { data: viewData, isLoading: viewLoading, refetch: refetchView } = useConferenceOfficialView();
  const { data: delegatesData, isLoading: delegatesLoading } = useConferenceDelegatesOfficial();
  const uploadPaymentMutation = useUploadConferencePaymentProof();
  
  const loading = viewLoading || delegatesLoading;
  const conferenceData = viewData || null;
  const payment = viewData?.unit_payment || null;
  
  // Delegates info for payment
  const delegatesInfo = delegatesData ? {
    delegates_count: delegatesData.delegates_count,
    max_count: delegatesData.max_count,
    payment_status: delegatesData.payment_status,
    amount_to_pay: delegatesData.amount_to_pay,
    food_preference: delegatesData.food_preference,
  } : null;
  
  // Form states
  const [paymentReference, setPaymentReference] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        addToast('Please select an image or PDF file', 'error');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast('File size must be less than 5MB', 'error');
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedFile) {
      addToast('Please select a payment proof file', 'error');
      return;
    }

    const totalAmount = delegatesInfo?.amount_to_pay ?? 0;

    uploadPaymentMutation.mutate(
      {
        file: selectedFile,
        paymentData: {
          amount_to_pay: totalAmount,
          payment_reference: paymentReference || undefined,
        },
      },
      {
        onSuccess: () => {
          setSelectedFile(null);
          setPreviewUrl(null);
          setPaymentReference('');
          refetchView();
          context?.refreshData?.();
        },
      }
    );
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalDelegates = delegatesInfo?.delegates_count || conferenceData?.unit_delegates?.length || 0;
  const registrationFee = conferenceData?.conference?.registration_fee || 0;
  const totalAmount = delegatesInfo?.amount_to_pay || (totalDelegates * registrationFee);
  const paymentStatus = delegatesInfo?.payment_status || payment?.status || 'PENDING';

  const getStatusIcon = () => {
    const status = paymentStatus?.toUpperCase();
    switch (status) {
      case 'PAID':
      case 'VERIFIED': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'SUBMITTED': return <Clock className="w-6 h-6 text-blue-500" />;
      case 'INVALID':
      case 'REJECTED': return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'PENDING':
      default: return <Clock className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    const status = paymentStatus?.toUpperCase();
    switch (status) {
      case 'PAID': return <Badge variant="success">Paid</Badge>;
      case 'VERIFIED': return <Badge variant="success">Verified</Badge>;
      case 'SUBMITTED': return <Badge variant="info">Under Review</Badge>;
      case 'INVALID': return <Badge variant="danger">Invalid</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      case 'PENDING':
      default: return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Payment</h1>
        <p className="text-gray-500 mt-1">Submit your conference registration payment</p>
      </div>

      {/* Payment Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Number of Delegates</span>
            <span className="font-medium text-gray-800">{totalDelegates}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Registration Fee (per person)</span>
            <span className="font-medium text-gray-800">₹{registrationFee}</span>
          </div>
          <div className="flex justify-between items-center py-3 bg-orange-50 -mx-6 px-6 rounded-lg">
            <span className="text-lg font-semibold text-gray-800">Total Amount</span>
            <span className="text-2xl font-bold text-orange-600">₹{totalAmount}</span>
          </div>
        </div>
      </Card>

      {/* Payment Status */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-100 rounded-xl">
            {getStatusIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Payment Status</h3>
              {getStatusBadge()}
            </div>
            {payment ? (
              <div className="space-y-2 text-sm text-gray-600">
                <p>Amount: <span className="font-medium text-gray-800">₹{payment.amount}</span></p>
                {payment.payment_reference && (
                  <p>Reference: <span className="font-medium text-gray-800">{payment.payment_reference}</span></p>
                )}
                {payment.submitted_at && (
                  <p>Submitted: <span className="font-medium text-gray-800">{formatDateTimeIST(payment.submitted_at)}</span></p>
                )}
                {payment.verified_at && (
                  <p>Verified: <span className="font-medium text-gray-800">{formatDateTimeIST(payment.verified_at)}</span></p>
                )}
                {payment.remarks && (
                  <p className="text-red-600">Remarks: {payment.remarks}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No payment has been submitted yet.</p>
            )}
          </div>
        </div>

        {/* Existing Payment Proof */}
        {payment?.payment_proof_url && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Proof:</p>
            <a 
              href={getMediaUrl(payment.payment_proof_url)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700"
            >
              <FileText className="w-4 h-4" />
              View Payment Proof
            </a>
          </div>
        )}
      </Card>

      {/* Submit Payment Form */}
      {(!payment || payment.status === 'rejected' || payment.status === 'pending') && totalDelegates > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {payment?.status === 'rejected' ? 'Resubmit Payment' : 'Submit Payment'}
          </h3>

          {payment?.status === 'rejected' && payment.remarks && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Payment Rejected</p>
                  <p className="text-sm text-red-700 mt-1">{payment.remarks}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Payment Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Reference / Transaction ID
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Enter transaction ID or reference number"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Proof (Screenshot/Receipt)
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
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearFile}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
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

            {/* Submit Button */}
            <Button
              onClick={handleSubmitPayment}
              disabled={!selectedFile || uploadPaymentMutation.isPending}
              isLoading={uploadPaymentMutation.isPending}
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Submit Payment
            </Button>
          </div>
        </Card>
      )}

      {/* No Delegates Warning */}
      {totalDelegates === 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">No Delegates Registered</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please add delegates first before submitting payment.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Payment Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-800 mb-3">Payment Instructions</h4>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>Calculate the total amount based on number of delegates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>Make payment via UPI/Bank Transfer to the official account</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>Take a screenshot of the payment confirmation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>Upload the screenshot and enter the transaction reference</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">5.</span>
            <span>Wait for verification (usually within 24-48 hours)</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};

