const env = Object.freeze({
  /** Base URL for API calls (empty string means same-origin / proxied) */
  API_URL: (import.meta.env.VITE_API_URL || '').replace(/\/+$/, ''),
  /** Backend proxy target (informational, used by vite.config.js) */
  PROXY_TARGET: import.meta.env.VITE_PROXY_TARGET || '',
  /** Dev server port */
  PORT: import.meta.env.VITE_PORT || '3020',
  /** Health check path for /api/ping */
  HEALTH_PATH: import.meta.env.VITE_HEALTH_PATH || '/api/v1/actuator/health',
});

export default env;

/** Default page size for paginated tables */
export const PAGE_SIZE = 10;
