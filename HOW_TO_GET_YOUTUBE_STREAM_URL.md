# 📺 How to Get YouTube Stream URL for Your App

This guide explains how to get the YouTube Live stream URL from YouTube Studio and add it to your app.

---

## 🎯 Quick Steps

### Step 1: Go to YouTube Studio
1. Visit [studio.youtube.com](https://studio.youtube.com)
2. Sign in with your YouTube account
3. Make sure your channel is verified (required for live streaming)

### Step 2: Start a Live Stream
1. Click the **"Create"** button (top right corner)
2. Select **"Go Live"**
3. If this is your first time, you may need to:
   - Verify your channel (takes 24 hours)
   - Enable live streaming in your channel settings

### Step 3: Set Up Your Stream
1. **Basic Info:**
   - Enter a title (e.g., "Sunday Morning Service")
   - Add a description
   - Choose visibility (Public, Unlisted, or Private)
   - Add a thumbnail image (optional)

2. **Stream Settings:**
   - Choose "Webcam" or "Stream" (for external streaming software)
   - For your app, you'll use the "Stream" option

### Step 4: Get Your Stream URL

#### Option A: For Live Stream (Currently Streaming)
1. Once your stream is live, click on the video
2. Copy the URL from the address bar
3. Format: `https://www.youtube.com/watch?v=VIDEO_ID`
4. Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

#### Option B: For Scheduled Stream (Future)
1. Create a scheduled live stream
2. Copy the URL from the scheduled stream page
3. Use the same format: `https://www.youtube.com/watch?v=VIDEO_ID`

#### Option C: From YouTube Studio Content Page
1. Go to **"Content"** in YouTube Studio
2. Find your live stream video
3. Click on it to open details
4. Copy the URL from the browser address bar

---

## 📝 Adding to Your App

### Method 1: Using Firebase Console (Recommended)

1. **Go to Firebase Console:**
   - Visit [console.firebase.google.com](https://console.firebase.google.com)
   - Select your project
   - Go to **Firestore Database**

2. **Add/Update Live Stream:**
   - Navigate to `liveStreams` collection
   - Create a new document or edit existing one
   - Add these fields:

```javascript
{
  isLive: true,
  title: "Sunday Morning Service",
  description: "Join us for live worship and teaching",
  streamUrl: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
  hdUrl: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",  // Optional (same URL)
  sdUrl: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",  // Optional (same URL)
  shareUrl: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
  startTime: Timestamp (current time),
  endTime: null,
  hasRecording: false,
  recordingUrl: null
}
```

### Method 2: Using Admin Interface

1. Open your app's admin interface
2. Navigate to **"Manage Live Streams"**
3. Click **"Add New Stream"** or edit existing stream
4. Paste your YouTube URL in the **"Stream URL"** field
5. Fill in other details (title, description, etc.)
6. Click **"Save"**

---

## 🔍 Supported YouTube URL Formats

Your app supports these YouTube URL formats:

✅ **Standard Watch URL:**
```
https://www.youtube.com/watch?v=VIDEO_ID
```

✅ **Short URL:**
```
https://youtu.be/VIDEO_ID
```

✅ **Embed URL:**
```
https://www.youtube.com/embed/VIDEO_ID
```

✅ **Mobile URL:**
```
https://m.youtube.com/watch?v=VIDEO_ID
```

The app will automatically detect YouTube URLs and use the appropriate player.

---

## 🎥 YouTube Live Stream Setup (First Time)

If you haven't set up live streaming before:

### 1. Verify Your Channel
- Go to [youtube.com/verify](https://www.youtube.com/verify)
- Follow the verification process
- Wait 24 hours for verification to complete

### 2. Enable Live Streaming
- Go to YouTube Studio → Settings → Channel → Feature eligibility
- Make sure "Live streaming" is enabled

### 3. Set Up Stream Key (For External Streaming)
- Go to YouTube Studio → Create → Go Live
- Click "Stream" tab
- Copy your **Stream Key** (keep this secret!)
- Use with streaming software (OBS, Streamlabs, etc.)

---

## 💡 Tips & Best Practices

### Before Going Live:
1. **Test your stream** - Do a test stream first
2. **Check internet connection** - Ensure stable upload speed
3. **Prepare backup URL** - Have a backup stream ready
4. **Schedule in advance** - Create scheduled streams 1-2 days before

### During Live Stream:
1. **Start stream early** - Begin 5-10 minutes before service
2. **Monitor quality** - Check stream quality in YouTube Studio
3. **Update app** - Make sure `isLive: true` in Firebase
4. **Share URL** - Share the stream URL with your team

### After Stream:
1. **Stop stream** - End the stream in YouTube Studio
2. **Update Firebase** - Set `isLive: false` and add `endTime`
3. **Add recording** - If recording is available, add `recordingUrl`
4. **Save recording** - Keep the recording for later viewing

---

## 🔧 Troubleshooting

### Issue: Can't find "Go Live" button
**Solution:**
- Verify your channel (takes 24 hours)
- Check if live streaming is enabled in channel settings
- Make sure you're using a verified account

### Issue: Stream URL not working in app
**Solution:**
- Verify the URL format is correct
- Make sure the stream is actually live
- Check if the video is public or unlisted (not private)
- Try opening the URL in a browser first

### Issue: Video not playing in app
**Solution:**
- Check internet connection
- Verify the stream is live on YouTube
- Make sure `isLive: true` in Firebase
- Try refreshing the app

### Issue: Can't see stream in app
**Solution:**
- Verify `isLive: true` in Firebase
- Check `startTime` is set correctly
- Make sure stream URL is in the correct format
- Check if stream exists in `liveStreams` collection

---

## 📱 Testing Your Stream

1. **Create a test stream:**
   - Go to YouTube Studio → Create → Go Live
   - Start a test stream
   - Copy the URL

2. **Add to Firebase:**
   - Add the URL to a test document in `liveStreams`
   - Set `isLive: true`

3. **Test in app:**
   - Open your app
   - Navigate to Live Streaming screen
   - Verify the stream loads and plays

4. **Clean up:**
   - End the test stream
   - Remove test document from Firebase

---

## 🎬 Example: Complete Workflow

### Sunday Morning Service Example:

1. **Friday (2 days before):**
   - Create scheduled stream in YouTube Studio
   - Copy the scheduled stream URL
   - Add to Firebase with `isLive: false` and `scheduledTime`

2. **Sunday Morning (30 min before):**
   - Start live stream in YouTube Studio
   - Copy the live stream URL
   - Update Firebase: Set `isLive: true`, add `startTime`, update `streamUrl`

3. **During Service:**
   - Stream is live and visible in app
   - Users can watch, chat, and interact

4. **After Service:**
   - End stream in YouTube Studio
   - Update Firebase: Set `isLive: false`, add `endTime`
   - If recording available, add `recordingUrl` and set `hasRecording: true`

---

## 📞 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify your YouTube account is verified
3. Ensure your Firebase configuration is correct
4. Test with a simple YouTube URL first

---

**Last Updated:** 2024
**App Version:** Supports YouTube Live Streaming

