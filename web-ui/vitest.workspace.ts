// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)));

const baseConfig = {
    plugins: [react(), tsconfigPaths()],
    resolve: {
        alias: {
            '@': root,
            '@/app': resolve(root, 'app'),
        },
    },
} as const;

export default defineWorkspace([
    {
        ...baseConfig,
        test: {
            name: 'unit',
            environment: 'jsdom',
            environmentOptions: {
                jsdom: {
                    url: 'http://localhost',
                },
            },
            setupFiles: ['./__tests__/setup.ts', './vitest.setup.ts'],
            include: [
                '__tests__/unit/**/*.spec.{ts,tsx}',
                'app/__tests__/unit/**/*.spec.{ts,tsx}',
            ],
            exclude: [
                '**/node_modules/**',
                '**/dist/**',
                '**/cypress/**',
                '**/.{idea,git,cache,output,temp}/**',
                '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
            ],
            globals: true,
        },
    },
    {
        ...baseConfig,
        test: {
            name: 'integration',
            environment: 'jsdom',
            setupFiles: ['./__tests__/setup.ts', './vitest.setup.ts'],
            include: [
                '__tests__/integration/**/*.spec.{ts,tsx}',
                'app/__tests__/integration/**/*.spec.{ts,tsx}',
            ],
            exclude: [
                '**/node_modules/**',
                '**/dist/**',
                '**/cypress/**',
                '**/.{idea,git,cache,output,temp}/**',
                '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
            ],
            globals: true,
        },
    },
    {
        ...baseConfig,
        test: {
            name: 'e2e',
            environment: 'jsdom',
            setupFiles: './vitest.setup.ts',
            include: [
                '__tests__/e2e/**/*.spec.{ts,tsx}',
                'app/__tests__/e2e/**/*.spec.{ts,tsx}',
            ],
            exclude: [
                '**/node_modules/**',
                '**/dist/**',
                '**/cypress/**',
                '**/.{idea,git,cache,output,temp}/**',
                '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
                '__tests__/e2e/**'
            ],
            globals: true,
        },
    },
]);
