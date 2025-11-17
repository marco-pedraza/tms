import { createTranslator } from 'next-intl';
import { messages } from '@/i18n/locales/es-MX';

export type Messages = typeof messages;
export type NamespaceTranslationKey = keyof Messages;
export type KnownServerErrors = keyof Messages['validations']['server'];
export type KnownServerEntities = keyof Messages['validations']['entities'];
export type KnownServerFields = keyof Messages['validations']['fields'];
export type KnownBusStatuses = keyof Messages['buses']['status'];
export type KnownBusLicensePlateTypes =
  keyof Messages['buses']['licensePlateTypes'];
export type KnownBusEngineTypes = keyof Messages['busModels']['engineTypes'];
export type KnownAmenityCategories = keyof Messages['amenities']['categories'];
export type KnownAmenityTypes = keyof Messages['amenities']['amenityTypes'];

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
export type UseLabelsTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'labels'>
>;
export type UseNodesTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'nodes'>
>;
export type UseServiceTypesTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'serviceTypes'>
>;
export type UseTransportersTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'transporters'>
>;
export type UseAmenitiesTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'amenities'>
>;
export type UseBusModelsTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'busModels'>
>;
export type UseBusesTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'buses'>
>;
export type UseSeatDiagramsTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'seatDiagrams'>
>;
export type UseTimeOffsTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'timeOffs'>
>;
export type UseTechnologiesTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'technologies'>
>;
export type UseChromaticsTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'chromatics'>
>;
export type UsePathwaysTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'pathways'>
>;
export type UseRoutesTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'routes'>
>;
export type UseUsersTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'users'>
>;
export type UseRolesTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'roles'>
>;
export type UseDepartmentsTranslationsResult = ReturnType<
  typeof createTranslator<Messages, 'departments'>
>;
