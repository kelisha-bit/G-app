# 📱 Mobile Money Payment API Setup Guide

This guide will help you integrate direct mobile money payment APIs (Flutterwave or Paystack) into your church app.

## 🎯 Overview

The app now supports direct mobile money payments through:
- **Flutterwave** - Supports MTN, Vodafone, and AirtelTigo mobile money
- **Paystack** - Supports mobile money in Ghana

Both gateways allow users to pay directly from their mobile money wallets without leaving the app.

---

## 📋 Prerequisites

1. A business account with either Flutterwave or Paystack
2. Business registration documents (for account verification)
3. Bank account for receiving payments
4. API keys from your chosen payment gateway

---

## 🔧 Step 1: Choose Your Payment Gateway

### Option A: Flutterwave (Recommended for Ghana)

**Pros:**
- Excellent mobile money support in Ghana
- Easy integration
- Good documentation
- Supports all three major providers (MTN, Vodafone, AirtelTigo)

**Cons:**
- Requires business verification
- Transaction fees apply

**Sign up:** [https://flutterwave.com](https://flutterwave.com)

### Option B: Paystack

**Pros:**
- Popular in West Africa
- Good mobile money support
- Simple API

**Cons:**
- Requires business verification
- Transaction fees apply

**Sign up:** [https://paystack.com](https://paystack.com)

---

## 🔑 Step 2: Get Your API Keys

### For Flutterwave:

1. **Sign up/Login** to Flutterwave dashboard
2. Go to **Settings** → **API Keys**
3. Copy your **Public Key** (starts with `FLWPUBK-`)
4. For production, you'll also need your **Secret Key** (for webhooks)

### For Paystack:

1. **Sign up/Login** to Paystack dashboard
2. Go to **Settings** → **API Keys & Webhooks**
3. Copy your **Public Key** (starts with `pk_test_` for test mode or `pk_live_` for live mode)

---

## ⚙️ Step 3: Configure API Keys

### Option A: Environment Variables (Recommended)

1. Create or update your `.env` file in the project root:

```env
# For Flutterwave
EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your-public-key-here

# OR for Paystack
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your-public-key-here
```

2. Make sure `.env` is in your `.gitignore` file

3. The app will automatically use these environment variables

### Option B: Direct Configuration

1. Open `src/utils/paymentService.js`
2. Find the API key constants (around line 12-13)
3. Update directly:

```javascript
const FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK-your-actual-key-here';
// OR
const PAYSTACK_PUBLIC_KEY = 'pk_test_your-actual-key-here';
```

---

## 🔄 Step 4: Choose Payment Provider

1. Open `src/utils/paymentService.js`
2. Find line 7:
```javascript
const PAYMENT_PROVIDER = 'flutterwave'; // Options: 'flutterwave' or 'paystack'
```
3. Change to your preferred provider:
```javascript
const PAYMENT_PROVIDER = 'paystack'; // or 'flutterwave'
```

---

## 🌐 Step 5: Configure Callback URLs

### Update Payment Service Callback URLs

1. Open `src/utils/paymentService.js`
2. Find the callback URLs (around lines 60 and 100)
3. Update with your actual callback URLs:

**For Flutterwave:**
```javascript
redirect_url: 'https://your-domain.com/payment-callback',
```

**For Paystack:**
```javascript
callback_url: 'https://your-domain.com/payment-callback',
```

### Set Up Webhook Endpoint (For Production)

You'll need a backend endpoint to receive payment confirmations:

1. **Create a webhook endpoint** (e.g., using Firebase Cloud Functions or a Node.js server)
2. **Verify payment status** when webhook is called
3. **Update donation status** in Firestore

Example webhook structure:
```javascript
// Firebase Cloud Function example
exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
  const { transactionId, status } = req.body;
  
  // Verify payment with gateway
  // Update Firestore donation status
  // Send confirmation notification
  
  res.status(200).send('OK');
});
```

---

## 🧪 Step 6: Test the Integration

### Test Mode

1. Use **test API keys** (test keys are provided by both gateways)
2. Use test phone numbers provided by the gateway
3. Make a test donation
4. Verify the payment flow works

### Test Phone Numbers

**Flutterwave Test Numbers:**
- MTN: 0244123456
- Vodafone: 0204123456
- AirtelTigo: 0274123456

**Paystack Test Numbers:**
- Check Paystack dashboard for test numbers

---

## 🚀 Step 7: Go Live

1. **Complete business verification** with your chosen gateway
2. **Switch to live API keys** in your configuration
3. **Update callback URLs** to production URLs
4. **Test with real transactions** (start with small amounts)
5. **Monitor transactions** in the gateway dashboard

---

## 📱 How It Works

1. **User selects Mobile Money** as payment method
2. **User enters phone number** and selects provider (MTN/Vodafone/AirtelTigo)
3. **User confirms donation**
4. **App calls payment API** to initiate payment
5. **Payment link opens** in browser (or in-app browser)
6. **User approves payment** on their phone
7. **Payment gateway processes** the transaction
8. **Webhook updates** donation status (when configured)
9. **User receives confirmation**

---

## 🔍 Troubleshooting

### Payment API Not Configured Error

**Problem:** "Payment API key not configured"

**Solution:**
- Check that your API key is set in `.env` or `paymentService.js`
- Verify the key format is correct
- Restart the Expo development server after adding environment variables

### Payment Link Not Opening

**Problem:** Payment link doesn't open in browser

**Solution:**
- Check that `Linking` is imported in `GivingScreen.js`
- Verify the payment API returned a valid link
- Check device browser permissions

### Payment Not Completing

**Problem:** Payment initiated but not completing

**Solution:**
- Check gateway dashboard for transaction status
- Verify webhook is configured correctly
- Check that callback URLs are accessible
- Review gateway logs for errors

### Test Mode vs Live Mode

**Problem:** Payments work in test but not in production

**Solution:**
- Ensure you're using live API keys (not test keys)
- Complete business verification
- Update callback URLs to production URLs
- Check gateway account status

---

## 💰 Transaction Fees

Both gateways charge transaction fees:

- **Flutterwave:** ~1.4% + ₵0.50 per transaction
- **Paystack:** ~1.5% + ₵1.00 per transaction

Fees are deducted automatically from received payments.

---

## 📞 Support

### Flutterwave Support
- Email: support@flutterwave.com
- Documentation: [https://developer.flutterwave.com](https://developer.flutterwave.com)

### Paystack Support
- Email: support@paystack.com
- Documentation: [https://paystack.com/docs](https://paystack.com/docs)

---

## 🔐 Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Use HTTPS** for all callback URLs
5. **Verify webhook signatures** before processing
6. **Monitor transactions** regularly
7. **Set up alerts** for suspicious activity

---

## 📝 Next Steps

After setting up mobile money payments:

1. ✅ Test with small amounts
2. ✅ Set up webhook endpoint for automatic status updates
3. ✅ Configure email/SMS notifications for successful payments
4. ✅ Set up transaction reporting
5. ✅ Train church staff on payment monitoring

---

## 🎉 You're All Set!

Once configured, users can:
- Pay directly from their mobile money wallets
- Receive instant payment confirmations
- Track their giving history
- Get receipts for tax purposes

Happy giving! 🙏

