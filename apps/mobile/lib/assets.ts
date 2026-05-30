import Constants from 'expo-constants';

/**
 * Base URL where static assets (e.g. textbook covers under `/assets/cover/...`)
 * are hosted. Mobile cannot resolve root-relative URLs the way a browser can,
 * so any path starting with `/` must be prefixed with an absolute origin.
 *
 * In production this should point at the web app / CDN that serves the
 * `public/assets/...` files. In dev it defaults to the local web app.
 */
const assetBaseUrl =
  process.env.EXPO_PUBLIC_ASSET_BASE_URL ??
  (Constants.expoConfig?.extra?.assetBaseUrl as string | undefined) ??
  'http://localhost:3000';

const trimTrailingSlash = (s: string) => s.replace(/\/+$/, '');

/**
 * Resolve a possibly-relative asset URL to an absolute URL that React
 * Native's `<Image>` can fetch.
 *
 * - Absolute URLs (`http://`, `https://`, `data:`, `file:`) pass through.
 * - Root-relative paths (`/assets/...`) are prefixed with `assetBaseUrl`.
 * - Empty / nullish input returns `undefined` so the caller can skip rendering.
 */
export function resolveAssetUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url) || /^(?:data|file):/i.test(url)) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${trimTrailingSlash(assetBaseUrl)}${url}`;
  }
  return url;
}
