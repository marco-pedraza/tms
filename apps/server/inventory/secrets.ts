import { secret } from 'encore.dev/config';

/**
 * Define the Sentry DSN secret at global scope within the service file
 * This is required by Encore, as secrets must be defined within services
 */
const SENTRY_DSN = secret('SENTRY_DSN');

/**
 * Returns the Sentry DSN secret value
 * This allows us to access the secret from shared modules
 */
export function getSentryDSN(): string | undefined {
  try {
    return SENTRY_DSN();
  } catch {
    console.error('Error accessing Sentry DSN secret');
    return undefined;
  }
}
