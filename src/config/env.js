const env = Object.freeze({
  /** Base URL for API calls (empty string means same-origin / proxied) */
  API_URL: (import.meta.env.VITE_API_URL || '').replace(/\/+$/, ''),
});

export default env;

/** Default page size for paginated tables */
export const PAGE_SIZE = 10;
