import en from '../i18n/en'

function get(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc: any, k: string) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj)
}

export function useI18n() {
  return {
    t: (key: string) => get(en, key) ?? key,
  }
}

export function createI18n() {
  return {
    install() {
      /* noop */
    },
  }
}
