import { createI18n } from 'vue-i18n'
import en from './en'
import es from './es'
import ptBR from './pt-BR'

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    'pt-BR': ptBR,
    en,
    es,
  },
})

export type MessageSchema = typeof ptBR
