import { Timezone } from './timezones.types';

/**
 * List of available timezones in the system
 * Used as a static data source since this data is unlikely to change frequently
 */
export const AVAILABLE_TIMEZONES: Timezone[] = [
  {
    id: 'America/Mexico_City',
  },
  {
    id: 'America/Tijuana',
  },
  {
    id: 'America/Hermosillo',
  },
  {
    id: 'America/Chihuahua',
  },
  {
    id: 'America/Cancun',
  },
  {
    id: 'America/Bogota',
  },
  {
    id: 'America/Lima',
  },
  {
    id: 'America/Santiago',
  },
  {
    id: 'America/Buenos_Aires',
  },
  {
    id: 'America/Sao_Paulo',
  },
];
