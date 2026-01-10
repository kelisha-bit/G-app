# 🔄 Recurring Events Feature Guide

## Overview

The app now supports recurring events! You can create events that repeat weekly on a specific day (e.g., Sunday Worship, Wednesday Prayer, Friday Bible Study) without having to manually create each occurrence.

## ✨ Features

- **Weekly Recurrence**: Events can repeat every week on a specific day
- **Flexible Time Ranges**: Support for time ranges (e.g., "8:00 AM - 8:30 AM")
- **Start/End Dates**: Optional start and end dates for recurring events
- **Automatic Expansion**: Recurring events are automatically expanded into individual instances for the next 12 weeks
- **Visual Indicators**: Recurring events are clearly marked with badges and icons

## 📋 How to Create Recurring Events

### As an Admin:

1. Navigate to **Admin Dashboard** → **Manage Events**
2. Tap the **+** button to create a new event
3. Fill in the event details:
   - **Title**: e.g., "Sunday Worship Service"
   - **Time**: e.g., "8:00 AM - 8:30 AM" or "9:00 AM - 1:00 PM"
   - **Location**: e.g., "Main Sanctuary"
   - **Category**: Select appropriate category
   - **Description**: Add event description
4. **Toggle "Recurring Event"** switch to ON
5. **Select Day of Week**: Choose the day (Sunday, Monday, Tuesday, etc.)
6. **Start Date** (Optional): Leave empty to start from today, or specify a date
7. **End Date** (Optional): Leave empty for ongoing events, or specify when it should end
8. Tap **"Create Event"**

### Example Recurring Events:

#### Sunday Worship Service
- **Title**: Sunday Worship Service
- **Time**: 8:00 AM - 8:30 AM
- **Location**: Main Sanctuary
- **Category**: Worship
- **Recurring**: Yes
- **Day**: Sunday
- **Start Date**: (leave empty or set start date)
- **End Date**: (leave empty for ongoing)

#### Wednesday Prayer Service
- **Title**: Wednesday Prayer Service
- **Time**: 9:00 AM - 1:00 PM
- **Location**: Prayer Room
- **Category**: Prayer
- **Recurring**: Yes
- **Day**: Wednesday

#### Friday Bible Study
- **Title**: Friday Bible Study
- **Time**: 6:30 PM - 8:00 PM
- **Location**: Fellowship Hall
- **Category**: Other
- **Recurring**: Yes
- **Day**: Friday

## 🎯 How It Works

### Data Structure

Recurring events are stored with the following structure:

```javascript
{
  title: "Sunday Worship Service",
  time: "8:00 AM - 8:30 AM",
  location: "Main Sanctuary",
  category: "Worship",
  description: "...",
  isRecurring: true,
  recurrencePattern: {
    dayOfWeek: 0,  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    startDate: "2025-01-12",  // Optional start date
    endDate: "2025-12-31",     // Optional end date (null for ongoing)
    time: "8:00 AM - 8:30 AM"
  },
  date: "2025-01-12"  // Start date for the recurring pattern
}
```

### Automatic Expansion

When events are loaded:
1. The system checks for recurring events
2. Generates individual instances for the next 12 weeks
3. Each instance gets a unique ID: `{eventId}_{date}`
4. Instances are sorted by date
5. Only future dates are included

### Display

- **Events List**: Shows all instances (upcoming recurring events appear as separate entries)
- **Home Screen**: Shows upcoming recurring event instances
- **Event Details**: Shows recurrence information for recurring events
- **Badges**: Recurring events have a "Recurring" badge with a repeat icon

## 🔧 Technical Details

### Utility Functions

Located in `src/utils/recurringEvents.js`:

- `generateRecurringInstances(event, weeksAhead)`: Generates instances for a recurring event
- `expandRecurringEvents(events, weeksAhead)`: Expands all recurring events in an array
- `formatRecurrencePattern(pattern)`: Formats recurrence pattern for display
- `getDayOfWeek(dayName)`: Converts day name to number
- `getDayName(dayNumber)`: Converts day number to name

### Updated Screens

1. **ManageEventsScreen**: Added recurring event creation/editing UI
2. **EventsScreen**: Expands recurring events when loading
3. **HomeScreen**: Handles recurring events in upcoming events
4. **EventDetailsScreen**: Shows recurrence information

## 📱 User Experience

### For Regular Users:

- Recurring events appear in the events list just like regular events
- Each occurrence shows the specific date
- Recurring events are marked with a "Recurring" badge
- Users can register for specific occurrences
- Event details show recurrence information

### For Admins:

- Easy toggle to make an event recurring
- Simple day-of-week selection
- Optional start/end dates
- Recurring events are clearly marked in the events list
- Can edit recurring event templates (changes apply to future instances)

## 🎨 Visual Indicators

- **Recurring Badge**: Purple badge with repeat icon (🔄) on event cards
- **Recurring Toggle**: Switch in the event creation form
- **Day Buttons**: Visual day selection buttons
- **Recurrence Info**: Displayed in event details

## ⚠️ Important Notes

1. **Date Format**: Use YYYY-MM-DD format for dates (e.g., "2025-01-12")
2. **Time Format**: Use standard time format (e.g., "8:00 AM - 8:30 AM")
3. **Day Selection**: Must select a day of week for recurring events
4. **Start Date**: If not specified, defaults to today
5. **End Date**: If not specified, event continues indefinitely
6. **Editing**: Editing a recurring event template updates the pattern for future instances
7. **Deletion**: Deleting a recurring event removes the template and all future instances

## 🚀 Future Enhancements (Potential)

- Monthly recurrence patterns
- Custom recurrence intervals (every 2 weeks, etc.)
- Exception dates (skip specific dates)
- Individual instance editing
- Recurrence pattern templates

## 📝 Example Use Cases

1. **Weekly Services**: Sunday worship, mid-week services
2. **Regular Meetings**: Prayer meetings, Bible studies, small groups
3. **Ongoing Programs**: Youth meetings, children's programs
4. **Seasonal Events**: Events that run for a specific period (e.g., 3-month study)

---

**Status**: ✅ Complete and Ready to Use

**Last Updated**: January 2025


