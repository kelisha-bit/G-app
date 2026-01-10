# 🤖 How to Add OpenAI API Key

## Quick Setup Guide

### Step 1: Get Your OpenAI API Key

1. **Sign up / Log in to OpenAI**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Create an account or sign in

2. **Navigate to API Keys**
   - Click on your profile icon (top right)
   - Select **"View API keys"** or go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

3. **Create New API Key**
   - Click **"Create new secret key"**
   - Give it a name (e.g., "Church App")
   - Copy the key immediately (you won't see it again!)
   - ⚠️ **Important**: Save it securely

4. **Add Payment Method** (if needed)
   - OpenAI may require a payment method even for free tier
   - Free tier: Usually $5-18 in free credits
   - Go to [platform.openai.com/account/billing](https://platform.openai.com/account/billing)

### Step 2: Add API Key to Your App

**Option A: Direct Edit (Simplest)**

1. Open `src/utils/aiService.js`
2. Find line 23:
   ```javascript
   const OPENAI_API_KEY = null; // Set to your OpenAI API key
   ```
3. Replace `null` with your API key in quotes:
   ```javascript
   const OPENAI_API_KEY = 'sk-your-actual-api-key-here';
   ```

4. (Optional) Change provider from Hugging Face to OpenAI on line 15:
   ```javascript
   const AI_PROVIDER = 'openai'; // Changed from 'huggingface'
   ```

**Option B: Use Environment Variables (Recommended for Production)**

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. Install `dotenv` if needed:
   ```bash
   npm install dotenv
   ```
4. Update `src/utils/aiService.js` line 23:
   ```javascript
   const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || null;
   ```

⚠️ **Important**: Add `.env` to your `.gitignore` file to avoid committing your API key!

### Step 3: Switch to OpenAI (Optional)

If you want to use OpenAI instead of Hugging Face:

1. In `src/utils/aiService.js`, line 15:
   ```javascript
   const AI_PROVIDER = 'openai'; // Change from 'huggingface'
   ```

### Step 4: Test

1. Restart your Expo app:
   ```bash
   npm start --clear
   ```

2. Test AI features:
   - Go to **Prayer** screen → Try "AI Help" button
   - Go to **Devotional** screen (Admin) → Try "AI Generate" button
   - Go to **Prayer** screen → Try "Get Verse Suggestions"

---

## 💰 OpenAI Pricing

### Free Tier
- **$5-18 in free credits** when you sign up
- Usually enough for testing and light usage

### Paid Tier
- **GPT-3.5-turbo**: ~$0.002 per 1K tokens (very affordable)
- **GPT-4**: Higher cost, better quality
- Check current pricing: [openai.com/pricing](https://openai.com/pricing)

### Cost Estimation for Church App
- **Prayer suggestions**: ~500 tokens each (~$0.001)
- **Devotional content**: ~1000 tokens each (~$0.002)
- **Bible verse suggestions**: ~300 tokens each (~$0.0006)

**Example**: 100 prayer suggestions = ~$0.10

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Keep your API key secret
- ✅ Use environment variables in production
- ✅ Add `.env` to `.gitignore`
- ✅ Set usage limits in OpenAI dashboard
- ✅ Monitor your usage regularly

### ❌ DON'T:
- ❌ Commit API keys to Git
- ❌ Share API keys publicly
- ❌ Hardcode keys in production
- ❌ Use same key for multiple projects

---

## 🆘 Troubleshooting

### Error: "OpenAI API key not configured"
- **Solution**: Make sure you added the API key correctly in `aiService.js`
- Check for typos or extra spaces
- Restart your app after adding the key

### Error: "Invalid API key"
- **Solution**: 
  - Verify the key is correct
  - Check if key starts with `sk-`
  - Make sure you copied the entire key
  - Regenerate key if needed

### Error: "Insufficient quota"
- **Solution**: 
  - Check your OpenAI account billing
  - Add payment method if needed
  - Wait for free credits to reset (monthly)

### Error: "Rate limit exceeded"
- **Solution**: 
  - You're making too many requests too quickly
  - Wait a few seconds and try again
  - Consider adding rate limiting in your app

---

## 🎯 Current Configuration

After setup, your `aiService.js` should look like:

```javascript
// Configuration - Set your preferred provider
const AI_PROVIDER = 'openai'; // or 'huggingface'

// OpenAI API
const OPENAI_API_KEY = 'sk-your-actual-key-here'; // Your actual key
```

---

## 📝 Quick Reference

**File to Edit**: `src/utils/aiService.js`  
**Line to Edit**: Line 23 (API key), Line 15 (provider)  
**API Key Format**: `sk-...` (starts with "sk-")  
**Where to Get Key**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

---

## ✅ Checklist

- [ ] Created OpenAI account
- [ ] Generated API key
- [ ] Added payment method (if required)
- [ ] Added API key to `src/utils/aiService.js`
- [ ] (Optional) Changed provider to 'openai'
- [ ] Restarted app
- [ ] Tested AI features
- [ ] Added `.env` to `.gitignore` (if using env vars)

---

**Need Help?** 
- OpenAI Docs: https://platform.openai.com/docs
- OpenAI Support: https://help.openai.com
- Check `AI_FEATURES_GUIDE.md` in your project for more details

