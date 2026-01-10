# 🤖 AI Features Integration Guide

This document explains the AI-powered features integrated into the Greater Works City Church app.

---

## 🎯 Overview

The app now includes **three AI-powered features** to enhance user experience and help with content creation:

1. **AI Prayer Request Helper** - Assists users in writing better prayer requests
2. **AI Devotional Content Assistant** - Helps admins generate devotional reflections
3. **AI Bible Verse Recommender** - Suggests relevant Bible verses based on topics

---

## 🚀 AI Features

### 1. AI Prayer Request Helper

**Location**: Prayer Screen → Submit Request tab

**What it does**:
- Helps users structure and improve their prayer requests
- Provides suggestions to make requests clearer and more meaningful
- Suggests relevant Bible verses based on the prayer topic

**How to use**:

1. Navigate to **Prayer** → **Submit Request** tab
2. Enter a prayer title (e.g., "Healing", "Job Search", "Family")
3. Start typing your prayer request
4. Tap the **"AI Help"** button next to "Prayer Request" label
5. The AI will suggest an improved version of your prayer request
6. Review and edit the suggestion as needed
7. Optionally, tap **"Get Bible Verse Suggestions"** to see relevant verses

**Features**:
- ✅ One-click AI assistance
- ✅ Automatic Bible verse suggestions
- ✅ Context-aware recommendations
- ✅ Fallback suggestions if AI unavailable

---

### 2. AI Devotional Content Assistant

**Location**: Admin Dashboard → Manage Devotionals → Create/Edit Devotional

**What it does**:
- Generates devotional reflection content based on Bible verses
- Creates prayer suggestions based on the verse
- Saves time for admins creating daily devotionals

**How to use**:

1. Navigate to **Admin Dashboard** → **Manage Devotionals**
2. Tap **+** to create a new devotional
3. Enter a **Bible Verse Reference** (e.g., "John 3:16")
4. Tap **"Fetch Verse"** to get the verse text
5. Once verse is loaded, tap **"AI Generate"** next to "Reflection Content"
6. AI will generate:
   - Reflection content (2-3 paragraphs)
   - Prayer suggestion
7. Review and edit the generated content
8. Complete the form and save

**Features**:
- ✅ Generates reflection based on verse
- ✅ Creates matching prayer
- ✅ Context-aware content
- ✅ Editable output

---

### 3. AI Bible Verse Recommender

**Location**: Prayer Screen → Submit Request tab

**What it does**:
- Suggests relevant Bible verses based on prayer topics
- Provides verse references with brief explanations
- Helps users find encouraging scriptures

**How to use**:

1. In **Prayer** → **Submit Request** tab
2. Enter your prayer title and/or request
3. Tap **"Get Bible Verse Suggestions"** button
4. View suggested verses with explanations
5. Use the verses for encouragement or in your prayer request

**Features**:
- ✅ Topic-based verse suggestions
- ✅ Brief explanations for each verse
- ✅ Multiple verses per topic
- ✅ Context-aware recommendations

---

## ⚙️ AI Provider Setup

The app supports multiple AI providers. Choose one based on your needs:

### Option 1: Hugging Face (Recommended for Free Tier)

**Pros**:
- ✅ Completely free (no credit card required)
- ✅ No API key needed for basic usage
- ✅ Multiple models available

**Cons**:
- ⚠️ Slower response times (free tier)
- ⚠️ May have rate limits

**Setup**:
1. No setup required! Works out of the box.
2. Optional: Get a free token at [huggingface.co](https://huggingface.co) for faster responses
3. If you get a token, add it to `src/utils/aiService.js`:
   ```javascript
   const HUGGINGFACE_TOKEN = 'your_token_here';
   ```

### Option 2: OpenAI (Better Quality, Requires API Key)

**Pros**:
- ✅ Higher quality responses
- ✅ Faster responses
- ✅ More reliable

**Cons**:
- ⚠️ Requires API key (free credits available)
- ⚠️ May require credit card for signup

**Setup**:
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Get your API key from the dashboard
3. Add free credits (usually $5-18 free)
4. Open `src/utils/aiService.js`
5. Find this line:
   ```javascript
   const OPENAI_API_KEY = null;
   ```
6. Replace with your API key:
   ```javascript
   const OPENAI_API_KEY = 'sk-your-api-key-here';
   ```
7. Change provider (optional):
   ```javascript
   const AI_PROVIDER = 'openai'; // Change from 'huggingface'
   ```

---

## 📋 Configuration

### Current Configuration

The AI service is configured in `src/utils/aiService.js`:

```javascript
// Choose your provider
const AI_PROVIDER = 'huggingface'; // or 'openai'

// Hugging Face (optional token)
const HUGGINGFACE_TOKEN = null;

// OpenAI (required if using OpenAI)
const OPENAI_API_KEY = null;
```

### Switching Providers

To switch from Hugging Face to OpenAI:

1. Get OpenAI API key (see setup above)
2. Open `src/utils/aiService.js`
3. Change:
   ```javascript
   const AI_PROVIDER = 'openai';
   const OPENAI_API_KEY = 'your-key-here';
   ```

---

## 🎨 How It Works

### AI Prayer Request Helper

1. User enters prayer request text
2. AI analyzes the input
3. AI suggests improved structure and clarity
4. User can accept, edit, or ignore the suggestion

### AI Devotional Content Assistant

1. Admin fetches a Bible verse
2. AI analyzes the verse text and reference
3. AI generates:
   - Reflection content (2-3 paragraphs)
   - Prayer suggestion
4. Admin reviews and edits as needed

### AI Bible Verse Recommender

1. User enters prayer topic/situation
2. AI identifies relevant themes
3. AI suggests 3-5 relevant Bible verses
4. Verses displayed with brief explanations

---

## 🔧 Technical Details

### File Structure

```
src/
├── utils/
│   └── aiService.js          # AI service utility
├── screens/
│   ├── PrayerScreen.js        # AI Prayer Helper integrated
│   └── admin/
│       └── ManageDevotionalsScreen.js  # AI Devotional Assistant
```

### Functions Available

**In `aiService.js`**:
- `generatePrayerSuggestion(input, topic)` - Generates prayer request suggestions
- `generateDevotionalContent(verse, verseText, title)` - Generates devotional content
- `suggestBibleVerses(topic, situation)` - Suggests relevant verses
- `isAIConfigured()` - Checks if AI is properly configured
- `getAIProviderStatus()` - Returns provider status

### Fallback System

If AI services are unavailable, the app uses intelligent fallback responses:
- Rule-based suggestions
- Pre-defined verse recommendations
- Helpful prompts

This ensures the app always provides value, even without AI.

---

## ⚠️ Troubleshooting

### Issue: "AI suggestion unavailable"

**Possible causes**:
1. No internet connection
2. AI service temporarily down
3. Rate limit exceeded (free tier)

**Solutions**:
- Check internet connection
- Try again in a few moments
- Use manual writing (AI is optional)

### Issue: "AI API key not configured"

**Solution**:
- If using OpenAI, add your API key to `src/utils/aiService.js`
- If using Hugging Face, no key needed (but optional token helps)

### Issue: Slow AI responses

**Solutions**:
- Get a Hugging Face token for faster responses
- Switch to OpenAI for better performance
- Check internet connection speed

### Issue: AI generates irrelevant content

**Solutions**:
- Provide more context in your input
- Edit the AI-generated content (it's meant to be a starting point)
- Try rephrasing your request

---

## 💡 Best Practices

### For Prayer Requests

1. **Be specific**: Enter clear prayer topics for better AI suggestions
2. **Review suggestions**: Always review and edit AI suggestions
3. **Use verse suggestions**: Incorporate suggested verses into your prayers
4. **Personalize**: AI provides structure, but add your personal touch

### For Devotionals

1. **Fetch verse first**: Always fetch the Bible verse before using AI
2. **Review carefully**: AI content is a starting point, not final
3. **Edit as needed**: Personalize the reflection to match your church's voice
4. **Add context**: Include relevant examples or applications

### For Verse Recommendations

1. **Be specific**: Enter specific topics (e.g., "healing", "peace", "guidance")
2. **Use in prayers**: Incorporate suggested verses into prayer requests
3. **Share with others**: Use verses to encourage others

---

## 📊 AI Usage Tips

### Getting Better Results

1. **Provide context**: More context = better AI suggestions
2. **Be specific**: Specific topics get better verse recommendations
3. **Review output**: Always review and edit AI-generated content
4. **Combine features**: Use verse suggestions with prayer helper

### Privacy & Content

- AI suggestions are generated on-the-fly
- No user data is stored by AI services
- All content is editable before submission
- AI is a tool to assist, not replace human creativity

---

## 🎯 Use Cases

### Example 1: User Needs Help Writing Prayer

```
1. User opens Prayer screen
2. Enters: "need help with job"
3. Taps "AI Help"
4. AI suggests: "Please pray for me as I search for employment. 
   I need God's guidance and provision in finding the right job 
   opportunity that aligns with His will for my life."
5. User edits and submits
```

### Example 2: Admin Creating Daily Devotional

```
1. Admin creates devotional
2. Enters verse: "John 3:16"
3. Fetches verse text
4. Taps "AI Generate"
5. AI generates reflection and prayer
6. Admin reviews, edits, and saves
```

### Example 3: Finding Encouraging Verses

```
1. User enters prayer topic: "anxiety"
2. Taps "Get Bible Verse Suggestions"
3. AI suggests:
   - Philippians 4:6-7 (Peace)
   - 1 Peter 5:7 (Cast your cares)
   - Matthew 6:25-34 (Don't worry)
4. User uses verses in prayer request
```

---

## ✅ Checklist

### Initial Setup
- [ ] Choose AI provider (Hugging Face or OpenAI)
- [ ] If using OpenAI, get API key and add to config
- [ ] Test AI features in Prayer screen
- [ ] Test AI features in Devotional creation

### For Users
- [ ] Know how to use AI Prayer Helper
- [ ] Understand how to get verse suggestions
- [ ] Know AI is optional (can write manually)

### For Admins
- [ ] Know how to use AI Devotional Assistant
- [ ] Understand to fetch verse first
- [ ] Know to review and edit AI content

---

## 🚀 Future Enhancements

Possible improvements:
- [ ] AI sermon summary generation
- [ ] AI announcement content suggestions
- [ ] AI-powered search with semantic understanding
- [ ] AI prayer request categorization
- [ ] AI content moderation assistance

---

**Status**: ✅ AI Features Integrated and Ready to Use

**Last Updated**: January 2025

**Note**: AI features are optional enhancements. All features work without AI, but AI makes them more powerful and user-friendly.

