# 🎥 Live Streaming Admin Interface Guide

## Overview

The new **Manage Live Streams** admin interface makes it easy to create, manage, and control live streams directly from the app - no need to manually edit Firestore documents!

---

## 📍 Accessing the Admin Interface

1. **From Admin Dashboard:**
   - Go to Admin Dashboard
   - Scroll to "Quick Actions"
   - Tap **"Live Streams"** button

2. **Direct Navigation:**
   - Navigate to `ManageLiveStreams` screen

---

## 🎯 Features

### 1. **View All Streams**
- **All Tab**: See all streams (live, scheduled, and past)
- **Live Tab**: See only currently active streams
- **Scheduled Tab**: See upcoming scheduled streams
- **Past Tab**: See completed streams and recordings

### 2. **Create New Stream**
1. Tap the **"+"** button in the header
2. Fill in the form:
   - **Title*** (required): Stream title (e.g., "Sunday Morning Service")
   - **Description**: Optional description
   - **Stream URL*** (required): Main streaming URL
   - **HD URL** (optional): High-definition quality URL
   - **SD URL** (optional): Standard quality URL
   - **Share URL** (optional): Shareable link
   - **Stream is Live Now**: Check if stream is currently live
   - **Schedule Stream**: Set date and time for future streams
   - **Has Recording**: Check if recording is available
   - **Recording URL**: URL to the recording (if available)
3. Tap **"Create Stream"**

### 3. **Start/Stop Streams**
- **Start Stream**: Tap the green **"Start"** button on any scheduled stream
- **Stop Stream**: Tap the red **"Stop"** button on any live stream

### 4. **Edit Streams**
1. Tap the **edit icon** (pencil) on any stream card
2. Update the information
3. Tap **"Update Stream"**

### 5. **Delete Streams**
1. Tap the **delete icon** (trash) on any stream card
2. Confirm deletion

---

## 📊 Stream Status Indicators

### 🟢 **LIVE** Badge
- Red badge with pulsing dot
- Appears on currently active streams
- Users see "LIVE NOW" button on Home screen

### 🟡 **SCHEDULED** Badge
- Yellow badge with calendar icon
- Appears on future scheduled streams
- Shows scheduled date/time

### ⚪ **PAST** Badge
- Gray badge
- Appears on completed streams
- May have recording available

---

## 🎬 Common Workflows

### Workflow 1: Schedule a Future Stream

1. Tap **"+"** to create new stream
2. Enter:
   - Title: "Sunday Evening Service"
   - Stream URL: Your YouTube Live URL
   - **Uncheck** "Stream is Live Now"
   - Set **Schedule Stream**: Date and time
3. Tap **"Create Stream"**
4. Stream appears in "Scheduled" tab
5. When ready to go live, tap **"Start"** button

### Workflow 2: Start a Live Stream Immediately

1. Tap **"+"** to create new stream
2. Enter:
   - Title: "Sunday Morning Service"
   - Stream URL: Your live streaming URL
   - **Check** "Stream is Live Now"
3. Tap **"Create Stream"**
4. Stream immediately appears as LIVE
5. Users see "LIVE NOW" button on Home screen

### Workflow 3: Stop a Live Stream

1. Find the live stream in "Live" tab
2. Tap the red **"Stop"** button
3. Confirm stopping the stream
4. Stream moves to "Past" tab

### Workflow 4: Add Recording After Stream

1. Find the stream in "Past" tab
2. Tap **edit icon** (pencil)
3. Check **"Has Recording"**
4. Enter **Recording URL**
5. Tap **"Update Stream"**

---

## 📝 Form Fields Explained

### Required Fields
- **Title**: Name of the stream (e.g., "Sunday Morning Service")
- **Stream URL**: Main streaming URL (YouTube, Vimeo, etc.)

### Optional Fields
- **Description**: Additional information about the stream
- **HD URL**: High-definition quality stream URL
- **SD URL**: Standard quality stream URL
- **Share URL**: Custom shareable link
- **Schedule Stream**: Date and time for future streams
- **Recording URL**: URL to the recording after stream ends

### Checkboxes
- **Stream is Live Now**: Check this when stream is currently active
- **Has Recording**: Check this when recording is available

---

## 🔗 Supported Streaming Services

The admin interface works with any streaming service that provides a URL:

- ✅ **YouTube Live** (Recommended)
- ✅ **Vimeo Live**
- ✅ **Facebook Live**
- ✅ **Twitch**
- ✅ **Custom RTMP/HLS streams**
- ✅ **Any platform with embeddable URLs**

---

## 💡 Tips & Best Practices

### Before Service
1. **Schedule streams in advance** - Create scheduled streams 1-2 days before
2. **Test URLs** - Verify stream URLs work before going live
3. **Prepare backup URLs** - Have backup stream URLs ready

### During Service
1. **Start stream** - Tap "Start" button when service begins
2. **Monitor** - Keep admin interface open to monitor status
3. **Update if needed** - Edit stream if URL changes

### After Service
1. **Stop stream** - Tap "Stop" button when service ends
2. **Add recording** - Update stream with recording URL
3. **Check recording** - Verify recording URL works

### URL Format Examples

**YouTube Live:**
```
https://www.youtube.com/watch?v=VIDEO_ID
```

**Vimeo Live:**
```
https://vimeo.com/event/EVENT_ID
```

**Custom HLS:**
```
https://your-streaming-server.com/stream.m3u8
```

---

## 🚨 Troubleshooting

### Issue: Stream won't start
- **Solution**: Verify stream URL is correct and accessible
- Check if stream is actually live on the platform
- Try opening URL in browser first

### Issue: Can't see "Start" button
- **Solution**: Make sure "Stream is Live Now" is unchecked
- Stream must have a scheduled time or be in scheduled state

### Issue: Stream not showing as LIVE
- **Solution**: 
  - Check "Stream is Live Now" checkbox
  - Or tap "Start" button on the stream
  - Verify `isLive` field is `true` in Firestore

### Issue: Users can't see live stream
- **Solution**:
  - Verify stream has `isLive: true`
  - Check `startTime` is set
  - Ensure stream URL is correct
  - Check Firestore rules are deployed

---

## 📊 Statistics Dashboard

The admin interface shows:
- **Live Now**: Number of currently active streams
- **Total Streams**: Total number of streams created
- **Recordings**: Number of streams with recordings

---

## 🔄 Real-time Updates

- Stream status updates in real-time
- No need to refresh - changes appear automatically
- Live streams appear immediately to users

---

## ✅ Quick Checklist

Before going live:
- [ ] Stream URL is tested and working
- [ ] Stream is created in admin interface
- [ ] "Start" button is ready (or "Stream is Live Now" is checked)
- [ ] Description and title are set
- [ ] Share URL is configured (optional)

After going live:
- [ ] Stream appears in "Live" tab
- [ ] Users can see "LIVE NOW" button
- [ ] Stream is playing correctly

After service:
- [ ] Stream is stopped
- [ ] Recording URL is added (if available)
- [ ] Stream appears in "Past" tab

---

## 🎯 Next Steps

1. **Test the interface** - Create a test stream
2. **Schedule your next service** - Create a scheduled stream
3. **Train your team** - Show admins how to use the interface
4. **Set up notifications** - Consider adding push notifications when streams go live

---

*Last Updated: January 2025*
*For technical support, refer to LIVE_STREAMING_GUIDE.md*

