import { Timezone } from './timezones.types';

/**
 * List of available timezones in the system
 * Used as a static data source since this data is unlikely to change frequently
 * Ordered alphabetically by timezone ID for better user experience
 */
export const AVAILABLE_TIMEZONES: Timezone[] = [
  {
    id: 'America/Bogota',
  },
  {
    id: 'America/Buenos_Aires',
  },
  {
    id: 'America/Cancun',
  },
  {
    id: 'America/Chihuahua',
  },
  {
    id: 'America/Hermosillo',
  },
  {
    id: 'America/Lima',
  },
  {
    id: 'America/Mexico_City',
  },
  {
    id: 'America/Santiago',
  },
  {
    id: 'America/Sao_Paulo',
  },
  {
    id: 'America/Tijuana',
  },
];
