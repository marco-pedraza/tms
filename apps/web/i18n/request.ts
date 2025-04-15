import { getRequestConfig } from 'next-intl/server';
import messages from './locales/es-MX.json';

export default getRequestConfig(() => {
  // Set static locale to es-MX
  const locale = 'es-MX';

  return {
    locale,
    messages,
  };
});
