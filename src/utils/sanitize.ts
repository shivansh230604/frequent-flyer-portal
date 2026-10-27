import DOMPurify from 'dompurify';

/**
 * Sanitizes user input before storing into state or persistence layer.
 * Strips dangerous HTML tags, attributes, and script execution vectors.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    }).trim();
  }
  return input.trim();
}
