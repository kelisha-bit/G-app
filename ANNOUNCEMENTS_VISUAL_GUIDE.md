# 📢 Announcements Visual Guide

## 📱 User Interface Overview

This guide provides a visual description of the updated announcements feature and how users interact with it.

---

## 1️⃣ Messages Screen - Announcements Tab

### Layout Structure

```
┌─────────────────────────────────────┐
│  ← Messages            ✏️            │  ← Header (Purple Gradient)
├─────────────────────────────────────┤
│  Inbox (2)  │  Announcements       │  ← Tabs
│             │  ▔▔▔▔▔▔▔▔▔▔▔▔▔      │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔴 Church Building Project  │   │  ← High Priority
│  │    [General]                │   │     Announcement
│  │                             │   │
│  │ We are excited to announce  │   │
│  │ the launch of our new...    │   │
│  │                             │   │
│  │ 📅 Today      Read more → │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🟠 New Service Time         │   │  ← Medium Priority
│  │    [Update]                 │   │     Announcement
│  │                             │   │
│  │ Starting next month, our    │   │
│  │ Sunday service will...      │   │
│  │                             │   │
│  │ 📅 Yesterday  Read more → │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🟢 Volunteer Appreciation   │   │  ← Low Priority
│  │    [General]                │   │     Announcement
│  │                             │   │
│  │ Thank you to all our        │   │
│  │ volunteers for...           │   │
│  │                             │   │
│  │ 📅 3 days ago Read more → │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Component Breakdown

#### Header
- **Background**: Purple gradient (`#6366f1` → `#8b5cf6`)
- **Left**: Back arrow button (← with rounded background)
- **Center**: "Messages" title (white, bold)
- **Right**: Compose button (✏️ with rounded background)

#### Tabs
- **Inbox Tab**: Shows unread count badge
- **Announcements Tab**: Currently selected (underlined in purple)
- **Selected State**: Purple underline (`#6366f1`)
- **Unselected State**: Gray text

#### Announcement Card
Each card contains:

1. **Header Row**:
   - Priority dot (colored circle)
   - Title (bold, dark text)
   - Category badge (purple background, small text)

2. **Message Preview**:
   - First 3 lines of announcement
   - Truncated with ellipsis if longer
   - Gray text, medium size

3. **Footer Row**:
   - Left: Calendar icon + formatted date
   - Right: "Read more" link + chevron (→)
   - Separated by divider line

---

## 2️⃣ Announcement Detail Modal

### Layout Structure

```
┌─────────────────────────────────────┐
│                                     │
│  (Tap anywhere to dismiss)          │
│  ↓                                  │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃  Announcement            ✕     ┃ │  ← Modal Header
│ ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫ │
│ ┃                                ┃ │
│ ┃  🔴 HIGH PRIORITY [General]    ┃ │  ← Priority & Category
│ ┃                                ┃ │
│ ┃  Church Building Project       ┃ │  ← Title (Large, Bold)
│ ┃                                ┃ │
│ ┃  📅 Today                      ┃ │  ← Date
│ ┃                                ┃ │
│ ┃  ─────────────────────────     ┃ │  ← Divider
│ ┃                                ┃ │
│ ┃  We are excited to announce    ┃ │
│ ┃  the launch of our new church  ┃ │
│ ┃  building project. This is a   ┃ │  ← Full Message
│ ┃  significant milestone in our  ┃ │     (Scrollable)
│ ┃  church's journey, and we      ┃ │
│ ┃  invite everyone to be part    ┃ │
│ ┃  of this exciting endeavor.    ┃ │
│ ┃                                ┃ │
│ ┃  The project will include:     ┃ │
│ ┃  - New sanctuary seating 500   ┃ │
│ ┃  - Modern fellowship hall      ┃ │
│ ┃  - Children's ministry wing    ┃ │
│ ┃  - Additional parking          ┃ │
│ ┃                                ┃ │
│ ┃  For more information or to    ┃ │
│ ┃  contribute, please contact    ┃ │
│ ┃  the church office.            ┃ │
│ ┃                                ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                     │
└─────────────────────────────────────┘
```

### Component Details

#### Modal Header
- **Background**: White with bottom border
- **Left**: "Announcement" title (bold)
- **Right**: Close button (✕) in rounded gray background

#### Content Area (Scrollable)
1. **Priority Badge**: 
   - Colored dot + "HIGH PRIORITY" text
   - Colors match priority level
   
2. **Category Badge**:
   - Purple background (`#ede9fe`)
   - Indigo text (`#6366f1`)
   - Displayed next to priority

3. **Title**:
   - Large (22px), bold
   - Dark gray (`#1f2937`)
   - Multi-line if needed

4. **Date**:
   - Calendar icon + formatted date text
   - Gray color
   - Same smart formatting as list view

5. **Divider**:
   - Light gray horizontal line
   - Separates metadata from content

6. **Full Message**:
   - Medium size (15px)
   - Comfortable line height (24px)
   - Dark gray for readability
   - Preserves line breaks and formatting

---

## 3️⃣ Loading State

```
┌─────────────────────────────────────┐
│  ← Messages            ✏️            │
├─────────────────────────────────────┤
│  Inbox (2)  │  Announcements       │
│             │  ▔▔▔▔▔▔▔▔▔▔▔▔▔      │
├─────────────────────────────────────┤
│                                     │
│                                     │
│            ⟳                        │  ← Loading Spinner
│     (Spinning animation)            │     (Purple)
│                                     │
│    Loading announcements...         │  ← Loading Text
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Details
- **Spinner**: Large, purple color (`#6366f1`)
- **Text**: Gray, centered below spinner
- **Background**: Light gray (`#f9fafb`)
- **Duration**: 1-2 seconds typically

---

## 4️⃣ Empty State

```
┌─────────────────────────────────────┐
│  ← Messages            ✏️            │
├─────────────────────────────────────┤
│  Inbox (2)  │  Announcements       │
│             │  ▔▔▔▔▔▔▔▔▔▔▔▔▔      │
├─────────────────────────────────────┤
│                                     │
│                                     │
│            📢                       │  ← Megaphone Icon
│       (Large icon, gray)            │     (64px)
│                                     │
│    No Announcements Yet             │  ← Empty Title
│                                     │
│  Check back later for church        │  ← Empty Description
│  updates and announcements          │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Details
- **Icon**: Megaphone outline, large size
- **Title**: Bold, medium gray
- **Description**: Regular weight, light gray
- **Background**: Light gray (`#f9fafb`)
- **Centered**: All elements vertically and horizontally centered

---

## 🎨 Color Palette

### Priority Colors
```
High Priority (Red):    ●  #ef4444
Medium Priority (Orange): ●  #f59e0b
Low Priority (Green):   ●  #10b981
```

### UI Colors
```
Primary (Purple):       ■  #6366f1
Primary Dark:           ■  #8b5cf6
Category Background:    ■  #ede9fe
Background:             ■  #f9fafb
White:                  ■  #ffffff
```

### Text Colors
```
Dark Text:              ■  #1f2937
Medium Text:            ■  #4b5563
Gray Text:              ■  #6b7280
Light Gray:             ■  #9ca3af
Border Gray:            ■  #e5e7eb
Lighter Border:         ■  #f3f4f6
```

---

## 📐 Spacing & Dimensions

### Card Dimensions
- **Width**: Full screen width - 40px (20px padding each side)
- **Height**: Auto (content-based)
- **Border Radius**: 12px
- **Padding**: 15px all sides
- **Margin Bottom**: 12px between cards
- **Shadow**: Subtle elevation effect

### Typography
```
Header Title:        20px, Bold, White
Announcement Title:  16px, Bold, Dark
Category Badge:      11px, Semi-Bold, Indigo
Message Preview:     14px, Regular, Gray
Date Text:          12px, Regular, Light Gray
Modal Title:        22px, Bold, Dark
Modal Message:      15px, Regular, Medium Gray
Priority Badge:     12px, Bold, Colored
```

### Icons
```
Priority Dot:       10px diameter
Calendar Icon:      14px
Chevron Icon:       14px
Megaphone Icon:     64px (empty state)
Close Button:       24px
```

---

## 🔄 Interactions & Animations

### Pull-to-Refresh
```
User scrolls at top
        ↓
Pulls down
        ↓
Refresh indicator appears (purple spinner)
        ↓
Releases
        ↓
Loads latest announcements
        ↓
Spinner disappears
        ↓
List updates
```

**Visual Feedback**:
- Purple spinner while refreshing
- Smooth animation
- List smoothly updates with new data

### Tap Announcement Card
```
User taps card
        ↓
Card briefly highlights (touch feedback)
        ↓
Modal slides up from bottom
        ↓
Background darkens (50% black overlay)
        ↓
Detail content displayed
```

**Animation**:
- Slide duration: ~300ms
- Easing: Ease-out
- Smooth, natural motion

### Close Modal
```
User taps close button OR taps outside
        ↓
Modal slides down
        ↓
Background overlay fades out
        ↓
Returns to list view
```

**Animation**:
- Slide duration: ~250ms
- Easing: Ease-in
- Quick, responsive

---

## 📱 Responsive Behavior

### Card Layout
- Adapts to screen width
- Maintains 20px side padding
- Text wraps naturally
- Icons scale appropriately

### Modal Height
- Maximum 85% of screen height
- Content scrolls if needed
- Header stays fixed at top
- Smooth scrolling behavior

---

## 🎭 State Transitions

### Initial Load
```
1. User opens Messages
        ↓
2. Switches to Announcements tab
        ↓
3. Loading spinner appears
        ↓
4. Data loads from Firebase
        ↓
5a. If announcements exist → Show list
5b. If no announcements → Show empty state
```

### After Refresh
```
1. User pulls down
        ↓
2. Refresh spinner appears
        ↓
3. Data reloads from Firebase
        ↓
4. List updates with new data
        ↓
5. Spinner disappears
```

---

## 💡 Visual Hierarchy

### Priority Order (Top to Bottom)
1. **Header** - Purple gradient, immediately visible
2. **Tabs** - Clear navigation
3. **Announcement Cards** - Primary content
4. **Priority Dots** - First visual indicator in cards
5. **Titles** - Largest text in cards
6. **Categories** - Supporting information
7. **Previews** - Content preview
8. **Dates & Actions** - Footer information

### Visual Weight
```
Highest Priority:
  - Priority dot color
  - Announcement title
  - "Read more" action

Medium Priority:
  - Category badge
  - Message preview

Lower Priority:
  - Date information
  - Divider lines
```

---

## 🖼️ Example Scenarios

### Scenario 1: High Priority Urgent Announcement
```
┌─────────────────────────────────┐
│ 🔴 Service Cancelled Tomorrow   │  ← RED dot, urgent
│    [Urgent]                     │  ← Urgent category
│                                 │
│ Due to severe weather, Sunday   │
│ service is cancelled...         │
│                                 │
│ 📅 Today      Read more →     │  ← Recent (Today)
└─────────────────────────────────┘
```

### Scenario 2: Medium Priority Event
```
┌─────────────────────────────────┐
│ 🟠 Youth Conference Next Month  │  ← ORANGE dot
│    [Event]                      │  ← Event category
│                                 │
│ Registration is now open for    │
│ our annual youth conference...  │
│                                 │
│ 📅 2 days ago  Read more →    │
└─────────────────────────────────┘
```

### Scenario 3: Low Priority General Info
```
┌─────────────────────────────────┐
│ 🟢 Welcome New Small Group      │  ← GREEN dot
│    [General]                    │  ← General category
│                                 │
│ We're excited to announce a     │
│ new small group starting...     │
│                                 │
│ 📅 Jan 1, 2025 Read more →    │  ← Older date
└─────────────────────────────────┘
```

---

## ✨ Polish & Details

### Shadows
- **Cards**: Subtle shadow for depth
- **Modal**: Stronger shadow for elevation
- **Platform-specific**: iOS shadow vs Android elevation

### Touch Feedback
- Cards highlight on touch
- Buttons show active state
- Smooth transitions

### Accessibility
- Sufficient color contrast
- Touch targets ≥ 44x44px
- Screen reader compatible
- Clear visual hierarchy

---

## 🎯 Design Principles

### Clarity
- Clear priority indicators
- Obvious call-to-action ("Read more")
- Distinct visual states

### Consistency
- Matches app's design system
- Purple theme throughout
- Consistent spacing and typography

### Efficiency
- Quick scanning with priority dots
- Preview text saves taps
- Pull-to-refresh for updates

### Beauty
- Modern, clean design
- Smooth animations
- Thoughtful color choices

---

## 📊 Component Hierarchy

```
MessagesScreen
├── Header (LinearGradient)
│   ├── Back Button
│   ├── Title
│   └── Compose Button
├── Tabs Container
│   ├── Inbox Tab (with badge)
│   └── Announcements Tab
└── Content Area (ScrollView with RefreshControl)
    ├── Loading State (conditional)
    │   ├── ActivityIndicator
    │   └── Loading Text
    ├── Empty State (conditional)
    │   ├── Megaphone Icon
    │   ├── Empty Title
    │   └── Empty Description
    └── Announcements List (conditional)
        ├── Announcement Card 1
        │   ├── Card Header
        │   │   ├── Priority Dot
        │   │   ├── Title
        │   │   └── Category Badge
        │   ├── Message Preview
        │   └── Card Footer
        │       ├── Date Container
        │       └── Read More Link
        ├── Announcement Card 2
        └── ...

Detail Modal (separate)
├── Modal Overlay (dimmed background)
└── Modal Container
    ├── Modal Header
    │   ├── Title
    │   └── Close Button
    └── Modal Content (ScrollView)
        ├── Priority Row
        ├── Title
        ├── Date Container
        ├── Divider
        └── Full Message
```

---

## 🎨 Style Reference

### Card Styles
```javascript
announcementCard: {
  backgroundColor: '#fff',
  padding: 15,
  borderRadius: 12,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}
```

### Priority Dot
```javascript
priorityDot: {
  width: 10,
  height: 10,
  borderRadius: 5,
  marginRight: 10,
}
```

### Category Badge
```javascript
categoryBadge: {
  backgroundColor: '#ede9fe',
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 12,
  marginTop: 5,
}
```

---

**This visual guide helps developers, designers, and stakeholders understand the complete user experience of the updated announcements feature.**

---

**Last Updated**: January 8, 2026  
**Version**: 2.0  
**Status**: Production Ready ✅


