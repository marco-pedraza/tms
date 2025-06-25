import { useTranslations } from 'next-intl';
import messages from '@/i18n/locales/es-MX.json';

export type UseTranslationsResult = ReturnType<typeof useTranslations>;
export type Messages = typeof messages;
export type KnownServerErrors =
  keyof Messages['common']['validations']['server'];
