import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Card from '../common/Card';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { paymentService } from '../../services/paymentService';

const PaymentSuccessModal = ({ 
  isOpen, 
  onClose, 
  paymentResult, 
  donationResult, 
  campaignTitle 
}) => {
  const handleDownloadReceipt = () => {
    // In a real app, this would download or open the receipt
    if (paymentResult?.receipt_url) {
      window.open(paymentResult.receipt_url, '_blank');
    }
  };

  const handleShareSuccess = () => {
    const shareText = `I just donated ${formatCurrency(paymentResult?.amount)} to "${campaignTitle}" on DonateHub! Every contribution makes a difference. 🙏`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Donation Successful',
        text: shareText,
        url: window.location.href,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Share text copied to clipboard!');
      });
    }
  };

  if (!paymentResult) return null;

  const paymentIcon = paymentService.getPaymentMethodIcon(
    paymentResult.method, 
    paymentResult.card?.brand
  );

  const paymentMethodName = paymentService.getPaymentMethodDisplayName(
    paymentResult.method, 
    paymentResult
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
    >
      <Modal.Content>
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thank You for Your Donation!
          </h2>
          <p className="text-gray-600">
            Your generous contribution has been successfully processed.
          </p>
        </div>

        {/* Payment Details Card */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Campaign:</span>
                <span className="font-medium text-gray-900 text-right flex-1 ml-4">
                  {campaignTitle}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(paymentResult.amount)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Method:</span>
                <div className="flex items-center space-x-2">
                  <span>{paymentIcon}</span>
                  <span className="font-medium text-gray-900">{paymentMethodName}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-sm text-gray-900">
                  {paymentResult.transactionId}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date & Time:</span>
                <span className="font-medium text-gray-900">
                  {formatDateTime(paymentResult.created)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  {paymentResult.status === 'succeeded' || paymentResult.status === 'completed' 
                    ? 'Completed' 
                    : paymentResult.status
                  }
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Impact Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 text-xl">💝</span>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Your Impact</h4>
              <p className="text-sm text-blue-800">
                Your donation of {formatCurrency(paymentResult.amount)} brings this campaign closer to its goal. 
                You're making a real difference in people's lives!
              </p>
            </div>
          </div>
        </div>

        {/* Receipt & Share Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadReceipt}
            className="flex-1"
          >
            📧 View Receipt
          </Button>
          <Button
            variant="outline"
            onClick={handleShareSuccess}
            className="flex-1"
          >
            📱 Share
          </Button>
        </div>

        {/* Tax Info */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Tax Information:</strong> This donation may be tax-deductible. 
            Please consult with a tax professional and keep this receipt for your records.
          </p>
        </div>
      </Modal.Content>

      <Modal.Footer>
        <Button onClick={onClose} className="w-full">
          Continue
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentSuccessModal;