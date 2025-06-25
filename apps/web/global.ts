import { Messages } from '@/types/translations';

type AvailableLocales = 'es-MX';

declare module 'next-intl' {
  interface AppConfig {
    Locale: AvailableLocales;
    Messages: Messages;
  }
}
