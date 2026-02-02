/**
 * Image Utility Functions
 * 
 * Provides fallback images and image handling utilities
 */

/**
 * Returns a default gradient image data URI for use as a fallback
 * This creates a simple purple gradient image that matches the app theme
 */
export const getDefaultImageUri = () => {
  // Return null to let components handle fallback with gradients/icons
  // This is better than using external placeholder services
  return null;
};

/**
 * Checks if an image URL is valid
 * @param {string} url - Image URL to validate
 * @returns {boolean} - True if URL is valid, false otherwise
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  // Check if it's a placeholder URL (should be replaced)
  if (url.includes('via.placeholder.com') || url.includes('placeholder')) {
    return false;
  }
  
  // Basic URL validation
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Gets a safe image URI, returning null if invalid
 * @param {string} url - Image URL
 * @returns {string|null} - Valid URL or null
 */
export const getSafeImageUri = (url) => {
  if (isValidImageUrl(url)) {
    return url;
  }
  return null;
};

