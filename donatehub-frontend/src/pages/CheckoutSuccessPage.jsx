import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { paymentService } from '../services/paymentService';

const CheckoutSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    paymentResult,
    donationResult,
    campaignTitle,
    amount
  } = location.state || {};

  useEffect(() => {
    // Redirect if no payment result data
    if (!paymentResult) {
      navigate('/campaigns');
    }
  }, [paymentResult, navigate]);

  const handleDownloadReceipt = () => {
    // In a real app, this would download or open the receipt
    if (paymentResult?.receipt_url) {
      window.open(paymentResult.receipt_url, '_blank');
    }
  };

  const handleShareSuccess = () => {
    const shareText = `I just donated ${formatCurrency(amount)} to "${campaignTitle}" on DonateHub! Every contribution makes a difference. 🙏`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Donation Successful',
        text: shareText,
        url: window.location.origin,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Share text copied to clipboard!');
      });
    }
  };

  const handleBackToCampaign = () => {
    if (donationResult?.campaignId) {
      navigate(`/campaigns/${donationResult.campaignId}`);
    } else {
      navigate('/campaigns');
    }
  };

  if (!paymentResult) {
    return null;
  }

  const paymentIcon = paymentService.getPaymentMethodIcon(
    paymentResult.method, 
    paymentResult.card?.brand
  );

  const paymentMethodName = paymentService.getPaymentMethodDisplayName(
    paymentResult.method, 
    paymentResult
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Thank You for Your Donation!
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Your generous contribution has been successfully processed.
        </p>
        <p className="text-gray-600">
          You'll receive a confirmation email with your receipt shortly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Summary */}
        <Card>
          <Card.Header>
            <Card.Title>Payment Summary</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">Campaign:</span>
                <span className="font-medium text-gray-900 text-right flex-1 ml-4">
                  {campaignTitle}
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">Donation Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(amount)}
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">Payment Method:</span>
                <div className="flex items-center space-x-2">
                  <span>{paymentIcon}</span>
                  <span className="font-medium text-gray-900">{paymentMethodName}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-sm text-gray-900 break-all">
                  {paymentResult.transactionId}
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">Date & Time:</span>
                <span className="font-medium text-gray-900">
                  {formatDateTime(paymentResult.created)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                  {paymentResult.status === 'succeeded' || paymentResult.status === 'completed' 
                    ? 'Completed' 
                    : paymentResult.status
                  }
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Impact & Actions */}
        <div className="space-y-6">
          {/* Impact Message */}
          <Card>
            <Card.Content className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💝</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Impact</h3>
                <p className="text-gray-600">
                  Your donation of {formatCurrency(amount)} brings this campaign closer to its goal. 
                  You're making a real difference in people's lives!
                </p>
              </div>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleDownloadReceipt}
              variant="outline"
              className="w-full"
            >
              📧 View Receipt
            </Button>
            
            <Button
              onClick={handleShareSuccess}
              variant="outline"
              className="w-full"
            >
              📱 Share Your Good Deed
            </Button>
            
            <Button
              onClick={handleBackToCampaign}
              className="w-full"
            >
              View Campaign
            </Button>
            
            <Button
              onClick={() => navigate('/campaigns')}
              variant="outline"
              className="w-full"
            >
              Browse More Campaigns
            </Button>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-8 space-y-4">
        {/* Thank You Message */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-none">
          <Card.Content className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🌟 You're Amazing!
              </h3>
              <p className="text-gray-700">
                Thanks to donors like you, we're able to support meaningful causes and make a positive impact 
                in communities around the world. Your generosity inspires others to give back too.
              </p>
            </div>
          </Card.Content>
        </Card>

        {/* Tax Information */}
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-start space-x-3">
              <span className="text-xl">📋</span>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Tax Information</h4>
                <p className="text-sm text-gray-600">
                  This donation may be tax-deductible. Please consult with a tax professional and 
                  keep your receipt for your records. If you need additional documentation, 
                  please contact us at support@donatehub.com.
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Next Steps */}
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-start space-x-3">
              <span className="text-xl">📧</span>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">What's Next?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• You'll receive an email confirmation within a few minutes</li>
                  <li>• The campaign organizer will be notified of your contribution</li>
                  <li>• You can track the campaign's progress and see updates</li>
                  <li>• Check your account for donation history and receipts</li>
                </ul>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;