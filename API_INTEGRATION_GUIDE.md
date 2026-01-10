# 🔌 API Integration Guide

This document explains the free APIs integrated into the Greater Works City Church app and how to use them.

---

## 📖 Bible API Integration

### Overview
The app now includes automatic Bible verse fetching using the free **Bible API** (bible-api.com). This allows admins to automatically fetch verse text when creating devotionals.

### Features
- ✅ **No API key required** - Completely free
- ✅ **Automatic verse fetching** - Just enter a verse reference
- ✅ **Supports verse ranges** - Works with ranges like "John 3:16-17"
- ✅ **Error handling** - Graceful fallback if verse not found

### How to Use

#### For Admins (Creating Devotionals)

1. Navigate to **Admin Dashboard** → **Manage Devotionals**
2. Tap **+** to create a new devotional
3. In the **"Bible Verse Reference"** field, enter a verse (e.g., `John 3:16`, `Psalm 23:1`)
4. Tap the **"Fetch Verse"** button next to the field
5. The verse text will automatically populate in the "Verse Text" field
6. Review and edit if needed, then complete the rest of the form

#### Supported Formats
- Single verses: `John 3:16`, `Psalm 23:1`
- Verse ranges: `John 3:16-17`, `Psalm 23:1-3`
- Books with numbers: `1 Corinthians 13:4`, `2 Timothy 1:7`

### Technical Details

**API Endpoint**: `https://bible-api.com/{reference}`

**Example Request**:
```
GET https://bible-api.com/john+3:16
```

**Response Format**:
```json
{
  "reference": "John 3:16",
  "text": "For God so loved the world...",
  "verses": [...]
}
```

**File Location**: `src/utils/bibleApi.js`

**Functions Available**:
- `fetchBibleVerse(reference)` - Fetches a single verse or range
- `isValidVerseReference(reference)` - Validates verse format

---

## 🌤️ Weather API Integration

### Overview
The app includes weather forecast integration using **OpenWeatherMap API**. This shows weather information for events, helping members prepare for outdoor activities.

### Features
- ✅ **Weather forecast** - Shows weather for event date
- ✅ **Temperature & conditions** - Displays temp, description, humidity, wind
- ✅ **Visual icons** - Weather condition icons
- ✅ **Smart location detection** - Extracts city from event location

### Setup Required

⚠️ **Important**: You need to get a free API key from OpenWeatherMap.

#### Step 1: Get API Key
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Click **"Sign Up"** (or **"Sign In"** if you have an account)
3. Complete the free registration
4. Go to **API Keys** section
5. Copy your API key (starts with letters/numbers)

#### Step 2: Add API Key to App
1. Open `src/utils/weatherApi.js`
2. Find this line:
   ```javascript
   const WEATHER_API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY_HERE';
   ```
3. Replace `YOUR_OPENWEATHERMAP_API_KEY_HERE` with your actual API key:
   ```javascript
   const WEATHER_API_KEY = 'abc123def456ghi789';
   ```
4. Save the file

#### Step 3: Test
1. Create an event with a location (e.g., "Main Sanctuary, Accra")
2. View the event details
3. You should see weather forecast section

### Free Tier Limits
- **1,000 API calls per day**
- **60 calls per minute**
- **5-day forecast** (not hourly)
- **Current weather** available

*Note: For most church apps, 1,000 calls/day is more than enough.*

### How It Works

#### For Users (Viewing Events)
1. Navigate to **Events** → Select an event
2. Scroll down to see **"Weather Forecast"** section
3. View temperature, conditions, humidity, and wind speed
4. Weather is automatically fetched for the event date

#### Location Detection
The app automatically extracts city names from event locations:
- `"Main Sanctuary, Accra"` → Uses `Accra`
- `"Youth Center, Kumasi"` → Uses `Kumasi`
- `"Prayer Room"` → Falls back to default location

### Supported Cities
The app works with any city worldwide. For Ghana, common cities include:
- Accra
- Kumasi
- Tamale
- Cape Coast
- Takoradi
- Sunyani
- Ho
- Koforidua

### Technical Details

**API Endpoint**: `https://api.openweathermap.org/data/2.5/forecast`

**Example Request**:
```
GET https://api.openweathermap.org/data/2.5/forecast?q=Accra,GH&appid=YOUR_API_KEY&units=metric
```

**Response Format**:
```json
{
  "list": [{
    "main": { "temp": 28, "humidity": 75 },
    "weather": [{
      "description": "clear sky",
      "icon": "01d"
    }],
    "wind": { "speed": 2.5 }
  }]
}
```

**File Location**: `src/utils/weatherApi.js`

**Functions Available**:
- `fetchCurrentWeather(city, countryCode)` - Gets current weather
- `fetchWeatherForecast(city, dateString, countryCode)` - Gets forecast for specific date
- `getWeatherIconUrl(iconCode)` - Gets weather icon URL
- `extractCityFromLocation(location)` - Extracts city from location string

---

## 🎯 Usage Examples

### Example 1: Creating Devotional with Bible API

```
1. Admin → Manage Devotionals → Create New
2. Enter verse reference: "John 3:16"
3. Tap "Fetch Verse" button
4. Verse text auto-populates:
   "For God so loved the world that he gave his one and only Son..."
5. Complete rest of form and save
```

### Example 2: Viewing Event Weather

```
1. User → Events → Select "Sunday Worship Service"
2. Event details screen loads
3. Weather section shows:
   - Temperature: 28°C
   - Condition: Clear sky
   - Humidity: 75%
   - Wind: 2.5 m/s
```

---

## ⚠️ Troubleshooting

### Bible API Issues

**Problem**: "Verse not found" error
- **Solution**: Check verse reference format. Use format like "John 3:16" not "John3:16"

**Problem**: "Failed to fetch verse"
- **Solution**: Check internet connection. The API requires internet access.

### Weather API Issues

**Problem**: "Weather API key not configured" message
- **Solution**: Add your OpenWeatherMap API key to `src/utils/weatherApi.js`

**Problem**: "Invalid API key" error
- **Solution**: 
  1. Verify your API key is correct
  2. Check if API key is activated (may take a few minutes after creation)
  3. Ensure no extra spaces in the API key

**Problem**: "Location not found" error
- **Solution**: 
  1. Make sure event location includes a city name
  2. Try using format: "Location, City" (e.g., "Main Sanctuary, Accra")
  3. Check if city name is spelled correctly

**Problem**: Weather not showing
- **Solution**: 
  1. Check if API key is set
  2. Verify event has a date and location
  3. Check internet connection
  4. Weather only shows for dates within 5 days (free tier limit)

---

## 📊 API Costs

### Bible API
- **Cost**: FREE
- **Limits**: None (reasonable use)
- **No registration required**

### Weather API (OpenWeatherMap)
- **Cost**: FREE (up to 1,000 calls/day)
- **Paid tiers**: Available if you need more
- **Registration**: Required (free account)

---

## 🔒 Security Notes

1. **Bible API**: No authentication needed, safe to use directly
2. **Weather API**: 
   - API key should be kept secure
   - For production, consider using environment variables
   - Never commit API keys to public repositories

### Recommended: Use Environment Variables

For production apps, use environment variables instead of hardcoding:

```javascript
// In weatherApi.js
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || 'YOUR_KEY_HERE';
```

Then set in `.env` file:
```
EXPO_PUBLIC_WEATHER_API_KEY=your_actual_key_here
```

---

## ✅ Checklist

### Bible API Setup
- [x] No setup required - works immediately
- [x] Test by creating a devotional and using "Fetch Verse"

### Weather API Setup
- [ ] Sign up for OpenWeatherMap account
- [ ] Get API key
- [ ] Add API key to `src/utils/weatherApi.js`
- [ ] Test by viewing an event with location
- [ ] Verify weather displays correctly

---

## 🚀 Future Enhancements

Possible improvements:
- [ ] Cache Bible verses locally to reduce API calls
- [ ] Add more Bible translations
- [ ] Weather alerts for severe weather
- [ ] Historical weather data
- [ ] Multiple location support

---

**Status**: ✅ Both APIs Integrated and Ready to Use

**Last Updated**: January 2025

