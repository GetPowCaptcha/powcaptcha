import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default defineConfig([
  { files: ['**/*.{js,mjs,cjs,ts}'], plugins: { js }, extends: ['js/recommended'] },
  { files: ['**/*.{js,mjs,cjs,ts}'], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
  },
  {
    rules: {
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            ['^\\u0000'], // Side effect imports.
            ['^lit'], // `lit` related packages come first.
            ['^@?\\w'],
            ['^\\.\\.(?!/?$)'],
            ['^\\.\\./?$'], // Parent imports. Put `..` last.
            ['^\\./(?=.*/)(?!/?$)'],
            ['^\\.(?!/?$)'],
            ['^\\./?$'], // Other relative imports. Put same-folder imports and `.` last.
            ['^.+\\.s?css$'], // Style imports.
          ],
        },
      ],
      'simple-import-sort/exports': 'warn',
      'simple-import-sort': 'off',
    },
  },
  {
    ignores: [
      'node_modules/',
      '**/dist/', // Common build output directory
      '**/build/', // Another common build output directory
      '**/coverage/', // Coverage reports
      '**/*.config.*',
      '**/*.test.*', // Ignore test files
      '.*', // Ignore hidden directories like .git, .vscode, .idea etc. but allow .eslintrc.js etc.
      '!.*.js', // Re-include dotfiles ending in .js (like .eslintrc.js)
      '!.*.cjs',
      '!.*.mjs',
      '!.*.json', // Re-include common config dotfiles
    ],
  },
]);
