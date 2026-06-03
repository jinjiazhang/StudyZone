import Constants from 'expo-constants';

/**
 * Base URL where static assets (e.g. textbook covers under `/assets/cover/...`)
 * are hosted. Mobile cannot resolve root-relative URLs the way a browser can,
 * so any path starting with `/` must be prefixed with an absolute origin.
 *
 * In production this should point at the web app / CDN that serves the
 * `public/assets/...` files. In dev, prefer an explicit env override, then a
 * web origin inferred from the dev API URL, then the Expo dev host, then the
 * local web app.
 */
const envAssetBaseUrl = process.env.EXPO_PUBLIC_ASSET_BASE_URL;
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
const appAssetBaseUrl = Constants.expoConfig?.extra?.assetBaseUrl as string | undefined;
const appApiUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
const devAssetBaseUrl =
  normalizeDevAssetBaseUrl(envAssetBaseUrl) ??
  inferWebAssetBaseUrl(envApiUrl) ??
  inferExpoWebAssetBaseUrl() ??
  'http://localhost:3000';
const assetBaseUrl = __DEV__
  ? devAssetBaseUrl
  : envAssetBaseUrl ??
    appAssetBaseUrl ??
    inferWebAssetBaseUrl(envApiUrl ?? appApiUrl) ??
    'http://localhost:3000';

const trimTrailingSlash = (s: string) => s.replace(/\/+$/, '');

function normalizeDevAssetBaseUrl(assetBaseUrl: string | undefined): string | undefined {
  if (!assetBaseUrl) return undefined;
  try {
    const url = new URL(assetBaseUrl);
    if (url.port === '4000') url.port = '3000';
    return url.origin;
  } catch {
    return assetBaseUrl;
  }
}

function inferWebAssetBaseUrl(apiUrl: string | undefined): string | undefined {
  if (!apiUrl) return undefined;
  try {
    const url = new URL(apiUrl);
    if (url.port === '4000') url.port = '3000';
    return url.origin;
  } catch {
    return undefined;
  }
}

function inferExpoWebAssetBaseUrl(): string | undefined {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost;
  if (!hostUri) return undefined;
  const host = hostUri.replace(/^\w+:\/\//, '').split('/')[0]?.split(':')[0];
  return host ? `http://${host}:3000` : undefined;
}

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
