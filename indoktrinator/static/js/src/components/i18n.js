import i18n from 'i18next';

import {en} from '../lang/en'
import {cs} from '../lang/cs'

i18n
  .init({
    fallbackLng: (process.env.NODE_ENV === 'production') ? 'en' : false,
    lng: 'en',
    ns: ['common'],
    defaultNS: 'common',

    debug: process.env.NODE_ENV !== 'production',

    interpolation: {
      escapeValue: false
    },

    resources: {
      en: en,
      cs: cs,
    },

  });

export default i18n;
