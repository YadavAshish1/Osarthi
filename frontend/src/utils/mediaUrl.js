/**
 * Resolve media URL for img/video tags.
 * - Full https URLs (Jio Cloud) → use as-is
 * - /uploads/... → local dev via Vite proxy
 */
export function mediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url;
}
