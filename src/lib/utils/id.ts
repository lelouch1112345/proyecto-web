/**
 * Generate a unique ID string for database records.
 * Combines timestamp with random characters for uniqueness.
 */
export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the current ISO datetime string.
 */
export function now(): string {
  return new Date().toISOString();
}
