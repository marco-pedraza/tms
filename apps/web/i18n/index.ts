import { createTranslator } from 'next-intl';
import messagesData from './locales/es-MX.json';

// Set locale type
type Locale = 'es-MX';
// Explicitly type the messages object to match what's expected by next-intl
const messages = messagesData as Record<string, Record<string, unknown>>;

// Helper function to get translator for client components
export function getTranslator(namespace = 'common') {
  const locale: Locale = 'es-MX';

  return createTranslator({ locale, messages, namespace });
}

// Re-export useful next-intl hooks and functions
export { useTranslations } from 'next-intl';
export { getTranslations } from 'next-intl/server';
