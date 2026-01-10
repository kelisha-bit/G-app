/**
 * Weather API Utility
 * 
 * Fetches weather data from OpenWeatherMap API
 * 
 * Setup Required:
 * 1. Sign up for free API key at https://openweathermap.org/api
 * 2. Free tier: 1,000 calls/day, 60 calls/minute
 * 3. Add your API key to the config below or use environment variable
 * 
 * Usage:
 *   import { fetchWeatherForecast } from '../utils/weatherApi';
 *   const weather = await fetchWeatherForecast('Accra', '2025-01-15');
 */

// Weather API key loaded from environment variable
// Set EXPO_PUBLIC_WEATHER_API_KEY in your .env file
// Get a free key at: https://openweathermap.org/api
// Free tier: 1,000 calls/day, 60 calls/minute
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || null;

// If API key is not set, the functions will return a helpful error message
const isApiKeySet = () => {
  return WEATHER_API_KEY && WEATHER_API_KEY.trim() !== '';
};

/**
 * Fetches current weather for a location
 * @param {string} city - City name (e.g., "Accra", "Kumasi")
 * @param {string} countryCode - Optional country code (e.g., "GH" for Ghana)
 * @returns {Promise<{temp: number, description: string, icon: string, error: string|null}>}
 */
export const fetchCurrentWeather = async (city, countryCode = 'GH') => {
  if (!isApiKeySet()) {
    return {
      temp: null,
      description: '',
      icon: '',
      error: 'Weather API key not configured. Please set EXPO_PUBLIC_WEATHER_API_KEY in your .env file. See .env.example for reference.',
    };
  }

  try {
    const location = countryCode ? `${city},${countryCode}` : city;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
      } else if (response.status === 404) {
        throw new Error(`Location "${city}" not found.`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind?.speed || 0,
      error: null,
    };
  } catch (error) {
    // Only log unexpected errors (not API key issues, which are expected if not configured)
    if (!error.message.includes('Invalid API key') && !error.message.includes('API key not configured')) {
      console.error('Error fetching weather:', error);
    }
    return {
      temp: null,
      description: '',
      icon: '',
      error: error.message || 'Failed to fetch weather data',
    };
  }
};

/**
 * Fetches weather forecast for a specific date
 * Note: Free tier only provides 5-day forecast, so we'll get the closest match
 * @param {string} city - City name
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} countryCode - Optional country code
 * @returns {Promise<{temp: number, description: string, icon: string, date: string, error: string|null}>}
 */
export const fetchWeatherForecast = async (city, dateString, countryCode = 'GH') => {
  if (!isApiKeySet()) {
    return {
      temp: null,
      description: '',
      icon: '',
      date: dateString,
      error: 'Weather API key not configured. Please set EXPO_PUBLIC_WEATHER_API_KEY in your .env file. See .env.example for reference.',
    };
  }

  try {
    const location = countryCode ? `${city},${countryCode}` : city;
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
      } else if (response.status === 404) {
        throw new Error(`Location "${city}" not found.`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);

    // Find the forecast closest to the target date (within 5 days)
    let closestForecast = null;
    let minDiff = Infinity;

    data.list.forEach((forecast) => {
      const forecastDate = new Date(forecast.dt * 1000);
      forecastDate.setHours(0, 0, 0, 0);
      
      const diff = Math.abs(forecastDate - targetDate);
      
      // Only consider forecasts within 5 days
      if (diff <= 5 * 24 * 60 * 60 * 1000 && diff < minDiff) {
        minDiff = diff;
        closestForecast = forecast;
      }
    });

    if (!closestForecast) {
      // If no forecast found, try to get current weather as fallback
      return await fetchCurrentWeather(city, countryCode);
    }

    return {
      temp: Math.round(closestForecast.main.temp),
      description: closestForecast.weather[0].description,
      icon: closestForecast.weather[0].icon,
      humidity: closestForecast.main.humidity,
      windSpeed: closestForecast.wind?.speed || 0,
      date: dateString,
      error: null,
    };
  } catch (error) {
    // Only log unexpected errors (not API key issues, which are expected if not configured)
    if (!error.message.includes('Invalid API key') && !error.message.includes('API key not configured')) {
      console.error('Error fetching weather forecast:', error);
    }
    return {
      temp: null,
      description: '',
      icon: '',
      date: dateString,
      error: error.message || 'Failed to fetch weather forecast',
    };
  }
};

/**
 * Gets weather icon URL from OpenWeatherMap
 * @param {string} iconCode - Icon code from API (e.g., "01d", "02n")
 * @returns {string} - URL to weather icon
 */
export const getWeatherIconUrl = (iconCode) => {
  if (!iconCode) return '';
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

/**
 * Extracts city name from a location string
 * Useful for parsing event locations like "Main Sanctuary, Accra"
 * @param {string} location - Full location string
 * @returns {string} - Extracted city name or original string
 */
export const extractCityFromLocation = (location) => {
  if (!location) return '';
  
  // Common patterns: "Location, City" or "City, Country"
  const parts = location.split(',').map(p => p.trim());
  
  // If multiple parts, try to find a city name
  // For Ghana, common cities: Accra, Kumasi, Tamale, Cape Coast, etc.
  const ghanaCities = ['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Takoradi', 'Sunyani', 'Ho', 'Koforidua'];
  
  for (const part of parts) {
    if (ghanaCities.some(city => part.includes(city) || city.includes(part))) {
      return part;
    }
  }
  
  // If no city found, return the last part (often the city)
  return parts[parts.length - 1] || location;
};

