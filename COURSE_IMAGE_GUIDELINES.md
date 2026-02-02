# 📸 Course Image Guidelines

This guide provides recommendations for course images in the Discipleship Training screen.

---

## 📐 Image Dimensions

### Current Display Size:
- **Width**: 100% of card width (varies by device)
- **Height**: 180px (fixed)
- **Aspect Ratio**: Approximately 16:9 (landscape)
- **Resize Mode**: `cover` (image fills container, may crop)

### Recommended Source Image Size:
- **Dimensions**: **800x450px** to **1200x675px**
- **Aspect Ratio**: **16:9** (landscape)
- **File Size**: **< 500KB** (optimized)
- **Format**: JPG, PNG, or WebP

### Why These Dimensions?
- **800-1200px width**: Provides good quality on all devices without being too large
- **16:9 aspect ratio**: Matches the display container (180px height with full width)
- **< 500KB**: Ensures fast loading on mobile networks
- **JPG/PNG/WebP**: Universally supported formats

---

## 🎨 Image Specifications

### Optimal Settings:
```
Width: 1000px
Height: 562px (maintains 16:9 ratio)
Format: JPG (for photos) or PNG (for graphics)
Quality: 80-85% (good balance of quality and file size)
File Size: 200-400KB
```

### Minimum Acceptable:
```
Width: 600px
Height: 338px
File Size: < 500KB
```

### Maximum Recommended:
```
Width: 1600px
Height: 900px
File Size: < 1MB
```

---

## 📱 Device Considerations

### Mobile Devices:
- Most phones: 375px - 428px wide
- Course card width: ~90% of screen (with padding)
- Displayed image: ~340px - 385px wide × 180px tall
- **Recommended**: 800x450px source image (2x resolution for retina)

### Tablets:
- Tablets: 768px - 1024px wide
- Course card width: ~600px - 800px
- Displayed image: ~600px - 800px wide × 180px tall
- **Recommended**: 1200x675px source image

### Desktop/Web:
- Desktop: 1024px+ wide
- Course card width: ~800px - 1000px
- Displayed image: ~800px - 1000px wide × 180px tall
- **Recommended**: 1200x675px source image

---

## 🖼️ Image Content Guidelines

### What Makes a Good Course Image?

1. **Clear and Relevant**
   - Image should relate to the course topic
   - Avoid generic stock photos
   - Use church-specific images when possible

2. **Text Overlay Friendly**
   - Course title and instructor name overlay at the bottom
   - Keep important content in the center/upper portion
   - Avoid busy backgrounds in the bottom third

3. **Good Contrast**
   - Ensure text overlay is readable
   - Dark images work well with white text
   - Light images may need dark overlay

4. **Professional Appearance**
   - High quality, not pixelated
   - Properly cropped (no awkward cuts)
   - Consistent style across courses

### Example Images:
- ✅ Bible study course → Image of open Bible or study group
- ✅ Leadership course → Image of people in leadership setting
- ✅ Prayer course → Image related to prayer/worship
- ✅ Evangelism course → Image of outreach/community service

---

## 🛠️ Image Optimization

### Before Uploading:

1. **Crop to 16:9 Ratio**
   ```
   Use any image editor:
   - Crop tool → Set aspect ratio to 16:9
   - Center important content
   - Remove unnecessary edges
   ```

2. **Resize to Recommended Size**
   ```
   Target: 1000x562px
   - Maintains quality
   - Fast loading
   - Works on all devices
   ```

3. **Compress the Image**
   ```
   Tools:
   - TinyPNG (https://tinypng.com)
   - Squoosh (https://squoosh.app)
   - ImageOptim (Mac)
   - Compressor.io (online)
   
   Goal: < 500KB file size
   ```

4. **Test the Image**
   - Open in browser at 1000px width
   - Verify it looks good
   - Check file size

---

## 📤 Uploading Course Images

### Method 1: Firebase Storage (Recommended)

1. **Upload to Firebase Storage:**
   ```
   Firebase Console → Storage
   Create folder: courses/
   Upload: courses/course-{id}.jpg
   Copy download URL
   ```

2. **Add URL to Course Document:**
   ```
   Firestore → courses → {courseId}
   Field: image (string)
   Value: [paste Firebase Storage URL]
   ```

### Method 2: External URL

1. **Host Image Elsewhere:**
   - Google Drive (make publicly accessible)
   - Imgur
   - Your own server
   - CDN

2. **Add URL to Course:**
   ```
   Firestore → courses → {courseId}
   Field: image (string)
   Value: [paste image URL]
   ```

### Method 3: Admin Screen (If Available)

If you have an admin screen for managing courses:
- Upload image directly from the app
- Image is automatically uploaded to Firebase Storage
- URL is saved to course document

---

## 🔧 Technical Details

### Current Implementation:

```javascript
// Course image style
courseImage: {
  width: '100%',      // Full width of card
  height: 180,         // Fixed height
  resizeMode: 'cover', // Fills container, may crop
}
```

### How It Works:
- Image fills the entire card width
- Height is fixed at 180px
- `resizeMode: 'cover'` means:
  - Image scales to fill container
  - Maintains aspect ratio
  - May crop edges if aspect ratios don't match

### Fallback Behavior:
- If no image: Shows gradient background with course title
- If image fails to load: Shows gradient background
- Error handling: Automatically falls back to gradient

---

## ✅ Best Practices

### Do's:
✅ Use 16:9 aspect ratio images
✅ Optimize images before uploading (< 500KB)
✅ Use relevant, high-quality images
✅ Keep important content in center/upper portion
✅ Test images on different devices
✅ Use consistent image style across courses

### Don'ts:
❌ Don't use vertical/portrait images (will be heavily cropped)
❌ Don't upload huge files (> 1MB)
❌ Don't use low-resolution images (< 600px width)
❌ Don't put important content in bottom third (text overlay area)
❌ Don't use images with too much text (overlay will conflict)

---

## 🎯 Quick Reference

### Recommended Image Specs:
```
Dimensions: 1000x562px
Aspect Ratio: 16:9
Format: JPG or PNG
File Size: 200-400KB
Quality: 80-85%
```

### Quick Setup:
1. Find or create course image
2. Crop to 16:9 ratio
3. Resize to 1000x562px
4. Compress to < 500KB
5. Upload to Firebase Storage
6. Add URL to course document

---

## 🐛 Troubleshooting

### Image Not Showing?

1. **Check URL**
   - Verify image URL is valid
   - Test URL in browser
   - Ensure URL is publicly accessible

2. **Check Field Name**
   - Field must be named: `image` (lowercase)
   - Check spelling in Firestore

3. **Check Image Format**
   - Use JPG, PNG, or WebP
   - Some formats may not work on all devices

4. **Check Firebase Storage Rules**
   - Ensure read access is allowed
   - Check Storage security rules

### Image Looks Distorted?

- **Cause**: Wrong aspect ratio
- **Fix**: Crop image to 16:9 ratio before uploading

### Image Loads Slowly?

- **Cause**: File too large
- **Fix**: Compress image to < 500KB

### Image Cropped Incorrectly?

- **Cause**: Important content in edges
- **Fix**: Center important content, avoid edges

---

## 📚 Related Documentation

- **Adding Courses**: `HOW_TO_ADD_COURSES.md`
- **Adding Lessons**: `HOW_TO_ADD_COURSE_LESSONS.md`
- **Firebase Storage**: `DEPLOY_STORAGE_RULES.md`

---

## 💡 Example Workflow

### Step-by-Step:

1. **Prepare Image**
   ```
   Original: 3000x2000px, 2MB
   ↓
   Crop to 16:9: 3000x1688px
   ↓
   Resize: 1000x562px
   ↓
   Compress: 350KB
   ```

2. **Upload**
   ```
   Firebase Console → Storage
   Upload: courses/foundations-of-faith.jpg
   Copy URL: https://firebasestorage.googleapis.com/...
   ```

3. **Add to Course**
   ```
   Firestore → courses → course-id
   Add field: image
   Paste URL
   Save
   ```

4. **Verify**
   ```
   Open app → Discipleship & Training
   Check Courses tab
   Image should display correctly
   ```

---

**Need help?** Check the code in `DiscipleshipTrainingScreen.js` - the image rendering logic shows exactly how images are displayed!

