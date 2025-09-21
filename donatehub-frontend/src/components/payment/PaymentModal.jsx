import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/helpers';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  onPaymentSuccess, 
  donationAmount, 
  campaignTitle,
  isProcessing = false 
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe');
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
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStripeForm = () => {
    const newErrors = {};
    
    if (!paymentData.cardNumber || paymentData.cardNumber.length < 16) {
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
    
    return newErrors;
  };

  const validatePayPalForm = () => {
    const newErrors = {};
    
    if (!paymentData.email || !/\S+@\S+\.\S+/.test(paymentData.email)) {
      newErrors.email = 'Please enter a valid PayPal email';
    }
    
    if (!paymentData.password) {
      newErrors.password = 'Please enter your PayPal password';
    }
    
    return newErrors;
  };

  const handlePayment = async () => {
    const formErrors = selectedPaymentMethod === 'stripe' 
      ? validateStripeForm() 
      : validatePayPalForm();
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const paymentInfo = {
      method: selectedPaymentMethod,
      amount: donationAmount,
      currency: 'USD',
      ...(selectedPaymentMethod === 'stripe' ? {
        card: {
          number: paymentData.cardNumber,
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

    await onPaymentSuccess(paymentInfo);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Your Donation"
      size="lg"
    >
      <Modal.Content>
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Donation Summary</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Campaign:</span>
              <span className="font-medium text-gray-900">{campaignTitle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(donationAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-4">Select Payment Method</h4>
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

        {/* Payment Form */}
        <Card className="p-6">
          {selectedPaymentMethod === 'stripe' ? (
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900 mb-4">Card Details</h5>
              
              <Input
                label="Card Number"
                value={paymentData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                error={errors.cardNumber}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Expiry Date"
                  value={paymentData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                  error={errors.expiryDate}
                  placeholder="MM/YY"
                  maxLength="5"
                />
                <Input
                  label="CVV"
                  value={paymentData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                  error={errors.cvv}
                  placeholder="123"
                  maxLength="4"
                />
              </div>
              
              <Input
                label="Cardholder Name"
                value={paymentData.cardholderName}
                onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                error={errors.cardholderName}
                placeholder="John Doe"
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
              <h5 className="font-medium text-gray-900 mb-4">PayPal Login</h5>
              
              <Input
                label="PayPal Email"
                type="email"
                value={paymentData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                placeholder="your.email@example.com"
              />
              
              <Input
                label="PayPal Password"
                type="password"
                value={paymentData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={errors.password}
                placeholder="Your PayPal password"
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
        </Card>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">🔒</span>
            <p className="text-sm text-green-800">
              Your payment information is secure and encrypted. This is a sandbox environment for testing.
            </p>
          </div>
        </div>
      </Modal.Content>

      <Modal.Footer>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          onClick={handlePayment}
          isLoading={isProcessing}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? 'Processing...' : `Donate ${formatCurrency(donationAmount)}`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentModal;