import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettier from 'eslint-plugin-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    {
        ignores: [
            'node_modules/**',
            '.next/**',
            'out/**',
            '.vscode/**',
            'coverage/**',
            'dist/**',
            '__mocks__/**',
            '__tests__/**',
        ],
    },
    ...compat.extends(
        'next/core-web-vitals',
        'next/typescript',
        'prettier',
        'plugin:react/recommended'
    ),
    {
        plugins: {
            prettier: prettier,
        },
        rules: {
            // Add prettier rule
            'prettier/prettier': 'error',
            // Basic formatting rules
            indent: ['error', 4],
            'linebreak-style': ['error', 'unix'],
            quotes: ['error', 'single', { avoidEscape: true }],
            semi: ['error', 'always'],
            // rules turned off
            '@next/next/no-img-element': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            // React specific formatting
            'react/jsx-indent': ['error', 4],
            'react/jsx-indent-props': ['error', 4],
            'jsx-a11y/aria-valid-attr-value': ['error', { allowExpressionValues: true }],
        },
    },
];

export default eslintConfig;
