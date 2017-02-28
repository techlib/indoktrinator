import i18n from 'i18next'
import LngDetector from 'i18next-browser-languagedetector'

const en = require('json!../lang/en.json')
const cs = require('json!../lang/cs.json')

i18n
  .use(LngDetector)
  .init({
    fallbackLng: (process.env.NODE_ENV === 'production') ? 'en' : false,
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

    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage', 'cookie']
    }

  })

export default i18n
