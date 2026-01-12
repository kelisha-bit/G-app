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
 * Helper function to delay execution
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches a Bible verse from the API with retry logic for rate limiting
 * @param {string} reference - Bible verse reference (e.g., "John 3:16", "Psalm 23:1")
 * @param {number} retries - Number of retry attempts (default: 2)
 * @returns {Promise<{text: string, reference: string, error: string|null}>}
 */
export const fetchBibleVerse = async (reference, retries = 2) => {
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

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url);

        if (response.status === 429) {
          // Rate limited - wait and retry
          if (attempt < retries) {
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.log(`Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`);
            await delay(waitTime);
            continue;
          } else {
            return {
              text: '',
              reference: reference,
              error: 'Too many requests. Please wait a moment and try again.',
            };
          }
        }

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
          verses: data.verses || null, // Include verses array for chapter views
          error: null,
        };
      } catch (fetchError) {
        if (fetchError.message.includes('429') && attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await delay(waitTime);
          continue;
        }
        throw fetchError;
      }
    }
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
 * Fetches an entire chapter
 * @param {string} bookName - Book name (e.g., "John")
 * @param {number} chapter - Chapter number (e.g., 3)
 * @returns {Promise<{text: string, reference: string, verses: array, error: string|null}>}
 */
export const fetchBibleChapter = async (bookName, chapter) => {
  try {
    const formattedBook = formatVerseReference(bookName);
    const url = `https://bible-api.com/${formattedBook}+${chapter}`;
    
    const response = await fetch(url);
    
    if (response.status === 429) {
      return {
        text: '',
        reference: `${bookName} ${chapter}`,
        verses: null,
        error: 'Too many requests. Please wait a moment and try again.',
      };
    }
    
    if (!response.ok) {
      // If that fails, try a range (e.g., "John 3:1-50")
      const rangeRef = `${bookName} ${chapter}:1-50`;
      return await fetchBibleVerse(rangeRef);
    }
    
    const data = await response.json();
    
    if (data.error) {
      return {
        text: '',
        reference: `${bookName} ${chapter}`,
        verses: null,
        error: data.error || 'Chapter not found',
      };
    }
    
    return {
      text: data.text || '',
      reference: data.reference || `${bookName} ${chapter}`,
      verses: data.verses || null, // Include verses array with verse numbers
      error: null,
    };
  } catch (error) {
    console.error('Error fetching Bible chapter:', error);
    return {
      text: '',
      reference: `${bookName} ${chapter}`,
      verses: null,
      error: error.message || 'Failed to fetch chapter. Please check your internet connection.',
    };
  }
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


