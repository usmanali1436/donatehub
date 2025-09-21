import { donationAPI } from './api';

// Mock payment gateway service
class PaymentService {
  // Stripe sandbox simulation
  async processStripePayment(paymentInfo) {
    const { card, amount, currency = 'USD' } = paymentInfo;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test card numbers for different scenarios
    const testCards = {
      '4242424242424242': 'success', // Success
      '4000000000000002': 'decline',  // Declined
      '4000000000000119': 'processing_error', // Processing error
      '4000000000000127': 'incorrect_cvc', // Incorrect CVC
    };
    
    const cardNumber = card.number.replace(/\s/g, '');
    const result = testCards[cardNumber] || 'success';
    
    switch (result) {
      case 'decline':
        throw new Error('Your card was declined. Please try a different payment method.');
      
      case 'processing_error':
        throw new Error('Unable to process payment at this time. Please try again.');
      
      case 'incorrect_cvc':
        throw new Error('Your card\'s security code is incorrect.');
      
      case 'success':
      default:
        return {
          success: true,
          transactionId: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          method: 'stripe',
          amount: amount,
          currency: currency,
          card: {
            last4: cardNumber.slice(-4),
            brand: this.detectCardBrand(cardNumber),
            exp_month: parseInt(card.expiry.split('/')[0]),
            exp_year: parseInt('20' + card.expiry.split('/')[1]),
          },
          receipt_url: `https://payment-receipts.stripe.com/test_receipt_${Date.now()}`,
          status: 'succeeded',
          created: new Date().toISOString(),
        };
    }
  }

  // PayPal sandbox simulation
  async processPayPalPayment(paymentInfo) {
    const { paypal, amount, currency = 'USD' } = paymentInfo;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Test email scenarios
    const testEmails = {
      'declined@example.com': 'decline',
      'error@example.com': 'processing_error',
      'insufficient@example.com': 'insufficient_funds',
    };
    
    const result = testEmails[paypal.email] || 'success';
    
    switch (result) {
      case 'decline':
        throw new Error('PayPal payment was declined. Please check your account.');
      
      case 'processing_error':
        throw new Error('PayPal is temporarily unavailable. Please try again.');
      
      case 'insufficient_funds':
        throw new Error('Insufficient funds in your PayPal account.');
      
      case 'success':
      default:
        return {
          success: true,
          transactionId: `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          method: 'paypal',
          amount: amount,
          currency: currency,
          payer: {
            email: paypal.email,
            status: 'VERIFIED',
          },
          receipt_url: `https://paypal.com/activity/payment/${Date.now()}`,
          status: 'completed',
          created: new Date().toISOString(),
        };
    }
  }

  // Main payment processing method
  async processPayment(paymentInfo) {
    try {
      let paymentResult;
      
      if (paymentInfo.method === 'stripe') {
        paymentResult = await this.processStripePayment(paymentInfo);
      } else if (paymentInfo.method === 'paypal') {
        paymentResult = await this.processPayPalPayment(paymentInfo);
      } else {
        throw new Error('Unsupported payment method');
      }
      
      return paymentResult;
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }

  // Create donation with payment integration
  async processDonation(campaignId, amount, paymentInfo) {
    try {
      // Process payment first
      const paymentResult = await this.processPayment({
        ...paymentInfo,
        amount,
      });

      // If payment successful, create donation record
      const donationData = {
        campaignId,
        amount,
        paymentMethod: paymentResult.method,
        transactionId: paymentResult.transactionId,
        paymentDetails: {
          transactionId: paymentResult.transactionId,
          method: paymentResult.method,
          status: paymentResult.status,
          currency: paymentResult.currency,
          receiptUrl: paymentResult.receipt_url,
          processedAt: paymentResult.created,
          ...(paymentResult.card && {
            card: {
              last4: paymentResult.card.last4,
              brand: paymentResult.card.brand,
            }
          }),
          ...(paymentResult.payer && {
            paypal: {
              email: paymentResult.payer.email,
              status: paymentResult.payer.status,
            }
          }),
        }
      };

      // Call the donation API
      const donationResponse = await donationAPI.donate(donationData);
      
      return {
        success: true,
        donation: donationResponse.data.data,
        payment: paymentResult,
        message: 'Donation completed successfully!'
      };
    } catch (error) {
      console.error('Donation processing failed:', error);
      throw error;
    }
  }

  // Utility method to detect card brand
  detectCardBrand(cardNumber) {
    const number = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6/.test(number)) return 'discover';
    
    return 'unknown';
  }

  // Utility method to get payment method icon
  getPaymentMethodIcon(method, brand = null) {
    if (method === 'stripe' && brand) {
      const brandIcons = {
        visa: '💳',
        mastercard: '💳',
        amex: '💳',
        discover: '💳',
      };
      return brandIcons[brand] || '💳';
    }
    
    if (method === 'paypal') {
      return '🅿️';
    }
    
    return '💳';
  }

  // Format payment method display name
  getPaymentMethodDisplayName(method, details = {}) {
    if (method === 'stripe' && details.card) {
      const brand = details.card.brand || 'card';
      const last4 = details.card.last4 || '****';
      return `${brand.charAt(0).toUpperCase() + brand.slice(1)} ending in ${last4}`;
    }
    
    if (method === 'paypal' && details.paypal) {
      return `PayPal (${details.paypal.email})`;
    }
    
    return method.charAt(0).toUpperCase() + method.slice(1);
  }
}

export const paymentService = new PaymentService();
export default paymentService;