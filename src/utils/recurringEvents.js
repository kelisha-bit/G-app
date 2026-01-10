/**
 * Utility functions for handling recurring events
 */

/**
 * Get day of week as number (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export const getDayOfWeek = (dayName) => {
  const days = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
  };
  return days[dayName] !== undefined ? days[dayName] : null;
};

/**
 * Get day name from number
 */
export const getDayName = (dayNumber) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber] || null;
};

/**
 * Generate recurring event instances from a recurring event template
 * @param {Object} recurringEvent - The recurring event template
 * @param {number} weeksAhead - Number of weeks to generate instances for (default: 12)
 * @returns {Array} Array of event instances
 */
export const generateRecurringInstances = (recurringEvent, weeksAhead = 12) => {
  if (!recurringEvent.isRecurring || !recurringEvent.recurrencePattern) {
    return [];
  }

  const { dayOfWeek, startDate, endDate, time } = recurringEvent.recurrencePattern;
  
  if (dayOfWeek === null || dayOfWeek === undefined) {
    return [];
  }

  const instances = [];
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate the first occurrence date
  const firstDate = new Date(start);
  const startDayOfWeek = firstDate.getDay();
  let daysToAdd = (dayOfWeek - startDayOfWeek + 7) % 7;
  if (daysToAdd === 0 && firstDate.getTime() < today.getTime()) {
    daysToAdd = 7; // If the first occurrence is in the past, move to next week
  }
  firstDate.setDate(firstDate.getDate() + daysToAdd);

  // Generate instances for the specified number of weeks
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + (weeksAhead * 7));

  let currentDate = new Date(firstDate);

  while (currentDate <= maxDate) {
    // Check if we've passed the end date
    if (end && currentDate > end) {
      break;
    }

    // Only include dates from today onwards
    if (currentDate >= today) {
      const instance = {
        ...recurringEvent,
        id: `${recurringEvent.id}_${currentDate.toISOString().split('T')[0]}`,
        date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
        time: time || recurringEvent.time,
        isRecurringInstance: true,
        recurringEventId: recurringEvent.id,
        originalDate: recurringEvent.date, // Keep original template date
      };
      instances.push(instance);
    }

    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return instances;
};

/**
 * Expand recurring events in an array of events
 * @param {Array} events - Array of events (may include recurring templates)
 * @param {number} weeksAhead - Number of weeks to generate instances for
 * @returns {Array} Array with recurring events expanded into instances
 */
export const expandRecurringEvents = (events, weeksAhead = 12) => {
  const expandedEvents = [];

  events.forEach((event) => {
    if (event.isRecurring && event.recurrencePattern) {
      // Generate instances for recurring events
      const instances = generateRecurringInstances(event, weeksAhead);
      expandedEvents.push(...instances);
    } else {
      // Add non-recurring events as-is
      expandedEvents.push(event);
    }
  });

  // Sort by date
  expandedEvents.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });

  return expandedEvents;
};

/**
 * Format recurring pattern for display
 * @param {Object} recurrencePattern - The recurrence pattern object
 * @returns {string} Formatted string like "Every Sunday" or "Every Wednesday"
 */
export const formatRecurrencePattern = (recurrencePattern) => {
  if (!recurrencePattern || recurrencePattern.dayOfWeek === null || recurrencePattern.dayOfWeek === undefined) {
    return '';
  }

  const dayName = getDayName(recurrencePattern.dayOfWeek);
  return `Every ${dayName}`;
};


