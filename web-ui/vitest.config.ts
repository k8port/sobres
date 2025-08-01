import { defineConfig, defineProject } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./vitest.setup.ts",
        projects: [
            defineProject({
                test: {
                    name: 'unit',
                    include: ['app/__tests__/unit/**/*.spec.{ts,tsx}']
                }
            }),
            defineProject({
                test: {
                    name: 'integration',
                    include: ['app/__tests__/integration/**/*.spec.{ts,tsx}']
                }
            })
        ]
    },
})