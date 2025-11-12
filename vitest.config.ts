import path from 'node:path'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      await defineVitestProject({
        resolve: {
          alias: {
            '~': path.resolve(__dirname),
            '@': path.resolve(__dirname),
          },
        },

        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
})
