/**
 * Validates a callback URL to prevent open redirect attacks
 *
 * This utility ensures that redirect URLs are safe by only allowing
 * relative paths starting with "/" (but not protocol-relative "//" URLs).
 * Absolute URLs are not supported for security reasons.
 *
 * @param callbackUrl - The callback URL to validate (may be null)
 * @returns A safe relative URL string, defaults to '/'
 */
export function validateCallbackUrl(callbackUrl: string | null): string {
  // Default to root if no callback URL provided
  if (!callbackUrl) {
    return '/';
  }

  try {
    const decodedUrl = decodeURIComponent(callbackUrl);

    // Only allow relative paths (starting with "/") but block protocol-relative URLs
    if (decodedUrl.startsWith('/') && !decodedUrl.startsWith('//')) {
      return decodedUrl;
    }

    // All other URLs (absolute, protocol-relative, etc.) - fall back to root
    return '/';
  } catch {
    // Invalid URL format - fall back to root
    return '/';
  }
}
