// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)));

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    resolve: {
        alias: {
            '@': root,
            '@/app': resolve(root, 'app'),
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./__tests__/setup.ts",
        exclude: ["**/__tests__/e2e/**"],
    },
});
