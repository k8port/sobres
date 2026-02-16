// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
// Avoid requiring Vite types in environments where 'vite' isn't installed.
// Use a local fallback type for PluginOption to prevent TS errors.
type PluginOption = any;

const root = resolve(dirname(fileURLToPath(import.meta.url)))
const plugins: PluginOption[] = [react(), tsconfigPaths()]
const resolveAllAliases = {
    alias: {
        '@': root,
        '@/app': resolve(root, 'app'),
    },
} 

const commonExclude = [
    '**/node_modules/**',
    '**/dist/**',
    '**/cypress/**',
    '**/.{idea,git,cache,output,temp}/**',
    '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
]

export default defineConfig({
    plugins,
    resolve: resolveAllAliases,
    test: {
    projects: [
      {
        plugins,
        resolve: resolveAllAliases,
        test: {
          name: 'unit',
          environment: 'jsdom',
          environmentOptions: { jsdom: { url: 'http://localhost' } },
          setupFiles: ['./__tests__/setup.ts', './vitest.setup.ts'],
          include: [
            '__tests__/unit/**/*.spec.{ts,tsx}',
            'app/__tests__/unit/**/*.spec.{ts,tsx}',
          ],
          exclude: commonExclude,
          globals: true,
        },
      },

      {
        plugins,
        resolve: resolveAllAliases,
        test: {
          name: 'integration',
          environment: 'jsdom',
          environmentOptions: { jsdom: { url: 'http://localhost' } },
          // 👇 add integration-only setup file here
          setupFiles: [
            './__tests__/setup.ts',
            './vitest.setup.ts',
            './__tests__/integration/setup.integration.ts',
          ],
          include: [
            '__tests__/integration/**/*.spec.{ts,tsx}',
            'app/__tests__/integration/**/*.spec.{ts,tsx}',
          ],
          exclude: commonExclude,
          globals: true,
        },
      },

      {
        plugins,
        resolve: resolveAllAliases,
        test: {
          name: 'e2e',
          environment: 'jsdom',
          environmentOptions: { jsdom: { url: 'http://localhost' } },
          setupFiles: ['./vitest.setup.ts'],
          include: [
            '__tests__/e2e/**/*.spec.{ts,tsx}',
            'app/__tests__/e2e/**/*.spec.{ts,tsx}',
          ],
          exclude: [...commonExclude, '__tests__/e2e/**'],
          globals: true,
        },
      },
    ],
  },
})