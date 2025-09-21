import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { campaignAPI } from '../services/api';
import paymentService from '../services/paymentService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ProgressBar from '../components/common/ProgressBar';
import { ComponentLoading } from '../components/common/LoadingSpinner';
import { formatCurrency, getErrorMessage, getCategoryIcon, getCategoryColor } from '../utils/helpers';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();

  const campaignId = searchParams.get('campaignId');
  const amount = searchParams.get('amount') || location.state?.amount || '';

  const [campaign, setCampaign] = useState(null);
  const [donationAmount, setDonationAmount] = useState(amount);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [paymentData, setPaymentData] = useState({
    // Stripe fields
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    // PayPal fields
    email: '',
    password: '',
  });

  useEffect(() => {
    if (!campaignId) {
      navigate('/campaigns');
      return;
    }
    fetchCampaign();
  }, [campaignId]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { 
        state: { 
          redirectTo: location.pathname + location.search,
          message: 'Please login to make a donation'
        }
      });
    }
  }, [user]);

  const fetchCampaign = async () => {
    try {
      setIsLoading(true);
      const response = await campaignAPI.getById(campaignId);
      setCampaign(response.data.data);
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
      navigate('/campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAmountChange = (value) => {
    setDonationAmount(value);
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate amount
    if (!donationAmount || isNaN(donationAmount) || parseFloat(donationAmount) <= 0) {
      newErrors.amount = 'Please enter a valid donation amount';
    } else if (parseFloat(donationAmount) < 1) {
      newErrors.amount = 'Minimum donation amount is $1';
    }

    // Validate payment method specific fields
    if (selectedPaymentMethod === 'stripe') {
      if (!paymentData.cardNumber || paymentData.cardNumber.replace(/\s/g, '').length < 13) {
        newErrors.cardNumber = 'Please enter a valid card number';
      }
      
      if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
        newErrors.expiryDate = 'Please enter expiry date (MM/YY)';
      }
      
      if (!paymentData.cvv || paymentData.cvv.length < 3) {
        newErrors.cvv = 'Please enter a valid CVV';
      }
      
      if (!paymentData.cardholderName.trim()) {
        newErrors.cardholderName = 'Please enter cardholder name';
      }
    } else if (selectedPaymentMethod === 'paypal') {
      if (!paymentData.email || !/\S+@\S+\.\S+/.test(paymentData.email)) {
        newErrors.email = 'Please enter a valid PayPal email';
      }
      
      if (!paymentData.password) {
        newErrors.password = 'Please enter your PayPal password';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      setIsProcessing(true);
      setErrors({});

      const paymentInfo = {
        method: selectedPaymentMethod,
        amount: parseFloat(donationAmount),
        currency: 'USD',
        ...(selectedPaymentMethod === 'stripe' ? {
          card: {
            number: paymentData.cardNumber.replace(/\s/g, ''),
            expiry: paymentData.expiryDate,
            cvv: paymentData.cvv,
            name: paymentData.cardholderName
          }
        } : {
          paypal: {
            email: paymentData.email
          }
        })
      };

      const result = await paymentService.processDonation(
        campaignId,
        parseFloat(donationAmount),
        paymentInfo
      );

      if (result.success) {
        // Navigate to success page with results
        navigate('/checkout/success', {
          state: {
            paymentResult: result.payment,
            donationResult: result.donation,
            campaignTitle: campaign.title,
            amount: parseFloat(donationAmount)
          }
        });
      }
    } catch (error) {
      setErrors({ general: getErrorMessage(error) });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComponentLoading message="Loading checkout..." />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign Not Found</h3>
          <Button onClick={() => navigate('/campaigns')}>Back to Campaigns</Button>
        </div>
      </div>
    );
  }

  const isActive = campaign.status === 'active';
  if (!isActive) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign Closed</h3>
          <p className="text-gray-600 mb-4">This campaign is no longer accepting donations.</p>
          <Button onClick={() => navigate('/campaigns')}>Back to Campaigns</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Complete Your Donation</h1>
        <p className="text-gray-600 mt-2">You're making a difference with your contribution</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Campaign Info & Amount */}
        <div className="space-y-6">
          {/* Campaign Summary */}
          <Card>
            <Card.Header>
              <Card.Title>Campaign Summary</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getCategoryIcon(campaign.category)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(campaign.category)}`}>
                      {campaign.category}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {campaign.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {campaign.description}
                  </p>
                  
                  <div className="mb-4">
                    <ProgressBar
                      current={campaign.raisedAmount || 0}
                      target={campaign.goalAmount}
                      size="sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Raised:</span>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(campaign.raisedAmount || 0)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Goal:</span>
                      <div className="font-semibold text-blue-600">
                        {formatCurrency(campaign.goalAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Donation Amount */}
          <Card>
            <Card.Header>
              <Card.Title>Donation Amount</Card.Title>
            </Card.Header>
            <Card.Content>
              <Input
                label="Amount (USD)"
                type="number"
                value={donationAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                error={errors.amount}
                placeholder="0.00"
                min="1"
                step="0.01"
                required
                className="text-lg"
              />
              
              {/* Quick Amount Buttons */}
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Quick amounts:</p>
                <div className="flex flex-wrap gap-2">
                  {[25, 50, 100, 250, 500].map(quickAmount => (
                    <Button
                      key={quickAmount}
                      variant={donationAmount == quickAmount ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleAmountChange(quickAmount.toString())}
                    >
                      ${quickAmount}
                    </Button>
                  ))}
                </div>
              </div>

              {donationAmount && !isNaN(donationAmount) && parseFloat(donationAmount) > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-900">
                    Your donation: {formatCurrency(parseFloat(donationAmount))}
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Every dollar helps bring this campaign closer to its goal!
                  </p>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Right Column - Payment Form */}
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>Payment Information</Card.Title>
            </Card.Header>
            <Card.Content>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('stripe')}
                      className={`p-4 border-2 rounded-lg transition-colors ${
                        selectedPaymentMethod === 'stripe'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                          💳
                        </div>
                        <span className="font-medium">Credit Card</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Via Stripe</div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('paypal')}
                      className={`p-4 border-2 rounded-lg transition-colors ${
                        selectedPaymentMethod === 'paypal'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                          🅿️
                        </div>
                        <span className="font-medium">PayPal</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">PayPal Account</div>
                    </button>
                  </div>
                </div>

                {/* Payment Form Fields */}
                {selectedPaymentMethod === 'stripe' ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Card Details</h4>
                    
                    <Input
                      label="Card Number"
                      value={paymentData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                      error={errors.cardNumber}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      required
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Expiry Date"
                        value={paymentData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                        error={errors.expiryDate}
                        placeholder="MM/YY"
                        maxLength="5"
                        required
                      />
                      <Input
                        label="CVV"
                        value={paymentData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                        error={errors.cvv}
                        placeholder="123"
                        maxLength="4"
                        required
                      />
                    </div>
                    
                    <Input
                      label="Cardholder Name"
                      value={paymentData.cardholderName}
                      onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                      error={errors.cardholderName}
                      placeholder="John Doe"
                      required
                    />

                    {/* Test Cards Info */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium mb-2">Test Cards (Sandbox):</p>
                      <div className="text-xs text-yellow-700 space-y-1">
                        <div>• Success: 4242 4242 4242 4242</div>
                        <div>• Declined: 4000 0000 0000 0002</div>
                        <div>• Any future date and CVV</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">PayPal Login</h4>
                    
                    <Input
                      label="PayPal Email"
                      type="email"
                      value={paymentData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      error={errors.email}
                      placeholder="your.email@example.com"
                      required
                    />
                    
                    <Input
                      label="PayPal Password"
                      type="password"
                      value={paymentData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      error={errors.password}
                      placeholder="Your PayPal password"
                      required
                    />

                    {/* Test PayPal Info */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium mb-2">Test PayPal (Sandbox):</p>
                      <div className="text-xs text-yellow-700 space-y-1">
                        <div>• Email: donor@example.com</div>
                        <div>• Password: any password</div>
                        <div>• Automatically approved</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* General Error */}
                {errors.general && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}

                {/* Security Notice */}
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">🔒</span>
                    <p className="text-sm text-green-800">
                      Your payment information is secure and encrypted. This is a sandbox environment for testing.
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                  isLoading={isProcessing}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing Payment...' : `Donate ${donationAmount ? formatCurrency(parseFloat(donationAmount)) : '$0.00'}`}
                </Button>
              </form>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;