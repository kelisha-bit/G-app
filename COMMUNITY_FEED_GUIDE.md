# 💬 Community Feed Feature - User Guide

## Overview
The Community Feed is a social wall where church members can share updates, testimonies, prayer requests, and encouragement posts. Users can like, comment, and interact with each other's posts.

---

## 📋 Features

### 1. **Create Posts**
- Share text posts with optional photos
- Choose from categories: General, Testimony, Prayer, Encouragement
- Use hashtags (e.g., #prayer, #testimony) to tag your posts
- Posts are automatically approved for admins, pending approval for regular users

### 2. **Interact with Posts**
- **Like**: Tap the heart icon to like/unlike posts
- **Comment**: Tap "Comment" to add a comment, or tap the comment count to view all comments
- **View Comments**: See all comments in real-time

### 3. **Categories**
- **All**: View all approved posts
- **General**: General updates and announcements
- **Testimony**: Share testimonies and answered prayers
- **Prayer**: Prayer requests and prayer updates
- **Encouragement**: Encouraging messages and Bible verses

### 4. **Hashtags**
- Use hashtags in your posts (e.g., `#prayer`, `#testimony`, `#blessed`)
- Hashtags are automatically extracted and displayed as clickable chips
- Helps organize and discover related content

### 5. **Photo Posts**
- Add photos to your posts
- Photos are uploaded to Firebase Storage
- Supports image editing before upload

### 6. **Admin Features**
- Admins can delete any post
- Admin posts are automatically approved
- Regular user posts require admin approval (isApproved field)

---

## 🚀 How to Use

### Creating a Post

1. **Open Community Feed**
   - From Home screen, tap "Community" in Quick Actions
   - Or navigate from More → Community Feed

2. **Tap the "+" button** in the header

3. **Fill in the form**:
   - Select a category (General, Testimony, Prayer, Encouragement)
   - Write your post content (up to 2000 characters)
   - Add hashtags using `#hashtag` format
   - Optionally add a photo by tapping "Add Photo"

4. **Tap "Post"** to submit

### Liking a Post

1. Find a post you want to like
2. Tap the heart icon
3. The like count updates in real-time

### Commenting on a Post

1. Find a post you want to comment on
2. Tap "Comment" button
3. Type your comment (up to 500 characters)
4. Tap the send button
5. Your comment appears immediately

### Viewing Comments

1. Tap the comment count (number next to chat icon)
2. View all comments in the modal
3. Scroll to see older comments

### Filtering by Category

1. Scroll the category bar at the top
2. Tap a category to filter posts
3. Tap "All" to see all posts

### Deleting Your Post

1. Find your post
2. Tap the trash icon in the top right
3. Confirm deletion

---

## 📊 Firestore Data Structure

### Main Collection: `communityFeed`

**Document Fields:**
- `userId` (string) - User ID who created the post
- `userName` (string) - Display name
- `userPhoto` (string, optional) - Profile photo URL
- `content` (string) - Post content text
- `category` (string) - Post category (General, Testimony, Prayer, Encouragement)
- `imageUrl` (string, optional) - Photo URL if post has image
- `hashtags` (array) - Array of hashtag strings (without #)
- `likes` (array) - Array of user IDs who liked the post
- `likesCount` (number) - Total number of likes
- `commentsCount` (number) - Total number of comments
- `createdAt` (timestamp) - When post was created
- `isApproved` (boolean) - Whether post is approved (default: false for regular users, true for admins)

### Subcollection: `communityFeed/{postId}/comments`

**Document Fields:**
- `userId` (string) - User ID who commented
- `userName` (string) - Display name
- `userPhoto` (string, optional) - Profile photo URL
- `text` (string) - Comment text
- `createdAt` (timestamp) - When comment was created

---

## 🔧 Admin Setup

### Approving Posts

1. Go to Firebase Console → Firestore Database
2. Navigate to `communityFeed` collection
3. Find posts with `isApproved: false`
4. Update the document and set `isApproved: true`
5. Posts will appear in the feed immediately

### Moderation

- Admins can delete any post by tapping the trash icon
- Posts are filtered to only show approved posts (`isApproved !== false`)
- Regular users can only delete their own posts

---

## 🎨 UI Features

- **Real-time Updates**: Posts, likes, and comments update in real-time
- **Pull to Refresh**: Pull down to refresh the feed
- **Category Filtering**: Easy category-based filtering
- **Hashtag Display**: Hashtags shown as colored chips
- **User Avatars**: Profile photos or placeholder icons
- **Time Stamps**: Relative time display (e.g., "2h ago", "Just now")
- **Image Support**: Full image display in posts

---

## 📱 Access Points

1. **Home Screen**: Tap "Community" in Quick Actions grid
2. **Navigation**: Can be added to More tab or main navigation
3. **Direct Navigation**: `navigation.navigate('CommunityFeed')`

---

## 🔒 Permissions

### Firestore Rules

- **Read**: Authenticated users can read approved posts
- **Create**: Authenticated users can create posts
- **Update**: Users can update their own posts, admins can update any
- **Delete**: Users can delete their own posts, admins can delete any
- **Comments**: Authenticated users can read/create comments, update/delete their own

### Storage Rules

- Users can upload images to `communityFeed/{userId}/` path
- Images are automatically uploaded when creating posts with photos

---

## 💡 Best Practices

### For Users:

1. **Be Respectful**: Keep posts encouraging and appropriate
2. **Use Hashtags**: Help others find related content
3. **Choose Right Category**: Helps organize the feed
4. **Share Testimonies**: Inspire others with your stories
5. **Pray for Others**: Engage with prayer requests

### For Admins:

1. **Moderate Regularly**: Review and approve posts daily
2. **Engage**: Like and comment on member posts
3. **Set Guidelines**: Communicate community guidelines
4. **Monitor**: Watch for inappropriate content

---

## 🐛 Troubleshooting

### Issue: Post not appearing

**Solution:**
- Check if post has `isApproved: true` in Firestore
- Verify user is logged in
- Check Firestore rules are deployed

### Issue: Can't upload photo

**Solution:**
- Grant camera roll permissions when prompted
- Check internet connection
- Verify Firebase Storage rules allow uploads

### Issue: Comments not loading

**Solution:**
- Check user is logged in
- Verify Firestore rules for comments subcollection
- Check internet connection

### Issue: Like not working

**Solution:**
- Ensure user is logged in
- Check Firestore rules allow updates
- Verify internet connection

---

## 🚀 Getting Started Checklist

- [ ] Firestore rules deployed
- [ ] Storage rules configured for image uploads
- [ ] Test creating a post
- [ ] Test liking a post
- [ ] Test commenting on a post
- [ ] Test photo upload
- [ ] Test category filtering
- [ ] Test hashtag extraction
- [ ] Verify admin can approve posts
- [ ] Verify admin can delete posts

---

## 📝 Notes

- Posts are limited to 2000 characters
- Comments are limited to 500 characters
- Hashtags are automatically extracted from post content
- Images are compressed before upload
- Real-time updates use Firestore listeners
- Posts require approval unless user is admin

---

*Last Updated: January 2025*

