# 📱 Offline Support Implementation Guide

## ✅ What's Been Implemented

Offline support has been added to the Greater Works City Church app, allowing users to access cached data when they don't have an internet connection.

---

## 🎯 Features

### 1. **Data Caching**
- ✅ Events cached for offline access
- ✅ Automatic cache on data load
- ✅ Cache expiration (24 hours)
- ✅ Fallback to cached data when offline

### 2. **Network Detection**
- ✅ Real-time network status monitoring
- ✅ Automatic online/offline detection
- ✅ Visual offline indicator

### 3. **Offline Indicator**
- ✅ Banner shows when offline
- ✅ Smooth animations
- ✅ Non-intrusive design

---

## 📁 Files Created/Modified

### New Files:
1. **`src/utils/cacheService.js`** - Caching utility with AsyncStorage
2. **`src/utils/networkService.js`** - Network connectivity detection
3. **`src/components/OfflineIndicator.js`** - Offline status banner

### Modified Files:
1. **`src/screens/HomeScreen.js`** - Now uses caching for events

---

## 🚀 How It Works

### Online Mode:
1. App loads data from Firebase
2. Data is automatically cached to AsyncStorage
3. Fresh data is displayed

### Offline Mode:
1. Network detection identifies offline status
2. App loads data from cache (even if expired)
3. Offline indicator banner appears
4. User can still view cached content

---

## 💻 Usage Examples

### Caching Data
```javascript
import { cacheEvents, getCachedEvents } from '../utils/cacheService';
import { isOnline } from '../utils/networkService';

// Load events with offline support
const loadEvents = async () => {
  const online = await isOnline();
  let events = [];

  if (online) {
    // Load from Firebase
    const snapshot = await getDocs(collection(db, 'events'));
    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() });
    });
    // Cache for offline
    await cacheEvents(events);
  } else {
    // Load from cache
    events = await getCachedEvents(true); // true = allow expired cache
  }

  return events;
};
```

### Using Network Hook
```javascript
import { useNetworkStatus } from '../utils/networkService';

function MyScreen() {
  const { isConnected, isChecking } = useNetworkStatus();

  return (
    <View>
      {!isConnected && (
        <Text>You're offline. Showing cached data.</Text>
      )}
    </View>
  );
}
```

### Adding Offline Indicator
```javascript
import OfflineIndicator from '../components/OfflineIndicator';

function MyScreen() {
  return (
    <View>
      <OfflineIndicator />
      {/* Your content */}
    </View>
  );
}
```

---

## 📊 Cache Management

### Available Cache Functions

**Events:**
- `cacheEvents(events)` - Cache events array
- `getCachedEvents(allowExpired)` - Get cached events

**Announcements:**
- `cacheAnnouncements(announcements)`
- `getCachedAnnouncements(allowExpired)`

**Devotionals:**
- `cacheDevotionals(devotionals)`
- `getCachedDevotionals(allowExpired)`

**Departments:**
- `cacheDepartments(departments)`
- `getCachedDepartments(allowExpired)`

**Ministries:**
- `cacheMinistries(ministries)`
- `getCachedMinistries(allowExpired)`

**User Profile:**
- `cacheUserProfile(profile)`
- `getCachedUserProfile(allowExpired)`

**Sermons:**
- `cacheSermons(sermons)`
- `getCachedSermons(allowExpired)`

### Cache Utilities
- `clearCache(key)` - Clear specific cache
- `clearAllCache()` - Clear all caches
- `hasValidCache(key)` - Check if cache exists and is valid
- `getCacheAge(key)` - Get cache age in milliseconds

---

## 🔧 Implementation Status

### ✅ Completed:
- [x] Cache service utility
- [x] Network detection service
- [x] Offline indicator component
- [x] HomeScreen events caching
- [x] Automatic cache on data load
- [x] Fallback to cache when offline

### 🟡 In Progress:
- [ ] Add caching to other screens (Announcements, Devotionals, etc.)
- [ ] Sync mechanism for when back online
- [ ] Queue actions for when offline

### 📋 To Do:
- [ ] Add caching to EventsScreen
- [ ] Add caching to MessagesScreen
- [ ] Add caching to DevotionalScreen
- [ ] Add caching to DepartmentsScreen
- [ ] Add caching to MinistriesScreen
- [ ] Implement action queue for offline writes
- [ ] Add cache size management
- [ ] Add cache statistics

---

## 🐛 Troubleshooting

### Problem: Cache not working
**Solution:**
- Check that AsyncStorage is properly installed
- Verify cache functions are being called
- Check console for errors

### Problem: Offline indicator not showing
**Solution:**
- Verify network detection is working
- Check that OfflineIndicator component is imported
- Test by disabling network on device

### Problem: Stale cached data
**Solution:**
- Cache expires after 24 hours by default
- Use `clearAllCache()` to force refresh
- Or modify `CACHE_EXPIRY` in `cacheService.js`

---

## 📝 Best Practices

1. **Always cache after successful data load**
   ```javascript
   const data = await loadFromFirebase();
   await cacheData(key, data);
   ```

2. **Check network before loading**
   ```javascript
   const online = await isOnline();
   if (online) {
     // Load from Firebase
   } else {
     // Load from cache
   }
   ```

3. **Allow expired cache for offline**
   ```javascript
   const data = await getCachedData(key, true); // true = allow expired
   ```

4. **Show offline indicator**
   - Add `<OfflineIndicator />` to main screens
   - Users should know when they're offline

---

## 🚀 Next Steps

To add offline support to other screens:

1. **Import utilities:**
   ```javascript
   import { cacheData, getCachedData } from '../utils/cacheService';
   import { isOnline } from '../utils/networkService';
   ```

2. **Modify load function:**
   ```javascript
   const loadData = async () => {
     const online = await isOnline();
     let data = [];

     if (online) {
       // Load from Firebase
       data = await loadFromFirebase();
       // Cache it
       await cacheData(CACHE_KEYS.YOUR_KEY, data);
     } else {
       // Load from cache
       data = await getCachedData(CACHE_KEYS.YOUR_KEY, true);
     }

     setData(data);
   };
   ```

3. **Add offline indicator:**
   ```javascript
   <OfflineIndicator />
   ```

---

## 📊 Performance

- **Cache Size:** Minimal (only essential data)
- **Cache Expiry:** 24 hours (configurable)
- **Network Checks:** Every 5 seconds when active
- **Storage:** Uses AsyncStorage (persistent)

---

## 🔒 Security

- Cached data is stored locally on device
- No sensitive data cached (only public content)
- Cache cleared on app uninstall
- User can manually clear cache

---

**Status:** ✅ **Basic offline support implemented**

The app now has offline capabilities for events. Additional screens can be updated following the same pattern.

