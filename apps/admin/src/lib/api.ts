/**
 * Build a URL for the Nest API (`/api/v1/...`).
 * When `NEXT_PUBLIC_API_URL` is unset, the admin app uses same-origin requests
 * and `next.config.js` rewrites proxy to the API (see web app pattern).
 */
export function apiV1(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env != null && env !== '') {
    return `${env.replace(/\/$/, '')}/api/v1${p}`;
  }
  return `/api/v1${p}`;
}
