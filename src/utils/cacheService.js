/**
 * Cache Service Utility
 * 
 * Provides offline data caching using AsyncStorage
 * Caches critical app data for offline access
 * 
 * Usage:
 *   import { cacheData, getCachedData, clearCache } from '../utils/cacheService';
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_KEYS = {
  EVENTS: '@cache:events',
  ANNOUNCEMENTS: '@cache:announcements',
  DEVOTIONALS: '@cache:devotionals',
  DEPARTMENTS: '@cache:departments',
  MINISTRIES: '@cache:ministries',
  USER_PROFILE: '@cache:userProfile',
  SERMONS: '@cache:sermons',
  CACHE_TIMESTAMP: '@cache:timestamp',
};

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * Cache data with timestamp
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @returns {Promise<void>}
 */
export const cacheData = async (key, data) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error(`Error caching data for ${key}:`, error);
  }
};

/**
 * Get cached data if not expired
 * @param {string} key - Cache key
 * @param {number} maxAge - Maximum age in milliseconds (optional, defaults to CACHE_EXPIRY)
 * @returns {Promise<any|null>} - Cached data or null if expired/not found
 */
export const getCachedData = async (key, maxAge = CACHE_EXPIRY) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cacheItem = JSON.parse(cached);
    const age = Date.now() - cacheItem.timestamp;

    // Check if cache is expired
    if (age > maxAge) {
      // Cache expired, remove it
      await AsyncStorage.removeItem(key);
      return null;
    }

    return cacheItem.data;
  } catch (error) {
    console.error(`Error getting cached data for ${key}:`, error);
    return null;
  }
};

/**
 * Get cached data even if expired (for offline use)
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Cached data or null
 */
export const getCachedDataOffline = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cacheItem = JSON.parse(cached);
    return cacheItem.data;
  } catch (error) {
    console.error(`Error getting offline cached data for ${key}:`, error);
    return null;
  }
};

/**
 * Clear specific cache
 * @param {string} key - Cache key
 * @returns {Promise<void>}
 */
export const clearCache = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing cache for ${key}:`, error);
  }
};

/**
 * Clear all app caches
 * @returns {Promise<void>}
 */
export const clearAllCache = async () => {
  try {
    const keys = Object.values(CACHE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
};

/**
 * Cache events
 * @param {Array} events - Events array
 * @returns {Promise<void>}
 */
export const cacheEvents = async (events) => {
  await cacheData(CACHE_KEYS.EVENTS, events);
};

/**
 * Get cached events
 * @param {boolean} allowExpired - Allow expired cache (for offline)
 * @returns {Promise<Array|null>}
 */
export const getCachedEvents = async (allowExpired = false) => {
  if (allowExpired) {
    return await getCachedDataOffline(CACHE_KEYS.EVENTS);
  }
  return await getCachedData(CACHE_KEYS.EVENTS);
};

/**
 * Cache announcements
 * @param {Array} announcements - Announcements array
 * @returns {Promise<void>}
 */
export const cacheAnnouncements = async (announcements) => {
  await cacheData(CACHE_KEYS.ANNOUNCEMENTS, announcements);
};

/**
 * Get cached announcements
 * @param {boolean} allowExpired - Allow expired cache (for offline)
 * @returns {Promise<Array|null>}
 */
export const getCachedAnnouncements = async (allowExpired = false) => {
  if (allowExpired) {
    return await getCachedDataOffline(CACHE_KEYS.ANNOUNCEMENTS);
  }
  return await getCachedData(CACHE_KEYS.ANNOUNCEMENTS);
};

/**
 * Cache devotionals
 * @param {Array} devotionals - Devotionals array
 * @returns {Promise<void>}
 */
export const cacheDevotionals = async (devotionals) => {
  await cacheData(CACHE_KEYS.DEVOTIONALS, devotionals);
};

/**
 * Get cached devotionals
 * @param {boolean} allowExpired - Allow expired cache (for offline)
 * @returns {Promise<Array|null>}
 */
export const getCachedDevotionals = async (allowExpired = false) => {
  if (allowExpired) {
    return await getCachedDataOffline(CACHE_KEYS.DEVOTIONALS);
  }
  return await getCachedData(CACHE_KEYS.DEVOTIONALS);
};

/**
 * Cache departments
 * @param {Array} departments - Departments array
 * @returns {Promise<void>}
 */
export const cacheDepartments = async (departments) => {
  await cacheData(CACHE_KEYS.DEPARTMENTS, departments);
};

/**
 * Get cached departments
 * @param {boolean} allowExpired - Allow expired cache (for offline)
 * @returns {Promise<Array|null>}
 */
export const getCachedDepartments = async (allowExpired = false) => {
  if (allowExpired) {
    return await getCachedDataOffline(CACHE_KEYS.DEPARTMENTS);
  }
  return await getCachedData(CACHE_KEYS.DEPARTMENTS);
};

/**
 * Cache ministries
 * @param {Array} ministries - Ministries array
 * @returns {Promise<void>}
 */
export const cacheMinistries = async (ministries) => {
  await cacheData(CACHE_KEYS.MINISTRIES, ministries);
};

/**
 * Get cached ministries
 * @param {boolean} allowExpired - Allow expired cache (for offline)
 * @returns {Promise<Array|null>}
 */
export const getCachedMinistries = async (allowExpired = false) => {
  if (allowExpired) {
    return await getCachedDataOffline(CACHE_KEYS.MINISTRIES);
  }
  return await getCachedData(CACHE_KEYS.MINISTRIES);
};

/**
 * Cache user profile
 * @param {Object} profile - User profile object
 * @returns {Promise<void>}
 */
export const cacheUserProfile = async (profile) => {
  await cacheData(CACHE_KEYS.USER_PROFILE, profile);
};

/**
 * Get cached user profile
 * @param {boolean} allowExpired - Allow expired cache (for offline)
 * @returns {Promise<Object|null>}
 */
export const getCachedUserProfile = async (allowExpired = false) => {
  if (allowExpired) {
    return await getCachedDataOffline(CACHE_KEYS.USER_PROFILE);
  }
  return await getCachedData(CACHE_KEYS.USER_PROFILE);
};

/**
 * Cache sermons
 * @param {Array} sermons - Sermons array
 * @returns {Promise<void>}
 */
export const cacheSermons = async (sermons) => {
  await cacheData(CACHE_KEYS.SERMONS, sermons);
};

/**
 * Get cached sermons
 * @param {boolean} allowExpired - Allow expired cache (for offline)
 * @returns {Promise<Array|null>}
 */
export const getCachedSermons = async (allowExpired = false) => {
  if (allowExpired) {
    return await getCachedDataOffline(CACHE_KEYS.SERMONS);
  }
  return await getCachedData(CACHE_KEYS.SERMONS);
};

/**
 * Check if cache exists and is valid
 * @param {string} key - Cache key
 * @returns {Promise<boolean>}
 */
export const hasValidCache = async (key) => {
  const data = await getCachedData(key);
  return data !== null;
};

/**
 * Get cache age in milliseconds
 * @param {string} key - Cache key
 * @returns {Promise<number|null>} - Age in ms or null if not found
 */
export const getCacheAge = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cacheItem = JSON.parse(cached);
    return Date.now() - cacheItem.timestamp;
  } catch (error) {
    return null;
  }
};

// Export cache keys for reference
export { CACHE_KEYS };

