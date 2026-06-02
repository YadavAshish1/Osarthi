import { getApiBaseUrl } from '../config/api';

/** Resolve media URL for img/video tags. */
export function mediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = getApiBaseUrl();
  return base ? `${base}${url}` : url;
}
