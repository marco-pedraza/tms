import { useTranslations } from 'next-intl';
import messages from '@/i18n/locales/es-MX.json';

export type UseTranslationsResult = ReturnType<typeof useTranslations>;
export type Messages = typeof messages;
export type KnownServerErrors =
  keyof Messages['common']['validations']['server'];
export type KnownEntities = keyof Messages['common']['entities'];
export type KnownFields = keyof Messages['common']['fields'];
