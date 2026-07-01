/**
 * Date Utilities
 *
 * Utility functions for date formatting and manipulation
 */

/**
 * Format date to YYYY-MM-DD string
 * @param date - Date object, ISO string, or timestamp
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDate(date: Date | string | number): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date to YYYY-MM-DD HH:mm:ss string
 * @param date - Date object, ISO string, or timestamp
 * @returns Formatted datetime string in YYYY-MM-DD HH:mm:ss format
 */
export function formatDateTime(date: Date | string | number): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const datePart = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${datePart} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format time duration in seconds to HH:mm:ss string
 * @param seconds - Time duration in seconds
 * @returns Formatted time string in HH:mm:ss format
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Get relative time string (e.g., "3 days ago")
 * @param date - Date object, ISO string, or timestamp
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string | number): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return formatDate(d);
}
