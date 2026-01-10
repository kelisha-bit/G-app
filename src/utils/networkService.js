/**
 * Network Service Utility
 * 
 * Detects network connectivity status using simple fetch test
 * Provides online/offline state management
 * 
 * Usage:
 *   import { isOnline, useNetworkStatus } from '../utils/networkService';
 */

import { useState, useEffect } from 'react';

// Simple network check using fetch
let cachedOnlineStatus = true;
let lastCheckTime = 0;
const CHECK_INTERVAL = 5000; // Check every 5 seconds

/**
 * Check if device is currently online
 * Uses a simple fetch test to Firebase (lightweight)
 * @returns {Promise<boolean>}
 */
export const isOnline = async () => {
  try {
    // Use cached result if checked recently
    const now = Date.now();
    if (now - lastCheckTime < CHECK_INTERVAL) {
      return cachedOnlineStatus;
    }

    // Try a lightweight fetch to check connectivity
    // Using a small Firebase endpoint or simple URL
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    try {
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-store',
      });
      cachedOnlineStatus = true;
      lastCheckTime = now;
      return true;
    } catch (error) {
      cachedOnlineStatus = false;
      lastCheckTime = now;
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // If fetch fails, assume offline
    cachedOnlineStatus = false;
    lastCheckTime = Date.now();
    return false;
  }
};

/**
 * React hook for network status
 * Checks network status periodically
 * @returns {{isConnected: boolean, isChecking: boolean}
 */
export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    isChecking: false,
  });

  useEffect(() => {
    let intervalId;
    let isMounted = true;

    const checkNetwork = async () => {
      if (!isMounted) return;
      
      setNetworkState(prev => ({ ...prev, isChecking: true }));
      const online = await isOnline();
      
      if (isMounted) {
        setNetworkState({
          isConnected: online,
          isChecking: false,
        });
      }
    };

    // Initial check
    checkNetwork();

    // Check periodically
    intervalId = setInterval(checkNetwork, CHECK_INTERVAL);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return networkState;
};

/**
 * Wait for network to come online
 * @param {number} timeout - Maximum time to wait in ms (default: 30000)
 * @returns {Promise<boolean>} - True if online, false if timeout
 */
export const waitForOnline = async (timeout = 30000) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkNetwork = async () => {
      const online = await isOnline();
      
      if (online) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }
      
      // Check again in 2 seconds
      setTimeout(checkNetwork, 2000);
    };
    
    checkNetwork();
  });
};

