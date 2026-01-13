// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: './coverage',
            include: [ 'app/**/*.{ts,tsx}'],
            exclude: [
                '**/__tests__/**',
                '**/test-utils/**',
                '**/*.spec.{ts,tsx}',
                '**/*.test.{ts,tsx}',
                '**/*.d.ts',
                '**/*.config.*',
                '**/node_modules/**',
                '**/.next/**',
                '**/coverage/**',
            ],
            // thresholds: {
            //     lines: 90,
            //     functions: 90,
            //     branches: 70,
            //     statements: 70
            // },
        },
    },
});