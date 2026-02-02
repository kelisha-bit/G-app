# 🎵 Direct Audio & Video Links Guide

## Understanding Direct vs Indirect Links

### ✅ Direct Links (Works with expo-video & expo-av)
Direct links point directly to a media file that can be downloaded/streamed by the app.

**Audio Examples:**
```
✅ https://firebasestorage.googleapis.com/v0/b/your-app.appspot.com/o/sermons%2Faudio%2F1234567890_abc123.mp3?alt=media&token=xyz
✅ https://yourdomain.com/audio/sermon.mp3
✅ https://cdn.example.com/files/sermon.m4a
✅ https://storage.googleapis.com/bucket/audio/file.mp3
```

**Video Examples:**
```
✅ https://firebasestorage.googleapis.com/v0/b/your-app.appspot.com/o/sermons%2Fvideo%2F1234567890_abc123.mp4?alt=media&token=xyz
✅ https://yourdomain.com/video/sermon.mp4
✅ https://cdn.example.com/files/sermon.mov
✅ https://storage.googleapis.com/bucket/video/file.mp4
```

**Characteristics:**
- URL ends with media file extension (.mp3, .mp4, .m4a, .mov, etc.)
- Direct download/stream link (not a web page)
- Can be opened directly in a media player
- Works with expo-video (video) and expo-av (audio) APIs

### ❌ Indirect Links (Won't work with expo-av)
Indirect links point to web pages or streaming services that require special handling.

**Examples:**
```
❌ https://youtube.com/watch?v=VIDEO_ID
❌ https://soundcloud.com/user/track
❌ https://drive.google.com/file/d/FILE_ID/view
❌ https://dropbox.com/s/abc123/file.mp3
❌ https://spotify.com/track/123
```

**Characteristics:**
- Points to a web page, not the file itself
- Requires browser or special app to play
- May require authentication
- Won't work with expo-av Audio API (YouTube works for video but direct uploads are better)

---

## 🚀 How to Get Direct Links

### Method 1: Upload via Admin Screen (Recommended)

1. **Open the App**
   - Navigate to Admin Dashboard
   - Go to "Manage Sermons"
   - Click "Add New Sermon" or edit existing sermon

2. **Upload Audio File**
   - In the "Audio URL" field, click the **"Upload"** button
   - Select an audio file from your device (MP3, M4A, AAC, WAV)
   - Wait for upload to complete
   - The direct link will be automatically filled in

3. **Upload Video File**
   - In the "Video URL" field, click the **"Upload"** button
   - Select a video file from your device (MP4, MOV, AVI, MKV)
   - Wait for upload to complete (may take a few minutes for large files)
   - The direct link will be automatically filled in

4. **Save the Sermon**
   - Fill in other required fields (Title, Pastor, Date)
   - Click "Save"
   - The sermon will now play directly in the app!

**Benefits:**
- ✅ Automatic direct link generation
- ✅ Stored securely in Firebase Storage
- ✅ No manual URL copying needed
- ✅ Works perfectly with the app
- ✅ Supports both audio and video files

---

### Method 2: Firebase Storage Console

1. **Go to Firebase Console**
   - Visit [console.firebase.google.com](https://console.firebase.google.com)
   - Select your project
   - Click "Storage" in the left menu

2. **Upload Media File**
   - Click "Upload file"
   - For audio: Navigate to `sermons/audio/` folder (or create it)
   - For video: Navigate to `sermons/video/` folder (or create it)
   - Select your media file
   - Wait for upload to complete

3. **Get Direct Link**
   - Click on the uploaded file
   - Click the "Copy link" button (or three dots → Copy link)
   - This is your direct link!

**Example Direct Links:**
```
Audio: https://firebasestorage.googleapis.com/v0/b/your-app.appspot.com/o/sermons%2Faudio%2Fsermon.mp3?alt=media&token=abc123xyz
Video: https://firebasestorage.googleapis.com/v0/b/your-app.appspot.com/o/sermons%2Fvideo%2Fsermon.mp4?alt=media&token=abc123xyz
```

---

### Method 3: Google Drive (Convert to Direct Link)

**⚠️ Note:** Regular Google Drive share links won't work. You need to convert them.

1. **Upload to Google Drive**
   - Upload your media file to Google Drive
   - Right-click the file → "Get link"
   - Make sure sharing is set to "Anyone with the link"

2. **Convert to Direct Link**
   - Your share link looks like:
     ```
     https://drive.google.com/file/d/FILE_ID/view?usp=sharing
     ```
   - Convert it to direct download link:
     ```
     https://drive.google.com/uc?export=download&id=FILE_ID
     ```
   - Replace `FILE_ID` with your actual file ID

**Example:**
```
Share Link: https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing
Direct Link: https://drive.google.com/uc?export=download&id=1ABC123xyz
```

**⚠️ Limitations:**
- Google Drive direct links may have size limits
- May require user interaction for large files
- Firebase Storage is more reliable

---

### Method 4: Your Own Server/CDN

If you have your own web server or CDN:

1. **Upload Media File**
   - Upload your media file to your server
   - Place it in a publicly accessible directory

2. **Get Direct URL**
   - The URL should directly point to the file:
     ```
     https://yourdomain.com/audio/sermon.mp3
     https://yourdomain.com/video/sermon.mp4
     ```
   - Test by opening the URL in a browser - it should download/play the file directly

3. **Use in App**
   - Copy the URL
   - Paste it in the "Audio URL" or "Video URL" field in Manage Sermons

**Requirements:**
- ✅ File must be publicly accessible
- ✅ URL must end with media file extension
- ✅ Server must allow direct file access (no redirects)
- ✅ CORS headers configured if needed

---

## 📋 Supported Media Formats

### Audio Formats
The app supports these audio formats for direct playback:

- ✅ **MP3** (.mp3) - Most compatible
- ✅ **M4A** (.m4a) - Good quality, smaller size
- ✅ **AAC** (.aac) - High quality
- ✅ **WAV** (.wav) - Uncompressed, large files
- ✅ **OGG** (.ogg) - Open source format
- ✅ **FLAC** (.flac) - Lossless, large files

**Recommended:** Use MP3 or M4A for best compatibility and file size balance.

### Video Formats
The app supports these video formats for direct playback:

- ✅ **MP4** (.mp4) - Most compatible, recommended
- ✅ **MOV** (.mov) - Apple format, good quality
- ✅ **AVI** (.avi) - Older format, larger files
- ✅ **MKV** (.mkv) - Container format
- ✅ **WebM** (.webm) - Web optimized
- ✅ **M4V** (.m4v) - Apple video format

**Recommended:** Use MP4 (H.264 codec) for best compatibility and file size balance.

---

## 🔍 How to Verify a Direct Link

Before using a link in your sermon, verify it's a direct link:

1. **Open the URL in a Browser**
   - If it downloads or plays the media file directly → ✅ Direct link
   - If it shows a web page or requires login → ❌ Indirect link

2. **Check the URL**
   - Ends with `.mp3`, `.mp4`, `.m4a`, `.mov`, etc. → ✅ Likely direct
   - Contains `youtube.com`, `soundcloud.com`, `drive.google.com/file/view` → ❌ Indirect

3. **Test in App**
   - Add the URL to a sermon
   - Try to play it
   - If you see "Media Playback Error" → Not a direct link
   - If it plays → ✅ Direct link works!

---

## 🛠️ Troubleshooting

### Error: "None of the available extractors could read the stream"

**Cause:** The URL is not a direct link to a media file.

**Solutions:**
1. Upload the media file via the admin screen (Method 1)
2. Use Firebase Storage to get a direct link (Method 2)
3. Convert Google Drive link to direct download format (Method 3)
4. Use the "Open in Browser" option for streaming services

### Error: "Failed to load audio/video"

**Possible Causes:**
- Network connection issue
- File doesn't exist at the URL
- Server requires authentication
- CORS restrictions
- File format not supported
- File too large

**Solutions:**
- Check your internet connection
- Verify the URL is correct and accessible
- Make sure the file is publicly accessible
- Try uploading via Firebase Storage instead
- Compress large video files (recommended: under 500MB)
- Use recommended formats (MP4 for video, MP3 for audio)

### Audio/Video plays but controls don't work

**Cause:** The media file format might not support seeking or has encoding issues.

**Solution:** 
- Re-encode audio files as MP3 or M4A with proper metadata
- Re-encode video files as MP4 (H.264) with proper encoding settings
- Ensure files have proper duration metadata

---

## 💡 Best Practices

1. **Use Firebase Storage**
   - Most reliable option
   - Automatic direct links
   - Secure and scalable
   - Built into the app

2. **File Size Considerations**
   - **Audio:** Keep files under 50MB for best performance
   - **Video:** Keep files under 500MB for best performance (larger files may take longer to upload/load)
   - Use MP3 at 128-192 kbps for good audio quality/size balance
   - Use MP4 (H.264) at 720p-1080p for good video quality/size balance
   - Compress longer sermons if needed

3. **Naming Convention**
   - Use descriptive filenames: `sermon-2024-01-15.mp3` or `sermon-2024-01-15.mp4`
   - Include date in filename for organization
   - Avoid special characters in filenames

4. **Testing**
   - Always test media playback after adding a sermon
   - Verify the link works on both WiFi and mobile data
   - Test on different devices if possible

---

## 📝 Quick Reference

### ✅ DO:
- Upload media files via the admin screen
- Use Firebase Storage for hosting
- Use MP3 or M4A format for audio
- Use MP4 format for video
- Keep file sizes reasonable (audio < 50MB, video < 500MB)
- Test playback after adding
- Compress large files before uploading

### ❌ DON'T:
- Use YouTube, SoundCloud, or Spotify links (for audio)
- Use YouTube links for video (they work but direct uploads are better)
- Use Google Drive share links (without conversion)
- Use Dropbox share links
- Use links that require login
- Use very large uncompressed files
- Upload uncompressed video files (can be several GB)

---

## 🎯 Summary

**For best results:**
1. Use the **Upload** button in the Manage Sermons screen
2. For audio: Select your audio file (MP3 or M4A recommended)
3. For video: Select your video file (MP4 recommended)
4. The app automatically creates a direct link
5. Save the sermon
6. Media will play directly in the app! 🎉

**If you must use external links:**
- Convert them to direct download links
- Test them in a browser first
- Verify they end with media file extensions (.mp3, .mp4, etc.)
- For video, YouTube links will work but direct uploads are preferred
- Be prepared to use "Open in Browser" as fallback for streaming services

---

**Need Help?**
- Check Firebase Storage setup: `FIREBASE_STORAGE_SETUP.md`
- Review storage rules: `storage.rules`
- Contact support if issues persist

