/**
 * Security Utilities for Medhashine Backend
 * - Regex escaping (prevents NoSQL injection)
 * - HTML/script tag stripping (prevents stored XSS)
 * - CSS color validation (prevents style injection)
 */

/**
 * Escape all regex special characters in a string to prevent
 * NoSQL injection via MongoDB $regex queries.
 * 
 * Example: "test.*|admin" → "test\\.\\*\\|admin"
 */
export function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strip HTML tags and script content from a string.
 * Preserves plain text content while removing any potential XSS vectors.
 * Also strips null bytes and other control characters.
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    // Remove null bytes and control characters (except newline, tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove <script>...</script> blocks entirely (including content)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handler attributes (onerror, onclick, onload, etc.)
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    // Remove javascript: protocol in any attribute
    .replace(/javascript\s*:/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities that might bypass filters
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&')
    // Re-strip any tags that emerged from entity decoding
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Validate and sanitize a CSS color value.
 * Only allows: hex (#fff, #ffffff), rgb(), rgba(), hsl(), hsla(), and named CSS colors.
 * Returns the color if valid, or null if it contains injection attempts.
 */
const NAMED_COLORS = new Set([
  'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
  'pink', 'gray', 'grey', 'brown', 'cyan', 'magenta', 'lime', 'navy',
  'teal', 'maroon', 'olive', 'aqua', 'fuchsia', 'silver', 'transparent',
  'inherit', 'initial', 'currentcolor',
  // Extended named colors
  'aliceblue', 'antiquewhite', 'aquamarine', 'azure', 'beige', 'bisque',
  'blanchedalmond', 'blueviolet', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'darkblue',
  'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey',
  'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid',
  'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray',
  'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue',
  'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite',
  'forestgreen', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
  'greenyellow', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory',
  'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon',
  'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray',
  'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen',
  'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue',
  'lightyellow', 'limegreen', 'linen', 'mediumaquamarine', 'mediumblue',
  'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue',
  'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue',
  'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'oldlace',
  'olivedrab', 'orangered', 'orchid', 'palegoldenrod', 'palegreen',
  'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru',
  'plum', 'powderblue', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon',
  'sandybrown', 'seagreen', 'seashell', 'sienna', 'skyblue', 'slateblue',
  'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan',
  'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'whitesmoke',
  'yellowgreen',
]);

// Pattern matches: #fff, #ffffff, #ffffffff (with alpha), rgb(), rgba(), hsl(), hsla()
const COLOR_PATTERN = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\)|hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*(,\s*[\d.]+\s*)?\))$/;

export function sanitizeColor(colorStr) {
  if (typeof colorStr !== 'string' || !colorStr.trim()) return null;
  const trimmed = colorStr.trim().toLowerCase();
  
  // Check named colors
  if (NAMED_COLORS.has(trimmed)) return trimmed;
  
  // Check pattern (hex, rgb, hsl)
  if (COLOR_PATTERN.test(trimmed)) return trimmed;
  
  // Invalid / potentially malicious color value
  return null;
}

/**
 * Sanitize an array of content blocks (used in blog creation/update).
 * Strips XSS vectors from text, validates types, and sanitizes colors in marks.
 */
const ALLOWED_BLOCK_TYPES = new Set([
  'heading', 'paragraph', 'quote', 'list', 'image', 'video', 'divider', 'part',
]);

export function sanitizeBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  
  return blocks.map(block => {
    const sanitized = { ...block };
    
    // Validate block type
    if (!ALLOWED_BLOCK_TYPES.has(sanitized.type)) {
      sanitized.type = 'paragraph';
    }
    
    // Sanitize text content (strip HTML/scripts but preserve newlines)
    if (sanitized.text && typeof sanitized.text === 'string') {
      sanitized.text = sanitized.text
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
        .replace(/javascript\s*:/gi, '')
        .replace(/<[^>]*>/g, '');
    }
    
    // Sanitize list items
    if (Array.isArray(sanitized.items)) {
      sanitized.items = sanitized.items.map(item =>
        typeof item === 'string' ? sanitizeString(item) : ''
      );
    }
    
    // Sanitize caption
    if (sanitized.caption && typeof sanitized.caption === 'string') {
      sanitized.caption = sanitizeString(sanitized.caption);
    }
    
    // Validate URL for image/video blocks
    if ((sanitized.type === 'image' || sanitized.type === 'video') && sanitized.url) {
      const url = String(sanitized.url).trim();
      // Only allow http(s) or relative paths (no javascript:, data:, etc.)
      if (url.match(/^(https?:\/\/|\/uploads\/)/i)) {
        sanitized.url = url;
      } else if (!url.includes(':')) {
        // Relative path with no protocol — allow it
        sanitized.url = url;
      } else {
        sanitized.url = '';
      }
    }
    
    // Sanitize marks (color values)
    if (Array.isArray(sanitized.marks)) {
      sanitized.marks = sanitized.marks.map(mark => {
        const cleanMark = { ...mark };
        if (cleanMark.color) {
          cleanMark.color = sanitizeColor(cleanMark.color) || undefined;
          if (!cleanMark.color) delete cleanMark.color;
        }
        if (cleanMark.backgroundColor) {
          cleanMark.backgroundColor = sanitizeColor(cleanMark.backgroundColor) || undefined;
          if (!cleanMark.backgroundColor) delete cleanMark.backgroundColor;
        }
        return cleanMark;
      });
    }
    
    return sanitized;
  });
}
