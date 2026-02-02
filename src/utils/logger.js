/**
 * Logger Utility
 * 
 * Provides conditional logging that only outputs in development mode.
 * This prevents console statements from appearing in production builds
 * and improves performance.
 */

/**
 * Logs a message only in development mode
 * @param {...any} args - Arguments to log
 */
export const log = (...args) => {
  if (__DEV__) {
    console.log(...args);
  }
};

/**
 * Logs an error only in development mode
 * In production, errors should be sent to error reporting service
 * @param {...any} args - Arguments to log
 */
export const logError = (...args) => {
  if (__DEV__) {
    console.error(...args);
  } else {
    // In production, still log to console for web debugging
    // TODO: In production, send to error reporting service (Sentry, Firebase Crashlytics, etc.)
    if (typeof window !== 'undefined' && window.console) {
      console.error('[Production Error]', ...args);
    }
  }
};

/**
 * Logs a warning only in development mode
 * @param {...any} args - Arguments to log
 */
export const logWarn = (...args) => {
  if (__DEV__) {
    console.warn(...args);
  }
};

/**
 * Logs info only in development mode
 * @param {...any} args - Arguments to log
 */
export const logInfo = (...args) => {
  if (__DEV__) {
    console.info(...args);
  }
};

/**
 * Logs debug info only in development mode
 * @param {...any} args - Arguments to log
 */
export const logDebug = (...args) => {
  if (__DEV__) {
    console.debug(...args);
  }
};

