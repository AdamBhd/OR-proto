/**
 * Development environment — used by `ng serve`.
 * Points at the Express API on port 3000 (CORS-allowed via CLIENT_ORIGIN).
 */
export const environment = {
  production: false,
  apiBase: 'http://localhost:3000/api',
} as const;
