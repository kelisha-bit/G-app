/**
 * Payment Service for Mobile Money Integration
 * Supports Flutterwave and Paystack payment gateways
 * 
 * Setup Instructions:
 * 1. Sign up for Flutterwave (https://flutterwave.com) or Paystack (https://paystack.com)
 * 2. Get your API keys from the dashboard
 * 3. Set the API keys in environment variables or update the constants below
 * 4. Choose your preferred provider: 'flutterwave' or 'paystack'
 */

// Payment Gateway Configuration
const PAYMENT_PROVIDER = 'flutterwave'; // Options: 'flutterwave' or 'paystack'

// API Keys - Set these in your environment variables or update directly
// For production, use environment variables: process.env.EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY
const FLUTTERWAVE_PUBLIC_KEY = process.env.EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || null;
const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || null;

// Base URLs
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Map mobile money provider to gateway-specific codes
 */
const getProviderCode = (provider, gateway) => {
  const providerMap = {
    flutterwave: {
      'MTN': 'MTN',
      'Vodafone': 'VODAFONE',
      'AirtelTigo': 'AIRTELTIGO',
    },
    paystack: {
      'MTN': 'mtn',
      'Vodafone': 'vodafone',
      'AirtelTigo': 'tigo',
    },
  };

  return providerMap[gateway]?.[provider] || provider;
};

/**
 * Format phone number for payment gateway
 * Converts Ghana numbers to international format
 */
const formatPhoneNumber = (phone) => {
  // Remove all spaces and non-numeric characters
  let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  
  // If starts with 0, replace with 233
  if (cleaned.startsWith('0')) {
    cleaned = '233' + cleaned.substring(1);
  } else if (!cleaned.startsWith('233')) {
    cleaned = '233' + cleaned;
  }
  
  return cleaned;
};

/**
 * Initialize mobile money payment with Flutterwave
 */
const initiateFlutterwavePayment = async (paymentData) => {
  const { amount, phone, provider, email, transactionId, category } = paymentData;

  if (!FLUTTERWAVE_PUBLIC_KEY) {
    throw new Error('Flutterwave public key not configured');
  }

  const payload = {
    tx_ref: transactionId,
    amount: amount,
    currency: 'GHS',
    payment_options: 'mobilemoneyghana',
    redirect_url: 'https://your-app.com/payment-callback', // Update with your callback URL
    customer: {
      email: email,
      phone_number: formatPhoneNumber(phone),
      name: email.split('@')[0], // Use email username as name
    },
    customizations: {
      title: 'Church Donation',
      description: `${category} - Greater Works City Church`,
      logo: 'https://your-app.com/logo.png', // Update with your logo URL
    },
    meta: {
      category: category,
      transactionId: transactionId,
    },
  };

  try {
    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLUTTERWAVE_PUBLIC_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.status === 'success') {
      return {
        success: true,
        paymentLink: data.data.link,
        transactionId: transactionId,
        provider: 'flutterwave',
      };
    } else {
      throw new Error(data.message || 'Payment initiation failed');
    }
  } catch (error) {
    console.error('Flutterwave payment error:', error);
    throw error;
  }
};

/**
 * Initialize mobile money payment with Paystack
 */
const initiatePaystackPayment = async (paymentData) => {
  const { amount, phone, provider, email, transactionId, category } = paymentData;

  if (!PAYSTACK_PUBLIC_KEY) {
    throw new Error('Paystack public key not configured');
  }

  // Paystack mobile money payment
  const payload = {
    email: email,
    amount: amount * 100, // Paystack amounts are in pesewas (multiply by 100)
    currency: 'GHS',
    reference: transactionId,
    callback_url: 'https://your-app.com/payment-callback', // Update with your callback URL
    metadata: {
      category: category,
      transactionId: transactionId,
      phone: formatPhoneNumber(phone),
      provider: getProviderCode(provider, 'paystack'),
    },
    channels: ['mobile_money'], // Specify mobile money channel
  };

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYSTACK_PUBLIC_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.status) {
      return {
        success: true,
        paymentLink: data.data.authorization_url,
        accessCode: data.data.access_code,
        transactionId: transactionId,
        provider: 'paystack',
      };
    } else {
      throw new Error(data.message || 'Payment initiation failed');
    }
  } catch (error) {
    console.error('Paystack payment error:', error);
    throw error;
  }
};

/**
 * Verify payment status
 */
const verifyPayment = async (transactionId, provider = PAYMENT_PROVIDER) => {
  try {
    if (provider === 'flutterwave' || PAYMENT_PROVIDER === 'flutterwave') {
      const response = await fetch(
        `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${FLUTTERWAVE_PUBLIC_KEY}`,
          },
        }
      );

      const data = await response.json();
      return {
        success: data.status === 'success',
        status: data.data?.status,
        amount: data.data?.amount,
        currency: data.data?.currency,
      };
    } else if (provider === 'paystack' || PAYMENT_PROVIDER === 'paystack') {
      const response = await fetch(
        `${PAYSTACK_BASE_URL}/transaction/verify/${transactionId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${PAYSTACK_PUBLIC_KEY}`,
          },
        }
      );

      const data = await response.json();
      return {
        success: data.status && data.data?.status === 'success',
        status: data.data?.status,
        amount: data.data?.amount / 100, // Convert from pesewas to cedis
        currency: data.data?.currency,
      };
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Main function to initiate mobile money payment
 */
export const initiateMobileMoneyPayment = async (paymentData) => {
  const { amount, phone, provider, email, transactionId, category } = paymentData;

  // Validate required fields
  if (!amount || !phone || !provider || !email || !transactionId) {
    throw new Error('Missing required payment data');
  }

  // Check if API keys are configured
  if (PAYMENT_PROVIDER === 'flutterwave' && !FLUTTERWAVE_PUBLIC_KEY) {
    throw new Error('Flutterwave API key not configured. Please set EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY');
  }

  if (PAYMENT_PROVIDER === 'paystack' && !PAYSTACK_PUBLIC_KEY) {
    throw new Error('Paystack API key not configured. Please set EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY');
  }

  // Route to appropriate payment gateway
  if (PAYMENT_PROVIDER === 'flutterwave') {
    return await initiateFlutterwavePayment(paymentData);
  } else if (PAYMENT_PROVIDER === 'paystack') {
    return await initiatePaystackPayment(paymentData);
  } else {
    throw new Error(`Unsupported payment provider: ${PAYMENT_PROVIDER}`);
  }
};

/**
 * Verify payment status
 */
export { verifyPayment };

/**
 * Check if payment service is configured
 */
export const isPaymentServiceConfigured = () => {
  if (PAYMENT_PROVIDER === 'flutterwave') {
    return !!FLUTTERWAVE_PUBLIC_KEY;
  } else if (PAYMENT_PROVIDER === 'paystack') {
    return !!PAYSTACK_PUBLIC_KEY;
  }
  return false;
};

/**
 * Get payment provider name
 */
export const getPaymentProvider = () => {
  return PAYMENT_PROVIDER;
};

