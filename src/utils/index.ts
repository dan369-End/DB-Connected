/**
 * Shared Utilities
 * DB-Connect — "Votre passerelle vers le numérique."
 */

/**
 * Format system date/time in standard French locale
 */
export function formatSystemDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Safely inspect environment configuration flags
 */
export function getEnvironmentInfo() {
  return {
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    mode: import.meta.env.MODE,
  };
}
