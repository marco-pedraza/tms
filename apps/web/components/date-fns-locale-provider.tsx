'use client';

import { setDefaultOptions } from 'date-fns';
import { es } from 'date-fns/locale';

setDefaultOptions({
  locale: es,
});

/**
 * Sets the locale for date-fns formatting and parsing functions.
 * Supported locales:
 * - es
 */
export default function DateFnsLocaleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
