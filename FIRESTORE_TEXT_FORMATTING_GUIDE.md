# 📝 Firestore Text Formatting Guide

## How to Add Bold Styling to Text in Firestore

This guide explains how to format text with **bold** styling when saving to Firebase Firestore.

---

## ✅ Quick Start

### When Adding Text to Firestore:

Use `**double asterisks**` or `__double underscores__` around text you want to make bold:

```javascript
// Example: Saving forum post with bold text
await addDoc(collection(db, 'trainingForums'), {
  title: 'My Post Title',
  content: 'This is **bold text** and this is normal text. You can also use __bold with underscores__.',
  // ... other fields
});
```

### Formatting Syntax:

- **Bold**: `**text**` or `__text__`
- Example: `"This is **important** information"`
- Example: `"This is __important__ information"`

---

## 📋 Examples

### Example 1: Forum Post with Bold Text

```javascript
const handleSubmitForumPost = async () => {
  await addDoc(collection(db, 'trainingForums'), {
    title: newForumPost.title.trim(),
    content: 'Welcome to the **Disciple Training** forum! This is a place for __spiritual growth__ and learning.',
    authorId: user.uid,
    authorName: user.displayName || 'Anonymous',
    createdAt: serverTimestamp(),
  });
};
```

### Example 2: Devotional Content with Bold

```javascript
const devotionalData = {
  title: 'Daily Devotional',
  content: '**Today's Message**: Trust in the Lord with all your heart. This is the __key__ to wisdom.',
  prayer: 'Lord, help us to **trust** in You completely.',
};
```

### Example 3: Multiple Bold Sections

```javascript
const content = `
**Introduction**: Welcome to this course.

**Main Points**:
1. First point
2. Second point

**Conclusion**: Remember these __important__ principles.
`;
```

---

## 🎨 How It Works

1. **Save to Firestore**: Store text with `**bold**` or `__bold__` markers
2. **Display**: The `FormattedText` component automatically detects and renders bold text
3. **No HTML Required**: Simple text markers, no HTML tags needed

---

## 🔧 Technical Details

### Component Used: `FormattedText`

Location: `src/components/FormattedText.js`

**Features:**
- ✅ Supports `**bold**` syntax (Markdown-style)
- ✅ Supports `__bold__` syntax (alternative)
- ✅ Automatically renders bold text in React Native
- ✅ Works with all Text styles
- ✅ Falls back to plain text if no formatting found

### Where It's Used:

- ✅ Forum posts (`DiscipleshipTrainingScreen.js`)
- ✅ Forum replies (`DiscipleshipTrainingScreen.js`)
- ✅ Can be used anywhere you need formatted text

---

## 💡 Best Practices

### 1. Always Trim Text
```javascript
content: textInput.trim()  // Remove leading/trailing spaces
```

### 2. Validate Before Saving
```javascript
if (!content.trim()) {
  Alert.alert('Error', 'Content cannot be empty');
  return;
}
```

### 3. Use Consistent Formatting
- Prefer `**bold**` over `__bold__` for consistency
- Don't mix both in the same text (though both work)

### 4. Escape Special Characters (if needed)
If you need to display literal `**` or `__`, you can escape them or use a different format.

---

## 📱 Using in Your Code

### Import the Component:

```javascript
import FormattedText from '../components/FormattedText';
```

### Use Instead of Text:

```javascript
// Before:
<Text style={styles.content}>{forum.content}</Text>

// After:
<FormattedText style={styles.content}>{forum.content}</FormattedText>
```

---

## 🚀 Adding to Other Screens

To add bold formatting support to other screens:

1. **Import FormattedText**:
```javascript
import FormattedText from '../components/FormattedText';
```

2. **Replace Text component**:
```javascript
// Replace this:
<Text style={styles.text}>{content}</Text>

// With this:
<FormattedText style={styles.text}>{content}</FormattedText>
```

3. **Save formatted text to Firestore**:
```javascript
await addDoc(collection(db, 'yourCollection'), {
  content: 'This is **bold** text',
});
```

---

## ❓ FAQ

**Q: Can I use HTML tags like `<b>bold</b>`?**  
A: No, use `**bold**` or `__bold__` markers instead. HTML tags won't work.

**Q: Can I combine bold with other formatting?**  
A: Currently, only bold is supported. You can extend `FormattedText.js` to add italic, underline, etc.

**Q: Does it work in all text fields?**  
A: Yes, anywhere you use `FormattedText` component instead of `Text`.

**Q: What if I want to display literal `**` characters?**  
A: The component will try to parse them as bold markers. For literal display, you may need to escape them or use a different approach.

---

## 📚 Related Files

- `src/components/FormattedText.js` - The formatting component
- `src/screens/DiscipleshipTrainingScreen.js` - Example usage in forums
- `src/utils/logger.js` - Logging utilities

---

**Last Updated**: January 2025

