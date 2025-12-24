import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: {
        // In tests, stub vue-i18n to avoid installing the real dependency
        'vue-i18n': fileURLToPath(new URL('./src/test/i18n-mock.ts', import.meta.url)),
        // In tests, stub vue-router
        'vue-router': fileURLToPath(new URL('./src/test/router-mock.ts', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
