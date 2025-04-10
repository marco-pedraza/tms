import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importamos las traducciones
import common from './locales/es-MX/common';
import countries from './locales/es-MX/countries';
import states from './locales/es-MX/states';

const resources = {
  'es-MX': {
    common,
    countries,
    states,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'es-MX',
  fallbackLng: 'es-MX',
  ns: ['common', 'countries', 'states'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
