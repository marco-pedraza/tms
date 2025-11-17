import { getRequestConfig } from 'next-intl/server';
import { loadMessages } from './locales/es-MX';

export default getRequestConfig(async () => {
  // Set static locale to es-MX
  const locale = 'es-MX';

  const messages = await loadMessages();

  return {
    locale,
    messages,
  };
});
