/**
 * Utility functions for handling dates and timezones consistently
 */

/**
 * Converts a date string to a local date string (YYYY-MM-DD) to avoid timezone shifts
 * @param dateString - ISO date string from the database
 * @returns Local date string in YYYY-MM-DD format
 */
export const toLocalDateString = (dateString: string): string => {
  const date = new Date(dateString);
  // Convert to local date by adjusting for timezone offset
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return localDate.toISOString().split('T')[0];
};

/**
 * Formats a date string to a readable local time format
 * @param dateString - ISO date string from the database
 * @returns Formatted time string (e.g., "12:30 PM")
 */
export const formatLocalTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

/**
 * Formats a date string to a readable local date and time format
 * @param dateString - ISO date string from the database
 * @returns Formatted date and time string (e.g., "9/10/2025, 12:30 PM")
 */
export const formatLocalDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Creates a date object in local timezone from date and time strings
 * @param dateString - Date string (YYYY-MM-DD)
 * @param timeString - Time string (HH:MM)
 * @returns Date object in local timezone
 */
export const createLocalDateTime = (dateString: string, timeString: string): Date => {
  // Create date in local timezone to avoid timezone shifts
  const date = new Date(`${dateString}T${timeString}:00`);
  
  // Ensure the date is valid
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date or time format');
  }
  
  return date;
};

/**
 * Converts a local date to ISO string while preserving the local time
 * @param localDate - Date object in local timezone
 * @returns ISO string that preserves the local time
 */
export const toLocalISOString = (localDate: Date): string => {
  // Get the timezone offset in minutes
  const offset = localDate.getTimezoneOffset();
  
  // Create a new date that represents the same local time in UTC
  const utcDate = new Date(localDate.getTime() + (offset * 60000));
  
  return utcDate.toISOString();
};
