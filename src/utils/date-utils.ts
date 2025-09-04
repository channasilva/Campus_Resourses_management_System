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
  // Parse the stored time as if it's already in local timezone
  const date = new Date(dateString);
  
  // If the date string ends with 'Z', treat it as UTC and convert to local
  if (dateString.endsWith('Z')) {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  // Otherwise, treat it as local time and format directly
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Formats a date string to a readable local date and time format
 * @param dateString - ISO date string from the database
 * @returns Formatted date and time string (e.g., "9/10/2025, 12:30 PM")
 */
export const formatLocalDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  
  // If the date string ends with 'Z', treat it as UTC and convert to local
  if (dateString.endsWith('Z')) {
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  
  // Otherwise, treat it as local time and format directly
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${month}/${day}/${year}, ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Creates a date object in local timezone from date and time strings
 * @param dateString - Date string (YYYY-MM-DD)
 * @param timeString - Time string (HH:MM)
 * @returns Date object in local timezone
 */
export const createLocalDateTime = (dateString: string, timeString: string): Date => {
  // Parse date and time components manually to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Create date in local timezone
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
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
  // Format the date components manually to avoid timezone issues
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  const seconds = String(localDate.getSeconds()).padStart(2, '0');
  
  // Return ISO string that preserves the local time
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
};
