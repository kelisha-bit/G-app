/**
 * Bible API Utility
 * 
 * Fetches Bible verses from the free Bible API (bible-api.com)
 * No API key required - completely free to use
 * 
 * Usage:
 *   import { fetchBibleVerse } from '../utils/bibleApi';
 *   const verse = await fetchBibleVerse('John 3:16');
 */

/**
 * Converts a verse reference to the format expected by the API
 * Examples:
 *   "John 3:16" -> "john+3:16"
 *   "Psalm 23:1-3" -> "psalm+23:1-3"
 *   "1 Corinthians 13:4" -> "1+corinthians+13:4"
 */
const formatVerseReference = (reference) => {
  return reference
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '+')
    .replace(/:/g, ':');
};

/**
 * Fetches a Bible verse from the API
 * @param {string} reference - Bible verse reference (e.g., "John 3:16", "Psalm 23:1")
 * @returns {Promise<{text: string, reference: string, error: string|null}>}
 */
export const fetchBibleVerse = async (reference) => {
  try {
    if (!reference || !reference.trim()) {
      return {
        text: '',
        reference: reference || '',
        error: 'Please provide a verse reference',
      };
    }

    const formattedRef = formatVerseReference(reference);
    const url = `https://bible-api.com/${formattedRef}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      return {
        text: '',
        reference: reference,
        error: data.error || 'Verse not found',
      };
    }

    // The API returns text as a string, reference, and verses array
    return {
      text: data.text || '',
      reference: data.reference || reference,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching Bible verse:', error);
    return {
      text: '',
      reference: reference,
      error: error.message || 'Failed to fetch verse. Please check your internet connection.',
    };
  }
};

/**
 * Fetches multiple verses (for verse ranges)
 * @param {string} reference - Bible verse reference with range (e.g., "John 3:16-17")
 * @returns {Promise<{text: string, reference: string, error: string|null}>}
 */
export const fetchBibleVerseRange = async (reference) => {
  return fetchBibleVerse(reference); // Same function handles ranges
};

/**
 * Validates if a verse reference format looks correct
 * @param {string} reference - Bible verse reference
 * @returns {boolean}
 */
export const isValidVerseReference = (reference) => {
  if (!reference || !reference.trim()) return false;
  
  // Basic pattern: Book name followed by chapter:verse(s)
  const pattern = /^[a-z0-9\s]+?\s+\d+:\d+(-?\d*)$/i;
  return pattern.test(reference.trim());
};


