import { createTranslator } from 'next-intl';
import messages from '@/i18n/locales/es-MX.json';

export type Messages = typeof messages;

export type KnownServerErrors = keyof Messages['validations']['server'];
export type KnownServerEntities = keyof Messages['validations']['entities'];
export type KnownServerFields = keyof Messages['validations']['fields'];

export type UseCommonTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'common'>
>;
export type UseValidationsTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'validations'>
>;
export type UseBusLinesTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'busLines'>
>;
export type UseCitiesTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'cities'>
>;
export type UseDriversTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'drivers'>
>;
export type UseEventsTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'eventTypes'>
>;
export type UseInstallationTypesTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'installationTypes'>
>;
export type UseNodesTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'nodes'>
>;
export type UseServiceTypesTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'serviceTypes'>
>;
export type UseTerminalsTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'terminals'>
>;
export type UseTransportersTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'transporters'>
>;
