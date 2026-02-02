# 🎥 Live Streaming Feature - Operation Guide

## Overview
The Live Streaming feature allows your church to broadcast live services with real-time chat, prayer requests, and note-taking capabilities.

---

## 📋 Table of Contents
1. [Admin Setup - Creating a Live Stream](#admin-setup)
2. [User Guide - Watching Live Streams](#user-guide)
3. [Firestore Data Structure](#data-structure)
4. [Troubleshooting](#troubleshooting)

---

## 🔧 Admin Setup - Creating a Live Stream

### Step 1: Prepare Your Stream URL

You'll need a streaming URL from one of these services:
- **YouTube Live** (Recommended - Free)
- **Vimeo Live**
- **Facebook Live**
- **Twitch**
- **Custom RTMP/HLS stream**

### Step 2: Create Live Stream Document in Firestore

Go to Firebase Console → Firestore Database and create a document in the `liveStreams` collection:

#### For a Live Stream (Currently Active):

```javascript
{
  isLive: true,
  title: "Sunday Morning Service",
  description: "Join us for worship and the Word",
  streamUrl: "https://youtube.com/watch?v=YOUR_VIDEO_ID",
  hdUrl: "https://youtube.com/watch?v=YOUR_VIDEO_ID_HD", // Optional
  sdUrl: "https://youtube.com/watch?v=YOUR_VIDEO_ID_SD",   // Optional
  shareUrl: "https://your-church-app.com/live",            // Optional
  startTime: Timestamp (current time),
  endTime: null, // Set when stream ends
  hasRecording: false,
  recordingUrl: null
}
```

#### For a Scheduled Stream (Future):

```javascript
{
  isLive: false,
  title: "Sunday Evening Service",
  description: "Evening worship and prayer",
  streamUrl: "https://youtube.com/watch?v=YOUR_VIDEO_ID",
  scheduledTime: Timestamp (future date/time),
  startTime: null,
  endTime: null,
  hasRecording: false,
  recordingUrl: null
}
```

#### For a Past Recording:

```javascript
{
  isLive: false,
  title: "Sunday Morning Service - Recording",
  description: "Full recording of Sunday service",
  streamUrl: "https://youtube.com/watch?v=YOUR_VIDEO_ID",
  startTime: Timestamp (past date),
  endTime: Timestamp (past date),
  hasRecording: true,
  recordingUrl: "https://youtube.com/watch?v=YOUR_VIDEO_ID"
}
```

### Step 3: Starting a Live Stream

1. **Before Service Starts:**
   - Create a new document in `liveStreams` collection
   - Set `isLive: false` and add `scheduledTime`
   - Users will see it in the "Schedule" tab

2. **When Service Goes Live:**
   - Update the document:
     - Set `isLive: true`
     - Set `startTime` to current timestamp
     - Add your streaming URL to `streamUrl`
   - Users will see the "LIVE NOW" button on Home screen

3. **When Service Ends:**
   - Update the document:
     - Set `isLive: false`
     - Set `endTime` to current timestamp
     - Set `hasRecording: true` if you have a recording
     - Add `recordingUrl` if available

### Step 4: Using YouTube Live (Recommended)

#### Setup YouTube Live:

1. **Go to YouTube Studio:**
   - Visit [studio.youtube.com](https://studio.youtube.com)
   - Click "Create" → "Go Live"

2. **Get Your Stream URL:**
   - After starting the stream, copy the video URL
   - Format: `https://www.youtube.com/watch?v=VIDEO_ID`
   - Or use the embed URL: `https://www.youtube.com/embed/VIDEO_ID`

3. **For HD/SD Quality:**
   - YouTube automatically provides different quality options
   - You can use the same URL for both `hdUrl` and `sdUrl`
   - The app will let users select quality in the player

#### Example Firestore Document:

```javascript
{
  isLive: true,
  title: "Sunday Morning Worship",
  description: "Join us for live worship and teaching",
  streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  hdUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  sdUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  shareUrl: "https://your-church-app.com/live",
  startTime: Timestamp (January 15, 2025, 10:00 AM),
  endTime: null,
  hasRecording: false,
  recordingUrl: null
}
```

---

## 👥 User Guide - Watching Live Streams

### Accessing Live Streams

1. **From Home Screen:**
   - When a stream is live, you'll see a red "LIVE NOW" button
   - Tap it to go directly to the live stream

2. **From Quick Actions:**
   - Scroll down on Home screen
   - Tap "Live Stream" in the Quick Actions grid

3. **From Navigation:**
   - Go to "More" tab → Navigate to "Live Streaming"

### Features Available During Live Stream

#### 1. **Video Player**
- Tap play to start watching
- Use quality button (HD/SD) to change video quality
- Use share button to share the stream link

#### 2. **Live Chat**
- Scroll down to see the chat section
- Type your message in the input box
- Tap send (or press Enter) to post
- Messages appear in real-time

#### 3. **Prayer Requests**
- Tap the "Prayer" button
- Enter a title (optional) and your prayer request
- Tap "Submit" to send
- Prayer requests are also saved to the main Prayer screen

#### 4. **Take Notes**
- Tap the "Notes" button
- Write your notes during the sermon
- Tap "Save" to store your notes
- Notes are linked to the specific stream

#### 5. **Share Stream**
- Tap the "Share" button
- Choose how to share (Messages, Email, etc.)
- Share the stream link with others

### Viewing Schedule

1. Tap the "Schedule" tab
2. See all upcoming scheduled streams
3. Streams are listed by date/time

### Viewing Recordings

1. Tap the "Recordings" tab
2. Browse past service recordings
3. Tap a recording to watch (opens in Sermons screen)

---

## 📊 Firestore Data Structure

### Main Collection: `liveStreams`

**Document Fields:**
- `isLive` (boolean) - Whether stream is currently active
- `title` (string) - Stream title
- `description` (string) - Stream description
- `streamUrl` (string) - Main streaming URL
- `hdUrl` (string, optional) - HD quality URL
- `sdUrl` (string, optional) - SD quality URL
- `shareUrl` (string, optional) - Shareable link
- `startTime` (timestamp) - When stream started
- `endTime` (timestamp, optional) - When stream ended
- `scheduledTime` (timestamp, optional) - When stream is scheduled
- `hasRecording` (boolean) - Whether recording is available
- `recordingUrl` (string, optional) - URL to recording

### Subcollections

#### `liveStreams/{streamId}/chat`
**Document Fields:**
- `userId` (string) - User ID who sent message
- `userName` (string) - Display name
- `userPhoto` (string, optional) - Profile photo URL
- `message` (string) - Chat message text
- `timestamp` (timestamp) - When message was sent

#### `liveStreams/{streamId}/prayerRequests`
**Document Fields:**
- `userId` (string) - User ID who submitted request
- `userName` (string) - Display name
- `title` (string) - Prayer request title
- `request` (string) - Prayer request text
- `timestamp` (timestamp) - When request was submitted

#### `liveStreams/{streamId}/notes`
**Document Fields:**
- `userId` (string) - User ID who created note
- `userName` (string) - Display name
- `content` (string) - Note content
- `timestamp` (timestamp) - When note was created
- `streamTitle` (string) - Title of the stream

---

## 🔍 Troubleshooting

### Issue: "No live stream at the moment"

**Solution:**
- Check that a document exists in `liveStreams` collection
- Verify `isLive` is set to `true`
- Ensure `startTime` is set to current or past time
- Check Firestore rules are deployed

### Issue: Video won't play

**Solution:**
- Verify `streamUrl` is correct and accessible
- Check if the stream is actually live on the platform
- Try opening the URL in a browser first
- Ensure video format is supported (HLS, MP4, YouTube, etc.)

### Issue: Chat messages not appearing

**Solution:**
- Check user is logged in
- Verify Firestore rules are deployed
- Check internet connection
- Ensure subcollection path is correct: `liveStreams/{streamId}/chat`

### Issue: Permission errors

**Solution:**
1. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Verify rules include liveStreams collection (should be in firestore.rules)

3. Check user is authenticated

### Issue: Quality selection not working

**Solution:**
- Ensure both `hdUrl` and `sdUrl` are set in Firestore
- If using YouTube, same URL works for both
- Some platforms handle quality automatically

---

## 🎯 Best Practices

### For Admins:

1. **Pre-Stream Setup:**
   - Create scheduled stream document 1-2 days before
   - Test stream URL before going live
   - Have backup stream URL ready

2. **During Stream:**
   - Monitor chat for inappropriate content
   - Respond to prayer requests
   - Keep stream info updated

3. **Post-Stream:**
   - Set `isLive: false` when stream ends
   - Add recording URL if available
   - Set `hasRecording: true` for recordings

4. **Stream URLs:**
   - Use YouTube Live for best compatibility
   - Test URLs in browser before adding to Firestore
   - Keep URLs updated if stream restarts

### For Users:

1. **Before Service:**
   - Check Schedule tab for upcoming streams
   - Set notifications if available

2. **During Service:**
   - Participate in chat respectfully
   - Submit prayer requests as needed
   - Take notes for later review

3. **After Service:**
   - Review your notes
   - Watch recordings if you missed anything
   - Share recordings with others

---

## 📱 Quick Reference

### Admin Actions:

| Action | Firestore Update |
|--------|------------------|
| Schedule stream | Create doc with `isLive: false`, `scheduledTime` |
| Start live | Set `isLive: true`, `startTime: now()` |
| End live | Set `isLive: false`, `endTime: now()` |
| Add recording | Set `hasRecording: true`, add `recordingUrl` |

### User Actions:

| Feature | How to Access |
|---------|---------------|
| Watch live | Tap "LIVE NOW" button or "Live Stream" in Quick Actions |
| Chat | Scroll to chat section, type and send |
| Prayer | Tap "Prayer" button, fill form, submit |
| Notes | Tap "Notes" button, write, save |
| Share | Tap "Share" button, choose method |
| Schedule | Tap "Schedule" tab |
| Recordings | Tap "Recordings" tab |

---

## 🚀 Getting Started Checklist

- [ ] Firestore rules deployed
- [ ] Test stream URL works in browser
- [ ] Create first live stream document
- [ ] Test on mobile device
- [ ] Verify chat works
- [ ] Test prayer request submission
- [ ] Test note-taking
- [ ] Verify share functionality
- [ ] Create scheduled stream for next service
- [ ] Inform users about live streaming feature

---

## 💡 Tips

1. **YouTube Live Setup:**
   - Use YouTube Studio for easier management
   - Enable chat moderation
   - Set up stream key in advance

2. **Multiple Streams:**
   - Only one stream should have `isLive: true` at a time
   - Use different documents for different services

3. **Recording Management:**
   - Link recordings to sermons collection for better organization
   - Keep recording URLs updated

4. **User Engagement:**
   - Encourage chat participation
   - Respond to prayer requests
   - Share important announcements in chat

---

*Last Updated: January 2025*

